/* ============================================================
   AURELIA — Projects page logic
   Renders whatever was added on the Settings page (admin only).
   Any logged-in user can view this page. Each card links out to
   that project's own page — if that page hasn't been uploaded
   yet, the link just waits until it exists.
   ============================================================ */

const projectGrid = document.getElementById("projectGrid");
const projectsEmptyState = document.getElementById("projectsEmptyState");

function buildProjectCard(project, index) {
  const hasLink = Boolean(project.link);

  // Card is a real <a> when there's a link to follow, otherwise a
  // non-navigating div so an empty href doesn't just reload the page.
  const card = document.createElement(hasLink ? "a" : "div");
  card.className = "glass-card project-card";
  card.style.animationDelay = `${Math.min(index * 0.06, 0.3)}s`;

  if (hasLink) {
    card.href = project.link;
    card.target = "_blank";
    card.rel = "noopener";
  }

  const top = document.createElement("div");
  top.className = "project-card-top";

  const tag = document.createElement("span");
  tag.className = "project-card-tag";
  tag.textContent = project.tag;

  const arrow = document.createElement("span");
  arrow.className = "project-card-arrow";
  arrow.innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 17L17 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M9 7H17V15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  top.appendChild(tag);
  top.appendChild(arrow);

  const title = document.createElement("h3");
  title.className = "project-card-title";
  title.textContent = project.title;

  const description = document.createElement("p");
  description.className = "project-card-description";
  description.textContent = project.description || "No description added yet.";

  const footer = document.createElement("div");
  footer.className = "project-card-footer";
  footer.innerHTML = hasLink
    ? `<span>View project page</span>`
    : `<span class="no-link-note">No link set — add one in Settings</span>`;

  card.appendChild(top);
  card.appendChild(title);
  card.appendChild(description);
  card.appendChild(footer);

  return card;
}

async function renderProjects() {
  let projects;
  try {
    projects = await getProjects();
  } catch (err) {
    console.error("Failed to load projects:", err);
    return;
  }

  projectGrid.innerHTML = "";

  if (projects.length === 0) {
    projectGrid.style.display = "none";
    projectsEmptyState.classList.add("visible");
    return;
  }

  projectGrid.style.display = "grid";
  projectsEmptyState.classList.remove("visible");

  projects.forEach((project, index) => {
    projectGrid.appendChild(buildProjectCard(project, index));
  });
}

window.addEventListener("DOMContentLoaded", renderProjects);
