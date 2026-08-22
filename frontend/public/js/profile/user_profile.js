
  // ---- Sidebar navigation ----
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.view');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      const target = item.dataset.view;
      views.forEach(v => v.classList.toggle('active', v.id === `view-${target}`));
    });
  });

  // ---- Toast helper ----
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  function showToast(msg){
    toastMsg.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  // ---- Edit Profile toggle ----
  const editBtn = document.getElementById('editBtn');
  const editableFields = document.querySelectorAll('.detail-value[data-field]');
  const nameDisplay = document.getElementById('nameDisplay');
  let editing = false;

  editBtn.addEventListener('click', () => {
    editing = !editing;
    editableFields.forEach(f => f.setAttribute('contenteditable', editing));
    nameDisplay.setAttribute('contenteditable', editing);
    if(editing){
      editBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg> Save Changes`;
      editableFields[0]?.focus();
    } else {
      editBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> Edit Profile`;
      showToast('Profile updated');
      // sync avatar initials if name changed
      const parts = nameDisplay.textContent.trim().split(/\s+/);
      const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
      document.getElementById('avatarCircle').textContent = initials.toUpperCase();
    }
  });

  // ---- Home button ----
  document.getElementById('homeBtn').addEventListener('click', () => {
    showToast('Heading home…');
  });

  // ---- Avatar click ----
  document.querySelector('.avatar-edit').addEventListener('click', () => {
    showToast('Photo upload coming soon');
  });

  // ---- Toggles ----
  document.querySelectorAll('[data-toggle]').forEach(sw => {
    sw.addEventListener('click', () => {
      sw.classList.toggle('on');
      showToast(sw.classList.contains('on') ? 'Enabled' : 'Disabled');
    });
  });

  // ---- Logout ----
  document.getElementById('logoutBtn').addEventListener('click', () => {
    showToast('Logged out');
  });

  // ---- Delete account ----
  document.getElementById('deleteBtn').addEventListener('click', () => {
    showToast('Account deletion requires confirmation');
  });

  // home button add
  document.getElementById("homeBtn").addEventListener('click', function(e){
    window.location.href = "/student-dash"

  })

  // logout button
  document.getElementById('logoutBtn').addEventListener('click',function(e){
              e.stopPropagation();
                localStorage.clear(); // Flush authentication tokens, profile usernames, and roles completely
                window.location.href = "/signin";
                return;
  })


async function loadUserProfile() {
    try {
        const token = localStorage.getItem("authToken");
        const response = await fetch("/api/auth/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        // Read the actual response from backend
        const data = await response.json();


        if (!response.ok) {
            throw new Error(data.error || "Failed to fetch user profile");
        }
        console.table(data)
       // Common information

        document.getElementById("userRole").innerText = data.role
        document.getElementById('nameDisplay').innerText = data.name
        document.getElementById("userEmail").textContent =
            data.email || "N/A";

        document.getElementById("userRollnumber").textContent =
            data.rollnumber;


        // Teacher
        if (data.role === "teacher") {

            document.getElementById("departmentRow").style.display = "none";
            document.getElementById("semesterRow").style.display = "none";
            document.getElementById("userRollnumber").textContent =data.teacherCode;

        } else {

            // Student
            document.getElementById("userDepartment").textContent =
                data.department || "N/A";

            document.getElementById("userSemester").textContent =
                data.semester ?? "N/A";
        }

    } catch (error) {
        console.error("Profile loading error:", error);
    }
}

loadUserProfile();