/* ============================================================
   AURELIA — API client
   Replaces the old localStorage-only data.js. All accounts,
   profile, and project data now live in a real Postgres database
   behind an Express API — every user hitting this site sees the
   same shared data, and only admins can change it (enforced by
   the server, not just hidden in the UI).

   Auth model: on login/signup the server returns a JWT. We cache
   it (plus a copy of the user record) in localStorage so pages can
   show "logged in as ___" instantly without a round trip, but every
   write — and every page load, via requireAuth() in common.js —
   is re-checked against the server. The cache is convenience, not
   the source of truth.
   ============================================================ */

const AURELIA_KEYS = {
  token: "aurelia_token",
  user: "aurelia_user",
};

function apiBase() {
  // Frontend is served by the same Express app, so relative URLs work
  // both locally and once deployed on Render.
  return "/api";
}

async function apiRequest(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${apiBase()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // e.g. 204 No Content
  }

  if (!res.ok) {
    throw new Error((data && data.error) || "Something went wrong. Please try again.");
  }
  return data;
}

/* ---------------- Session cache ---------------- */
function getToken() {
  return localStorage.getItem(AURELIA_KEYS.token);
}

function setSession(token, user) {
  localStorage.setItem(AURELIA_KEYS.token, token);
  localStorage.setItem(AURELIA_KEYS.user, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(AURELIA_KEYS.token);
  localStorage.removeItem(AURELIA_KEYS.user);
}

// Synchronous, cached — good for "is *something* logged in" checks and
// instant UI (e.g. nav greeting). Not proof the session is still valid
// server-side; common.js's requireAuth() confirms that on each page load.
function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  try {
    const raw = localStorage.getItem(AURELIA_KEYS.user);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isAdmin(user) {
  return !!user && user.role === "admin";
}

/* ---------------- Auth ---------------- */
async function apiSignup({ username, password, name }) {
  const data = await apiRequest("/auth/signup", {
    method: "POST",
    auth: false,
    body: { username, password, name },
  });
  setSession(data.token, data.user);
  return data.user;
}

async function apiLogin(username, password) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    auth: false,
    body: { username, password },
  });
  setSession(data.token, data.user);
  return data.user;
}

// Confirms the cached token against the server, refreshing the cached
// user in the process. Returns null (and clears the cache) if the
// session is missing/expired/invalid.
async function verifySession() {
  if (!getToken()) return null;
  try {
    const data = await apiRequest("/auth/me");
    localStorage.setItem(AURELIA_KEYS.user, JSON.stringify(data.user));
    return data.user;
  } catch {
    clearSession();
    return null;
  }
}

/* ---------------- Profile ---------------- */
async function getProfile() {
  const data = await apiRequest("/profile");
  return data.profile;
}

async function saveProfile(profile) {
  const data = await apiRequest("/profile", { method: "PUT", body: profile });
  return data.profile;
}

/* ---------------- Projects ---------------- */
async function getProjects() {
  const data = await apiRequest("/projects");
  return data.projects;
}

async function addProject(project) {
  const data = await apiRequest("/projects", { method: "POST", body: project });
  return data.project;
}

async function removeProject(id) {
  await apiRequest(`/projects/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/* ---------------- Small shared UI helper ---------------- */
function initial(name) {
  return (name || "A").trim().charAt(0).toUpperCase() || "A";
}
