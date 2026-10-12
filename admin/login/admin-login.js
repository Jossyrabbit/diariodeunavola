(function initAdminLogin() {
  "use strict";

  const form = document.querySelector("[data-admin-login-form]");
  const status = document.querySelector("[data-login-status]");
  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "Verificando acceso…";
    const submit = form.querySelector("button[type='submit']");
    submit.disabled = true;
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (!response.ok) throw new Error("No fue posible iniciar sesión. Revisa tus credenciales y el rol asignado.");
      window.location.assign("/admin/");
    } catch (error) {
      status.textContent = error.message;
      submit.disabled = false;
    }
  });
})();
