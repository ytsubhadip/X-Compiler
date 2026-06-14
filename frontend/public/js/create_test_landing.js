
document.addEventListener("DOMContentLoaded", () => {
    // =========================================================================
    // 1. END-POINT ROUTER SECURITY GUARD
    // =========================================================================
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole") || "student";

    // Re-route unauthorized traffic away from teacher panels instantly
    if (!token || role.trim().toLowerCase() !== "teacher") {
        console.warn("Unauthorized access trace blocked. Diverting credentials...");
        window.location.href = "/playground";
        return;
    }

    // =========================================================================
    // 2. INTERACTIVE BUTTON ROUTING LIFE-CYCLES
    // =========================================================================
    const launchFormBtn = document.getElementById("btnLaunchForm");
    const historyBtn = document.getElementById("historyBtn");

    // Intercept and route to form generator view
    if (launchFormBtn) {
        launchFormBtn.addEventListener("click", (e) => {
            window.location.href = "/test-form";
        });
    }

    // Intercept and route to historic test matrix table
    if (historyBtn) {
        historyBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            window.location.href = "/test-history";
        });
    }

    // =========================================================================
    // 3. INTERACTIVE 3D TILT EFFECT
    // =========================================================================
    const container = document.querySelector(".container");
    if (container) {
        container.addEventListener("mousemove", (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -10; // Max tilt: 10 degrees
            const rotateY = ((x - centerX) / centerX) * 10;

            container.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            container.style.transition = "none";
        });

        container.addEventListener("mouseleave", () => {
            container.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
            container.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
        });
    }
});