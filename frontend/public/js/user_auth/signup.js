
document.addEventListener("DOMContentLoaded", () => {

    const signupForm = document.getElementById("formSignup");
    const submitBtn = document.getElementById("btnSubmitSignup");

    // Shared references for the global dynamic domino loader overlay screen
    const pageLoader = document.getElementById("globalPageLoader");
    const loaderText = document.getElementById("globalLoaderText");

    if (signupForm) {

        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById("signupName");
            const emailInput = document.getElementById("signupEmail");
            const passwordInput = document.getElementById("signupPassword");
            const confirmPasswordInput = document.getElementById("signupConfirmPassword");

            if (!nameInput || !emailInput || !passwordInput || !confirmPasswordInput) return;

            let currentRole = "student";
            const teacherTab = document.getElementById("btnTabTeacher");
            if (teacherTab && teacherTab.classList.contains("active")) {
                currentRole = "teacher";
            }

            // Perform simple password equality validation
            if (passwordInput.value !== confirmPasswordInput.value) {
                alert("Passwords do not match!");
                return;
            }

            // Construct payload configuration object
            const payload = {
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                password: passwordInput.value,
                role: currentRole,
            };

            // Collect student-specific department and semester contexts if active
            if (currentRole === 'student') {
                const deptSelect = document.getElementById("signupStudentDept");
                const semInput = document.getElementById("signupStudentSem");
                const studentRollNumber = document.getElementById("signupStudentId");

                payload.rollnumber = studentRollNumber ? studentRollNumber.value.trim() : "N/A";
                payload.department = deptSelect ? deptSelect.value : "";
                payload.semester = semInput ? parseInt(semInput.value) : null;
            }

            // teacher unique ID moved to signin page; no teacher unique in signup payload

            try {
                console.log("Submitting payload context:", payload);

                // Disable interface triggers and show loading spinner inside the button
                if (submitBtn) {
                    submitBtn.disabled = true;
                    const signupLoader = document.getElementById("signupLoader");
                    const signupBtnText = document.getElementById("signupBtnText");
                    if (signupLoader) signupLoader.classList.remove("d-none");
                    if (signupBtnText) signupBtnText.textContent = "Creating Account...";
                }

                // Mutate DB and generate profile records in backend service
                // 🟢 FIXED SYNTAX: Stray '|' character successfully removed
                const response = await fetch("/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

               const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Registration rejected.");

                // 🟢 UPDATE LOADER TEXT ON SUCCESS
                if (loaderText) loaderText.innerText = "Account Created! Redirecting to Gateway...";
                if (submitBtn) submitBtn.innerText = "Created";

                // Redirect user to the login window to start sessions cleanly
                setTimeout(() => window.location.href = "/signin", 900);

            } catch (err) {
                // ❌ CLOSE OVERLAY INSTANTLY ON FAILURE
                if (pageLoader) pageLoader.classList.remove("active");

                // Restore submit triggers and alert user on failures
                if (submitBtn) {
                    submitBtn.disabled = false;
                    const signupLoader = document.getElementById("signupLoader");
                    const signupBtnText = document.getElementById("signupBtnText");
                    if (signupLoader) signupLoader.classList.add("d-none");
                    if (signupBtnText) signupBtnText.innerHTML = `<i class="bi bi-person-plus-fill me-1"></i> Create Account`;
                }
                console.error("Signup error:", err);
                alert(`Registration Failed: ${err.message}`);
            }
        });
    }
});