/**
 * @file create_test_form.js
 * @description Manages view router asserts, dynamic working transaction memory for question creation arrays,
 * and handles secure REST endpoint form serialization streams with active submission lockout integrity checks.
 */

document.addEventListener("DOMContentLoaded", () => {
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
    // 🟢 HYDRATE CUSTOM ENTRY CODE FROM MEMORY IF PRE-EXISTING
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
            
            // 🟢 CACHE CUSTOM ENTRY CODE STATE VALUE
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

            // 🟢 EXTRACT CUSTOM CODE DIRECTLY FROM TARGET CELL ELEMENT
            const customCodeField = document.getElementById("testCustomCodeInput");
            const finalCustomCodeValue = customCodeField ? customCodeField.value.trim().toUpperCase() : "";

            // Gather standard payload formatting elements
            const payload = {
                title: document.getElementById("testName").value.trim(),
                department: document.getElementById("testDepartment").value,
                semester: parseInt(document.getElementById("testSemester").value, 10),
                duration: parseInt(document.getElementById("testDuration").value, 10),
                questions: activeDraftQuestions,
                // 🟢 CRITICAL TRACKING SYNC: Bound code cleanly inside inbound data structures payload
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

    // Helper method to completely reset draft tracking allocations safely
    function clearTransientFormLocalStorageCaches() {
        localStorage.removeItem("draftTestName");
        localStorage.removeItem("draftTestDept");
        localStorage.removeItem("draftTestSem");
        localStorage.removeItem("draftTestDuration");
        localStorage.removeItem("draftTestCustomCode"); // 🟢 Flush custom token from memory storage clean
        localStorage.removeItem("currentDraftQuestions");
        localStorage.removeItem("editingTestId"); 
    }
});