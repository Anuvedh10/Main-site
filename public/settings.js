/* ============================================================
   AURELIA — Settings logic
   Admin-only page: reads/writes profile + projects via the API.
   The server rejects writes from non-admin tokens regardless, but
   we also gate the page itself so read-only users get redirected
   to the dashboard instead of seeing a form that will just fail.
   ============================================================ */

const profileForm = document.getElementById("profileForm");
const profileNameInput = document.getElementById("profileName");
const profileRoleInput = document.getElementById("profileRole");
const profileBioInput = document.getElementById("profileBio");
const profileSaveConfirm = document.getElementById("profileSaveConfirm");

const projectForm = document.getElementById("projectForm");
const projectTitleInput = document.getElementById("projectTitle");
const projectTagInput = document.getElementById("projectTag");
const projectDescriptionInput = document.getElementById("projectDescription");
const projectLinkInput = document.getElementById("projectLink");
const projectSaveConfirm = document.getElementById("projectSaveConfirm");

const projectManageList = document.getElementById("projectManageList");
const projectEmptyHint = document.getElementById("projectEmptyHint");

// ---- Flash a small "Saved ✓" confirmation next to a button --------
function flashConfirm(el) {
  el.classList.add("visible");
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => el.classList.remove("visible"), 1800);
}

// ---- Load & populate profile form on page load ---------------------
async function populateProfileForm() {
  const profile = await getProfile();
  profileNameInput.value = profile.name === "Admin User" ? "" : profile.name;
  profileRoleInput.value = profile.role === "Workspace Owner" ? "" : profile.role;
  profileBioInput.value = profile.bio;
}

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await saveProfile({
      name: profileNameInput.value,
      role: profileRoleInput.value,
      bio: profileBioInput.value,
    });
    flashConfirm(profileSaveConfirm);
  } catch (err) {
    alert(err.message || "Could not save profile.");
  }
});

// ---- Render the "My Projects" management list -----------------------
async function renderProjectManageList() {
  const projects = await getProjects();
  projectManageList.innerHTML = "";

  if (projects.length === 0) {
    projectEmptyHint.classList.add("visible");
    return;
  }
  projectEmptyHint.classList.remove("visible");

  projects.forEach((project) => {
    const row = document.createElement("div");
    row.className = "project-manage-row";

    const info = document.createElement("div");
    info.className = "project-manage-info";

    const title = document.createElement("span");
    title.className = "project-manage-title";
    title.textContent = project.title;

    const tag = document.createElement("span");
    tag.className = "project-manage-tag";
    tag.textContent = project.tag;

    const link = document.createElement("span");
    link.className = "project-manage-link";
    link.textContent = project.link || "No link set";

    info.appendChild(title);
    info.appendChild(tag);
    info.appendChild(link);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn-remove";
    removeBtn.setAttribute("aria-label", `Remove ${project.title}`);
    removeBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 7H19" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M9 7V5C9 4.44772 9.44772 4 10 4H14C14.5523 4 15 4.44772 15 5V7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7 7L7.6 19C7.65 19.55 8.1 20 8.65 20H15.35C15.9 20 16.35 19.55 16.4 19L17 7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    removeBtn.addEventListener("click", async () => {
      try {
        await removeProject(project.id);
        await renderProjectManageList();
      } catch (err) {
        alert(err.message || "Could not remove project.");
      }
    });

    row.appendChild(info);
    row.appendChild(removeBtn);
    projectManageList.appendChild(row);
  });
}

// ---- Add project form -------------------------------------------------
projectForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = projectTitleInput.value.trim();
  if (!title) {
    projectTitleInput.focus();
    return;
  }

  try {
    await addProject({
      title,
      description: projectDescriptionInput.value,
      link: projectLinkInput.value,
      tag: projectTagInput.value,
    });

    projectForm.reset();
    await renderProjectManageList();
    flashConfirm(projectSaveConfirm);
  } catch (err) {
    alert(err.message || "Could not save project.");
  }
});

// ---- Init ---------------------------------------------------------------
window.addEventListener("DOMContentLoaded", async () => {
  const user = await requireAdmin();
  if (!user) return; // redirected to dashboard already
  await populateProfileForm();
  await renderProjectManageList();
});
