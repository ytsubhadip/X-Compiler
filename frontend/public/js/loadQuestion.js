/**
 * @file loadQuestion.js
 * @description Implements robust telemetry fetching and structural formatting of coding 
 * challenges using relative proxy paths to prevent cross-port connection block errors.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Expose layout updater block globally so ide_portal_controller can trigger it on the fly
    window.loadQuestionDataMatrix = async function (explicitTestId = null) {
        
        const questionTitle = document.getElementById("question");
        const questionExample = document.getElementById("exap");
        const questionDescription = document.getElementById("description");
        const questionSample = document.getElementById("sample");

        // 🟢 FIXED ROUTING API MATRIX: Resolve endpoints relatively without hardcoding port 8001
        const activeExamToken = explicitTestId || localStorage.getItem("activeExamTestId");
        
        // Construct clean backend API routes
        const PRIMARY_URL = activeExamToken ? `/api/question/${activeExamToken}` : "/api/question/active";
        const FALLBACK_URL = "/api/question/active"; 

        async function tryFetchQuestion(url) {
            const response = await fetch(url, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("authToken")}`
                }
            });
            if (!response.ok) throw new Error(`Status ${response.status}`);
            return await response.json();
        }

        try {
            let data = null;
            try {
                data = await tryFetchQuestion(PRIMARY_URL);
            } catch (primaryErr) {
                console.warn("Primary question payload unavailable, checking fallback relative proxy node...", primaryErr);
                data = await tryFetchQuestion(FALLBACK_URL);
            }

            if (data) {
                const titleText = data.question || data.title || "Reverse String";
                const descText = data.description || "Write a function that reverses a string. The input string is given as an array of characters s.";
                const rawExample = data.example;
                const rawSample = data.sample || data.sampleOutputs;

                if (questionTitle) questionTitle.textContent = titleText;
                if (questionDescription) questionDescription.textContent = descText;
                
                // Format examples safely
                if (questionExample) {
                    let exampleText = "";
                    if (rawExample) {
                        if (Array.isArray(rawExample)) {
                            rawExample.forEach((ex, idx) => {
                                if (ex.example_input) exampleText += `${ex.example_input}\n`;
                                if (ex.example_output) exampleText += `${ex.example_output}\n`;
                                if (idx < rawExample.length - 1) exampleText += "\n";
                            });
                        } else if (typeof rawExample === 'object') {
                            exampleText = JSON.stringify(rawExample, null, 2);
                        } else {
                            exampleText = rawExample;
                        }
                    } else {
                        exampleText = 'Input: s = ["h","e","l","l","o"]\nOutput: ["o","l","l","e","h"]';
                    }
                    questionExample.textContent = exampleText;
                }

                // Format expected outcomes safely
                if (questionSample) {
                    let sampleText = "";
                    if (rawSample) {
                        if (Array.isArray(rawSample)) {
                            rawSample.forEach((sa, idx) => {
                                if (sa.input) sampleText += `Input: "${sa.input}"\n`;
                                if (sa.output) sampleText += `Output: "${sa.output}"\n`;
                                if (idx < rawSample.length - 1) sampleText += "\n";
                            });
                        } else if (typeof rawSample === 'object') {
                            sampleText = JSON.stringify(rawSample, null, 2);
                        } else {
                            sampleText = rawSample;
                        }
                    } else {
                        sampleText = 'Input: "hello"\nOutput: "olleh"';
                    }
                    questionSample.textContent = sampleText;
                }
            }

        } catch (err) {
            console.error("Failed to hydrate task question parameters layout metrics:", err);
            
            // Hard coded default UI backup parameters fallback
            if (questionTitle) questionTitle.textContent = "Reverse String";
            if (questionDescription) {
                questionDescription.textContent = "Write a function that reverses a string. The input string is given as an array of characters s. You must do this by modifying the input array in-place with O(1) extra memory.";
            }
            if (questionExample) {
                questionExample.textContent = 'Input: s = ["h","e","l","l","o"]\nOutput: ["o","l","l","e","h"]';
            }
            if (questionSample) {
                questionSample.textContent = 'Input: "hello"\nOutput: "olleh"';
            }
        }
    };

    // Automatically trigger on viewport rendering initialization loop if token is cached
    if (localStorage.getItem("activeExamTestId")) {
        window.loadQuestionDataMatrix();
    }
});