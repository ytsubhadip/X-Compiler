const userForm = document.getElementById("formSignup");

if (userForm) {
    userForm.addEventListener("submit", (e) => {
        e.preventDefault();

        // Get latest role when form is submitted
        let currentRole = "student";

        const teacherTab = document.getElementById("btnTabTeacher");

        if (teacherTab && teacherTab.classList.contains("active")) {
            currentRole = "teacher";
        } else {
            const storedRole = localStorage.getItem("userRole");

            if (storedRole) {
                currentRole = storedRole.toLowerCase().trim();
            }
        }

        console.log("Current Role:", currentRole);

        if (currentRole === "teacher") {
            console.log("Teacher Signup");
        } else {
            console.log("Student Signup");
        }
    });
}