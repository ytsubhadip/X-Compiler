
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
  const avatarCircle = document.getElementById('avatarCircle');
  const avatarImage = document.getElementById('avatarImage');
  const avatarEdit = document.getElementById('avatarEdit');
  const profileImageInput = document.getElementById('profileImageInput');
  let editing = false;

  function setAvatarInitials(name) {
    const parts = name.trim().split(/\s+/);
    const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
    avatarCircle.textContent = initials.toUpperCase();
    avatarCircle.appendChild(avatarImage);
    avatarImage.style.display = 'none';
  }

  function setAvatarImage(imageUrl, name) {
    setAvatarInitials(name);
    if (!imageUrl) return;

    avatarImage.onload = () => {
      avatarCircle.textContent = '';
      avatarCircle.appendChild(avatarImage);
      avatarImage.style.display = 'block';
    };
    avatarImage.onerror = () => setAvatarInitials(name);
    avatarImage.src = imageUrl;
  }

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
      // Keep the existing photo while updating the fallback initials.
      if (avatarImage.style.display !== 'block') {
        setAvatarInitials(nameDisplay.textContent);
      }
    }
  });

  // ---- Home button ----
  document.getElementById('homeBtn').addEventListener('click', () => {
    showToast('Heading home…');
  });

  // ---- Avatar upload ----
  avatarEdit.addEventListener('click', () => profileImageInput.click());
  avatarEdit.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      profileImageInput.click();
    }
  });

  profileImageInput.addEventListener('change', async () => {
    const file = profileImageInput.files[0];
    const email = localStorage.getItem('userEmail');
    if (!file) return;
    if (!email) {
      showToast('Your email could not be found');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      showToast('Choose a JPG or PNG image');
      profileImageInput.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('email', email);
    formData.append('file', file);

    try {
      avatarEdit.classList.add('uploading');
      const response = await fetch('http://localhost:5000/api/profile/upload', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || result.error || 'Upload failed');

      localStorage.setItem('userAvatar', result.image_url);
      setAvatarImage(result.image_url, nameDisplay.textContent || 'User');
      showToast('Profile photo updated');
    } catch (error) {
      console.error('Profile image upload error:', error);
      showToast(error.message || 'Could not upload photo');
    } finally {
      avatarEdit.classList.remove('uploading');
      profileImageInput.value = '';
    }
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
   
    if (localStorage.getItem("userRole") == 'student'){
         window.location.href = "/student-dash"
    }
    else{
      window.location.href = "/teacher/dashboard"
    }
   
  })
  


  // logout button
  document.getElementById('logoutBtn').addEventListener('click',function(e){
              e.stopPropagation();
                localStorage.clear(); // Flush authentication tokens, profile usernames, and roles completely
                window.location.href = "/signin";
                return;
  })


async function loadUserProfile() {

  const loader = document.getElementById("profileLoader");
  const loaderStartTime = Date.now();
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
      
       // Common information
       console.log(data)
        
          const image_url = data.profile_pic || data.image_url;

        document.getElementById("userRole").innerText = data.role
        document.getElementById('nameDisplay').innerText = data.name
          setAvatarImage(image_url, data.name || 'User');
        document.getElementById("userEmail").textContent =
            data.email || "N/A";
        if (data.email) localStorage.setItem('userEmail', data.email);

        document.getElementById("userRollnumber").textContent =
            data.rollnumber;


        // Teacher
        if (data.role === "teacher") {

            document.getElementById("departmentRow").style.display = "none";
            document.getElementById("semesterRow").style.display = "none";
            document.getElementById("userRollnumber").textContent =data.teacherId;

        } else {

            // Student
            document.getElementById("userDepartment").textContent =
                data.department || "N/A";

            document.getElementById("userSemester").textContent =
                data.semester ?? "N/A";
        }

    } catch (error) {
        console.error("Profile loading error:", error);
    } finally {
      const remainingTime = 2000 - (Date.now() - loaderStartTime);
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      loader.hidden = true;
    }
}

loadUserProfile();

console.log(localStorage)