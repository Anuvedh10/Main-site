/* ============================================================
   AURELIA — Sign-up page logic
   Depends on api.js (loaded before this file).
   New accounts are created with role: "user" (read-only dashboard) -
   enforced server-side, not just by what this page sends.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // If already logged in, skip straight to the dashboard
  if (getCurrentUser()) {
    window.location.href = "dashboard.html";
    return;
  }

  const form = document.getElementById("signupForm");
  const fullNameInput = document.getElementById("fullName");
  const usernameInput = document.getElementById("newUsername");
  const passwordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const errorMessage = document.getElementById("errorMessage");
  const errorText = document.getElementById("errorText");
  const signUpBtn = document.getElementById("signUpBtn");

  function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = "flex";
  }

  function hideError() {
    errorMessage.style.display = "none";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const fullName = fullNameInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!username || !password) {
      showError("Please choose a username and password.");
      return;
    }
    if (password.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      showError("Passwords don't match.");
      return;
    }

    signUpBtn.classList.add("loading");
    signUpBtn.disabled = true;

    try {
      // role is always "user" server-side -> read-only dashboard
      await apiSignup({ username, password, name: fullName });
      window.location.href = "dashboard.html";
    } catch (err) {
      showError(err.message || "Could not create account. Please try again.");
    } finally {
      signUpBtn.classList.remove("loading");
      signUpBtn.disabled = false;
    }
  });
});
