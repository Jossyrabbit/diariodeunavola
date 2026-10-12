(function initAdminLogin() {
  "use strict";

  const loginPanel = document.querySelector("[data-admin-login-panel]");
  const loginForm = document.querySelector("[data-admin-login-form]");
  const loginStatus = document.querySelector("[data-login-status]");
  const passwordPanel = document.querySelector("[data-identity-password-panel]");
  const passwordForm = document.querySelector("[data-identity-password-form]");
  const passwordStatus = document.querySelector("[data-identity-password-status]");
  const passwordTitle = document.querySelector("[data-identity-password-title]");
  const passwordCopy = document.querySelector("[data-identity-password-copy]");
  if (!loginPanel || !loginForm || !loginStatus || !passwordPanel || !passwordForm || !passwordStatus || !passwordTitle || !passwordCopy) return;

  const hash = new URLSearchParams(window.location.hash.slice(1));
  const callback = hash.has("invite_token")
    ? { action: "accept_invite", token: hash.get("invite_token") }
    : hash.has("recovery_token")
      ? { action: "recover_password", token: hash.get("recovery_token") }
      : null;

  if (callback?.token) {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    loginPanel.hidden = true;
    passwordPanel.hidden = false;
    if (callback.action === "recover_password") {
      passwordTitle.textContent = "Crea una contraseña nueva.";
      passwordCopy.textContent = "Este enlace confirma tu identidad. Define una contraseña nueva para recuperar el acceso.";
    }

    passwordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(passwordForm));
      if (data.password !== data.password_confirmation) {
        passwordStatus.textContent = "Las contraseñas no coinciden.";
        return;
      }
      passwordStatus.textContent = "Guardando contraseña…";
      const submit = passwordForm.querySelector("button[type='submit']");
      submit.disabled = true;
      try {
        const response = await fetch("/api/admin/identity-password", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: callback.action, token: callback.token, password: data.password }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "El enlace no es válido o ya expiró.");
        passwordForm.reset();
        passwordPanel.hidden = true;
        loginPanel.hidden = false;
        loginStatus.textContent = "Contraseña guardada. Ya puedes iniciar sesión.";
      } catch (error) {
        passwordStatus.textContent = error.message;
        submit.disabled = false;
      }
    });
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginStatus.textContent = "Verificando acceso…";
    const submit = loginForm.querySelector("button[type='submit']");
    submit.disabled = true;
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(loginForm))),
      });
      if (!response.ok) throw new Error("No fue posible iniciar sesión. Revisa tus credenciales y el rol asignado.");
      window.location.assign("/admin/");
    } catch (error) {
      loginStatus.textContent = error.message;
      submit.disabled = false;
    }
  });
})();
