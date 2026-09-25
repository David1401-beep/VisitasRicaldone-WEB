import { iniciarSesionPersonal } from "../../AuthApiService.js";

const ROLES_PERMITIDOS = ["ADMINISTRADOR", "RECEPCIONISTA"];

export function validarCorreoAdministrador(correo) {
  return /^[^@\s]+@ricaldone\.edu\.sv$/i.test(correo.trim());
}

// Esta pantalla sirve para administradores y recepcionistas: la API-AUTH ya
// dice a cuál de los dos roles pertenece la cuenta, así que aquí solo se
// decide a dónde mandarla y con qué claves guardar la sesión.
export async function iniciarSesionAdministrador(correo, contrasena) {
  const correoNormalizado = correo.trim().toLowerCase();

  if (!validarCorreoAdministrador(correoNormalizado)) {
    return {
      exito: false,
      mensaje: "El correo debe terminar en @ricaldone.edu.sv."
    };
  }

  const resultado = await iniciarSesionPersonal(correoNormalizado, contrasena);

  if (!resultado.exito) {
    return resultado;
  }

  const rol = String(resultado.datos?.rol || "").toUpperCase();

  if (!ROLES_PERMITIDOS.includes(rol)) {
    return {
      exito: false,
      mensaje: "Este acceso es exclusivo para administradores y recepcionistas."
    };
  }

  return {
    exito: true,
    redireccion: rol === "ADMINISTRADOR" ? "inicio-admin.html" : "inicio-recepcionista.html",
    sesion: {
      idUsuario: resultado.datos.idUsuario,
      correo: resultado.datos.email,
      rol
    }
  };
}

export function guardarSesionAdministrador(sesion) {
  if (sesion.rol === "ADMINISTRADOR") {
    sessionStorage.setItem("adminId", sesion.idUsuario);
    sessionStorage.setItem("adminCorreo", sesion.correo);
    sessionStorage.setItem("adminRol", sesion.rol);
    sessionStorage.setItem("adminSesionActiva", "true");
    return;
  }

  sessionStorage.setItem("recepcionistaId", sesion.idUsuario);
  sessionStorage.setItem("userCorreo", sesion.correo);
  sessionStorage.setItem("userRol", sesion.rol);
}
