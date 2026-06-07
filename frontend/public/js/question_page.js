

function initializeDifficultyButtons() {
    const difficultyButtons = document.querySelectorAll(".difficulty-btn-group button");
    
    if (difficultyButtons.length === 0) {
        console.warn("No difficulty buttons found in .difficulty-btn-group");
        return;
    }

    difficultyButtons.forEach((button) => {
        button.addEventListener("click", () => {
            // Remove active and activate classes from all buttons in the group
            difficultyButtons.forEach((btn) => {
                btn.classList.remove("active", "activate");
            });

            // Add active and activate classes to the clicked button
            button.classList.add("active", "activate");
        });
    });
}

/**
 * Manages adding and removing topic tags dynamically on input and press of Enter key.
 */
function initializeTopicTags() {
    const tagInput = document.getElementById("tagInput");
    const tagContainer = document.getElementById("tagContainer");

    if (!tagInput || !tagContainer) {
        console.warn("Tag input or container elements not found");
        return;
    }

    let tagsList = [];

    // Focus input when tag container is clicked
    tagContainer.addEventListener("click", (e) => {
        if (e.target === tagContainer || e.target.classList.contains("tag-container")) {
            tagInput.focus();
        }
    });

    // Add tag chip on Enter key press
    tagInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            
            const tagValue = tagInput.value.trim();
            if (tagValue === "") return;

            // Prevent duplicate tags
            if (tagsList.includes(tagValue)) {
                tagInput.value = "";
                return;
            }

            // Create tag element chip
            const tagChip = document.createElement("div");
            tagChip.className = "tag-chip";
            
            const tagLabel = document.createElement("span");
            tagLabel.textContent = tagValue;
            tagChip.appendChild(tagLabel);

            const closeIcon = document.createElement("i");
            closeIcon.className = "fa-solid fa-xmark";
            
            // Remove tag chip listener
            closeIcon.addEventListener("click", (event) => {
                event.stopPropagation();
                tagChip.remove();
                tagsList = tagsList.filter(t => t !== tagValue);
            });

            tagChip.appendChild(closeIcon);

            // Insert new tag chip before the input tag control
            tagContainer.insertBefore(tagChip, tagInput);
            
            tagsList.push(tagValue);
            tagInput.value = "";
        }
    });
}

/**
 * Manages dynamically adding and removing test case example blocks.
 */
function initializeExamplesList() {
    const examplesList = document.getElementById("examplesList");
    const addExampleBtn = document.getElementById("addExampleBtn");

    if (!examplesList || !addExampleBtn) {
        console.warn("Examples list or add button elements not found");
        return;
    }

    let exampleCount = 0;

    addExampleBtn.addEventListener("click", () => {
        exampleCount++;
        const currentId = exampleCount;

        // Create container box
        const exampleBox = document.createElement("div");
        exampleBox.className = "example-box";
        exampleBox.dataset.exampleId = currentId;

        // Header section
        const header = document.createElement("div");
        header.className = "example-header";
        
        const title = document.createElement("span");
        title.className = "example-title-label";
        title.textContent = `Example ${currentId}`;
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

        // Fields section
        const fieldsContainer = document.createElement("div");
        fieldsContainer.className = "example-fields";

        // Input field
        const inputRow = document.createElement("div");
        inputRow.className = "field-row";
        const inputLabel = document.createElement("label");
        inputLabel.textContent = "Input";
        const inputArea = document.createElement("textarea");
        inputArea.placeholder = "e.g. nums = [2,7,11,15], target = 9";
        inputArea.required = true;
        inputRow.appendChild(inputLabel);
        inputRow.appendChild(inputArea);
        fieldsContainer.appendChild(inputRow);

        // Output field
        const outputRow = document.createElement("div");
        outputRow.className = "field-row";
        const outputLabel = document.createElement("label");
        outputLabel.textContent = "Output";
        const outputArea = document.createElement("textarea");
        outputArea.placeholder = "e.g. [0,1]";
        outputArea.required = true;
        outputRow.appendChild(outputLabel);
        outputRow.appendChild(outputArea);
        fieldsContainer.appendChild(outputRow);

        // Explanation field
        const explanationRow = document.createElement("div");
        explanationRow.className = "field-row";
        const explanationLabel = document.createElement("label");
        explanationLabel.textContent = "Explanation (Optional)";
        const explanationArea = document.createElement("textarea");
        explanationArea.placeholder = "e.g. Because nums[0] + nums[1] == 9...";
        explanationRow.appendChild(explanationLabel);
        explanationRow.appendChild(explanationArea);
        fieldsContainer.appendChild(explanationRow);

        exampleBox.appendChild(fieldsContainer);
        examplesList.appendChild(exampleBox);
    });

    /**
     * Re-calculates and updates the numbering (Example 1, Example 2, etc.)
     * after a box gets deleted.
     */
    function updateExampleNumbers() {
        const boxes = examplesList.querySelectorAll(".example-box");
        exampleCount = boxes.length;
        boxes.forEach((box, index) => {
            const titleLabel = box.querySelector(".example-title-label");
            if (titleLabel) {
                titleLabel.textContent = `Example ${index + 1}`;
            }
        });
    }
}

// Execute immediately if DOM is already loaded, otherwise listen for DOMContentLoaded
function init() {
    initializeDifficultyButtons();
    initializeTopicTags();
    initializeExamplesList();
}

if (document.readyState !== "loading") {
    init();
} else {
    document.addEventListener("DOMContentLoaded", init);
}
