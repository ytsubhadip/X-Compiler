// =========================================================================
// 🟢 ASYNCHRONOUS FORM PROCESSING TRANSACTION CONTROLLER
// =========================================================================
document.getElementById("formForgotPasswordReset").addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailVal = document.getElementById("Email").value.trim();
    const rollVal = document.getElementById("RollNumber").value.trim(); // Scrape the secure UID token
    const passVal = document.getElementById("Password").value;
    const confirmPassVal = document.getElementById("ConfirmPassword").value;
    const alertBox = document.getElementById("resetStatusAlertDisplay");
    const submitBtn = document.getElementById("btnSubmitSignup");

    // Front-end sanity logic verification check
    if (passVal !== confirmPassVal) {
        showAlertMessage("Password entries do not match. Please verify configurations.", "text-danger");
        return;
    }

    if (passVal.length < 6) {
        showAlertMessage("Security Exception: New password must contain at least 6 characters.", "text-danger");
        return;
    }

    try {
        if (submitBtn) submitBtn.disabled = true;
        showAlertMessage("Initiating identity verification check...", "text-warning");

        // 🟢 UPDATED FETCH PAYLOAD: Pushing email, rollNumber, and new password parameters to backend
        const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailVal, rollNumber: rollVal, password: passVal })
        });

        const data = await response.json();

        if (response.ok && data.success === true) {
            showAlertMessage(data.message, "text-success");

            // Route user cleanly to login screen upon success parameters matching
            setTimeout(() => {
                window.location.href = "/signin";
            }, 1500);
        } else {
            showAlertMessage(data.error || "The server rejected this mutation call string.", "text-danger");
            if (submitBtn) submitBtn.disabled = false;
        }

    } catch (err) {
        console.error("Forgot password client breakdown fault:", err);
        showAlertMessage("Transmission Failure: Unable to handshake with cloud clusters.", "text-danger");
        if (submitBtn) submitBtn.disabled = false;
    }

    function showAlertMessage(msg, bootstrapTextColorClass) {
        if (!alertBox) return;
        alertBox.innerText = msg;
        alertBox.className = `text-center small mt-3 fw-bold ${bootstrapTextColorClass}`;
        alertBox.style.display = "block";
    }
});