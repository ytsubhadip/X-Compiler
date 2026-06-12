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
            window.wpCodeEditorInstance.setOption("mode", "text/javascript");
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