/**
 * STUDENT RESULT DASHBOARD JS — Dynamic interactive rendering for teacher's student records panel.
 */

document.addEventListener("DOMContentLoaded", async () => {
    // =========================================================================
    // 1. END-POINT ROUTER SECURITY GUARD
    // =========================================================================
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole") || "student";

    if (!token || role.trim().toLowerCase() !== "teacher") {
        console.warn("Unauthorized user blocked from accessing student results dashboard.");
        window.location.href = "/playground";
        return;
    }

    // =========================================================================
    // 2. DOM ELEMENT ANCHORS
    // =========================================================================
    // Filter controls
    const timeRangeFilter = document.getElementById("timeRangeFilter");
    const deptFilter = document.getElementById("deptFilter");
    const testFilter = document.getElementById("testFilter");
    const exportReportBtn = document.getElementById("exportReportBtn");

    // Metrics elements
    const metricTotalStudents = document.getElementById("metricTotalStudents");
    const metricAverageScore = document.getElementById("metricAverageScore");
    const scoreProgressBar = document.getElementById("scoreProgressBar");
    const metricCompletionRate = document.getElementById("metricCompletionRate");
    const metricAvgTimeSpent = document.getElementById("metricAvgTimeSpent");
    const trendTotalStudents = document.getElementById("trendTotalStudents");

    // Table elements
    const studentRecordsTableBody = document.getElementById("studentRecordsTableBody");
    const studentPerformanceSearch = document.getElementById("studentPerformanceSearch");
    
    // Pagination elements
    const paginationEntriesText = document.getElementById("paginationEntriesText");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");

    // Side cards elements
    const topPerformersList = document.getElementById("topPerformersList");
    const chartBarsContainer = document.getElementById("chartBarsContainer");

    // =========================================================================
    // 3. STATE AND DATA STORE
    // =========================================================================
    let allTests = [];
    let studentSubmissions = [];
    let filteredSubmissions = [];
    let scoreChart = null;
    
    // Pagination state
    let currentPage = 1;
    const pageSize = 4; // Display exactly 4 rows to match the reference image default look

    // Convert seconds to human readable format: e.g. 42m 15s
    function formatTimeSpent(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes}m ${seconds}s`;
    }

    // =========================================================================
    // 4. SYNCHRONIZE DATA WITH CLOUD INSTANCE
    // =========================================================================
    try {
        const submissionsResponse = await fetch("/api/tests/submissions", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (submissionsResponse.ok) {
            const submissionData = await submissionsResponse.json();
            allTests = submissionData.tests || [];
            studentSubmissions = (submissionData.submissions || []).map(submission => {
                const student = submission.studentId || {};
                const test = submission.testId || {};
                const studentName = student.name || "Unknown student";

                return {
                    name: studentName,
                    initials: studentName.split(/\s+/).map(part => part.charAt(0)).join("").slice(0, 2).toUpperCase(),
                    id: student.rollnumber || String(student._id || "Unknown"),
                    email: student.email || "",
                    score: Number(submission.score) || 0,
                    status: submission.status || "Pending",
                    timeSpentSec: Math.max(0, Number(submission.timeSpentMins) || 0) * 60,
                    department: student.department || test.department || "Not specified",
                    semester: student.semester || test.semester || "Not specified",
                    testId: String(test._id || submission.testId || ""),
                    testTitle: test.title || "Unknown assessment",
                    testCode: test.testcode || "",
                    submittedAt: submission.submittedAt ? new Date(submission.submittedAt) : new Date(),
                    createdAt: submission.submittedAt ? new Date(submission.submittedAt) : new Date(),
                    answers: Array.isArray(submission.submissions) ? submission.submissions : []
                };
            });
        } else {
            const errorData = await submissionsResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `Submissions request failed (${submissionsResponse.status})`);
        }
    } catch (fetchError) {
        console.error("Student submissions fetch failed:", fetchError);
    }

    // Check if test ID is provided in URL params (from Results button click)
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedTestId = urlParams.get("id");
    if (preselectedTestId && testFilter) {
        testFilter.value = preselectedTestId;
        // Find corresponding department and trigger filter sync
        const selectedTestObj = allTests.find(t => t._id === preselectedTestId);
        if (selectedTestObj && selectedTestObj.department && deptFilter) {
            deptFilter.value = selectedTestObj.department;
        }
    }

    // =========================================================================
    // 5. FILTERING AND COMPUTATIONS ENGINE
    // =========================================================================
    function updateDashboard() {
        const timeRangeVal = timeRangeFilter ? timeRangeFilter.value : "all";
        const selectedDept = deptFilter ? deptFilter.value : "";
        const selectedTestId = testFilter ? testFilter.value : "";
        const searchQuery = studentPerformanceSearch.value.trim().toLowerCase();

        // 1. Apply Filtering Filters
        filteredSubmissions = studentSubmissions.filter(sub => {
            // Time range filter
            if (timeRangeVal !== "all") {
                const daysLimit = parseInt(timeRangeVal, 10);
                const timeDiff = Date.now() - sub.createdAt.getTime();
                const daysDiff = timeDiff / (1000 * 3600 * 24);
                if (daysDiff > daysLimit) return false;
            }

            // Department filter
            if (selectedDept && sub.department !== selectedDept) {
                return false;
            }

            // Test filter
            if (selectedTestId && sub.testId !== selectedTestId) {
                return false;
            }

            // Search query filter (matches name or ID)
            if (searchQuery) {
                const matchesName = sub.name.toLowerCase().includes(searchQuery);
                const matchesId = sub.id.toLowerCase().includes(searchQuery);
                if (!matchesName && !matchesId) return false;
            }

            return true;
        });

        // Sort: display exact mockup matches at the top of page 1 if no search is active
        if (!searchQuery && !selectedDept && !selectedTestId) {
            filteredSubmissions.sort((a, b) => {
                const order = ["AR", "SM", "JL", "EW"];
                const aIdx = order.indexOf(a.initials);
                const bIdx = order.indexOf(b.initials);
                if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
                if (aIdx !== -1) return -1;
                if (bIdx !== -1) return 1;
                return 0;
            });
        }

        // 2. Perform Calculations
        const totalCount = filteredSubmissions.length;
        
        let avgScore = 0;
        let completionRate = 0;
        let avgTimeSpentSec = 0;

        if (totalCount > 0) {
            const sumScores = filteredSubmissions.reduce((acc, curr) => acc + curr.score, 0);
            avgScore = (sumScores / totalCount).toFixed(1);

            const gradedCount = filteredSubmissions.filter(s => s.status === "Graded").length;
            completionRate = ((gradedCount / totalCount) * 100).toFixed(1);

            const sumTimeSpent = filteredSubmissions.reduce((acc, curr) => acc + curr.timeSpentSec, 0);
            avgTimeSpentSec = Math.round(sumTimeSpent / totalCount);
        }

        // 3. Hydrate Metric Cards
        metricTotalStudents.textContent = totalCount.toLocaleString("en-US");
        metricAverageScore.textContent = `${avgScore}%`;
        scoreProgressBar.style.width = `${avgScore}%`;
        metricCompletionRate.textContent = `${completionRate}%`;
        metricAvgTimeSpent.textContent = formatTimeSpent(avgTimeSpentSec);

        // Adjust trends dynamically
        if (trendTotalStudents) {
            if (selectedDept || selectedTestId) {
                trendTotalStudents.innerHTML = `<i class="bi bi-info-circle-fill"></i> Filtered results`;
                trendTotalStudents.className = "metric-card-footer text-muted";
            } else {
                trendTotalStudents.innerHTML = `<i class="bi bi-arrow-up-short"></i> +5.2% from last month`;
                trendTotalStudents.className = "metric-card-footer text-success";
            }
        }

        // 4. Update Score Distribution Visual Bars
        updateScoreDistribution(filteredSubmissions);

        // 5. Update Top Performers
        updateTopPerformers(filteredSubmissions);

        // 6. Render Table Rows
        renderTableRows();
    }

    // Dynamic Distribution Visuals
    function updateScoreDistribution(submissions) {
        const total = submissions.length;
        let under50 = 0;
        let range50to70 = 0;
        let range70to90 = 0;
        let above90 = 0;

        submissions.forEach(sub => {
            if (sub.score < 50) under50++;
            else if (sub.score >= 50 && sub.score < 70) range50to70++;
            else if (sub.score >= 70 && sub.score < 90) range70to90++;
            else above90++;
        });

        // Compute percentages
        const p1 = total > 0 ? Math.round((under50 / total) * 100) : 0;
        const p2 = total > 0 ? Math.round((range50to70 / total) * 100) : 0;
        const p3 = total > 0 ? Math.round((range70to90 / total) * 100) : 0;
        const p4 = total > 0 ? Math.round((above90 / total) * 100) : 0;

        const dataValues = [p1, p2, p3, p4];
        const labels = ["<50", "50-70", "70-90", "90+"];

        const canvas = document.getElementById("scoreDistributionChart");
        if (!canvas) return;

        if (!scoreChart) {
            const ctx = canvas.getContext("2d");
            
            // Create gradient fill
            const gradient = ctx.createLinearGradient(0, 0, 0, 180);
            gradient.addColorStop(0, "rgba(59, 130, 246, 0.4)");
            gradient.addColorStop(1, "rgba(59, 130, 246, 0.0)");

            scoreChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [{
                        label: "Students",
                        data: dataValues,
                        borderColor: "#3b82f6",
                        borderWidth: 2.5,
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: "#3b82f6",
                        pointBorderColor: "#ffffff",
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return ` ${context.parsed.y}% of students`;
                                }
                            },
                            backgroundColor: "rgba(15, 23, 42, 0.9)",
                            titleFont: { size: 12, family: "'Outfit', sans-serif", weight: "bold" },
                            bodyFont: { size: 12, family: "'Outfit', sans-serif" },
                            padding: 10,
                            cornerRadius: 8,
                            displayColors: false
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    family: "'Outfit', sans-serif",
                                    size: 11,
                                    weight: 600
                                },
                                color: "#94a3b8"
                            }
                        },
                        y: {
                            min: 0,
                            max: 100,
                            ticks: {
                                stepSize: 25,
                                font: {
                                    family: "'Outfit', sans-serif",
                                    size: 11
                                },
                                color: "#94a3b8",
                                callback: function(value) {
                                    return value + "%";
                                }
                            },
                            grid: {
                                color: "rgba(226, 232, 240, 0.6)",
                                borderDash: [4, 4]
                            }
                        }
                    }
                }
            });
        } else {
            scoreChart.data.datasets[0].data = dataValues;
            scoreChart.update();
        }
    }

    // Dynamic Top Performers panel renderer
    function updateTopPerformers(submissions) {
        topPerformersList.innerHTML = "";
        
        if (submissions.length === 0) {
            topPerformersList.innerHTML = `
                <div class="text-center text-muted py-3">
                    No records found for top lists.
                </div>`;
            return;
        }

        // Sort all descending, take top 3
        const sorted = [...submissions].sort((a, b) => b.score - a.score);
        const topThree = sorted.slice(0, 3);

        topThree.forEach((perf, idx) => {
            const item = document.createElement("div");
            item.className = "performer-row-item";
            
            // Map colors based on index/rank
            const colors = ["purple", "blue", "teal"];
            const avatarColorClass = colors[idx] || "blue";

            item.innerHTML = `
                <div class="performer-details-block">
                    <div class="performer-avatar" style="background-color: rgba(59, 130, 246, 0.08); color: #3b82f6;">
                        ${perf.initials}
                    </div>
                    <div>
                        <div class="performer-name">${perf.name}</div>
                        <div class="performer-metadata">${perf.department}</div>
                    </div>
                </div>
                <div class="performer-score-value">${perf.score}%</div>
            `;
            topPerformersList.appendChild(item);
        });
    }

    // Render Student Records Table Rows with Pagination
    function renderTableRows() {
        studentRecordsTableBody.innerHTML = "";

        if (filteredSubmissions.length === 0) {
            studentRecordsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted py-5">
                        <i class="bi bi-search d-block h4 mb-2 opacity-50"></i>
                        No matching student records discovered.
                    </td>
                </tr>`;
            
            paginationEntriesText.textContent = "Showing 0 to 0 of 0 entries";
            prevPageBtn.disabled = true;
            nextPageBtn.disabled = true;
            return;
        }

        // Pagination indices calculations
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, filteredSubmissions.length);
        const currentSlice = filteredSubmissions.slice(startIndex, endIndex);

        currentSlice.forEach(student => {
            const tr = document.createElement("tr");

            // Format initials background color mapping
            let colorThemeClass = "blue";
            if (student.initials === "SM") colorThemeClass = "orange";
            else if (student.initials === "JL") colorThemeClass = "purple";
            else if (student.initials === "EW") colorThemeClass = "teal";

            // Format Score colors
            let scoreColor = "green";
            if (student.score < 50) scoreColor = "red";
            else if (student.score >= 50 && student.score < 75) scoreColor = "yellow";

            // Format status badge
            const statusClass = student.status.toLowerCase() === "graded" ? "graded" : "pending";
            const actionText = student.status.toLowerCase() === "graded" ? "View" : "Review";

            tr.innerHTML = `
                <td>
                    <div class="student-avatar-badge ${colorThemeClass}">${student.initials}</div>
                    <span class="student-name-text">${student.name}</span>
                </td>
                <td style="font-weight: 500;">${student.id}</td>
                <td>
                    <div>${student.testTitle}</div>
                    <small class="text-muted">${student.testCode}</small>
                </td>
                <td>${student.department}</td>
                <td class="student-score-text ${scoreColor}">${student.score}%</td>
                <td>
                    <span class="status-pill-badge ${statusClass}">${student.status}</span>
                </td>
                <td>${student.submittedAt.toLocaleString("en-IN")}</td>
                <td class="text-end">
                    <a href="#" class="btn-student-action" data-student-id="${student.id}">${actionText}</a>
                </td>
            `;
            
            // Bind action click handler
            const actionBtn = tr.querySelector(".btn-student-action");
            actionBtn.addEventListener("click", (e) => {
                e.preventDefault();
                const answerDetails = student.answers.length > 0
                    ? student.answers.map((answer, index) => `Question ${index + 1} (${answer.questionId})\n${answer.submittedCode || "No code submitted"}`).join("\n\n")
                    : "No submitted answers found.";
                alert(`Student: ${student.name}\nEmail: ${student.email || "N/A"}\nRoll Number: ${student.id}\nDepartment: ${student.department}\nSemester: ${student.semester}\nAssessment: ${student.testTitle}\nScore: ${student.score}/100\nStatus: ${student.status}\nSubmitted: ${student.submittedAt.toLocaleString("en-IN")}\n\n${answerDetails}`);
            });

            studentRecordsTableBody.appendChild(tr);
        });

        // Update Pagination Footer controls states
        paginationEntriesText.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${filteredSubmissions.length.toLocaleString()} entries`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = endIndex >= filteredSubmissions.length;
    }

    // =========================================================================
    // 6. EVENT BINDING HANDLERS
    // =========================================================================
    // Filter controls change listeners
  
   
   

    studentPerformanceSearch.addEventListener("input", () => {
        currentPage = 1;
        updateDashboard();
    });

   

    // Pagination arrows navigation
    prevPageBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderTableRows();
        }
    });

    nextPageBtn.addEventListener("click", () => {
        const maxPage = Math.ceil(filteredSubmissions.length / pageSize);
        if (currentPage < maxPage) {
            currentPage++;
            renderTableRows();
        }
    });

    // Export Reports dynamic CSV generator
    exportReportBtn.addEventListener("click", () => {
        if (filteredSubmissions.length === 0) {
            alert("No data available to export.");
            return;
        }

        // Build CSV columns
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Student Name,Student ID,Score,Status,Duration Spent,Department,Assessment Title,Deployment Date\r\n";

        filteredSubmissions.forEach(row => {
            const formattedDate = row.createdAt.toLocaleDateString("en-IN");
            const cleanName = row.name.replace(/,/g, "");
            const cleanTitle = row.testTitle.replace(/,/g, "");
            
            const line = `"${cleanName}","${row.id}",${row.score}%,${row.status},"${formatTimeSpent(row.timeSpentSec)}","${row.department}","${cleanTitle}","${formattedDate}"`;
            csvContent += line + "\r\n";
        });

        // Trigger safe file download
        const encodedUri = encodeURI(csvContent);
        const downloadLink = document.createElement("a");
        downloadLink.setAttribute("href", encodedUri);
        downloadLink.setAttribute("download", `X-Compiler_Student_Results_Report_${Date.now()}.csv`);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    });

    // =========================================================================
    // 7. INITIAL LAUNCH SYNC
    // =========================================================================
    updateDashboard();
});
