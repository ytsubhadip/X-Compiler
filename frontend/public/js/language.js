/**
 * @file language.js
 * @description Manages CodeMirror editor language context switching, 
 * interactive live typing code line highlights, and character streaming (typewriter effect) 
 * inside the IDE editor panel.
 * * Used in:
 * - /pages/compiler_page/playground.html
 * - /pages/compiler_page/coding_test.html
 */

const optionL = document.getElementById('inlineFormSelectPref');
let ideTypewriterTimeout;
let lineFadeTimeout;

const codeCache = {
    python: "print('Hello world')",
    cpp: `#include <iostream>\nusing namespace std;\nint main() {\n  cout << "Hello world";\n  return 0;\n}`,
    c: `#include <stdio.h>\nint main() {\n  printf("hello, world");\n  return 0;\n}`,
    java: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello World");\n  }\n}`,
    javascript: `console.log("Hello World");`
};

let currentLang = optionL ? optionL.value || 'python' : 'python';

/**
 * Streams pre-formatted template code snippets into the global CodeMirror instance.
 */
function streamCodeIntoEditor(targetText, speed = 10) {
    clearInterval(ideTypewriterTimeout);
    
    // 🟢 SECURE INSTANCE CHECK: Target the global window instance wrapper
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
        }
    }, speed);
}

// Event listener for dropdown language shifts
if (optionL) {
    optionL.addEventListener('change', function () {
        const selectedLang = optionL.value.toLowerCase().trim();
        if (!window.wpCodeEditorInstance) return;

        if (selectedLang === "nol") {
            clearInterval(ideTypewriterTimeout);
            window.wpCodeEditorInstance.setValue("");
            return;
        }

        if (currentLang && currentLang !== "nol") {
            codeCache[currentLang] = window.wpCodeEditorInstance.getValue();
        }
        
        clearInterval(ideTypewriterTimeout);
        currentLang = selectedLang;
        
        // Dynamically adjust CodeMirror syntax highlighting options safely
        if (currentLang === 'python') {
            window.wpCodeEditorInstance.setOption("mode", "text/x-python");
        } else if (currentLang === 'cpp' || currentLang === 'c++') {
            window.wpCodeEditorInstance.setOption("mode", "text/x-c++src");
        } else if (currentLang === 'c') {
            window.wpCodeEditorInstance.setOption("mode", "text/x-csrc");
        } else if (currentLang === 'java') {
            window.wpCodeEditorInstance.setOption("mode", "text/x-java");
        } else if (currentLang === 'javascript') {
            window.wpCodeEditorInstance.setOption("mode", "text/javascript");
        }

        const retrievedCode = codeCache[currentLang];
        if (retrievedCode) {
            streamCodeIntoEditor(retrievedCode, 8); 
        }
    });
}

/**
 * 🟢 NEON GLOW DELEGATED INITIALIZATION
 * Attaches the change listener safely after the global CodeMirror canvas mounts.
 */
function initializeLineHighlighterHook() {
    if (!window.wpCodeEditorInstance) {
        // If your overlay gate is still active, wait slightly and check back
        setTimeout(initializeLineHighlighterHook, 500);
        return;
    }

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

// Start watching for editor mounting cycles
initializeLineHighlighterHook();