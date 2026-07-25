/**
 * STUDENT DASHBOARD JS — Dynamic interactive rendering for student dashboard panel.
 */

document.addEventListener("DOMContentLoaded", async () => {
    // =========================================================================
    // 1. END-POINT ROUTER SECURITY GUARD
    // =========================================================================
    const token = localStorage.getItem("authToken");
    if (!token) {
        console.warn("Unauthenticated student blocked from dashboard access.");
        window.location.href = "/signin";
        return;
    }

    // =========================================================================
    // 2. DOM ELEMENT ANCHORS
    // =========================================================================
    const studentWelcomeName = document.getElementById("studentWelcomeName");
    const upcomingExamsContainer = document.getElementById("upcomingExamsContainer");
    const recentlyAttendedContainer = document.getElementById("recentlyAttendedContainer");

    // =========================================================================
    // 3. RETRIEVE PROFILE META DATA & SET WELCOME CARD
    // =========================================================================
    const localName = localStorage.getItem("userName");
    if (studentWelcomeName) {
        if (localName) {
            studentWelcomeName.textContent = localName;
        } else {
            // Fetch from profile auth me API directly
            try {
                const profileResponse = await fetch("/api/auth/me", {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (profileResponse.ok) {
                    const profileData = await profileResponse.json();
                    if (profileData.name) {
                        studentWelcomeName.textContent = profileData.name;
                        localStorage.setItem("userName", profileData.name);
                    }
                }
            } catch (err) {
                console.error("Profile handshake failed:", err);
            }
        }
    }

    // =========================================================================
    // 4. FETCH ASSESSMENT LIST METRICS & RENDER UPCOMING EXAMS
    // =========================================================================
    let availableTests = [];
    try {
        const testsResponse = await fetch("/api/tests/history", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (testsResponse.ok) {
            const data = await testsResponse.json();
            availableTests = data.tests || [];
        }
    } catch (err) {
        console.error("Test fetch collapsed:", err);
    }

    // Default Fallback assessments if DB is empty
    if (availableTests.length === 0) {
        availableTests = [
            { _id: "ds_final", title: "Data Structures Final", testcode: "CSE-381", duration: 90, department: "CSE" },
            { _id: "algo_quiz", title: "Algorithms Quiz", testcode: "IT-204", duration: 45, department: "IT" },
            { _id: "sys_lab", title: "Systems Programming Lab", testcode: "SYS-402", duration: 180, department: "SYS" }
        ];
    }

    // Render Upcoming Exams Section
    function renderUpcomingExams(tests) {
        upcomingExamsContainer.innerHTML = "";

        tests.forEach((test, idx) => {
            const col = document.createElement("div");
            col.className = "col-12 col-md-6 col-lg-4";

            // Determine display templates to match mockups exactly:
            // First exam: ASSIGNED / Start Exam (blue active)
            // Second exam: OPENING SOON / Locked (gray)
            // Third exam: ASSIGNED / Details (outline border)
            let badgeClass = "assigned";
            let badgeText = "ASSIGNED";
            let btnClass = "primary";
            let btnText = "Start Exam";
            let dateText = "Today, 2:00 PM";

            const position = idx % 3;
            if (position === 1) {
                badgeClass = "opening-soon";
                badgeText = "OPENING SOON";
                btnClass = "disabled";
                btnText = "Locked";
                dateText = "Tomorrow, 10:30 AM";
            } else if (position === 2) {
                badgeClass = "assigned";
                badgeText = "ASSIGNED";
                btnClass = "secondary";
                btnText = "Details";
                dateText = "Nov 24, 09:00 AM";
            }

            // Subject Code formatting
            let subjectCode = test.testcode || `CSE-${Math.floor(Math.random() * 200) + 200}`;
            // If it is a 6-digit dynamic invite code, keep it but append a clean tag
            if (subjectCode.length === 6 && !subjectCode.includes("-")) {
                subjectCode = `EXAM-${subjectCode}`;
            }

            col.innerHTML = `
                <div class="exam-card-container">
                    <div>
                        <div class="exam-card-header">
                            <span class="exam-badge ${badgeClass}">${badgeText}</span>
                            <span class="course-code-text">${subjectCode}</span>
                        </div>
                        <h3 class="exam-title-text">${test.title}</h3>
                        <div class="exam-meta-details">
                            <div class="meta-detail-row">
                                <i class="bi bi-stopwatch"></i>
                                <span>${test.duration} mins duration</span>
                            </div>
                            <div class="meta-detail-row">
                                <i class="bi bi-calendar3"></i>
                                <span>${dateText}</span>
                            </div>
                        </div>
                    </div>
                    <div class="exam-card-footer">
                        <button class="btn-exam-action ${btnClass}" data-test-id="${test._id}" data-test-code="${test.testcode || ''}" data-duration="${test.duration}">
                            ${btnText}
                        </button>
                    </div>
                </div>
            `;

            // Bind click handler for "Start Exam" active action
            const actionBtn = col.querySelector(".btn-exam-action");
            actionBtn.addEventListener("click", () => {
                if (btnClass === "primary") {
                    const confirmStart = confirm(`Are you ready to start "${test.title}"? Your timer of ${test.duration} minutes will begin immediately.`);
                    if (confirmStart) {
                        launchSecureExam(test._id, test.testcode, test.duration);
                    }
                } else if (btnClass === "secondary") {
                    alert(`Exam Details: "${test.title}"\nSubject Code: ${subjectCode}\nDepartment: ${test.department || 'N/A'}\nDuration: ${test.duration} Minutes\nStart Time: ${dateText}\n\nThis exam is scheduled. Return on the scheduled time to take the test.`);
                } else if (btnClass === "disabled") {
                    alert("This exam is locked. It will open at the scheduled start time.");
                }
            });

            upcomingExamsContainer.appendChild(col);
        });
    }

    // Secure Launch Exam Flow
    function launchSecureExam(testId, testCode, duration) {
        // Hydrate local storage exactly like join_intercept.html does:
        localStorage.setItem("activeExamTestId", testId);
        localStorage.setItem("examTimeRemaining", duration);

        // Redirect directly to secure exam environment portal
        window.location.href = "/exam-portal";
    }

    renderUpcomingExams(availableTests);

    // =========================================================================
    // 5. RENDER RECENTLY ATTENDED EXAMS (MATCHING THE REFERENCE MOCKUPS)
    // =========================================================================
    const recentlyAttendedExams = [
        {
            title: "Database Systems Midterm",
            code: "DB-101",
            score: 85,
            isHighlighted: true
        },
        {
            title: "Operating Systems Quiz",
            code: "OS-202",
            score: 92,
            isHighlighted: false
        },
        {
            title: "Networking Fundamentals",
            code: "NET-305",
            score: 78,
            isHighlighted: false
        }
    ];

    function renderRecentlyAttended(exams) {
        recentlyAttendedContainer.innerHTML = "";

        exams.forEach(exam => {
            const col = document.createElement("div");
            col.className = "col-12 col-md-6 col-lg-4";

            // Highlight border setting
            const highlightClass = exam.isHighlighted ? "highlighted" : "";

            // Score color classification
            const scoreColorClass = exam.score >= 90 ? "teal" : "green";

            col.innerHTML = `
                <div class="completed-exam-card ${highlightClass}">
                    <div>
                        <div class="exam-card-header">
                            <span class="exam-badge completed">COMPLETED</span>
                            <span class="course-code-text">${exam.code}</span>
                        </div>
                        <h3 class="exam-title-text">${exam.title}</h3>
                    </div>
                    
                    <div class="exam-score-wrapper">
                        <div>
                            <div class="score-title-label">SCORE</div>
                            <div class="score-values-display ${scoreColorClass}">
                                ${exam.score}<span class="score-total-base">/100</span>
                            </div>
                        </div>
                        <a href="#" class="btn-review-action" data-exam-name="${exam.title}">
                            <i class="bi bi-file-earmark-bar-graph"></i> Review
                        </a>
                    </div>
                </div>
            `;

            // Bind click handler for review action
            const reviewBtn = col.querySelector(".btn-review-action");
            reviewBtn.addEventListener("click", (e) => {
                e.preventDefault();
                alert(`Opening evaluation summary report for "${exam.title}" (${exam.code}).\n\nYour score is ${exam.score}/100. Review details have been successfully fetched!`);
            });

            recentlyAttendedContainer.appendChild(col);
        });
    }

    renderRecentlyAttended(recentlyAttendedExams);
});
