// Protege las paginas privadas. Le pregunta a la API si la sesion sigue
// activa y si el rol es el correcto; si no, manda al login.
//
// En el HTML se pone asi:
//   <script type="module" src="../js/guardian.js?roles=ADMINISTRADOR"></script>

import { obtenerSesion, cerrarSesionApi } from "./AuthApiService.js";

const LOGIN_PERSONAL = "/Proyecto-Visitas-Ricaldone-API/pages/inicioSesion-admin.html";
const LOGIN_DOCENTES = "/Proyecto-Visitas-Ricaldone-API/pages/inicioSesion-docente.html";

// Los roles los leo de la URL del script. No uso document.currentScript
// porque en los modulos siempre da null.
const rolesAdmitidos = (new URL(import.meta.url).searchParams.get("roles") || "")
  .split(",")
  .map(rol => rol.trim().toUpperCase())
  .filter(Boolean);

// Los docentes tecnicos y academicos usan las mismas pantallas.
function coincideRol(rolSesion) {
  if (rolesAdmitidos.length === 0) {
    return true;
  }

  return rolesAdmitidos.some(admitido =>
    admitido === "DOCENTE" ? rolSesion.startsWith("DOCENTE") : admitido === rolSesion
  );
}

function pantallaDeLogin() {
  return rolesAdmitidos.includes("DOCENTE") ? LOGIN_DOCENTES : LOGIN_PERSONAL;
}

// Escondo la pagina mientras reviso, para que no se alcance a ver si
// al final lo voy a sacar.
document.documentElement.style.visibility = "hidden";

const sesion = await obtenerSesion();

if (!sesion) {
  window.location.replace(pantallaDeLogin());
} else if (!coincideRol(String(sesion.rol || "").toUpperCase())) {
  await cerrarSesionApi();
  window.location.replace(pantallaDeLogin());
} else {
  // Guardo los datos para que los usen los demas controladores.
  sessionStorage.setItem("usuarioId", sesion.idUsuario);
  sessionStorage.setItem("usuarioCorreo", sesion.email);
  sessionStorage.setItem("usuarioRol", sesion.rol);

  document.documentElement.style.visibility = "visible";
}
