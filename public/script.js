/* ============================================================
   AURELIA — Sign-in page logic
   Depends on api.js (loaded before this file).
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // If already logged in, skip straight to the dashboard
  if (getCurrentUser()) {
    window.location.href = "dashboard.html";
    return;
  }

  const form = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("errorMessage");
  const errorText = document.getElementById("errorText");
  const signInBtn = document.getElementById("signInBtn");

  const togglePassword = document.getElementById("togglePassword");
  const iconEye = togglePassword.querySelector(".icon-eye");
  const iconEyeOff = togglePassword.querySelector(".icon-eye-off");

  const forgotPassword = document.getElementById("forgotPassword");

  function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = "flex";
  }

  function hideError() {
    errorMessage.style.display = "none";
  }

  togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePassword.setAttribute("aria-pressed", String(isPassword));
    togglePassword.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
    iconEye.style.display = isPassword ? "none" : "block";
    iconEyeOff.style.display = isPassword ? "block" : "none";
  });

  forgotPassword.addEventListener("click", (e) => {
    e.preventDefault();
    showError("Password recovery isn't available in this demo yet.");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      showError("Please enter both your username and password.");
      return;
    }

    signInBtn.classList.add("loading");
    signInBtn.disabled = true;

    try {
      await apiLogin(username, password);
      window.location.href = "dashboard.html";
    } catch (err) {
      showError(err.message || "Invalid username or password.");
    } finally {
      signInBtn.classList.remove("loading");
      signInBtn.disabled = false;
    }
  });
});
