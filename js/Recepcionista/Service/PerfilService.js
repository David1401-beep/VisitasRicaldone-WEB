import { solicitarApi } from "../../Docentes/Service/ApiService.js";
import { cerrarSesionApi } from "../../AuthApiService.js";

export function obtenerCorreoSesion() {
  return sessionStorage.getItem("userCorreo");
}

export async function obtenerPerfilSesion() {
  const idRecepcionista = Number(sessionStorage.getItem("recepcionistaId"));

  if (!idRecepcionista) {
    throw new Error("No se encontró la sesión de la recepcionista.");
  }

  const recepcionista = await solicitarApi(
    `/recepcionistas/${encodeURIComponent(idRecepcionista)}`
  );

  return {
    idRecepcionista: recepcionista.idRecepcionista,
    correo: recepcionista.recCorreo,
    nombre: `${recepcionista.recNombre} ${recepcionista.recApellido}`.trim(),
    rol: recepcionista.recRol
  };
}

export async function cerrarSesion() {
  sessionStorage.removeItem("userCorreo");
  sessionStorage.removeItem("userId");
  sessionStorage.removeItem("recepcionistaId");
  sessionStorage.removeItem("userNombre");
  sessionStorage.removeItem("userRol");

  // Sin esto la cookie sigue viva y la sesion nunca se cierra de verdad.
  await cerrarSesionApi();
}
