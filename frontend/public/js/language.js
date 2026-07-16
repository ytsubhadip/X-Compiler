// Scope timers and tracking states globally within this module space
let ideTypewriterTimeout = null;
let lineFadeTimeout = null;
let currentLang = 'python'; // Default fallback tracking context

// Global template memory bank cache configuration values
window.codeCache = {
    python: "print('Hello world')",
    cpp: `#include <iostream>\nusing namespace std;\nint main() {\n   cout << "Hello world";\n   return 0;\n}`,
    c: `#include <stdio.h>\nint main() {\n   printf("hello, world");\n   return 0;\n}`,
    java: `public class Main {\n   public static void main(String[] args) {\n      System.out.println("Hello World");\n   }\n}`,
    javascript: `console.log("Hello World");`
};


function streamCodeIntoEditor(targetText, speed = 10) {
    // Explicitly wipe active character intervals to prevent overlapping typewriter streams
    if (ideTypewriterTimeout) {
        clearInterval(ideTypewriterTimeout);
    }

    if (!window.wpCodeEditorInstance) return;

    window.wpCodeEditorInstance.setValue("");
    window.wpCodeEditorInstance.focus();

    let index = 0;
    ideTypewriterTimeout = setInterval(() => {
        if (index < targetText.length && window.wpCodeEditorInstance) {
            const char = targetText.charAt(index);
            const doc = window.wpCodeEditorInstance.getDoc();
            const cursor = doc.getCursor();

            doc.replaceRange(char, cursor);
            index++;
        } else {
            clearInterval(ideTypewriterTimeout);
            ideTypewriterTimeout = null;
        }
    }, speed);
}

/**
 * 🟢 NEON GLOW DELEGATED INITIALIZATION
 * Hooks event listeners and trackers safely after all elements mount to the DOM.
 */
function initializeLanguageWorkspaceEngine() {
    const optionL = document.getElementById('inlineFormSelectPref');

    // Core structural check: if layout arrays or global canvases aren't bound yet, retry smoothly
    if (!optionL || !window.wpCodeEditorInstance) {
        setTimeout(initializeLanguageWorkspaceEngine, 100);
        return;
    }

    // Initialize state tracker metrics matching active template drop selections
    if (optionL.value && optionL.value.toLowerCase().trim() !== 'nol') {
        let initialLang = optionL.value.toLowerCase().trim();
        if (initialLang === 'c++') initialLang = 'cpp'; // Normalize tracking flags
        currentLang = initialLang;
    }

    // 🟢 CUSTOM DROPDOWN INTERACTION LOGIC
    const customDropdown = document.getElementById('customLanguageDropdown');
    if (customDropdown) {
        const customDropdownBtn = document.getElementById('customDropdownBtn');
        const customDropdownMenu = document.getElementById('customDropdownMenu');
        const customDropdownLabel = document.getElementById('customDropdownLabel');
        const dropdownItems = customDropdownMenu.querySelectorAll('.custom-dropdown-item');

        function syncCustomDropdown() {
            const val = optionL.value;
            const currentIcon = document.getElementById('customDropdownIcon');
            
            let itemFound = false;
            dropdownItems.forEach(item => {
                if (item.getAttribute('data-value') === val) {
                    itemFound = true;
                    item.classList.add('selected');
                    // Update button label & icon
                    customDropdownLabel.textContent = item.querySelector('span').textContent;
                    const img = item.querySelector('img').cloneNode(true);
                    img.className = 'custom-dropdown-logo-selected';
                    img.id = 'customDropdownIcon';
                    if (currentIcon) {
                        currentIcon.replaceWith(img);
                    }
                } else {
                    item.classList.remove('selected');
                }
            });
            
            if (!itemFound || val === 'noL') {
                customDropdownLabel.textContent = 'Choose Language';
                const icon = document.createElement('i');
                icon.className = 'bi bi-code-slash custom-dropdown-icon';
                icon.id = 'customDropdownIcon';
                if (currentIcon) {
                    currentIcon.replaceWith(icon);
                }
            }
        }

        // Toggle dropdown open/close
        customDropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = customDropdown.classList.contains('open');
            if (isOpen) {
                customDropdown.classList.remove('open');
                customDropdownBtn.setAttribute('aria-expanded', 'false');
            } else {
                customDropdown.classList.add('open');
                customDropdownBtn.setAttribute('aria-expanded', 'true');
            }
        });

        // Handle item selection
        dropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                const val = this.getAttribute('data-value');
                optionL.value = val;
                optionL.dispatchEvent(new Event('change'));
                customDropdown.classList.remove('open');
                customDropdownBtn.setAttribute('aria-expanded', 'false');
            });
        });

        // Close on click outside
        document.addEventListener('click', function() {
            customDropdown.classList.remove('open');
            customDropdownBtn.setAttribute('aria-expanded', 'false');
        });

        // Listen for native select change to keep custom UI in sync
        optionL.addEventListener('change', function() {
            syncCustomDropdown();
        });

        // Run initial sync
        syncCustomDropdown();
    }

    // Dropdown change listener block definitions
    optionL.addEventListener('change', function () {
        let selectedLang = optionL.value.toLowerCase().trim();
        if (!window.wpCodeEditorInstance) return;

        if (selectedLang === "nol") {
            if (ideTypewriterTimeout) clearInterval(ideTypewriterTimeout);
            window.wpCodeEditorInstance.setValue("");
            return;
        }

        // 🟢 HARD FIX: Normalize C++ string lookups to match 'cpp' cache key
        if (selectedLang === 'c++') {
            selectedLang = 'cpp';
        }

        // Cache currently written data blocks into local runtime volatile buffers before switching
        if (currentLang && currentLang !== "nol") {
            window.codeCache[currentLang] = window.wpCodeEditorInstance.getValue();
        }

        if (ideTypewriterTimeout) clearInterval(ideTypewriterTimeout);
        currentLang = selectedLang;

        // Dynamically adjust CodeMirror syntax highlighting options safely
        if (currentLang === 'python') {
            window.wpCodeEditorInstance.setOption("mode", "text/x-python");
        } else if (currentLang === 'cpp') {
            window.wpCodeEditorInstance.setOption("mode", "text/x-c++src");
        } else if (currentLang === 'c') {
            window.wpCodeEditorInstance.setOption("mode", "text/x-csrc");
        } else if (currentLang === 'java') {
            window.wpCodeEditorInstance.setOption("mode", "text/x-java");
        } else if (currentLang === 'javascript') {
            window.wpCodeEditorInstance.setOption("mode", "text/javascripts");
        }

        // Guard fallback: stream default configurations if cached data fields return empty rows
        let retrievedCode = window.codeCache[currentLang];
        if (!retrievedCode || retrievedCode.trim() === "") {
            retrievedCode = window.codeCache[currentLang] || "print('Hello world')";
        }

        streamCodeIntoEditor(retrievedCode, 8);
    });

    // Code line keyboard input neon active highlight handlers
    window.wpCodeEditorInstance.on("change", (instance, changeObj) => {
        if (changeObj.origin === "+input" || changeObj.origin === "paste") {
            clearTimeout(lineFadeTimeout);
            const currentLine = window.wpCodeEditorInstance.getDoc().getCursor().line;

            window.wpCodeEditorInstance.removeLineClass(currentLine, "background", "line-fade-out");
            window.wpCodeEditorInstance.addLineClass(currentLine, "background", "active-typing-line");

            lineFadeTimeout = setTimeout(() => {
                if (window.wpCodeEditorInstance) {
                    window.wpCodeEditorInstance.removeLineClass(currentLine, "background", "active-typing-line");
                    window.wpCodeEditorInstance.addLineClass(currentLine, "background", "line-fade-out");
                }
            }, 700);
        }
    });
}

// Instantiate workspace orchestrator check sequence
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeLanguageWorkspaceEngine);
} else {
    initializeLanguageWorkspaceEngine();
}