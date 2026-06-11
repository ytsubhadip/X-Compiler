/**
 * @file compilerRunner.js - Unified High-Performance Code Execution Client
 * Handles compiler triggers, terminal animations, status widgets,
 * countdown proctoring, and multi-task assignment submittal transactions.
 */

document.addEventListener("DOMContentLoaded", () => {
    let widgetTimeout;
    let consoleTimeout;

    function typeWidgetText(element, text, speed = 40) {
        clearTimeout(widgetTimeout);
        element.textContent = "";
        let i = 0;
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                widgetTimeout = setTimeout(type, speed);
            }
        }
        type();
    }

    function typeConsoleOutput(textarea, text, speed = 5) {
        clearTimeout(consoleTimeout);
        textarea.value = "";
        let i = 0;
        function type() {
            if (i < text.length) {
                textarea.value += text.charAt(i);
                textarea.scrollTop = textarea.scrollHeight; 
                i++;
                consoleTimeout = setTimeout(type, speed);
            }
        }
        type();
    }

    function updateConsolePet(state) {
        const consoleHeader = document.querySelector('.console-header');
        if (!consoleHeader) return;

        let pet = document.getElementById('ide-pet');
        if (!pet) {
            pet = document.createElement('div');
            pet.id = 'ide-pet';
            pet.style.cssText = `margin-left: auto; margin-right: 16px; display: flex; align-items: center; gap: 10px; padding: 6px 14px; border-radius: 12px; background: #1a1d24; border: 1px solid rgba(255, 255, 255, 0.05); transition: all 0.4s ease;`;
            const statusEl = document.getElementById('consoleStatus');
            consoleHeader.insertBefore(pet, statusEl);
        }

        if (!pet.innerHTML) {
            pet.innerHTML = `
              <span id="pet-avatar" style="font-size: 1.2rem; transition: transform 0.3s ease;">💤</span>
              <span id="pet-status" style="font-size: 0.85rem; font-family: 'Outfit', sans-serif; font-weight: 500; min-width: 100px; color: #fff;"></span>
            `;
        }

        const avatar = document.getElementById('pet-avatar');
        const statusText = document.getElementById('pet-status');

        if (state === 'idle') {
            avatar.textContent = "💤";
            typeWidgetText(statusText, "Chillin'...");
            statusText.style.color = "#888";
        } else if (state === 'running') {
            avatar.textContent = "⚡";
            typeWidgetText(statusText, "Crunching bytes...", 30);
            statusText.style.color = "#ffc107";
        } else if (state === 'success') {
            avatar.textContent = "✨ 😺";
            typeWidgetText(statusText, "Clean compile!", 40);
            statusText.style.color = "#2ec866";
        } else if (state === 'error') {
            avatar.textContent = "😈 🔥";
            typeWidgetText(statusText, "Bug found!", 40);
            statusText.style.color = "#dc3545";
        }
    }

    function showModernToast(message, isSuccess = false) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 12px;';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.style.cssText = `background: #16181d; border-left: 4px solid ${isSuccess ? '#2ec866' : '#dc3545'}; color: #fff; padding: 16px 20px; border-radius: 8px; font-family: 'Outfit', sans-serif; font-size: 0.9rem; box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5); display: flex; align-items: center; gap: 14px; opacity: 0; transform: translateX(40px); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);`;
        toast.innerHTML = `<i class="bi ${isSuccess ? 'bi-check-circle-fill' : 'bi-slash-circle-fill'}" style="color: ${isSuccess ? '#2ec866' : '#dc3545'}; font-size: 1.1rem;"></i> <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)'; }, 50);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(40px)'; setTimeout(() => toast.remove(), 400); }, 4000);
    }

    // =========================================================================
    // 🟢 PRODUCTION-GRADE WORKSPACE DYNAMIC MODAL INJECTORS
    // =========================================================================
    function createCustomExamModal(htmlContent) {
        // Clear out any old instances
        const oldModal = document.getElementById("customExamModalWrapper");
        if (oldModal) oldModal.remove();

        const backdrop = document.createElement("div");
        backdrop.id = "customExamModalWrapper";
        backdrop.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(10, 12, 16, 0.82); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); z-index: 99999; display: flex; align-items: center; justify-content: center; opacity: 0; transition: all 0.3s ease;";
        
        const card = document.createElement("div");
        card.style.cssText = "background: #111418; border: 1px solid rgba(255, 255, 255, 0.06); padding: 32px; border-radius: 20px; max-width: 440px; width: 90%; text-align: center; box-shadow: 0 30px 70px rgba(0,0,0,0.8); transform: scale(0.9); transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);";
        card.innerHTML = htmlContent;
        
        backdrop.appendChild(card);
        document.body.appendChild(backdrop);
        
        // Force Reflow for Animations
        setTimeout(() => {
            backdrop.style.opacity = "1";
            card.style.transform = "scale(1)";
        }, 20);

        return backdrop;
    }

    function removeCustomExamModal() {
        const modal = document.getElementById("customExamModalWrapper");
        if (!modal) return;
        modal.style.opacity = "0";
        modal.children[0].style.transform = "scale(0.9)";
        setTimeout(() => modal.remove(), 300);
    }

    // =========================================================================
    // 🟢 TICKING TIMER COUNTDOWN CLOCK ENGINE
    // =========================================================================
    function startGlobalExamCountdown() {
        const complexityDisplay = document.getElementById("complexity");
        if (!complexityDisplay) return;

        // Create a styled block container context right over the complexity metadata slot
        complexityDisplay.innerHTML = `<span id="examClockNode" class="text-success font-monospace fw-bold" style="letter-spacing: 1px; font-size: 0.95rem;"><i class="bi bi-stopwatch-fill me-1 fa-spin"></i> Syncing...</span>`;

        let timeRemainingInMinutes = parseInt(localStorage.getItem("examTimeRemaining") || "60");
        let totalSeconds = timeRemainingInMinutes * 60;

        const clockInterval = setInterval(() => {
            if (!localStorage.getItem("activeExamTestId")) {
                clearInterval(clockInterval);
                return;
            }

            if (totalSeconds <= 0) {
                clearInterval(clockInterval);
                document.getElementById("examClockNode").textContent = "00:00";
                document.getElementById("examClockNode").className = "text-danger font-monospace fw-bold";
                
                // 🚨 FORCE AUTOMATED RECOGNITION EXECUTOR
                executeFinalSubmissionPipeline(true);
                return;
            }

            totalSeconds--;
            
            // Sync calculation units back to local cache storage rows
            const ceilingMinutes = Math.ceil(totalSeconds / 60);
            localStorage.setItem("examTimeRemaining", ceilingMinutes);

            let displayMin = Math.floor(totalSeconds / 60);
            let displaySec = totalSeconds % 60;

            displayMin = displayMin < 10 ? "0" + displayMin : displayMin;
            displaySec = displaySec < 10 ? "0" + displaySec : displaySec;

            const clockNode = document.getElementById("examClockNode");
            if (clockNode) {
                clockNode.innerHTML = `<i class="bi bi-clock-history me-1 ${totalSeconds < 60 ? 'text-danger fa-beat' : 'text-success'}"></i> ${displayMin}:${displaySec}`;
                if (totalSeconds < 60) {
                    clockNode.className = "text-danger font-monospace fw-bold";
                }
            }
        }, 1000);
    }

    // Mount initial idle pet state cleanly
    updateConsolePet('idle');
    if (localStorage.getItem("activeExamTestId")) {
        startGlobalExamCountdown();
    }

    // =========================================================================
    // 🟢 GLOBAL EVENT DELEGATION LISTENER BLOCK
    // =========================================================================
    document.addEventListener("click", async function (event) {
        const target = event.target;

        // 1️⃣ INTERCEPT RUN CODE BUTTON ACTION
        if (target && (target.id === "coderun" || target.closest("#coderun"))) {
            event.preventDefault();
            console.log("🖱 Moff! Run Code event intercepted successfully!");

            const runBtn = document.getElementById("coderun");
            const optionLElement = document.getElementById("inlineFormSelectPref");
            const output = document.getElementById('output');
            const statusEl = document.getElementById('consoleStatus');
            const inputEl = document.getElementById("customInput");

            if (!optionLElement || optionLElement.value === "noL") {
                showModernToast("Please select a valid environment language context.", false);
                return;
            }

            if (!window.wpCodeEditorInstance) {
                showModernToast("Workspace initialization mismatch. Please refresh.", false);
                return;
            }

            if (statusEl) {
                statusEl.textContent = "Running";
                statusEl.className = "badge-status badge-status-running";
            }

            updateConsolePet('running');
            clearTimeout(consoleTimeout);
            output.value = "Compiling and running....";

            const codePayload = {
                code: window.wpCodeEditorInstance.getValue(),
                input: inputEl ? inputEl.value : "",
                lang: optionLElement.value.toLowerCase().trim(),
                questionId: window.activeQuestionId || null,
                testCases: window.activeTestCases || []
            };

            try {
                runBtn.disabled = true;
                runBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i> Running...`;

                const response = await fetch("/compiler", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(codePayload)
                });

                if (!response.ok) throw new Error(`Gateway Error ${response.status}`);
                const con = await response.json();

                if (con.error) {
                    output.classList.add("console-error-text");
                    if (statusEl) { statusEl.textContent = "Rejected"; statusEl.className = "badge-status badge-status-rejected"; }
                    updateConsolePet('error');
                    typeConsoleOutput(output, con.error, 4);
                    showModernToast("Execution halted: Structural bugs discovered.", false);
                } else {
                    output.classList.remove("console-error-text");
                    if (statusEl) { statusEl.textContent = "Accepted"; statusEl.className = "badge-status badge-status-success"; }
                    updateConsolePet('success');
                    typeConsoleOutput(output, con.output || "Execution completed cleanly.", 6);
                    showModernToast("Build finished cleanly. Scripts evaluated successfully.", true);
                }
            } catch (err) {
                console.error("Outbound compile link failure:", err);
                updateConsolePet('error');
                if (statusEl) { statusEl.textContent = "Rejected"; }
                typeConsoleOutput(output, `Network Interrupt: ${err.message}`, 5);
            } finally {
                runBtn.disabled = false;
                runBtn.innerHTML = `<i class="bi bi-play-fill"></i> Run Code`;
            }
        }

        // 2️⃣ INTERCEPT SUBMIT EXAM BUTTON ACTION (RAISES BEAUTIFUL MODAL PROMPT)
        if (target && (target.id === "codesubmit" || target.closest("#codesubmit"))) {
            event.preventDefault();
            console.log("🖱️ Submit Exam click caught: Raising glassmorphic confirmation modal panel...");

            const submitBtn = document.getElementById("codesubmit");
            if (submitBtn.disabled) return;

            // Injected Content Mapping Rule Layout for Confirmation Matrix
            const confirmContent = `
                <div style="font-size: 3.5rem; margin-bottom: 16px;">📂</div>
                <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: #fff; margin-bottom: 12px;">Finalize Examination Script?</h4>
                <p style="font-size: 0.88rem; color: #8a99ad; line-height: 1.5; margin-bottom: 28px;">Are you sure you want to commit your current tasks workspace? All loaded code parameters will be packaged and locked down into production databases.</p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button type="button" id="modal-cancel-btn" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #fff; padding: 10px 22px; border-radius: 10px; font-weight: 600; font-size: 0.9rem; transition: all 0.2s;">Cancel</button>
                    <button type="button" id="modal-confirm-btn" style="background: #2ec866; border: none; color: #0d0f12; padding: 10px 24px; border-radius: 10px; font-weight: 700; font-size: 0.9rem; box-shadow: 0 8px 20px rgba(46, 200, 102, 0.25); transition: all 0.2s;">Confirm Submit</button>
                </div>
            `;

            createCustomExamModal(confirmContent);
            return;
        }

        // 3️⃣ HANDLE MODAL CANCEL TAP CLICK
        if (target && target.id === "modal-cancel-btn") {
            removeCustomExamModal();
            return;
        }

        // 4️⃣ HANDLE MODAL CONFIRM SUBMIT ACTION TAP CLICK
        if (target && target.id === "modal-confirm-btn") {
            removeCustomExamModal();
            executeFinalSubmissionPipeline(false);
            return;
        }
    });

    // =========================================================================
    // 🟢 CORE FINAL DATA PERSISTENCE PIPELINE METHOD
    // =========================================================================
    async function executeFinalSubmissionPipeline(isAutoForceSubmitted = false) {
        const submitBtn = document.getElementById("codesubmit");
        if (submitBtn) submitBtn.disabled = true;

        if (typeof window.saveCurrentCodeDraftToLocalMemory === 'function') {
            window.saveCurrentCodeDraftToLocalMemory();
        }

        // Display Loading/Processing Screen overlay lock
        const loadingContent = `
            <div style="margin-bottom: 20px;"><i class="fa-solid fa-spinner fa-spin fa-3x text-success"></i></div>
            <h5 style="color: #fff; font-family: 'Outfit', sans-serif; font-weight: 600;">${isAutoForceSubmitted ? 'Time Expired: Force-Submitting' : 'Encrypting Script Payload...'}</h5>
            <p style="font-size: 0.85rem; color: #6c7a8d; margin-top: 6px;">Syncing answers mapping securely down to  clusters...</p>
        `;
        createCustomExamModal(loadingContent);

        try {
            const activeExamId = localStorage.getItem("activeExamTestId");
            const answersPayload = [];
            const cachedQuestionsList = JSON.parse(localStorage.getItem("activeExamQuestionsList") || "[]");

            cachedQuestionsList.forEach((q, idx) => {
                const targetId = q._id || q.id;
                const savedCode = localStorage.getItem(`exam_code_draft_q_${idx}`) || 
                                  localStorage.getItem(`exam_code_draft_q_${targetId}`) || 
                                  "";

                answersPayload.push({
                    questionId: targetId,
                    submittedCode: savedCode
                });
            });

            const response = await fetch("/api/tests/submit-evaluation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    testId: activeExamId,
                    submissions: answersPayload
                })
            });

            const report = await response.json();
            
            if (response.ok && report.success) {
                // Wipe Local Storage configurations keys clean immediately upon verification handshake
                localStorage.removeItem("activeExamTestId");
                localStorage.removeItem("activeExamQuestionsList");
                localStorage.removeItem("examTimeRemaining");
                localStorage.removeItem("activeExamCurrentIndex");
                
                cachedQuestionsList.forEach((q, idx) => {
                    localStorage.removeItem(`exam_code_draft_q_${idx}`);
                    localStorage.removeItem(`exam_code_draft_q_${q._id || q.id}`);
                });

                // Inject the Success UI State Card Frame Content
                const successContent = `
                    <div style="font-size: 4rem; color: #2ec866; margin-bottom: 12px;" class="fa-bounce">✨</div>
                    <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: #fff; margin-bottom: 8px;">Answers Submitted!</h4>
                    <p style="font-size: 0.85rem; color: #2ec866; font-weight: 600; margin-bottom: 12px; background: rgba(46,200,102,0.06); padding: 6px 12px; border-radius: 8px; display: inline-block;">Committed Cleanly to MongoDB Atlas</p>
                    <p style="font-size: 0.85rem; color: #7a899e; line-height: 1.5; margin-bottom: 24px;">Your script records are locked and secured. You are being redirected safely back to your main student command portal panel view.</p>
                    <div style="font-size: 0.8rem; color: #526073; font-family: monospace;">Redirecting in <span id="countdown-redirect-ticker">4</span>s...</div>
                `;
                createCustomExamModal(successContent);

                //  Dynamic Visual Countdown redirect ticker (4-5 Seconds delay block loop)
                let remainingTicks = 4;
                const redirectTimer = setInterval(() => {
                    remainingTicks--;
                    const node = document.getElementById("countdown-redirect-ticker");
                    if (node) node.textContent = remainingTicks;
                    
                    if (remainingTicks <= 0) {
                        clearInterval(redirectTimer);
                        removeCustomExamModal();
                        //  REDIRECT ROAD TARGET
                        window.location.href = "/dashboard";
                    }
                }, 1000);

            } else {
                throw new Error(report.error || "Submission rejected by Mongoose model constraints.");
            }
        } catch (submitErr) {
            console.error("Submission pipeline collapsed:", submitErr);
            removeCustomExamModal();
            showModernToast(`Transaction Blocked: ${submitErr.message}`, false);
            if (submitBtn) submitBtn.disabled = false;
        }
    }
});