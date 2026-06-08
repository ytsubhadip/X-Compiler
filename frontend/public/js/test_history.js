/**
 * @file test_history.js
 * @description Secures views pathways, queries historic assessment entries from databases,
 * and compiles layout items into structural data grid matrices dynamically.
 */

document.addEventListener("DOMContentLoaded", async () => {
    // =========================================================================
    // 1. END-POINT ROUTER SECURITY GUARD
    // =========================================================================
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole") || "student";

    if (!token || role.trim().toLowerCase() !== "teacher") {
        console.warn("Unauthorized trace blocked from accessing teacher data grids.");
        window.location.href = "/playground";
        return;
    }

    // Capture Core Display DOM Anchors
    const tableBody = document.getElementById("historyTableBodyRowsAnchor");
    const stateLoader = document.getElementById("historyViewStateLoader");

    try {
        // Fetch full deployment parameters list logs straight from the operational backend API path
        const response = await fetch("/api/tests/history", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to sync historic list metrics.");

        // Clean loader visibility structures out of viewport
        if (stateLoader) stateLoader.remove();

        // Catch edge conditions when zero assessments exist in database clusters
        if (!data.tests || data.tests.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted py-5 italic font-sans">
                        <i class="bi bi-folder-x d-block h3 mb-2 opacity-50"></i>
                        No compiled assessments discovered in your account record. Try creating a new test form!
                    </td>
                </tr>`;
            return;
        }

        // =========================================================================
        // 2. ITERATIVE DATA ROW COMPILER ENGINE
        // =========================================================================
        data.tests.forEach(test => {
            const rowNode = document.createElement("tr");

            const parsedDeploymentDate = new Date(test.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });

            const questionCount = test.questions ? test.questions.length : 0;
            
            // 🟢 RUNTIME DATA FALLBACK: Ensures clean look for older documents missing codes
            const renderingCode = test.testCode || `OLD-${test._id.slice(-4).toUpperCase()}`;

            // 🟢 FIXED STRUCTURAL GRID BALANCE: Exactly 8 clean matching <td> cells
            rowNode.innerHTML = `
                <td>
                    <div class="fw-bold text-white mb-1" style="font-size: 0.95rem;">${test.title}</div>
                    <div>
                        <span class="badge bg-dark border border-success text-success font-monospace" 
                              style="cursor: pointer; font-size: 0.72rem; padding: 4px 8px; display: inline-flex; align-items: center; gap: 4px;" 
                              onclick="navigator.clipboard.writeText('${window.location.origin}/join-test?code=${renderingCode}'); alert('Direct exam join link copied to clipboard!');"
                              title="Click to copy student invite link">
                            <i class="bi bi-share-fill" style="font-size: 0.65rem;"></i> CODE: ${renderingCode}
                        </span>
                    </div>
                </td>

                <td><span class="badge bg-secondary text-wrap" style="background-color: rgba(255, 255, 255, 0.03) !important; border: 1px solid rgba(255, 255, 255, 0.08) !important; padding: 6px 10px; border-radius: 4px; font-size: 0.75rem;">${test.department}</span></td>
                
                <td class="text-center fw-bold text-success" style="font-size: 0.85rem;">Sem ${test.semester}</td>
                
                <td class="timestamp-text" style="color: #cbd5e1 !important; font-size: 0.88rem;"><i class="bi bi-stopwatch me-2 text-warning"></i>${test.duration} Mins</td>
                
                <td>
                    <a href="/view-test-tasks?id=${test._id}" class="btn-action-panel btn-tasks-explorer">
                        <i class="bi bi-code-square"></i> View Tasks (${questionCount})
                    </a>
                </td>
                
                <td class="timestamp-text" style="font-size: 0.85rem; color: #94a3b8 !important;">${parsedDeploymentDate}</td>
                
                <td class="text-center"><span class="status-badge">Live</span></td>
                
                <td>
                    <a href="/student-records?id=${test._id}" class="btn-action-panel btn-records-audit">
                        <i class="bi bi-graph-up-arrow"></i> Student Records
                    </a>
                </td>
            `;
            tableBody.appendChild(rowNode);
        });

    } catch (err) {
        console.error("History datagrid rendering failure:", err);
        if (stateLoader) {
            stateLoader.innerHTML = `
                <i class="bi bi-exclamation-triangle text-danger h2"></i>
                <p class="text-danger small mt-2 m-0">Failed to communicate with cluster database matrix: ${err.message}</p>
            `;
        }
    }
});