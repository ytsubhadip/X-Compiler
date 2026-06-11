/**
 * @file test_history.js
 * @description Secures views pathways, queries historic assessment entries from databases,
 * and compiles layout items into structural data grid matrices dynamically.
 */

// Global helper function for interactive code copy feedback animation
window.copyInviteLink = function(element, url) {
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
            return;
        }

        // =========================================================================
        // 2. ITERATIVE DATA CARD COMPILER ENGINE
        // =========================================================================
        data.tests.forEach(test => {
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
                    </div>
                </div>
            `;
            gridContainer.appendChild(cardCol);
        });

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