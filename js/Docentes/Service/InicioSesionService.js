import { validarCorreoInstitucional } from "./validaciones.js";
import { iniciarSesionPersonal } from "../../AuthApiService.js";

export { validarCorreoInstitucional };

const ROLES_DOCENTE = [
  "DOCENTE",
  "DOCENTE TÉCNICO",
  "DOCENTE TECNICO",
  "DOCENTE ACADÉMICO",
  "DOCENTE ACADEMICO"
];

export async function iniciarSesion(correo, contrasena) {
  if (!validarCorreoInstitucional(correo)) {
    return {
      exito: false,
      mensaje: "El correo debe terminar en @ricaldone.edu.sv."
    };
  }

  const resultado = await iniciarSesionPersonal(correo, contrasena);

  if (!resultado.exito) {
    return resultado;
  }

  const rol = String(resultado.datos?.rol || "").toUpperCase();

  if (!ROLES_DOCENTE.includes(rol)) {
    return {
      exito: false,
      mensaje: "Este acceso es exclusivo para docentes."
    };
  }

  return {
    exito: true,
    redireccion: "inicio-docente.html",
    sesion: {
      idDocente: resultado.datos.idUsuario,
      correo: resultado.datos.email,
      rol
    }
  };
}
