/**
 * @file ide_portal_controller.js
 * @description Decoupled workspace state controller. Orchestrates interactive 
 * 7-cell hyphenated OTP access matrices (e.g. OLD-8ADE), handles invite leaks, 
 * and securely initializes CodeMirror instances under strict anti-flicker guards.
 */

window.wpCodeEditorInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
    const overlayGate = document.getElementById("authGateBoxOverlay");
    const workspaceGrid = document.getElementById("mainWorkspaceGridMatrix");
    const verifyBtn = document.getElementById("btnVerifyRoomCode");
    const statusAlert = document.getElementById("portalStatusAlertDisplay");
    
    // Select all split character cells across the DOM grid array
    const otpCells = document.querySelectorAll(".otp-digit-cell");
    const authToken = localStorage.getItem("authToken");

    if (!authToken) {
        window.location.href = "/signin";
        return;
    }

    // Immediately push text cursor focus to box cell 1 on page initialization
    if (otpCells.length > 0 && overlayGate && overlayGate.style.display !== "none") {
        otpCells[0].focus();
    }

    // =========================================================================
    // 1. DYNAMIC FOCUS-SHIFTING OTP CELL KEYSTROKE HANDLERS
    // =========================================================================
    otpCells.forEach((cell, idx) => {
        // Handle input typing transformations
        cell.addEventListener("input", (e) => {
            const inputChar = e.target.value.trim().toUpperCase();
            cell.value = inputChar; // Force clean uppercase characters inside display rendering

            if (inputChar.length > 0) {
                // Shift focus to the next logical input box in line if it exists
                if (idx < otpCells.length - 1) {
                    otpCells[idx + 1].focus();
                }
            }

            // Automated completion shortcut trigger: Check if every box has a string digit compiled
            const activeCodeBuffer = getCompiledOtpString();
            if (activeCodeBuffer.length === 8) { // 7 letters + 1 integrated hyphen = 8 total characters
                triggerSecurityHandshake(activeCodeBuffer);
            }
        });

        // Handle structural backspaces to reverse caret focus points
        cell.addEventListener("keydown", (e) => {
            if (e.key === "Backspace") {
                if (cell.value === "" && idx > 0) {
                    otpCells[idx - 1].focus();
                    otpCells[idx - 1].value = "";
                }
            }
        });

        // Intercept global string copy pastes and scatter values across the box elements arrays
        cell.addEventListener("paste", (e) => {
            e.preventDefault();
            let pasteBuffer = (e.clipboardData || window.clipboardData).getData("text").trim().toUpperCase();
            
            // Remove any random hyphens the student pasted so we can unpack raw alphanumeric strings evenly
            pasteBuffer = pasteBuffer.replace(/-/g, "");

            if (pasteBuffer.length <= 7) {
                otpCells.forEach((targetCell, targetIdx) => {
                    if (pasteBuffer.charAt(targetIdx)) {
                        targetCell.value = pasteBuffer.charAt(targetIdx);
                    }
                });

                // Jump focus to the end of parsed input values index boundary
                const shiftIndexTarget = Math.min(pasteBuffer.length, otpCells.length - 1);
                if (otpCells[shiftIndexTarget]) otpCells[shiftIndexTarget].focus();

                const verifiedCodeString = getCompiledOtpString();
                if (verifiedCodeString.length === 8) {
                    triggerSecurityHandshake(verifiedCodeString);
                }
            }
        });
    });

    /**
     * Unpacks cell array values and bundles them with a hyphen: e.g. "OLD" + "-" + "8ADE"
     * @returns {string} Fully structured 8-character token identifier signature.
     */
    function getCompiledOtpString() {
        let prefixSegment = "";
        let suffixSegment = "";
        
        otpCells.forEach((cell, index) => {
            const tokenChar = cell.value.trim().toUpperCase();
            if (index < 3) prefixSegment += tokenChar;  // First 3 boxes (e.g., 'OLD')
            if (index >= 3) suffixSegment += tokenChar; // Last 4 boxes (e.g., '8ADE')
        });

        // Return if any fields are empty to avoid incomplete validation fetch streams
        if (prefixSegment.length < 3 || suffixSegment.length < 4) return "";
        
        return `${prefixSegment}-${suffixSegment}`;
    }

    // =========================================================================
    // 2. MANUAL ACCORDION INTERACTION OVERRIDES
    // =========================================================================
    if (verifyBtn) {
        verifyBtn.addEventListener("click", async () => {
            const submissionCode = getCompiledOtpString();
            if (!submissionCode || submissionCode.length < 8) {
                displayGateError("Please input an authentic 7-character code sequence.");
                return;
            }
            await triggerSecurityHandshake(submissionCode);
        });
    }

    // =========================================================================
    // 3. SECURE BACKEND API COMMUNICATIONS ARCHITECTURE LAYER
    // =========================================================================
    async function triggerSecurityHandshake(compiledOtpCode) {
        try {
            if (statusAlert) statusAlert.style.display = "none";
            if (verifyBtn) verifyBtn.disabled = true;

            const response = await fetch("/api/tests/join", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ code: compiledOtpCode })
            });

            const data = await response.json();

            if (response.ok && data.success === true) {
                localStorage.setItem("activeExamTestId", data.testId);
                localStorage.setItem("examTimeRemaining", data.duration);
                
                // Clear out the overlay and instantiate active terminal layout frames
                bypassGateAndMountEditor();
                
                // Fire dynamic text loading hooks configured inside loadQuestion.js
                if (typeof window.loadQuestionDataMatrix === "function") {
                    window.loadQuestionDataMatrix(data.testId);
                }
            } else {
                displayGateError(data.error || "Access Denied: Specified validation code mismatch.");
                clearAndResetOtpCells();
            }
        } catch (err) {
            console.error("Lock gate system breakdown payload interception:", err);
            displayGateError("Network communication latency error tracking handshakes.");
        } finally {
            if (verifyBtn) verifyBtn.disabled = false;
        }
    }

    function bypassGateAndMountEditor() {
        if (overlayGate) overlayGate.style.display = "none";
        if (workspaceGrid) workspaceGrid.classList.remove("workspace-blur-active");
        
        const textareaElement = document.getElementById("editor");
        if (textareaElement) {
            // 🟢 ANTI-FLICKER RENDERING GUARD: Guarantees single allocation loops
            if (!window.wpCodeEditorInstance) {
                window.wpCodeEditorInstance = CodeMirror.fromTextArea(textareaElement, {
                    mode: "python",
                    theme: "darcula",
                    lineNumbers: true,
                    autoCloseBrackets: true,
                    matchBrackets: true,
                    indentUnit: 4,
                    lineWrapping: true,
                    scrollbarStyle: "native"
                });
                window.wpCodeEditorInstance.setSize("100%", "100%");
                
                setTimeout(() => {
                    if (window.wpCodeEditorInstance) window.wpCodeEditorInstance.refresh();
                }, 200);
            } else {
                window.wpCodeEditorInstance.refresh();
            }
        }
    }

    function clearAndResetOtpCells() {
        otpCells.forEach(cell => cell.value = "");
        if (otpCells[0]) otpCells[0].focus();
    }

    function displayGateError(msg) {
        if (!statusAlert) return;
        statusAlert.innerText = msg;
        statusAlert.style.display = "block";
    }

    // Auto-uncover interface structures seamlessly if the terminal token is cached valid
    if (localStorage.getItem("activeExamTestId")) {
        bypassGateAndMountEditor();
    }
});