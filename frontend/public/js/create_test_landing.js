/**
 * @file create_test_landing.js
 * @description Manages view-state router guard assertions for teacher execution
 * frameworks and binds user action listeners to animated deployment nodes.
 */

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
});