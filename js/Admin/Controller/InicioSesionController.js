import {
  guardarSesionAdministrador,
  iniciarSesionAdministrador
} from "../Service/InicioSesionService.js";

const formInicioSesionAdmin = document.getElementById("loginAdminForm");
const correoAdminInput = document.getElementById("loginAdminCorreo");
const contrasenaAdminInput = document.getElementById("loginAdminContrasena");

// Ya no exijo el dominio del colegio: quien dice si el correo sirve es
// la base de datos, porque hay cuentas registradas con otro dominio.
correoAdminInput?.addEventListener("input", function () {
  correoAdminInput.setCustomValidity("");
});

contrasenaAdminInput?.addEventListener("input", function () {
  contrasenaAdminInput.setCustomValidity("");
});

formInicioSesionAdmin?.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  correoAdminInput.setCustomValidity("");
  contrasenaAdminInput.setCustomValidity("");

  if (!formInicioSesionAdmin.checkValidity()) {
    formInicioSesionAdmin.reportValidity();
    return;
  }

  const botonIngresar = formInicioSesionAdmin.querySelector('button[type="submit"]');

  botonIngresar.disabled = true;
  const resultado = await iniciarSesionAdministrador(
    correoAdminInput.value,
    contrasenaAdminInput.value
  );
  botonIngresar.disabled = false;

  if (!resultado.exito) {
    contrasenaAdminInput.setCustomValidity(resultado.mensaje);
    contrasenaAdminInput.reportValidity();
    return;
  }

  guardarSesionAdministrador(resultado.sesion);
  window.location.href = resultado.redireccion;
});
