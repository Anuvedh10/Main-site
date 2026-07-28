/* ============================================================
   AURELIA — Dashboard page logic
   Depends on api.js and common.js (common.js already redirects
   to index.html if nobody is signed in, before this runs).
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  const user = getCurrentUser();
  if (!user) return; // common.js will already have redirected

  let profile, projects;
  try {
    [profile, projects] = await Promise.all([getProfile(), getProjects()]);
  } catch (err) {
    console.error("Failed to load dashboard data:", err);
    return;
  }

  const detailsName = document.getElementById("detailsName");
  const detailsRole = document.getElementById("detailsRole");
  const detailsAvatar = document.getElementById("detailsAvatar");
  const detailsBio = document.getElementById("detailsBio");
  const detailsProjectCount = document.getElementById("detailsProjectCount");
  const statProjectCount = document.getElementById("statProjectCount");

  if (detailsName) detailsName.textContent = profile.name;
  if (detailsRole) detailsRole.textContent = profile.role;
  if (detailsAvatar) detailsAvatar.textContent = initial(profile.name);
  if (detailsBio) {
    detailsBio.textContent = profile.bio || "No bio added yet — you can add one in Settings.";
  }
  if (detailsProjectCount) detailsProjectCount.textContent = projects.length;
  if (statProjectCount) statProjectCount.textContent = projects.length;

  renderDashboardProjects(projects);
  applyReadOnlyMode(user);
});

// Renders every project into the dashboard's "My Projects" panel.
// This is always view-only here — editing/removing happens on Settings,
// which is gated to admin accounts only (server-enforced).
function renderDashboardProjects(projects) {
  const list = document.getElementById("dashboardProjectList");
  const empty = document.getElementById("dashboardProjectsEmpty");
  if (!list) return;

  list.innerHTML = "";

  if (!projects || projects.length === 0) {
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  projects.forEach((project) => {
    const li = document.createElement("li");

    const dot = document.createElement("span");
    dot.className = "activity-dot";
    dot.style.setProperty("--accent", "#8b9dff");

    const textWrap = document.createElement("div");
    const title = document.createElement("p");
    title.className = "activity-title";
    title.textContent = project.title;

    const meta = document.createElement("p");
    meta.className = "activity-time";
    meta.textContent = project.tag ? project.tag : "Project";

    textWrap.appendChild(title);
    textWrap.appendChild(meta);

    li.appendChild(dot);
    li.appendChild(textWrap);
    list.appendChild(li);
  });
}

// Adds a "Read-only account" badge for non-admin users.
// (Hiding nav links / admin-only elements is handled globally in common.js)
function applyReadOnlyMode(user) {
  const readOnly = !isAdmin(user);
  document.body.classList.toggle("read-only", readOnly);

  if (readOnly) {
    const header = document.querySelector(".dash-header");
    if (header && !document.getElementById("readOnlyBadge")) {
      const badge = document.createElement("span");
      badge.id = "readOnlyBadge";
      badge.className = "tag";
      badge.textContent = "Read-only account";
      badge.style.marginLeft = "10px";
      header.querySelector(".dash-welcome")?.appendChild(badge);
    }
  }
}
