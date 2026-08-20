/* =========================================================================
   USER PROFILE PAGE — REAL-TIME DATA CONNECTION
   Fetches live user data from /api/auth/me using the session token.
   ========================================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "/signin";
    return;
  }


  
  // -------------------------------------------------------------------------
  // HELPER: show/hide skeleton loaders
  // -------------------------------------------------------------------------
  function setLoading(isLoading) {
    document.querySelectorAll(".skeleton").forEach(el => {
      el.classList.toggle("skeleton-active", isLoading);
    });
  }

  // -------------------------------------------------------------------------
  // HELPER: generate initials from name
  // -------------------------------------------------------------------------
  function getInitials(name) {
    return (name || "U")
      .trim()
      .split(/\s+/)
      .map(n => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }

  // -------------------------------------------------------------------------
  // HELPER: apply avatar from localStorage (persists across visits)
  // -------------------------------------------------------------------------
  function applyStoredAvatar() {
    const saved = localStorage.getItem("userAvatar");
    const avatarCircle = document.getElementById("avatarCircle");
    const initialsSpan = document.getElementById("avatarInitials");
    if (saved && avatarCircle) {
      avatarCircle.style.backgroundImage = `url(${saved})`;
      avatarCircle.style.backgroundSize = "cover";
      avatarCircle.style.backgroundPosition = "center";
      if (initialsSpan) initialsSpan.style.display = "none";
    }
  }

  // -------------------------------------------------------------------------
  // FETCH REAL USER DATA FROM API
  // -------------------------------------------------------------------------
  setLoading(true);

  let userData = null;

  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (response.status === 401 || response.status === 404) {
      localStorage.clear();
      window.location.href = "/signin";
      return;
    }

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    userData = await response.json();

    // Sync fresh name and role into localStorage so navbar also stays current
    if (userData.name) localStorage.setItem("userName", userData.name);
    if (userData.role) localStorage.setItem("userRole", userData.role);

  } catch (err) {
    console.error("Failed to fetch user profile:", err);
    // Graceful degradation: use cached localStorage values
    userData = {
      name: localStorage.getItem("userName") || "User",
      email: "",
      role: (localStorage.getItem("userRole") || "student").toLowerCase(),
      rollnumber: "N/A",
      department: "",
      semester: null
    };
  } finally {
    setLoading(false);
  }

  // -------------------------------------------------------------------------
  // HYDRATE UI WITH REAL DATA
  // -------------------------------------------------------------------------
  const { name, email, role, rollnumber, department, semester } = userData;
  const userRole = (role || "student").toLowerCase();

  // Name & email
  const profileNameEl = document.getElementById("profileName");
  const profileEmailEl = document.getElementById("profileEmail");
  if (profileNameEl) profileNameEl.textContent = name || "User";
  if (profileEmailEl) profileEmailEl.textContent = email || "—";

  // Role badge
  const roleBadge = document.getElementById("profileRoleBadge");
  if (roleBadge) {
    roleBadge.textContent = userRole.toUpperCase();
    if (userRole === "student") {
      roleBadge.style.background = "rgba(46, 200, 102, 0.12)";
      roleBadge.style.color = "var(--accent-success, #2ec866)";
      roleBadge.style.borderColor = "rgba(46, 200, 102, 0.25)";
    } else {
      roleBadge.style.background = "rgba(251, 191, 36, 0.12)";
      roleBadge.style.color = "var(--accent-warning, #fbbf24)";
      roleBadge.style.borderColor = "rgba(251, 191, 36, 0.25)";
    }
  }

  // Avatar initials
  const initialsSpan = document.getElementById("avatarInitials");
  if (initialsSpan) initialsSpan.textContent = getInitials(name);

  // Student-only fields
  if (userRole === "student") {
    const deptEl = document.getElementById("profileDept");
    const semEl  = document.getElementById("profileSem");
    const rollEl = document.getElementById("profileRoll");

    if (deptEl) deptEl.textContent = department || "—";
    if (semEl)  semEl.textContent  = semester != null ? semester : "—";
    if (rollEl) rollEl.textContent = rollnumber || "—";

    // Profile detail rows use flex; modal form groups use block
    document.querySelectorAll(".profile-details .student-only").forEach(el => {
      el.style.display = "flex";
    });
    document.querySelectorAll(".edit-modal-card .student-only").forEach(el => {
      el.style.display = "block";
    });
  } else {
    document.querySelectorAll(".student-only").forEach(el => {
      el.style.display = "none";
    });
  }

  // Member since (using createdAt if returned, else graceful)
  const memberSince = userData.createdAt
    ? new Date(userData.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "—";
  const memberSinceEl = document.getElementById("profileMemberSince");
  if (memberSinceEl) memberSinceEl.textContent = memberSince;

  // Apply stored avatar photo (overrides initials)
  applyStoredAvatar();

  // -------------------------------------------------------------------------
  // AVATAR UPLOAD — Persist to localStorage for offline display
  // -------------------------------------------------------------------------
  const avatarCircle = document.getElementById("avatarCircle");
  const avatarInput  = document.getElementById("avatarInput");

  if (avatarCircle && avatarInput) {
    avatarCircle.addEventListener("click", () => avatarInput.click());

    avatarInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        localStorage.setItem("userAvatar", base64);
        avatarCircle.style.backgroundImage = `url(${base64})`;
        avatarCircle.style.backgroundSize = "cover";
        avatarCircle.style.backgroundPosition = "center";
        if (initialsSpan) initialsSpan.style.display = "none";
      };
      reader.readAsDataURL(file);
    });
  }

  // -------------------------------------------------------------------------
  // BACK HOME BUTTON — Role-aware redirect
  // -------------------------------------------------------------------------
  const homeBtn = document.getElementById("btnBackHome");
  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      window.location.href = userRole === "teacher" ? "/teacher/dashboard" : "/student-dash";
    });
  }

  // -------------------------------------------------------------------------
  // EDIT PROFILE MODAL — Open / Close Logic
  // -------------------------------------------------------------------------
  const editBtn        = document.getElementById("btnEditProfile");
  const modal          = document.getElementById("editProfileModal");
  const modalClose     = document.getElementById("modalClose");
  const modalOverlay   = document.getElementById("modalOverlay");

  function openModal() {
    if (!modal) return;
    // Pre-fill form with current data
    const nameInput = document.getElementById("editName");
    const deptInput = document.getElementById("editDept");
    const semInput  = document.getElementById("editSem");

    if (nameInput) nameInput.value = profileNameEl?.textContent || "";
    if (deptInput) deptInput.value = department || "";
    if (semInput)  semInput.value  = semester || "";

    modal.classList.add("modal-open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("modal-open");
    document.body.style.overflow = "";
  }

  if (editBtn)      editBtn.addEventListener("click", openModal);
  if (modalClose)   modalClose.addEventListener("click", closeModal);
  if (modalOverlay) modalOverlay.addEventListener("click", closeModal);

  const cancelEditBtn = document.getElementById("cancelEditBtn");
  if (cancelEditBtn) cancelEditBtn.addEventListener("click", closeModal);

  // Keyboard ESC closes modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // -------------------------------------------------------------------------
  // EDIT PROFILE FORM SUBMIT — Save name update via API (future endpoint)
  // -------------------------------------------------------------------------
  const editForm = document.getElementById("editProfileForm");
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const saveBtn = document.getElementById("saveProfileBtn");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
      }

      const newName = document.getElementById("editName")?.value.trim();

      // For now: save updated name to localStorage and reflect in the UI
      // (Full backend PATCH endpoint can be wired here when ready)
      if (newName) {
        localStorage.setItem("userName", newName);
        if (profileNameEl) profileNameEl.textContent = newName;
        if (initialsSpan)  initialsSpan.textContent  = getInitials(newName);
        // Refresh navbar avatar initial
        const navAvatar = document.querySelector(".avatar-circle");
        if (navAvatar && !localStorage.getItem("userAvatar")) {
          navAvatar.textContent = newName.charAt(0).toUpperCase();
        }
      }

      closeModal();

      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Changes";
      }

      // Show a brief success toast
      showToast("Profile updated successfully!");
    });
  }

  // -------------------------------------------------------------------------
  // TOAST NOTIFICATION
  // -------------------------------------------------------------------------
  function showToast(message) {
    let toast = document.getElementById("profileToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "profileToast";
      toast.className = "profile-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("toast-show");
    setTimeout(() => toast.classList.remove("toast-show"), 3000);
  }
});