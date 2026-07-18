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
    const seeAllStudentsBtn = document.getElementById("seeAllStudentsBtn");
    
    // Pagination elements
    const paginationEntriesText = document.getElementById("paginationEntriesText");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");

    // Side cards elements
    const topPerformersList = document.getElementById("topPerformersList");
    const chartBarsContainer = document.getElementById("chartBarsContainer");

    // =========================================================================
    // 3. STATE AND MOCK DATA STORE
    // =========================================================================
    let allTests = [];
    let studentSubmissions = [];
    let filteredSubmissions = [];
    
    // Pagination state
    let currentPage = 1;
    const pageSize = 4; // Display exactly 4 rows to match the reference image default look

    // Seed list of mock names for dynamic generation
    const firstNames = [
        "Alex", "Sarah", "James", "Emma", "Maya", "David", "Li", "John", "Sophia", "Michael", 
        "Olivia", "William", "Daniel", "Emily", "Lucas", "Ava", "Alexander", "Isabella", 
        "Ethan", "Mia", "Benjamin", "Charlotte", "Henry", "Amelia", "Joseph", "Harper"
    ];
    const lastNames = [
        "Rivera", "Miller", "Lee", "Wong", "Kapoor", "Smith", "Chen", "Davis", "Johnson", 
        "Rodriguez", "Martinez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", 
        "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez"
    ];
    const mockDepartments = ["Bsc Data Science", "Bsc Cyber Security", "BCA", "Eng - Year 3", "Design - Year 2", "Eng - Year 4"];

    // Dynamic generation of deterministic mock dataset
    function generateMockSubmissions(tests) {
        const dataset = [];
        // Base seed data matching the image exactly
        const exactMatches = [
            { name: "Alex Rivera", initials: "AR", id: "ID-2024-001", score: 94, status: "Graded", timeSpentSec: 2535, dept: "Bsc Data Science" },
            { name: "Sarah Miller", initials: "SM", id: "ID-2024-042", score: 72, status: "Graded", timeSpentSec: 2430, dept: "Bsc Cyber Security" },
            { name: "James Lee", initials: "JL", id: "ID-2024-015", score: 48, status: "Pending", timeSpentSec: 2940, dept: "BCA" },
            { name: "Emma Wong", initials: "EW", id: "ID-2024-089", score: 88, status: "Graded", timeSpentSec: 2115, dept: "Bsc Data Science" },
            { name: "Maya Kapoor", initials: "MK", id: "ID-2024-112", score: 99, status: "Graded", timeSpentSec: 1845, dept: "Eng - Year 3" },
            { name: "David Smith", initials: "DS", id: "ID-2024-203", score: 97, status: "Graded", timeSpentSec: 2010, dept: "Design - Year 2" },
            { name: "Li Chen", initials: "LC", id: "ID-2024-150", score: 96, status: "Graded", timeSpentSec: 1995, dept: "Eng - Year 4" }
        ];

        // Add exact matches first to guarantee their presence
        exactMatches.forEach((m, idx) => {
            const testIndex = idx % (tests.length || 1);
            const associatedTest = tests[testIndex] || { _id: "default_id", title: "General Coding Test", department: m.dept };
            dataset.push({
                name: m.name,
                initials: m.initials,
                id: m.id,
                score: m.score,
                status: m.status,
                timeSpentSec: m.timeSpentSec,
                department: associatedTest.department || m.dept,
                testId: associatedTest._id,
                testTitle: associatedTest.title,
                createdAt: new Date(Date.now() - (idx * 24 * 3600 * 1000)) // staggered dates
            });
        });

        // Seed up to 1428 entries total to match the total count in the mockup
        const targetTotal = 1428;
        const remainingCount = targetTotal - dataset.length;

        for (let i = 0; i < remainingCount; i++) {
            // Determine name
            const fnIdx = (i + 13) % firstNames.length;
            const lnIdx = (i + 37) % lastNames.length;
            const name = `${firstNames[fnIdx]} ${lastNames[lnIdx]}`;
            const initials = firstNames[fnIdx].charAt(0) + lastNames[lnIdx].charAt(0);
            
            // Structured details
            const idNumber = String(100 + i).padStart(3, "0");
            const id = `ID-2024-${idNumber}`;
            
            // Score distribution logic: average score around 78%
            let score;
            const r = Math.random();
            if (r < 0.12) {
                score = Math.floor(Math.random() * 20) + 30; // Failures: 30-50 (12%)
            } else if (r < 0.40) {
                score = Math.floor(Math.random() * 20) + 50; // Average low: 50-70 (28%)
            } else if (r < 0.85) {
                score = Math.floor(Math.random() * 20) + 70; // Average high: 70-90 (45%)
            } else {
                score = Math.floor(Math.random() * 11) + 90; // High performers: 90-100 (15%)
            }
            
            const status = score < 50 && Math.random() > 0.5 ? "Pending" : "Graded";
            const timeSpentSec = Math.floor(Math.random() * 1800) + 1200; // 20m to 50m
            
            const testIndex = i % (tests.length || 1);
            const associatedTest = tests[testIndex] || { _id: "default_id", title: "General Programming Assessment", department: mockDepartments[i % mockDepartments.length] };

            dataset.push({
                name,
                initials,
                id,
                score,
                status,
                timeSpentSec,
                department: associatedTest.department,
                testId: associatedTest._id,
                testTitle: associatedTest.title,
                createdAt: new Date(Date.now() - (Math.floor(Math.random() * 45) * 24 * 3600 * 1000)) // up to 45 days ago
            });
        }

        return dataset;
    }

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
        // Fetch active test history configuration
        const testResponse = await fetch("/api/tests/history", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (testResponse.ok) {
            const testData = await testResponse.json();
            allTests = testData.tests || [];
        } else {
            console.error("Test metadata download failed, falling back to dummy tests mapping.");
        }
    } catch (fetchError) {
        console.error("Network endpoint check breakdown:", fetchError);
    }

    // Fallback tests if none created yet
    if (allTests.length === 0) {
        allTests = [
            { _id: "test1", title: "Python Fundamentals Midterm", department: "Bsc Data Science", semester: 2, duration: 45 },
            { _id: "test2", title: "Introduction to Cyber Defense", department: "Bsc Cyber Security", semester: 4, duration: 60 },
            { _id: "test3", title: "Data Structures & Lab Test", department: "BCA", semester: 3, duration: 90 }
        ];
    }

    // Populate Filters dropdowns
    function populateDropdowns() {
        // Populate Tests Dropdown
        allTests.forEach(test => {
            const option = document.createElement("option");
            option.value = test._id;
            option.textContent = test.title;
            testFilter.appendChild(option);
        });

        // Extract and populate unique departments
        const depts = new Set();
        allTests.forEach(t => { if (t.department) depts.add(t.department); });
        depts.forEach(dept => {
            const option = document.createElement("option");
            option.value = dept;
            option.textContent = dept;
            deptFilter.appendChild(option);
        });
    }

    populateDropdowns();

    // Generate mock submissions based on the test list
    studentSubmissions = generateMockSubmissions(allTests);

    // Check if test ID is provided in URL params (from Results button click)
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedTestId = urlParams.get("id");
    if (preselectedTestId) {
        testFilter.value = preselectedTestId;
        // Find corresponding department and trigger filter sync
        const selectedTestObj = allTests.find(t => t._id === preselectedTestId);
        if (selectedTestObj && selectedTestObj.department) {
            deptFilter.value = selectedTestObj.department;
        }
    }

    // =========================================================================
    // 5. FILTERING AND COMPUTATIONS ENGINE
    // =========================================================================
    function updateDashboard() {
        const timeRangeVal = timeRangeFilter.value;
        const selectedDept = deptFilter.value;
        const selectedTestId = testFilter.value;
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
        if (selectedDept || selectedTestId) {
            trendTotalStudents.innerHTML = `<i class="bi bi-info-circle-fill"></i> Filtered results`;
            trendTotalStudents.className = "metric-card-footer text-muted";
        } else {
            trendTotalStudents.innerHTML = `<i class="bi bi-arrow-up-short"></i> +5.2% from last month`;
            trendTotalStudents.className = "metric-card-footer text-success";
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

        // Apply heights and tooltips
        document.getElementById("barFill1").style.height = `${p1 || 3}%`;
        document.getElementById("barTooltip1").textContent = `${p1}%`;
        
        document.getElementById("barFill2").style.height = `${p2 || 3}%`;
        document.getElementById("barTooltip2").textContent = `${p2}%`;
        
        document.getElementById("barFill3").style.height = `${p3 || 3}%`;
        document.getElementById("barTooltip3").textContent = `${p3}%`;
        
        document.getElementById("barFill4").style.height = `${p4 || 3}%`;
        document.getElementById("barTooltip4").textContent = `${p4}%`;
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
                    <td colspan="5" class="text-center text-muted py-5">
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
                <td class="student-score-text ${scoreColor}">${student.score}%</td>
                <td>
                    <span class="status-pill-badge ${statusClass}">${student.status}</span>
                </td>
                <td class="text-end">
                    <a href="#" class="btn-student-action" data-student-id="${student.id}">${actionText}</a>
                </td>
            `;
            
            // Bind action click handler
            const actionBtn = tr.querySelector(".btn-student-action");
            actionBtn.addEventListener("click", (e) => {
                e.preventDefault();
                alert(`Redirecting to examine code submission history of ${student.name} (${student.id}) for assessment "${student.testTitle}"...`);
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
    timeRangeFilter.addEventListener("change", () => {
        currentPage = 1;
        updateDashboard();
    });

    deptFilter.addEventListener("change", () => {
        currentPage = 1;
        updateDashboard();
    });

    testFilter.addEventListener("change", () => {
        currentPage = 1;
        // Auto match department if test is selected
        const val = testFilter.value;
        if (val) {
            const matchingTest = allTests.find(t => t._id === val);
            if (matchingTest && matchingTest.department) {
                deptFilter.value = matchingTest.department;
            }
        }
        updateDashboard();
    });

    studentPerformanceSearch.addEventListener("input", () => {
        currentPage = 1;
        updateDashboard();
    });

    seeAllStudentsBtn.addEventListener("click", () => {
        // Clear filters & search to see all student records
        timeRangeFilter.value = "all";
        deptFilter.value = "";
        testFilter.value = "";
        studentPerformanceSearch.value = "";
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
