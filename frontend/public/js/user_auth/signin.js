/**
 * @file signin.js
 * @description Manages student and teacher platform credential authorization,
 * tab state updates, REST API endpoint communications, and user metadata caching.
 * 
 * Used in:
 * - /pages/user_auth/signin.html
 */

document.addEventListener("DOMContentLoaded", () => {
    /**
     * Sign In Form element reference in DOM.
     * @type {HTMLFormElement|null}
     */
    const signinForm = document.getElementById("formSignin");

    /**
     * Auth action submit button reference in DOM.
     * @type {HTMLButtonElement|null}
     */
    const submitBtn = document.getElementById("btnSubmitSignin");

    if (signinForm) {
        /**
         * Intercepts form submissions and triggers backend authorization queries.
         */
        signinForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            /** @type {HTMLInputElement|null} */
            const emailField = document.getElementById("signinEmail");
            
            /** @type {HTMLInputElement|null} */
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

            try {
                // Disable interface triggers and show loading animation text
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerText = "Signing in...";
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

                if (submitBtn) submitBtn.innerText = "Signed in";
                
                // Navigate users based on permission levels (Teachers are sent to test configuration dashboards, students to compiler labs)
                const roleAfter = (data.role || currentRole || '').toString().toLowerCase();
                const dest = roleAfter === 'teacher' ? '/create-test' : '/dashbord';
                
                setTimeout(() => window.location.href = dest, 600);

            } catch (err) {
                // Restore button triggers and notify user of auth exceptions
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = "Sign In";
                }
                console.error("AJAX error:", err);
                alert(`Login Error: ${err.message}`);
            }
        });
    }

    // =========================================================================
    // DYNAMIC MOUSE CURSOR GLOW EFFECT (OUTSIDE SIGN-IN BOX)
    // =========================================================================
    const glow = document.getElementById("cursorGlow");
    const authCard = document.querySelector(".auth-card");

    if (glow) {
        document.addEventListener("mousemove", (e) => {
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            // Move the glow to follow mouse coordinates
            glow.style.left = `${mouseX}px`;
            glow.style.top = `${mouseY}px`;

            if (authCard) {
                const rect = authCard.getBoundingClientRect();
                // Check if the cursor coordinates fall inside the bounds of the authentication card
                const isInside = (
                    mouseX >= rect.left &&
                    mouseX <= rect.right &&
                    mouseY >= rect.top &&
                    mouseY <= rect.bottom
                );

                if (isInside) {
                    glow.classList.remove("active");
                } else {
                    glow.classList.add("active");
                }
            } else {
                glow.classList.add("active");
            }
        });

        // Hide glow when the mouse leaves the viewport
        document.addEventListener("mouseleave", () => {
            glow.classList.remove("active");
        });
    }
});