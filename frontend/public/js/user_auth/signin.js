
document.addEventListener("DOMContentLoaded", () => {

    const signinForm = document.getElementById("formSignin");
    const submitBtn = document.getElementById("btnSubmitSignin");
    const authWrapper = document.getElementById("authWrapper");
    const loginLoader = document.querySelector(".login-loder");

    // Shared references for the global dynamic domino loader
    const pageLoader = document.getElementById("globalPageLoader");
    const loaderText = document.getElementById("globalLoaderText");

    if (authWrapper && loginLoader) {
        authWrapper.classList.remove("is-visible");
        loginLoader.classList.remove("is-hidden");
        setTimeout(() => {
            loginLoader.classList.add("is-hidden");
            authWrapper.classList.add("is-visible");
        }, 1500);
    }

    if (signinForm) {

        signinForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const emailField = document.getElementById("signinEmail");
            const passwordField = document.getElementById("signinPassword");

            if (!emailField || !passwordField) return;

            // Determine active persona tab context (defaults to student)
            let currentRole = "student";
            const teacherTab = document.getElementById("btnTabTeacher");
            if (teacherTab && teacherTab.classList.contains("active")) {
                currentRole = "teacher";
            }

           
            // Construct payload configuration object
            const payload = {
                email: emailField.value.trim(),
                password: passwordField.value,
                role: currentRole
            };

            if (currentRole === "teacher") {
                const uidField = document.getElementById("signinTeacherUid");
                if (uidField) {
                    //  FIXED: Changed from teacherUid to teacherId to match server.js
                    payload.teacherId = uidField.value.trim();
                }
            }

            try {
                //  Trigger the global domino loading overlay screen
                if (pageLoader && loaderText) {
                    loaderText.innerText = "Verifying Security Credentials...";
                    pageLoader.classList.add("active");
                }

                // Query authorization token from backend REST endpoint
                const response = await fetch("/signin", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Authentication refused.");

                // Persist authentication tokens and user attributes locally
                localStorage.setItem("authToken", data.token);
                localStorage.setItem("userRole", data.role);
                localStorage.setItem("userName", data.name);

                // Update loader statement text on success
                const signinBtnText = document.getElementById("signinBtnText");
                if (signinBtnText) signinBtnText.textContent = "Access Granted! Redirecting...";

                // Navigate users based on permission levels
                const roleAfter = (data.role || currentRole || '').toString().toLowerCase();
                const dest = roleAfter === 'teacher' ? '/teacher/dashboard' : '/student-dash';
                setTimeout(() => window.location.href = dest, 800);

            } catch (err) {
                //  Close loader overlay instantly on execution crashes so user can retry
                if (pageLoader) pageLoader.classList.remove("active");

                // Restore button triggers and notify user of auth exceptions
                if (submitBtn) {
                    submitBtn.disabled = false;
                    const signinLoader = document.getElementById("signinLoader");
                    const signinBtnText = document.getElementById("signinBtnText");
                    if (signinLoader) signinLoader.classList.add("d-none");
                    if (signinBtnText) signinBtnText.innerHTML = `<i class="bi bi-box-arrow-in-right me-1"></i> Sign In`;
                }
                console.error("AJAX error:", err);
                alert(`Login Error: ${err.message}`);
            }
        });
    }
});