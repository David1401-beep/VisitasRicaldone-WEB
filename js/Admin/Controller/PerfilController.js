
import {
  cerrarSesionAdministrador,
  obtenerPerfilAdministrador
} from "../Service/PerfilService.js";

document.addEventListener("DOMContentLoaded", async function () {
  const perfilAdminNombre = document.getElementById("perfilAdminNombre");
  const perfilAdminCorreo = document.getElementById("perfilAdminCorreo");
  const perfilAdminRol = document.getElementById("perfilAdminRol");
  const btnCerrarSesionAdmin = document.getElementById("btnCerrarSesionAdmin");

  try {

    const perfil = await obtenerPerfilAdministrador();

    escribir(perfilAdminNombre, perfil.nombre || "Nombre no disponible");
    escribir(perfilAdminCorreo, perfil.correo || "Correo no disponible");
    escribir(perfilAdminRol, perfil.rol);
  } catch (error) {
    console.error("No fue posible cargar el perfil del administrador.", error);

    escribir(perfilAdminNombre, "Nombre no disponible");
    escribir(perfilAdminCorreo, "Correo no disponible");
    escribir(perfilAdminRol, "—");
  }

  btnCerrarSesionAdmin?.addEventListener("click", async function (evento) {
    // Detengo el enlace para que no se vaya antes de que la API borre
    // la cookie. Uso replace para que la flecha de atras no regrese aqui.
    evento.preventDefault();
    await cerrarSesionAdministrador();
    window.location.replace(btnCerrarSesionAdmin.getAttribute("href"));
  });
});

function escribir(elemento, valor) {
  if (elemento) {
    elemento.textContent = valor;
  }
}
