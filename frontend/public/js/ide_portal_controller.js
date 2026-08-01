
window.wpCodeEditorInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    const overlayGate = document.getElementById("authGateBoxOverlay");
    const workspaceGrid = document.getElementById("mainWorkspaceGridMatrix");
    const verifyBtn = document.getElementById("btnVerifyRoomCode");
    const statusAlert = document.getElementById("portalStatusAlertDisplay");

    const otpCells = document.querySelectorAll(".otp-digit-cell");
    const authToken = localStorage.getItem("authToken");

    if (!authToken) {
        window.location.href = "/signin";
        return;
    }

    if (otpCells.length > 0 && overlayGate && overlayGate.style.display !== "none") {
        otpCells[0].focus();
    }

    // Dynamic focus transformations logic loop bounds
    otpCells.forEach((cell, idx) => {
        cell.addEventListener("input", (e) => {
            const inputChar = e.target.value.trim().toUpperCase();
            cell.value = inputChar;

            if (inputChar.length > 0 && idx < otpCells.length - 1) {
                otpCells[idx + 1].focus();
            }

            const activeCodeBuffer = getCompiledOtpString();
            // 🟢 FIXED: Adjusted validation array boundaries strictly back to 6 characters
            if (activeCodeBuffer.length === 6) {
                triggerSecurityHandshake(activeCodeBuffer);
            }
        });

        cell.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && cell.value === "" && idx > 0) {
                otpCells[idx - 1].focus();
                otpCells[idx - 1].value = "";
            }
        });
    });

    function getCompiledOtpString() {
        let compiledString = "";
        otpCells.forEach((cell) => {
            const tokenChar = cell.value.trim().toUpperCase();
            if (tokenChar) compiledString += tokenChar;
        });
        return compiledString;
    }

    if (verifyBtn) {
        verifyBtn.addEventListener("click", async () => {
            const submissionCode = getCompiledOtpString();
            // 🟢 FIXED: Validate exact 6-character layout configs for manual click execution
            if (!submissionCode || submissionCode.length < 6) {
                displayGateError("Please input an authentic 6-character code sequence.");
                return;
            }
            await triggerSecurityHandshake(submissionCode);
        });
    }

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
                localStorage.setItem("activeExamQuestionsList", JSON.stringify(data.questions));
                localStorage.setItem("activeExamCurrentIndex", "0");

                bypassGateAndMountEditor();

                if (typeof window.hydrateExamWorkspaceTaskElement === "function") {
                    window.hydrateExamWorkspaceTaskElement();
                }
            } else {
                displayGateError(data.error || "Access Denied: Specified validation code mismatch.");
                clearAndResetOtpCells();
            }
        } catch (err) {
            console.error("Lock gate breakdown connection interception error:", err);
            displayGateError("Network communication latency error tracking handshakes.");
        } finally {
            if (verifyBtn) verifyBtn.disabled = false;
        }
    }

    function bypassGateAndMountEditor() {
        if (overlayGate) overlayGate.style.display = "none";
        if (workspaceGrid) workspaceGrid.classList.remove("workspace-blur-active");

        const textareaElement = document.getElementById("editor");
        if (textareaElement && !window.wpCodeEditorInstance) {
            window.wpCodeEditorInstance = CodeMirror.fromTextArea(textareaElement, {
                mode: "python",
                theme: "darcula",
                lineNumbers: true,
                autoCloseBrackets: true,
                matchBrackets: true,
                indentUnit: 4,
                lineWrapping: true
            });
            window.wpCodeEditorInstance.setSize("100%", "100%");

            // Broadcast global signal that CodeMirror is fully mounted so compilerRunner catches it instantly
            window.dispatchEvent(new Event("ideWorkspaceMounted"));

            // Activate our proctor security lock downs
            activateProctorSecurityShield();
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

    // =========================================================================
    // 🟢 PRODUCTION-GRADE PROCTORING & ANTI-CHEAT PROTOCOL MATRIX
    // =========================================================================
    // let tabViolationStrikes = 0;
    // const MAX_VIOLATION_LIMIT = 2; // Strict limit: 3rd switch triggers force lockout auto-submit

    // function activateProctorSecurityShield() {
    //     console.log("🛡️ Proctoring Security Shield Active: Monitoring Workspace Activity Vectors...");

    //     // 1️⃣ ANTI-INSPECT: Block Right-Click Context Menus
    //     document.addEventListener("contextmenu", (e) => {
    //         e.preventDefault();
    //         alert("Security Restriction: Right-click inspection is strictly disabled during active assessment sessions.");
    //     });

    //     // 2️⃣ ANTI-INSPECT: Block Core Developer Tool Keyboard Combos (F12, Ctrl+Shift+I/J/C, Ctrl+U)
    //     document.addEventListener("keydown", (e) => {
    //         const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    //         const metaOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    //         if (
    //             e.key === "F12" ||
    //             (metaOrCtrl && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
    //             (metaOrCtrl && (e.key === "U" || e.key === "u"))
    //         ) {
    //             e.preventDefault();
    //             e.stopPropagation();
    //             alert("Security Alert: Developer system tool hotkeys are strictly prohibited.");
    //         }
    //     });

    //     // 3️⃣ ANTI-COPY/PASTE: Block Clipboard Vectors within Code Canvas Area
    //     const workspaceContainer = document.getElementById("mainWorkspaceGridMatrix");
    //     if (workspaceContainer) {
    //         ["copy", "cut", "paste"].forEach(eventType => {
    //             workspaceContainer.addEventListener(eventType, (e) => {
    //                 e.preventDefault();
    //                 e.stopPropagation();
    //                 alert(`Security Restriction: Clipboard interactions (${eventType}) are permanently blocked inside the evaluation window.`);
    //             });
    //         });
    //     }

    //     // 4️⃣ ANTI-TAB-SWITCH: Monitor Window Visibility Focus Transitions
    //     document.addEventListener("visibilitychange", () => {
    //         if (document.visibilityState === "hidden") {
    //             if (!localStorage.getItem("activeExamTestId")) return;

    //             tabViolationStrikes++;
    //             console.warn(`⚠️ Tab violation detected! Strike Count: ${tabViolationStrikes}/${MAX_VIOLATION_LIMIT + 1}`);

    //             if (tabViolationStrikes <= MAX_VIOLATION_LIMIT) {
    //                 const strikesRemaining = (MAX_VIOLATION_LIMIT + 1) - tabViolationStrikes;
    //                 alert(`🚨 SECURITY VIOLATION DETECTED!\nYou have navigated away from the active examination portal environment. This infraction counts as a formal strike.\n\n⚠️ Warning: If you switch tabs, lose window focus, or minimize this screen ${strikesRemaining} more time(s), your session will be instantly terminated and force-submitted.`);
    //             } else {
    //                 executeEmergencyForceTermination();
    //             }
    //         }
    //     });
    // }

    // 🚨 EMERGENCY FORCE TERMINATION TERMINATION SEQUENCE
    function executeEmergencyForceTermination() {
        console.error("🚨 CRITICAL STRIKE THRESHOLD REACHED: Initiating programmatic lockout submittal...");

        const submitButtonElement = document.getElementById("codesubmit");
        if (submitButtonElement) {
            submitButtonElement.disabled = false;
            alert("🔒 ACCESS TERMINATED!\nYou have exceeded the maximum window tracking infraction limit. Your assessment session has been locked out, and your current script drafts are being automatically force-submitted to the evaluation databases.");
            submitButtonElement.click();
        } else {
            localStorage.clear();
            window.location.href = "/dashboard";
        }
    }

    // Re-engage proctoring instantly if refreshing back into a live running session context block
    if (localStorage.getItem("activeExamTestId")) {
        bypassGateAndMountEditor();
        setTimeout(() => {
            if (typeof window.hydrateExamWorkspaceTaskElement === "function") {
                window.hydrateExamWorkspaceTaskElement();
            }
        }, 150);
    } else {
        // Populate tempTestCode if redirected from dashboard
        const tempCode = localStorage.getItem("tempTestCode");
        if (tempCode && tempCode.length === 6 && otpCells.length === 6) {
            localStorage.removeItem("tempTestCode");
            otpCells.forEach((cell, idx) => {
                cell.value = tempCode[idx];
            });
            setTimeout(() => {
                triggerSecurityHandshake(tempCode);
            }, 300); // slight visual delay so student sees the room code populating on the auth screen
        }
    }
});