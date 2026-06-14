
// Global helper function for interactive code copy feedback animation
window.copyInviteLink = function (element, url) {
    navigator.clipboard.writeText(url).then(() => {
        const originalHTML = element.innerHTML;
        element.innerHTML = `<i class="bi bi-check-circle-fill text-success"></i> Copied Link!`;
        element.classList.add("copied");
        setTimeout(() => {
            element.innerHTML = originalHTML;
            element.classList.remove("copied");
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy link: ', err);
    });
};

document.addEventListener("DOMContentLoaded", async () => {
    // =========================================================================
    // 1. END-POINT ROUTER SECURITY GUARD
    // =========================================================================
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole") || "student";

    if (!token || role.trim().toLowerCase() !== "teacher") {
        console.warn("Unauthorized trace blocked from accessing teacher data grids.");
        window.location.href = "/playground";
        return;
    }

    // Capture Core Display DOM Anchors
    const gridContainer = document.getElementById("historyGridContainer");
    const stateLoader = document.getElementById("historyViewStateLoader");

    // Capture Search and Filter Controls
    const examSearchInput = document.getElementById("examSearchInput");
    const deptFilterDropdown = document.getElementById("deptFilterDropdown");
    const deptSelectTrigger = document.getElementById("deptSelectTrigger");
    const deptSelectValue = document.getElementById("deptSelectValue");
    const clearExamSearch = document.getElementById("clearExamSearch");

    let allTests = [];
    let selectedDept = "";

    // Filter application logic
    function applyFilters() {
        const examQuery = examSearchInput ? examSearchInput.value.toLowerCase().trim() : "";
        const deptQuery = selectedDept.toLowerCase();

        // Toggle clear buttons
        if (clearExamSearch) clearExamSearch.style.display = examQuery ? "inline-flex" : "none";

        const filtered = allTests.filter(test => {
            const matchesExam = !examQuery || (test.title && test.title.toLowerCase().includes(examQuery));
            const matchesDept = !deptQuery || (test.department && test.department.toLowerCase().includes(deptQuery));
            return matchesExam && matchesDept;
        });

        renderTests(filtered);
    }

    // Dynamic cards rendering logic
    function renderTests(testsToRender) {
        if (!gridContainer) return;
        gridContainer.innerHTML = "";

        if (testsToRender.length === 0) {
            gridContainer.innerHTML = `
                <div class="col-12 text-center text-muted py-5 font-sans">
                    <i class="bi bi-search d-block h3 mb-2 opacity-50"></i>
                    No matching assessments discovered. Try adjusting your filters!
                </div>`;
            return;
        }

        // Iterate and compile cards
        testsToRender.forEach(test => {
            const cardCol = document.createElement("div");
            cardCol.className = "col-12 col-md-6 col-lg-4";

            const parsedDeploymentDate = new Date(test.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });

            const questionCount = test.questions ? test.questions.length : 0;

            // 🟢 RUNTIME DATA FALLBACK: Ensures clean look for older documents missing codes
            const renderingCode = test.testcode || `OLD-${test._id.slice(-4).toUpperCase()}`;

            cardCol.innerHTML = `
                <div class="test-history-card">
                    <div class="card-header-section">
                        <h3 class="test-title" title="${test.title}">${test.title}</h3>
                        <span class="status-badge-live">Live</span>
                    </div>
                    
                    <div class="code-share-block mb-3">
                       <span class="invite-code-pill" 
                             onclick="copyInviteLink(this, '${window.location.origin}/join-test?code=${renderingCode}')"
                             title="Click to copy student invite link">
                            <i class="bi bi-share-fill"></i> Invite Code: <strong class="text-white">${renderingCode}</strong>
                        </span>
                    </div>

                    <div class="metadata-grid">
                        <div class="metadata-item">
                            <label>Department</label>
                            <span>${test.department}</span>
                        </div>
                        <div class="metadata-item">
                            <label>Semester</label>
                            <span>Sem ${test.semester}</span>
                        </div>
                        <div class="metadata-item">
                            <label>Duration</label>
                            <span><i class="bi bi-stopwatch text-warning me-1"></i> ${test.duration} Mins</span>
                        </div>
                        <div class="metadata-item">
                            <label>Questions</label>
                            <span><i class="bi bi-code-square text-success me-1"></i> ${questionCount} Tasks</span>
                        </div>
                    </div>

                    <div class="card-footer-timestamp mt-2">
                        <span>Deployed: ${parsedDeploymentDate}</span>
                    </div>

                    <div class="card-actions-row mt-3">
                        <a href="/view-test-tasks?id=${test._id}" class="action-btn btn-tasks-view">
                            <i class="bi bi-code-square me-1"></i> View Tasks
                        </a>
                        <a href="/student-records?id=${test._id}" class="action-btn btn-records-view">
                            <i class="bi bi-graph-up-arrow me-1"></i> Results
                        </a>
                        <button class="action-btn btn-delete-test" title="Delete Assessment">
                            <i class="bi bi-trash3"></i>
                        </button>
                    </div>
                </div>
            `;
            gridContainer.appendChild(cardCol);

            // Bind click handler for delete button (pure frontend deletion)
            const deleteBtn = cardCol.querySelector(".btn-delete-test");
            if (deleteBtn) {
                deleteBtn.addEventListener("click", () => {
                    if (confirm(`Are you sure you want to delete "${test.title}"?`)) {
                        cardCol.remove();
                        // Remove from the local allTests array so it stays deleted during filters
                        allTests = allTests.filter(t => t._id !== test._id);

                        // Check if no cards are currently visible
                        if (gridContainer.children.length === 0) {
                            gridContainer.innerHTML = `
                                <div class="col-12 text-center text-muted py-5 font-sans">
                                    <i class="bi bi-search d-block h3 mb-2 opacity-50"></i>
                                    No matching assessments discovered. Try adjusting your filters!
                                </div>`;
                        }
                    }
                });
            }
        });
    }

    try {
        // Fetch full deployment parameters list logs straight from the operational backend API path
        const response = await fetch("/api/tests/history", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to sync historic list metrics.");

        // Clean loader visibility structures out of viewport
        if (stateLoader) stateLoader.remove();

        // Catch edge conditions when zero assessments exist in database clusters
        if (!data.tests || data.tests.length === 0) {
            gridContainer.innerHTML = `
                <div class="col-12 text-center text-muted py-5 font-sans">
                    <i class="bi bi-folder-x d-block h3 mb-2 opacity-50"></i>
                    No compiled assessments discovered in your account record. Try creating a new test form!
                </div>`;
            const filterWrapper = document.querySelector(".filter-wrapper");
            if (filterWrapper) filterWrapper.style.display = "none";
            return;
        }

        // Save tests and initialize render/listeners
        allTests = data.tests;
        renderTests(allTests);

        // Bind input and dropdown event listeners
        if (examSearchInput) examSearchInput.addEventListener("input", applyFilters);

        if (deptSelectTrigger) {
            deptSelectTrigger.addEventListener("click", (e) => {
                e.stopPropagation();
                if (deptFilterDropdown) deptFilterDropdown.classList.toggle("active");
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener("click", () => {
            if (deptFilterDropdown) deptFilterDropdown.classList.remove("active");
        });

        // Handle option click selection
        const deptOptionsList = document.querySelectorAll(".glass-select-option");
        deptOptionsList.forEach(option => {
            option.addEventListener("click", (e) => {
                e.stopPropagation();

                // Toggle active classes
                deptOptionsList.forEach(opt => opt.classList.remove("active"));
                option.classList.add("active");

                // Set value and trigger label update
                selectedDept = option.getAttribute("data-value") || "";
                if (deptSelectValue) deptSelectValue.textContent = option.textContent;

                // Close options list
                if (deptFilterDropdown) deptFilterDropdown.classList.remove("active");

                applyFilters();
            });
        });

        if (clearExamSearch) {
            clearExamSearch.addEventListener("click", () => {
                examSearchInput.value = "";
                applyFilters();
            });
        }

    } catch (err) {
        console.error("History datagrid rendering failure:", err);
        if (stateLoader) {
            stateLoader.innerHTML = `
                <i class="bi bi-exclamation-triangle text-danger h2"></i>
                <p class="text-danger small mt-2 m-0">Failed to communicate with cluster database matrix: ${err.message}</p>
            `;
        }
    }
});