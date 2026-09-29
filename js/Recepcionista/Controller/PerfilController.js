import {
  cerrarSesion,
  obtenerCorreoSesion,
  obtenerPerfilSesion
} from "../Service/PerfilService.js";

document.addEventListener("DOMContentLoaded", async function () {
  const perfilCorreo = document.getElementById("perfilCorreo");
  const perfilNombre = document.getElementById("perfilNombre");
  const perfilRol = document.getElementById("perfilRol");
  const btnLogout = document.getElementById("btnLogout");

  try {
    const perfil = await obtenerPerfilSesion();

    escribir(perfilCorreo, perfil.correo || obtenerCorreoSesion() || "Correo no disponible");
    escribir(perfilNombre, perfil.nombre || "Nombre no disponible");
    escribir(perfilRol, perfil.rol || "—");
  } catch (error) {
    console.error("No fue posible cargar el perfil.", error);

    escribir(perfilCorreo, obtenerCorreoSesion() || "Correo no disponible");
    escribir(perfilNombre, "Nombre no disponible");
    escribir(perfilRol, "—");
  }

  btnLogout?.addEventListener("click", async function (evento) {
    // Detengo el enlace para que no se vaya antes de que la API borre
    // la cookie. Uso replace para que la flecha de atras no regrese aqui.
    evento.preventDefault();
    await cerrarSesion();
    window.location.replace(btnLogout.getAttribute("href"));
  });
});

function escribir(elemento, valor) {
  if (elemento) {
    elemento.textContent = valor;
  }
}
