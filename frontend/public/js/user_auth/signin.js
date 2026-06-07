/**
 * @file signin.js
 * @description Manages student and teacher platform credential authorization,
 * tab state updates, REST API endpoint communications, and user metadata caching.
 * * Used in:
 * - /pages/user_auth/signin.html
 */

document.addEventListener("DOMContentLoaded", () => {
    /** @type {HTMLFormElement|null} */
    const signinForm = document.getElementById("formSignin");

    /** @type {HTMLButtonElement|null} */
    const submitBtn = document.getElementById("btnSubmitSignin");

    // Shared references for the global dynamic domino loader
    const pageLoader = document.getElementById("globalPageLoader");
    const loaderText = document.getElementById("globalLoaderText");

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
                // 🟢 Trigger the global domino loading overlay screen
                if (pageLoader && loaderText) {
                    loaderText.innerText = "Verifying Security Credentials...";
                    pageLoader.classList.add("active");
                }

                // Disable interface triggers
                if (submitBtn) submitBtn.disabled = true;

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

                // 🟢 Update loader statement text on success
                if (loaderText) loaderText.innerText = "Access Granted! Initializing Profile...";
                if (submitBtn) submitBtn.innerText = "Signed in";
                
                // Navigate users based on permission levels
                const roleAfter = (data.role || currentRole || '').toString().toLowerCase();
                const dest = roleAfter === 'teacher' ? '/create-test' : '/dashboard'; // Fixed typo routing from 'dashbord' to 'dashboard'
                
                setTimeout(() => window.location.href = dest, 600);

            } catch (err) {
                // ❌ Close loader overlay instantly on execution crashes so user can retry
                if (pageLoader) pageLoader.classList.remove("active");
                
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