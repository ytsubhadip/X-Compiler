/**
 * @file signup.js
 * @description Manages registration forms, validation rules, role identifier matching, 
 * and REST API mutations to create new user profiles.
 * 
 * Used in:
 * - /pages/user_auth/signup.html
 */

document.addEventListener("DOMContentLoaded", () => {
    /**
     * Signup Form element reference in DOM.
     * @type {HTMLFormElement|null}
     */
    const signupForm = document.getElementById("formSignup");

    /**
     * Account creation action submit button.
     * @type {HTMLButtonElement|null}
     */
    const submitBtn = document.getElementById("btnSubmitSignup");

    if (signupForm) {
        /**
         * Intercepts form submissions and triggers account registration queries.
         */
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById("signupName");
            const emailInput = document.getElementById("signupEmail");
            const passwordInput = document.getElementById("signupPassword");
            const confirmPasswordInput = document.getElementById("signupConfirmPassword");

            if (!nameInput || !emailInput || !passwordInput || !confirmPasswordInput) return;

            // Determine active persona registration context (defaults to student)
            let currentRole = "student";
            const teacherTab = document.getElementById("btnTabTeacher");
            if (teacherTab && teacherTab.classList.contains("active")) {
                currentRole = "teacher";
            }

            // Pick correct role identifier inputs dynamically
            const roleIdentifierField = currentRole === 'student' 
                ? document.getElementById("signupStudentId") 
                : document.getElementById("signupTeacherId");

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
                roleIdentifier: roleIdentifierField ? roleIdentifierField.value.trim() : "N/A"
            };

            // Collect student-specific department and semester contexts if active
            if (currentRole === 'student') {
                const deptSelect = document.getElementById("signupStudentDept");
                const semInput = document.getElementById("signupStudentSem");
                payload.department = deptSelect ? deptSelect.value : "";
                payload.semester = semInput ? parseInt(semInput.value) : null;
            }

            try {
                // Disable interface triggers and show loading animation text
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerText = "Creating...";
                }

                // Mutate DB and generate profile records in backend service
                const response = await fetch("/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Registration rejected.");

                if (submitBtn) submitBtn.innerText = "Created";
                
                // Redirect user to the login window to start sessions cleanly
                setTimeout(() => window.location.href = "/signin", 900);

            } catch (err) {
                // Restore submit triggers and alert user on failures
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = "Create Account";
                }
                console.error("Signup error:", err);
                alert(`Registration Failed: ${err.message}`);
            }
        });
    }
});