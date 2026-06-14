document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "/signin";
    return;
  }

  // Bind Back Home trigger based on role
  const role = (localStorage.getItem("userRole") || "student").toLowerCase();
  const homeBtn = document.getElementById("btnBackHome");
  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      window.location.href = role === "teacher" ? "/create-test" : "/dashboard";
    });
  }

  // Edit Profile stub
  const editBtn = document.getElementById("btnEditProfile");
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      alert("Profile editing feature is currently under active development!");
    });
  }

  // Populate fields using localStorage values or local dummy details
  const name = localStorage.getItem("userName") || "Subhadip";
  const userRole = (localStorage.getItem("userRole") || "teacher").toLowerCase();
  const email = name.toLowerCase().replace(/\s+/g, "") + "@example.com";

  // Hydrate HTML elements
  document.getElementById("profileName").innerText = name;
  document.getElementById("profileEmail").innerText = email;

  const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const initialsSpan = document.getElementById("avatarInitials");
  if (initialsSpan) initialsSpan.innerText = initials;

  // Hydrate avatar picture from localStorage if it exists
  const avatarCircle = document.getElementById("avatarCircle");
  const avatarInput = document.getElementById("avatarInput");
  const savedAvatar = localStorage.getItem("userAvatar");

  if (savedAvatar) {
    avatarCircle.style.backgroundImage = `url(${savedAvatar})`;
    if (initialsSpan) initialsSpan.style.display = "none";
  }

  // Trigger file upload when clicking avatar circle
  if (avatarCircle && avatarInput) {
    avatarCircle.addEventListener("click", () => {
      avatarInput.click();
    });

    avatarInput.addEventListener("change", (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Image = event.target.result;
          localStorage.setItem("userAvatar", base64Image);
          avatarCircle.style.backgroundImage = `url(${base64Image})`;
          if (initialsSpan) initialsSpan.style.display = "none";
        };
        reader.readAsDataURL(files[0]);
      }
    });
  }

  const roleBadge = document.getElementById("profileRoleBadge");
  roleBadge.innerText = userRole.toUpperCase();

  if (userRole === "student") {
    roleBadge.style.background = "rgba(46, 200, 102, 0.12)";
    roleBadge.style.color = "var(--accent-success, #2ec866)";
    roleBadge.style.borderColor = "rgba(46, 200, 102, 0.25)";

    document.getElementById("profileDept").innerText = "Bsc Data Science";
    document.getElementById("profileSem").innerText = "4";
    document.getElementById("profileRoll").innerText = "DS202610";

    document.querySelectorAll(".student-only").forEach(el => el.style.display = "flex");
  } else {
    roleBadge.style.background = "rgba(251, 191, 36, 0.12)";
    roleBadge.style.color = "var(--accent-warning, #fbbf24)";
    roleBadge.style.borderColor = "rgba(251, 191, 36, 0.25)";
    document.querySelectorAll(".student-only").forEach(el => el.style.display = "none");
  }
});