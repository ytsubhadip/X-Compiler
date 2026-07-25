

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("authToken");
    const testId = new URLSearchParams(window.location.search).get("id");

    if (!testId) {
        window.location.href = "/teacher/test-history";
        return;
    }

    let globalFetchedTestObjectInstance = null;
    let isTestLockedPermanently = false;

    const banner = document.getElementById("lockoutBannerAlert");
    const titleHeader = document.getElementById("viewTestTitleDisplay");
    const controlsHub = document.getElementById("actionControlsContextCluster");
    const questionsWrapper = document.getElementById("questionsContainerCanvasWrapper");

    try {
        const response = await fetch(`/api/tests/details/${testId}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to retrieve configuration mapping.");

        globalFetchedTestObjectInstance = data.test;
        isTestLockedPermanently = data.hasSubmissions;

        // Hydrate read-only text fields smoothly
        titleHeader.innerText = globalFetchedTestObjectInstance.title;
        document.getElementById("metaDept").value = globalFetchedTestObjectInstance.department;
        document.getElementById("metaSemester").value = globalFetchedTestObjectInstance.semester;
        document.getElementById("metaDuration").value = globalFetchedTestObjectInstance.duration;

        // Render the read-only question blocks
        renderStaticQuestionsList(globalFetchedTestObjectInstance.questions);

        // =========================================================================
        // DYNAMIC STATE CONTROL HUB
        // =========================================================================
        if (isTestLockedPermanently) {
            // 🔒 CASE B: Active submissions exist -> Force cloning flow
            if (banner) banner.style.display = "block";

            controlsHub.innerHTML = `
                <button type="button" id="btnCloneToDraftTriggerAction" class="btn-action-panel btn-tasks-explorer">
                    <i class="bi bi-copy"></i> Clone to New Draft
                </button>
                <a href="/teacher/test-history" class="btn-action-panel btn-records-audit">
                    <i class="bi bi-arrow-left" style="transition: transform 0.2s ease;"></i> Back
                </a>
            `;

            document.getElementById("btnCloneToDraftTriggerAction").addEventListener("click", () => {
                executeCloneToTransientWorkspace(globalFetchedTestObjectInstance);
            });

        } else {
            // 🔓 CASE A: Zero submissions -> Allow direct modification via the builder page
            if (banner) banner.style.display = "none";

            controlsHub.innerHTML = `
                <button type="button" id="btnRedirectToEditor" class="btn-action-panel btn-tasks-explorer">
                    <i class="bi bi-pencil-square"></i> Edit Assessment Questions
                </button>
                <a href="/teacher/test-history" class="btn-action-panel btn-records-audit">
                    <i class="bi bi-arrow-left" style="transition: transform 0.2s ease;"></i> Back
                </a>
            `;

            document.getElementById("btnRedirectToEditor").addEventListener("click", () => {
                executeEditRedirection(globalFetchedTestObjectInstance);
            });
        }

    } catch (err) {
        console.error("View task dashboard rendering failure:", err);
        if (questionsWrapper) {
            questionsWrapper.innerHTML = `<p class="text-danger small">Failed to resolve configuration framework: ${err.message}</p>`;
        }
    }

    function renderStaticQuestionsList(questions) {
        if (!questionsWrapper) return;
        questionsWrapper.innerHTML = "";

        questions.forEach((q, index) => {
            const block = document.createElement("div");
            block.className = "question-inspect-pod";

            // Compile individual examples if they exist in the schema array
            let examplesHTML = "";
            if (q.examples && q.examples.length > 0) {
                examplesHTML = `
                <div class="mt-3 pt-2" style="border-top: 1px dashed #232931;">
                    <a class="text-success small text-decoration-none" data-bs-toggle="collapse" href="#collapseEx-${index}" role="button" aria-expanded="false" style="font-weight: 600; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="bi bi-braces"></i> View Test Case Examples (${q.examples.length})
                    </a>
                    <div class="collapse mt-2" id="collapseEx-${index}">
                        ${q.examples.map((ex, exIdx) => `
                            <div class="p-2 mb-2" style="background: #111418; border: 1px solid #1f242d; border-radius: 6px; font-family: monospace; font-size: 0.85rem;">
                                <strong class="text-warning d-block mb-1" style="font-size: 0.75rem;">Example ${exIdx + 1}:</strong>
                                <div class="text-white-50"><span class="text-muted">Input:</span> ${ex.input || 'N/A'}</div>
                                <div class="text-white-50"><span class="text-muted">Output:</span> ${ex.output || 'N/A'}</div>
                                ${ex.explanation ? `<div class="text-wrap text-muted small mt-1" style="font-family: sans-serif;"><span class="text-secondary">Explanation:</span> ${ex.explanation}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            }

            block.innerHTML = `
            <div class="d-flex justify-content-between mb-2">
                <h6 class="text-white m-0 fw-bold">${index + 1}. ${q.title}</h6>
                <span class="badge bg-difficulty-${q.difficulty.toLowerCase()}" style="border-radius:4px;">${q.difficulty}</span>
            </div>
            <p class="small text-muted mb-0" style="white-space: pre-wrap;">${q.description}</p>
            
            ${q.tags && q.tags.length > 0 ? `<div class="mt-2">${q.tags.map(t => `<span class="badge bg-dark border border-secondary me-1" style="font-size:0.7rem; padding: 4px 6px;">${t}</span>`).join('')}</div>` : ''}
            
            ${examplesHTML}
        `;
            questionsWrapper.appendChild(block);
        });
    }

    // Flow 1: Redirect to builder with loaded questions for direct editing
    function executeEditRedirection(testObject) {
        // Hydrate local storage queue directly with existing values
        localStorage.setItem("currentDraftQuestions", JSON.stringify(testObject.questions));
        // Save the test ID so your builder page knows it's updating an existing test instead of creating a new one
        localStorage.setItem("editingTestId", testObject._id);

        window.location.href = "/teacher/add-question";
    }

    // Flow 2: Clone everything as an independent new draft string
    function executeCloneToTransientWorkspace(testObject) {
        showCustomConfirm(`Are you sure you want to clone "${testObject.title}"? This creates a safe copy so you don't corrupt ongoing exam results.`, () => {
            const clonedQuestionsArray = testObject.questions.map(q => ({
                title: `${q.title} (Copy)`,
                difficulty: q.difficulty,
                tags: q.tags || [],
                description: q.description,
                examples: q.examples || []
            }));

            localStorage.setItem("currentDraftQuestions", JSON.stringify(clonedQuestionsArray));
            // Remove editing token so it treats it as a brand new test submission
            localStorage.removeItem("editingTestId");

            window.location.href = "/teacher/add-question";
        });
    }
});