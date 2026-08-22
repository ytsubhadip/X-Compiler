
document.addEventListener("DOMContentLoaded", () => {

    // =========================================================================
    // DYNAMIC ROLE-BASED NAVBAR GENERATION
    // =========================================================================


    const navbarTarget = document.querySelector(".custom-navbar");
    if (!navbarTarget) return;

    const token = localStorage.getItem("authToken");


    const role = localStorage.getItem("userRole") || "student";


    const name = localStorage.getItem("userName") || "User";

    const currentPath = window.location.pathname;

    // Configure core center navigation links accessible by everyone
    let centerLinks = "";
    if (!token) {
        centerLinks += `<li><a href="/" class="nav-link ${currentPath === '/' ? 'active' : ''}">Home</a></li>`;
    }
    centerLinks += `<li><a href="/playground" class="nav-link ${currentPath === '/playground' ? 'active' : ''}">Compiler</a></li>`;

    // =========================================================================
    // 🟢 FIXED ROLE-BASED CONDITIONAL NAVIGATION
    // =========================================================================
    if (token) {
        const sanitizedRole = role.trim().toLowerCase();

        if (sanitizedRole === "teacher") {
            // Teachers see the creation panel endpoint mapping
            centerLinks += `<li><a href="/teacher/dashboard" class="nav-link ${currentPath === '/teacher/dashboard' ? 'active' : ''}">Dashboard</a></li>`;
        } else {
            // Students see the interactive exam entry portal path (Spelling fixed!)
            centerLinks += `<li><a href="/student-dash" class="nav-link ${currentPath === '/student-dash' ? 'active' : ''}">Exam Dashboard</a></li>`;
        }
    }

    // Configure right-side session actions (Dropdown vs Sign In controls)
    let rightActionsHTML = "";
    let mobileActionsHTML = "";

    if (token) {
        // Create gorgeous uppercase avatar characters based on profile metadata
        const savedAvatar = localStorage.getItem("userAvatar");
        const initialChar = name.trim().charAt(0).toUpperCase();
        const avatarStyle = savedAvatar ? `background-image: url('${savedAvatar}'); background-size: cover; background-position: center; color: transparent;` : '';
        const dropdownStructure = `
            <div class="user-profile-menu">
                <div class="profile-avatar-trigger" id="profileTrigger">
                    <div class="avatar-circle" style="${avatarStyle}">
                        <i class="fa-solid fa-user" style="color: rgb(18, 17, 17); style="font-size: 1.50rem;"></i>
                    </div>
                </div>
                <div class="profile-dropdown-card" id="profileDropdown">
                    <div class="dropdown-header">
                        <h6>${name}</h6>
                        <span class="user-role-badge">${role.toUpperCase()} SYSTEM</span>
                    </div>
                    <hr class="dropdown-divider">
                    <button class="dropdown-profile-btn" id="btnProfileAction">
                        <i class="bi bi-person-circle"></i> View Profile
                    </button>
                </div>
            </div>
        `;
        rightActionsHTML = dropdownStructure;
        mobileActionsHTML = dropdownStructure;
    } else {
        rightActionsHTML = `
            <a href="/signin" class="btn-signin">Sign In</a>
            <a href="/signup" class="btn-signup">Create a free account</a>
        `;
        mobileActionsHTML = rightActionsHTML;
    }

    // Populate actual modular container templates safely
    navbarTarget.innerHTML = `
        <div class="nav-container">
            <a class="nav-brand" href="/">
                 <img src="/asset/logo.png" alt="logo" height="30ox">
                <span class="nav-title">X compiler</span>
            </a>
            
            <div class="nav-menu-wrapper" id="navMenuWrapper">
                <ul class="nav-menu">${centerLinks}</ul>
                <div class="nav-actions-mobile">${mobileActionsHTML}</div>
            </div>
            
            <div class="nav-actions">${rightActionsHTML}</div>
            
            <button class="nav-toggle" id="navToggle" aria-label="Toggle Navigation">
                <span class="bar"></span>
                <span class="bar"></span>
                <span class="bar"></span>
            </button>
        </div>
    `;

    // Initialize responsive hamburger mobile drawer layouts
    const navToggle = document.getElementById("navToggle");
    const navMenuWrapper = document.getElementById("navMenuWrapper");
    if (navToggle && navMenuWrapper) {
        navToggle.addEventListener("click", () => {
            navToggle.classList.toggle("active");
            navMenuWrapper.classList.toggle("active");
        });
    }

    // Setup interactive profile dropdown cards if authenticated
    if (token) {
        /**
         * Global click listener to track local user dropdown toggle states.
         */
        document.addEventListener("click", (e) => {
            const trigger = e.target.closest(".profile-avatar-trigger");
            if (trigger) {
                e.stopPropagation();

                // Fetch surrounding dropdown cards (supporting both Desktop and responsive views)
                const menu = trigger.closest(".user-profile-menu");
                const dropdown = menu?.querySelector(".profile-dropdown-card");

                if (dropdown) {
                    const isShown = dropdown.classList.contains("show");

                    // Close all active dropdown elements first to avoid overlapping stacking card glitches
                    document.querySelectorAll(".profile-dropdown-card.show").forEach((d) => {
                        d.classList.remove("show");
                    });

                    // Toggle targeted dropdown
                    if (!isShown) {
                        dropdown.classList.add("show");
                    }
                }
                return;
            }

            // Close all active elements if clicking anywhere outside profile triggers
            if (!e.target.closest(".user-profile-menu")) {
                document.querySelectorAll(".profile-dropdown-card.show").forEach((d) => {
                    d.classList.remove("show");
                });
            }
        });

        /**
         * Global delegated click handlers for Dropdown Profile navigation & Session Logouts.
         */
        document.addEventListener("click", (e) => {
            // Check view profile trigger matching
            const profileBtn = e.target.closest(".dropdown-profile-btn");
            if (profileBtn) {
                e.stopPropagation();
                document.querySelectorAll(".profile-dropdown-card.show").forEach(d => d.classList.remove("show"));
                window.location.href = "/profile";
                return;
            }

            // Check session logout trigger matching
            const logoutBtn = e.target.closest(".dropdown-logout-btn");
            if (logoutBtn) {
                e.stopPropagation();
                localStorage.clear(); // Flush authentication tokens, profile usernames, and roles completely
                window.location.href = "/signin";
                return;
            }
        });
    }
});