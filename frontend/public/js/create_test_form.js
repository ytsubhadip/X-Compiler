
document.addEventListener("DOMContentLoaded", () => {
    // =========================================================================
    // 🟢 ADDED: ANTI-LEAK WORKSPACE RECOVERY GUARD (ON PAGE LOAD)
    // =========================================================================
    const activeEditingTestId = localStorage.getItem("editingTestId");

    // If we are NOT editing an old test, check if we came from the add-question panel
    if (!activeEditingTestId) {
        // Check the page history navigation record
        const navigationEntries = performance.getEntriesByType("navigation");
        const isPageNavReload = navigationEntries.length > 0 && navigationEntries[0].type === "reload";

        // Check if the teacher is actually coming back from the "Add Question" page
        const comingFromAddQuestionPage = document.referrer.includes("add-question") ||
            document.referrer.includes("question_page");

        // 🧹 If they are starting fresh and NOT returning from adding a question, completely wipe the memory!
        if (!comingFromAddQuestionPage && !isPageNavReload) {
            console.log("🧹 Fresh Test Creation Session Detected. Purging previous tracking state caches...");
            localStorage.removeItem("currentDraftQuestions");
            localStorage.removeItem("draftTestName");
            localStorage.removeItem("draftTestDept");
            localStorage.removeItem("draftTestSem");
            localStorage.removeItem("draftTestDuration");
            localStorage.removeItem("draftTestCustomCode");
        }
    }
    // =========================================================================
    // 1. END-POINT ROUTER SECURITY GUARD
    // =========================================================================
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole") || "student";

    if (!token || role.trim().toLowerCase() !== "teacher") {
        console.warn("Unauthorized credential route attempt caught. Halting execution pipeline.");
        window.location.href = "/playground";
        return;
    }

    // References
    const createTestForm = document.getElementById("formCreateTestAssessment");
    const submitBtn = document.getElementById("btnSubmitTestForm");
    const addQuestionBtn = document.getElementById("addQuestionBtn");
    const counterLabel = document.getElementById("labelQuestionCounter");
    const pageLoader = document.getElementById("globalPageLoader");
    const loaderText = document.getElementById("globalLoaderText");
    const uploadZone = document.getElementById("questionUploadZone");
    const fileInput = document.getElementById("questionFileInput");
    const uploadContentText = document.getElementById("uploadContentText");
    const fileInfoDisplay = document.getElementById("fileInfoDisplay");
    const selectedFileName = document.getElementById("selectedFileName");
    const removeFileBtn = document.getElementById("removeFileBtn");

    // =========================================================================
    // 2. SESSION TRANSACTION MEMORY HOOKS (Preserve form state across links)
    // =========================================================================
    let activeDraftQuestions = JSON.parse(localStorage.getItem("currentDraftQuestions")) || [];

    // Update count indicator badge live on screen
    if (counterLabel) {
        counterLabel.innerText = `${activeDraftQuestions.length} Selected`;
    }

    // Hydrate form inputs from memory state drops if applicable
    if (localStorage.getItem("draftTestName")) document.getElementById("testName").value = localStorage.getItem("draftTestName");
    if (localStorage.getItem("draftTestDept")) document.getElementById("testDepartment").value = localStorage.getItem("draftTestDept");
    if (localStorage.getItem("draftTestSem")) document.getElementById("testSemester").value = localStorage.getItem("draftTestSem");
    if (localStorage.getItem("draftTestDuration")) document.getElementById("testDuration").value = localStorage.getItem("draftTestDuration");

    // Hydrate custom entry code from memory if pre-existing
    if (localStorage.getItem("draftTestCustomCode")) {
        const customCodeField = document.getElementById("testCustomCodeInput");
        if (customCodeField) customCodeField.value = localStorage.getItem("draftTestCustomCode");
    }

    // Cache typed parameters into memory whenever a user taps the "Add Question" redirect button
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener("click", () => {
            localStorage.setItem("draftTestName", document.getElementById("testName").value.trim());
            localStorage.setItem("draftTestDept", document.getElementById("testDepartment").value);
            localStorage.setItem("draftTestSem", document.getElementById("testSemester").value);
            localStorage.setItem("draftTestDuration", document.getElementById("testDuration").value);

            const customCodeField = document.getElementById("testCustomCodeInput");
            if (customCodeField) {
                localStorage.setItem("draftTestCustomCode", customCodeField.value.trim().toUpperCase());
            }

            window.location.href = "/add-question";
        });
    }

    // =========================================================================
    // 3. ASYNCHRONOUS FORM SUBMISSION LIFECYCLE DISPATCH (WITH INTEGRITY GUARD)
    // =========================================================================
    if (createTestForm) {
        createTestForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (activeDraftQuestions.length === 0) {
                alert("Validation Exception: You cannot create an empty test assessment. Please add at least 1 question.");
                return;
            }

            const customCodeField = document.getElementById("testCustomCodeInput");
            const finalCustomCodeValue = customCodeField ? customCodeField.value.trim().toUpperCase() : "";

            // Gather standard payload formatting elements
            const payload = {
                title: document.getElementById("testName").value.trim(),
                department: document.getElementById("testDepartment").value,
                semester: parseInt(document.getElementById("testSemester").value, 10),
                duration: parseInt(document.getElementById("testDuration").value, 10),
                questions: activeDraftQuestions,
                code: finalCustomCodeValue
            };

            const activeEditingTestId = localStorage.getItem("editingTestId");
            let targetApiUrl = "/api/tests/create";
            let requestMethodType = "POST";

            try {
                if (pageLoader && loaderText) {
                    loaderText.innerText = "Running Security Pre-Flight Parameters Checks...";
                    pageLoader.classList.add("active");
                }
                if (submitBtn) submitBtn.disabled = true;

                // =========================================================================
                // CASE B PRE-FLIGHT GUARD: LIVE LOCKOUT INTERCEPT INTERCEPT
                // =========================================================================
                if (activeEditingTestId) {
                    const integrityCheck = await fetch(`/api/tests/details/${activeEditingTestId}`, {
                        method: "GET",
                        headers: { "Authorization": `Bearer ${token}` }
                    });

                    const integrityResult = await integrityCheck.json();

                    if (integrityResult.hasSubmissions) {
                        if (pageLoader) pageLoader.classList.remove("active");
                        alert("🔒 Modification Denied: A student has already initialized this assessment while you were editing. Edits are locked to preserve grading integrity.");

                        clearTransientFormLocalStorageCaches();
                        window.location.href = "/test-history";
                        return;
                    }

                    targetApiUrl = `/api/tests/update/${activeEditingTestId}`;
                    requestMethodType = "PUT";
                }

                if (loaderText) loaderText.innerText = "Deploying Assessment Parameters to Cloud Clusters...";

                const response = await fetch(targetApiUrl, {
                    method: requestMethodType,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Assessment creation transaction refused by server matrix.");

                if (loaderText) loaderText.innerText = "Assessment Manifest Live! Syncing Systems...";

                // 🟢 Trigger the structural memory cleanup block right here
                clearTransientFormLocalStorageCaches();

                setTimeout(() => {
                    window.location.href = "/test-history";
                }, 900);

            } catch (err) {
                if (pageLoader) pageLoader.classList.remove("active");
                if (submitBtn) submitBtn.disabled = false;
                console.error("Test save execution error:", err);
                alert(`Platform Processing Error: ${err.message}`);
            }
        });
    }

    // =========================================================================
    // 4. INTERACTIVE FILE UPLOAD ZONE HANDLING (PDF, EXCEL, DOC)
    // =========================================================================
    if (uploadZone && fileInput) {
        // Trigger file input click when clicking the zone
        uploadZone.addEventListener("click", (e) => {
            // Prevent trigger if remove-file-btn is clicked
            if (e.target.closest("#removeFileBtn")) return;
            fileInput.click();
        });

        // Drag & Drop handlers
        ["dragenter", "dragover"].forEach(eventName => {
            uploadZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadZone.classList.add("dragover");
            }, false);
        });

        ["dragleave", "drop"].forEach(eventName => {
            uploadZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadZone.classList.remove("dragover");
            }, false);
        });

        // Drop file handler
        uploadZone.addEventListener("drop", (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                handleUploadedFile(files[0]);
            }
        });

        // File input change handler
        fileInput.addEventListener("change", (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                handleUploadedFile(files[0]);
            }
        });

        // Remove selected file handler
        if (removeFileBtn) {
            removeFileBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                resetFileUpload();
            });
        }
    }

    function handleUploadedFile(file) {
        const allowedExtensions = /(\.pdf|\.xlsx|\.xls|\.doc|\.docx)$/i;
        if (!allowedExtensions.exec(file.name)) {
            alert("Format Error: Only PDF, Excel (.xlsx, .xls) and Word (.doc, .docx) documents are supported.");
            resetFileUpload();
            return;
        }

        // Limit size to 10MB
        if (file.size > 10 * 1024 * 1024) {
            alert("Size Limit: File size exceeds the 10MB limit.");
            resetFileUpload();
            return;
        }

        // Display file info
        if (selectedFileName) selectedFileName.innerText = file.name;
        if (uploadContentText) uploadContentText.style.display = "none";
        if (fileInfoDisplay) fileInfoDisplay.style.display = "flex";

        // Add visual success outline feedback
        uploadZone.style.borderColor = "var(--accent-success, #2ec866)";
        uploadZone.style.background = "rgba(46, 200, 102, 0.05)";
    }

    function resetFileUpload() {
        if (fileInput) fileInput.value = "";
        if (uploadContentText) uploadContentText.style.display = "flex";
        if (fileInfoDisplay) fileInfoDisplay.style.display = "none";

        // Reset visual border states
        uploadZone.style.borderColor = "rgba(255, 255, 255, 0.18)";
        uploadZone.style.background = "rgba(255, 255, 255, 0.005)";
    }

    // =========================================================================
    // 🟢 FIXED LIFECYCLE MANAGEMENT: FULL CACHE WIPE ON TRANSACTION COMPLETE
    // =========================================================================
    function clearTransientFormLocalStorageCaches() {
        localStorage.removeItem("draftTestName");
        localStorage.removeItem("draftTestDept");
        localStorage.removeItem("draftTestSem");
        localStorage.removeItem("draftTestDuration");
        localStorage.removeItem("draftTestCustomCode");
        localStorage.removeItem("editingTestId");

        // 🟢 THE CRITICAL HERO LINE: Wipes out previous question allocations cleanly
        localStorage.removeItem("currentDraftQuestions");
    }
});