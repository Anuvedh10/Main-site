/* ============================================================
   AURELIA — Shared page logic
   Include this on any page that requires a logged-in user
   (dashboard, projects, settings, etc). Depends on api.js.
   ============================================================ */

// Confirms the session against the server (not just the local cache)
// and redirects to index.html if nobody is logged in / the token has
// expired. Returns the current user if logged in.
async function requireAuth() {
  const cached = getCurrentUser();
  if (!cached) {
    window.location.href = "index.html";
    return null;
  }
  const user = await verifySession();
  if (!user) {
    window.location.href = "index.html";
    return null;
  }
  return user;
}

// Call this at the top of admin-only pages (projects.html, settings.html).
// Sends non-admin users straight to the dashboard instead of showing the page.
async function requireAdmin() {
  const user = await requireAuth();
  if (user && !isAdmin(user)) {
    window.location.href = "dashboard.html";
    return null;
  }
  return user;
}

// Wires up the navbar greeting + logout button found on protected pages,
// and hides admin-only nav links (Projects, Settings) for read-only users.
function initNavUser(user) {
  const navUser = document.getElementById("navUser");
  if (navUser && user) {
    navUser.textContent = `Hi, ${user.name}`;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearSession();
      window.location.href = "index.html";
    });
  }

  if (user && !isAdmin(user)) {
    document.querySelectorAll('.nav-link[href="projects.html"]').forEach((el) => {
      el.style.display = "none";
    });
    document.querySelectorAll('.nav-link[href="settings.html"]').forEach((el) => {
      el.style.display = "none";
    });
    document.querySelectorAll("[data-admin-only]").forEach((el) => {
      el.style.display = "none";
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireAuth();
  if (user) {
    initNavUser(user);
  }
});
