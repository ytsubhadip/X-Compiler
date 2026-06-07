/**
 * @file question_page.js
 * @description Manages interactive tag chips, multi-example dynamic blocks, 
 * and handles adding or editing questions within the transient local storage queue.
 */

// =========================================================================
// 1. GLOBAL STATE TRACKING & SECURITY ROUTE GUARDS
// =========================================================================
const token = localStorage.getItem("authToken");
const role = localStorage.getItem("userRole") || "student";

if (!token || role.trim().toLowerCase() !== "teacher") {
    console.warn("Unauthorized checkpoint access trace blocked. Re-routing...");
    window.location.href = "/playground";
}

// Global Memory Collections
let tagsList = []; 
let activeSelectedDifficulty = "Easy";
let workingDraftQuestionsList = JSON.parse(localStorage.getItem("currentDraftQuestions")) || [];
// 🟢 NEW STATE: Track if we are editing an existing question (-1 means creating a new one)
let editingQuestionIndex = -1;

// =========================================================================
// 2. DOM INTERACTION FACTORIES
// =========================================================================
function initializeDifficultyButtons() {
    const difficultyButtons = document.querySelectorAll(".difficulty-btn-group button");
    
    difficultyButtons.forEach((button) => {
        button.addEventListener("click", () => {
            difficultyButtons.forEach((btn) => btn.classList.remove("active", "activate"));
            button.classList.add("active", "activate");
            activeSelectedDifficulty = button.textContent.trim();
        });
    });
}

function initializeTopicTags() {
    const tagInput = document.getElementById("tagInput");
    const tagContainer = document.getElementById("tagContainer");

    if (!tagInput || !tagContainer) return;

    tagContainer.addEventListener("click", (e) => {
        if (e.target === tagContainer || e.target.classList.contains("tag-container")) {
            tagInput.focus();
        }
    });

    tagInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            
            const tagValue = tagInput.value.trim();
            if (tagValue === "") return;

            if (tagsList.includes(tagValue)) {
                tagInput.value = "";
                return;
            }

            addTagChipToDOM(tagValue);
            tagsList.push(tagValue);
            tagInput.value = "";
        }
    });
}

// Helper to construct tag chip components
function addTagChipToDOM(tagValue) {
    const tagContainer = document.getElementById("tagContainer");
    const tagInput = document.getElementById("tagInput");
    if (!tagContainer || !tagInput) return;

    const tagChip = document.createElement("div");
    tagChip.className = "tag-chip";
    
    const tagLabel = document.createElement("span");
    tagLabel.textContent = tagValue;
    tagChip.appendChild(tagLabel);

    const closeIcon = document.createElement("i");
    closeIcon.className = "fa-solid fa-xmark";
    
    closeIcon.addEventListener("click", (event) => {
        event.stopPropagation();
        tagChip.remove();
        tagsList = tagsList.filter(t => t !== tagValue);
    });

    tagChip.appendChild(closeIcon);
    tagContainer.insertBefore(tagChip, tagInput);
}

function initializeExamplesList() {
    const examplesList = document.getElementById("examplesList");
    const addExampleBtn = document.getElementById("addExampleBtn");

    if (!examplesList || !addExampleBtn) return;

    addExampleBtn.addEventListener("click", () => {
        const nextId = examplesList.querySelectorAll(".example-box").length + 1;
        addExampleBoxToDOM(nextId, "", "", "");
    });
}

// Helper to inject a structural example layout card
function addExampleBoxToDOM(idNumber, inputValue = "", outputValue = "", explanationValue = "") {
    const examplesList = document.getElementById("examplesList");
    if (!examplesList) return;

    const exampleBox = document.createElement("div");
    exampleBox.className = "example-box";
    exampleBox.dataset.exampleId = idNumber;

    const header = document.createElement("div");
    header.className = "example-header";
    
    const title = document.createElement("span");
    title.className = "example-title-label";
    title.textContent = `Example ${idNumber}`;
    header.appendChild(title);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "remove-example-btn";
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteBtn.addEventListener("click", () => {
        exampleBox.remove();
        updateExampleNumbers();
    });
    header.appendChild(deleteBtn);
    exampleBox.appendChild(header);

    const fieldsContainer = document.createElement("div");
    fieldsContainer.className = "example-fields";

    const inputRow = document.createElement("div");
    inputRow.className = "field-row";
    const inputLabel = document.createElement("label");
    inputLabel.textContent = "Input";
    const inputArea = document.createElement("textarea");
    inputArea.placeholder = "e.g. nums = [2,7,11,15], target = 9";
    inputArea.value = inputValue;
    inputRow.appendChild(inputLabel);
    inputRow.appendChild(inputArea);
    fieldsContainer.appendChild(inputRow);

    const outputRow = document.createElement("div");
    outputRow.className = "field-row";
    const outputLabel = document.createElement("label");
    outputLabel.textContent = "Output";
    const outputArea = document.createElement("textarea");
    outputArea.placeholder = "e.g. [0,1]";
    outputArea.value = outputValue;
    outputRow.appendChild(outputLabel);
    outputRow.appendChild(outputArea);
    fieldsContainer.appendChild(outputRow);

    const explanationRow = document.createElement("div");
    explanationRow.className = "field-row";
    const explanationLabel = document.createElement("label");
    explanationLabel.textContent = "Explanation (Optional)";
    const explanationArea = document.createElement("textarea");
    explanationArea.placeholder = "e.g. Because nums[0] + nums[1] == 9...";
    explanationArea.value = explanationValue;
    explanationRow.appendChild(explanationLabel);
    explanationRow.appendChild(explanationArea);
    fieldsContainer.appendChild(explanationRow);

    exampleBox.appendChild(fieldsContainer);
    examplesList.appendChild(exampleBox);
}

function updateExampleNumbers() {
    const boxes = document.querySelectorAll("#examplesList .example-box");
    boxes.forEach((box, index) => {
        const titleLabel = box.querySelector(".example-title-label");
        if (titleLabel) {
            titleLabel.textContent = `Example ${index + 1}`;
        }
    });
}

// =========================================================================
// 3. REACTIVE SIDEBAR DRAFTS DRAW & EDIT INDUCTION LOOP
// =========================================================================
function renderSidebarDraftsQueue() {
    const draftsQueueWrapper = document.querySelector(".question-container");
    const countHeader = document.querySelector(".question-queue > span");
    
    if (!draftsQueueWrapper) return;
    draftsQueueWrapper.innerHTML = "";
    
    if (countHeader) {
        countHeader.innerText = `DRAFTS (${workingDraftQuestionsList.length})`;
    }

    if (workingDraftQuestionsList.length === 0) {
        draftsQueueWrapper.innerHTML = `<p style="color: #6c757d; font-style: italic; font-size: 0.85rem; padding: 10px; margin: 0;">No questions in queue.</p>`;
        return;
    }

    workingDraftQuestionsList.forEach((q, idx) => {
        const draftRowNode = document.createElement("div");
        draftRowNode.className = "question-one";
        draftRowNode.style.display = "flex";
        draftRowNode.style.justifyContent = "space-between";
        draftRowNode.style.alignItems = "center";
        
        // 🟢 HIGHLIGHT ACTIVE EDIT: Adds subtle styling context if this card is currently open
        if (editingQuestionIndex === idx) {
            draftRowNode.style.borderLeft = "3px solid #fbbf24";
            draftRowNode.style.background = "rgba(255, 255, 255, 0.08)";
        }
        
        draftRowNode.innerHTML = `
            <div class="draft-click-area" data-index="${idx}" style="display: flex; align-items: center; gap: 10px; max-width: 80%; flex-grow: 1; cursor: pointer;">
                <i class="fa-solid fa-square-poll-horizontal"></i>
                <p style="margin:0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${q.title}</p>
            </div>
            <i class="bi bi-trash3-fill delete-draft-trigger" data-index="${idx}" style="color: #ef4444 !important; cursor: pointer; padding-left: 5px;"></i>
        `;
        draftsQueueWrapper.appendChild(draftRowNode);
    });

    // 🟢 CLICK TO EDIT ENGINE INTERCEPT
    draftsQueueWrapper.querySelectorAll(".draft-click-area").forEach(area => {
        area.addEventListener("click", () => {
            const index = parseInt(area.getAttribute("data-index"));
            loadQuestionIntoFormForEditing(index);
        });
    });

    // Discard draft triggers
    draftsQueueWrapper.querySelectorAll(".delete-draft-trigger").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const targetIdx = parseInt(btn.getAttribute("data-index"));
            
            // Reset edit context if active card gets dropped out
            if (editingQuestionIndex === targetIdx) {
                editingQuestionIndex = -1;
                resetFormCanvasWorkspace();
            } else if (editingQuestionIndex > targetIdx) {
                editingQuestionIndex--; // Balance structural array index shift keys
            }
            
            workingDraftQuestionsList.splice(targetIdx, 1);
            localStorage.setItem("currentDraftQuestions", JSON.stringify(workingDraftQuestionsList));
            renderSidebarDraftsQueue();
        });
    });
}

// 🟢 NEW STRATEGIC LOADER METHOD: Hydrates form fields securely with stored parameters
function loadQuestionIntoFormForEditing(index) {
    const question = workingDraftQuestionsList[index];
    if (!question) return;

    editingQuestionIndex = index;
    
    // 1. Hydrate title and descriptor content blocks
    const titleInput = document.querySelector(".right-side-div input[type='text']");
    const descInput = document.querySelector(".probleam-desc textarea");
    if (titleInput) titleInput.value = question.title;
    if (descInput) descInput.value = question.description;

    // 2. Select difficulty mapping buttons dynamically
    const difficultyButtons = document.querySelectorAll(".difficulty-btn-group button");
    difficultyButtons.forEach(btn => {
        btn.classList.remove("active", "activate");
        if (btn.textContent.trim().toLowerCase() === question.difficulty.toLowerCase()) {
            btn.classList.add("active", "activate");
        }
    });
    activeSelectedDifficulty = question.difficulty;

    // 3. Re-render individual tag arrays chips
    const container = document.getElementById("tagContainer");
    if (container) {
        container.querySelectorAll(".tag-chip").forEach(c => c.remove());
    }
    tagsList = [...question.tags];
    tagsList.forEach(tag => addTagChipToDOM(tag));

    // 4. Generate dynamic custom multi-example text block forms loops
    const examplesList = document.getElementById("examplesList");
    if (examplesList) examplesList.innerHTML = "";
    if (question.examples && question.examples.length > 0) {
        question.examples.forEach((ex, idx) => {
            addExampleBoxToDOM(idx + 1, ex.input, ex.output, ex.explanation);
        });
    }

    // 5. Update footer submission buttons context text labels cleanly
    const btnAddToQueue = document.querySelectorAll(".footer-button button")[0];
    if (btnAddToQueue) btnAddToQueue.textContent = "Update in Queue";

    renderSidebarDraftsQueue();
}

function resetFormCanvasWorkspace() {
    const titleInput = document.querySelector(".right-side-div input[type='text']");
    const descInput = document.querySelector(".probleam-desc textarea");
    const examplesList = document.getElementById("examplesList");

    if (titleInput) titleInput.value = "";
    if (descInput) descInput.value = "";
    if (examplesList) examplesList.innerHTML = "";
    
    tagsList = [];
    const container = document.getElementById("tagContainer");
    if (container) {
        container.querySelectorAll(".tag-chip").forEach(c => c.remove());
    }

    const difficultyButtons = document.querySelectorAll(".difficulty-btn-group button");
    difficultyButtons.forEach(btn => btn.classList.remove("active", "activate"));
    if (difficultyButtons[0]) difficultyButtons[0].classList.add("active", "activate");
    activeSelectedDifficulty = "Easy";

    // Restore text context values
    editingQuestionIndex = -1;
    const btnAddToQueue = document.querySelectorAll(".footer-button button")[0];
    if (btnAddToQueue) btnAddToQueue.textContent = "Add in Queue";
}

// =========================================================================
// 4. SCRAPER OPERATORS & SUBMISSIONS ACTION MANAGERS
// =========================================================================
function initializeFormActions() {
    const footerButtons = document.querySelectorAll(".footer-button button");
    const btnAddToQueue = footerButtons[0];      // "Add in Queue" / "Update in Queue"
    const btnSaveToAssessment = footerButtons[1]; // "Save Assignment"

    if (btnAddToQueue) {
        btnAddToQueue.addEventListener("click", () => {
            const titleInput = document.querySelector(".right-side-div input[type='text']");
            const descInput = document.querySelector(".probleam-desc textarea");
            const examplesList = document.getElementById("examplesList");

            const problemTitle = titleInput ? titleInput.value.trim() : "";
            const problemDescription = descInput ? descInput.value.trim() : "";

            if (!problemTitle || !problemDescription) {
                alert("Please fill out the Problem Title and Description fields before adding to the queue.");
                return;
            }

            const structuredExamples = [];
            if (examplesList) {
                const boxes = examplesList.querySelectorAll(".example-box");
                boxes.forEach(block => {
                    const textAreas = block.querySelectorAll("textarea");
                    if (textAreas.length >= 2) {
                        structuredExamples.push({
                            input: textAreas[0].value.trim(),
                            output: textAreas[1].value.trim(),
                            explanation: textAreas[2] ? textAreas[2].value.trim() : ""
                        });
                    }
                });
            }

            const questionPayload = {
                title: problemTitle,
                difficulty: activeSelectedDifficulty,
                tags: [...tagsList],
                description: problemDescription,
                examples: structuredExamples
            };

            // 🟢 MODIFIED LIFECYCLE: Checks if updating an index trace or generating a new array entry block
            if (editingQuestionIndex > -1) {
                workingDraftQuestionsList[editingQuestionIndex] = questionPayload;
            } else {
                workingDraftQuestionsList.push(questionPayload);
            }

            localStorage.setItem("currentDraftQuestions", JSON.stringify(workingDraftQuestionsList));

            renderSidebarDraftsQueue();
            resetFormCanvasWorkspace();
        });
    }

    if (btnSaveToAssessment) {
        btnSaveToAssessment.addEventListener("click", () => {
            window.location.href = "/test-form";
        });
    }

    // Connect trigger button handler safely
    const btnNewQuestionReset = document.querySelector(".left-side-div > button");
    if (btnNewQuestionReset) {
        btnNewQuestionReset.addEventListener("click", resetFormCanvasWorkspace);
    }
}

// =========================================================================
// 5. ENGINE KICKOFF
// =========================================================================
function init() {
    initializeDifficultyButtons();
    initializeTopicTags();
    initializeExamplesList();
    initializeFormActions();
    renderSidebarDraftsQueue();
}

if (document.readyState !== "loading") {
    init();
} else {
    document.addEventListener("DOMContentLoaded", init);
}