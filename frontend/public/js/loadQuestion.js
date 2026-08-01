
// Global key tracker definitions for scoped storage partitions
const CODE_DRAFT_CACHE_PREFIX = "exam_code_draft_q_";

window.hydrateExamWorkspaceTaskElement = function () {
    console.log("🔄 Dynamic Hydration sweep initiated...");

    const rawQuestionsArray = localStorage.getItem("activeExamQuestionsList");
    const currentIndexPointer = parseInt(localStorage.getItem("activeExamCurrentIndex") || "0", 10);

    if (!rawQuestionsArray) {
        console.warn("🛑 Hydration halted: 'activeExamQuestionsList' is missing.");
        return;
    }

    let testTasksList;
    try {
        testTasksList = JSON.parse(rawQuestionsArray);
    } catch (parseErr) {
        console.error("🛑 Critical parsing crash on data stream:", parseErr);
        return;
    }

    if (!Array.isArray(testTasksList) || testTasksList.length === 0) {
        console.warn("🛑 Hydration halted: Cached question array vector is empty.");
        return;
    }

    const activeTask = testTasksList[currentIndexPointer];
    if (!activeTask) {
        console.error(`🛑 Index trace out of bounds: ${currentIndexPointer}`);
        return;
    }

    // Bind current running metrics onto global window variables for your compiler runner script to extract
    window.activeQuestionId = activeTask._id || activeTask.id;
    window.activeTestCases = activeTask.examples || [];

    // 1. Fetch DOM core viewport anchor elements safely
    const questionTitleDOM = document.getElementById("question");
    const problemDescriptionDOM = document.getElementById("description");
    const sampleExamplesDOM = document.getElementById("exap");
    const expectedOutcomesDOM = document.getElementById("sample");

    if (questionTitleDOM) {
        questionTitleDOM.innerText = `${currentIndexPointer + 1}. ${activeTask.title || "Untitled Assessment Task"}`;
    }

    if (problemDescriptionDOM) {
        problemDescriptionDOM.innerText = activeTask.description || "No problem parameters specifications provided.";
    }

    if (activeTask.examples && Array.isArray(activeTask.examples) && activeTask.examples.length > 0) {
        const primaryExample = activeTask.examples[0];
        const rawInputText = primaryExample.input ? primaryExample.input.trim() : "None";
        const rawOutputText = primaryExample.output ? primaryExample.output.trim() : "None";
        const rawExplanationText = primaryExample.explanation ? primaryExample.explanation.trim() : "";

        if (sampleExamplesDOM) {
            sampleExamplesDOM.innerText = `Input:\n${rawInputText}\n\nOutput:\n${rawOutputText}`;
        }
        if (expectedOutcomesDOM) {
            expectedOutcomesDOM.innerText = rawExplanationText ? `Explanation:\n${rawExplanationText}` : "Standard validations apply.";
        }
    } else {
        if (sampleExamplesDOM) sampleExamplesDOM.innerText = "No custom input test cases mapped to this resource node.";
        if (expectedOutcomesDOM) expectedOutcomesDOM.innerText = "Standard outcome validations criteria apply.";
    }

    // 2. 🟢 RESTORE STUDENT'S CODE DRAFT SNAPSHOT FOR THIS SPECIFIC INDEX
    if (window.wpCodeEditorInstance) {
        const uniqueStorageKey = `${CODE_DRAFT_CACHE_PREFIX}${currentIndexPointer}`;
        const savedDraft = localStorage.getItem(uniqueStorageKey);

        if (savedDraft) {
            window.wpCodeEditorInstance.setValue(savedDraft);
        } else {
            // Fallback to default code snippet from cache if they haven't touched this question yet
            const activeLangElement = document.getElementById('inlineFormSelectPref');
            const selectedLang = activeLangElement ? activeLangElement.value.toLowerCase().trim() : 'python';

            // Call your typewriter streaming module or set text raw if needed
            if (typeof window.codeCache !== 'undefined' && window.codeCache[selectedLang]) {
                window.wpCodeEditorInstance.setValue(window.codeCache[selectedLang]);
            } else {
                window.wpCodeEditorInstance.setValue("# Write your solution code execution routine here...");
            }
        }
    }

    // Render active dynamic navigation buttons highlight status if present in DOM layout
    window.renderDynamicQuestionPaginationHUD(testTasksList.length, currentIndexPointer);
    console.log(`🎯 Task index [${currentIndexPointer}] loaded cleanly.`);
};

/**
 * 🟢 NEW METHOD: CACHES THE WRITTEN CODE BEFORE CHANGING POINTERS
 */
window.saveCurrentCodeDraftToLocalMemory = function () {
    if (!window.wpCodeEditorInstance) return;
    const currentIndexPointer = localStorage.getItem("activeExamCurrentIndex") || "0";
    const currentCodeValue = window.wpCodeEditorInstance.getValue();
    localStorage.setItem(`${CODE_DRAFT_CACHE_PREFIX}${currentIndexPointer}`, currentCodeValue);
};

/**
 * 🟢 NEW METHOD: HANDLE FORWARD/BACKWARD SWITCH NAVIGATION SEQUENCES
 */
window.navigateExamWorkspaceTaskIndex = function (targetIndex) {
    const rawQuestionsArray = localStorage.getItem("activeExamQuestionsList");
    if (!rawQuestionsArray) return;

    const maxBoundLength = JSON.parse(rawQuestionsArray).length;
    if (targetIndex < 0 || targetIndex >= maxBoundLength) return;

    // 1. Freeze and cache current text field string progress
    window.saveCurrentCodeDraftToLocalMemory();

    // 2. Step index position tracker up or down
    localStorage.setItem("activeExamCurrentIndex", targetIndex);

    // 3. Trigger refreshing UI hydration
    window.hydrateExamWorkspaceTaskElement();
};

/**
 * 🟢 NEW METHOD: AUTO-GENERATES STEP PAGINATION BUTTON NODES INSIDE YOUR PANEL UI
 */
window.renderDynamicQuestionPaginationHUD = function (totalQuestions, activeIndex) {
    const wrapperContainer = document.getElementById("questionPaginationWrapper");
    if (!wrapperContainer) return; // Skips if you haven't dropped the HTML container hook block yet

    wrapperContainer.innerHTML = "";

    for (let i = 0; i < totalQuestions; i++) {
        const btn = document.createElement("button");
        btn.innerText = i + 1;
        btn.className = (i === activeIndex) ? "task-pill task-pill--active" : "task-pill";
        btn.onclick = () => window.navigateExamWorkspaceTaskIndex(i);
        wrapperContainer.appendChild(btn);
    }
};

// Automatic load triggers setup execution profiles
if (localStorage.getItem("activeExamTestId")) {
    if (document.readyState !== "loading") {
        window.hydrateExamWorkspaceTaskElement();
    } else {
        document.addEventListener("DOMContentLoaded", window.hydrateExamWorkspaceTaskElement);
    }
}