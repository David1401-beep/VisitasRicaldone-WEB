import { solicitarApi } from "./ApiService.js";
import { RUTAS } from "../../config.js";

const MARCADOR_SOLICITUD_PADRE = "[SOLICITUD_PADRE]";

// Uso estos textos para saber cuál de los dos mandó la última propuesta.
const PROPUESTA_ENCARGADO = "Encargado propone otra fecha:";
const PROPUESTA_DOCENTE = "Docente propone otra fecha:";

let estudiantesEnMemoria = null;

export async function obtenerSolicitudes(idDocente) {
  if (!idDocente) {
    throw new Error("No se encontró el docente de la sesión.");
  }

  const [citas, relaciones, estudiantes] = await Promise.all([
    solicitarApi(`${RUTAS.CITAS}/por-docente/${encodeURIComponent(idDocente)}`),
    solicitarApi(RUTAS.ESTUDIANTES_ENCARGADOS),
    obtenerEstudiantes()
  ]);

  const listaCitas = Array.isArray(citas) ? citas : [];
  const listaRelaciones = Array.isArray(relaciones) ? relaciones : [];

  return listaCitas
    .filter(esSolicitudDePadre)
    .map(cita => convertirSolicitud(cita, listaRelaciones, estudiantes));
}

// Agrego POSPUESTA para que el docente siga viendo las que él movió
// de fecha. Antes se le desaparecían de la lista.
function esSolicitudDePadre(cita) {
  return ["PENDIENTE", "ACEPTADA", "POSPUESTA"].includes(cita.citEstado) &&
         cita.citObservaciones?.startsWith(MARCADOR_SOLICITUD_PADRE);
}

async function obtenerEstudiantes() {
  if (estudiantesEnMemoria === null) {
    const respuesta = await solicitarApi(RUTAS.ESTUDIANTES);
    estudiantesEnMemoria = Array.isArray(respuesta) ? respuesta : [];
  }

  return estudiantesEnMemoria;
}

function convertirSolicitud(cita, relaciones, estudiantes) {
  const relacion = relaciones.find(
    registro => Number(registro.idEstudianteEncargado) === Number(cita.idEstudianteEncargado)
  );

  const estudiante = estudiantes.find(
    registro => Number(registro.idEstudiante) === Number(relacion?.idEstudiante)
  );

  return {
    id: cita.idCita,
    idEstudianteEncargado: cita.idEstudianteEncargado,

    padre: cita.nombreEncargado || relacion?.nombreEncargado || "Encargado no disponible",
    estudiante: cita.nombreEstudiante || relacion?.nombreEstudiante || "Estudiante no disponible",

    codigo: estudiante?.estCodigo || "No disponible",
    correo: estudiante?.estCorreo || "No disponible",

    motivo: cita.citMotivo || "",

    descripcion: limpiarObservaciones(cita.citObservaciones) || cita.citMotivo || "",

    // Quién mandó la última propuesta: el encargado, el docente, o nadie.
    propuestaDe: quienPropuso(cita.citObservaciones),

    fechaReunion: cita.citFechaReunion,
    estado: cita.citEstado
  };
}

function quienPropuso(observaciones) {
  const texto = String(observaciones || "");

  if (texto.includes(PROPUESTA_ENCARGADO)) {
    return "ENCARGADO";
  }

  if (texto.includes(PROPUESTA_DOCENTE)) {
    return "DOCENTE";
  }

  return "";
}

// Le quito el marcador y el texto de quién propuso, para dejar el motivo.
function limpiarObservaciones(observaciones) {
  let texto = String(observaciones || "");

  if (texto.startsWith(MARCADOR_SOLICITUD_PADRE)) {
    texto = texto.slice(MARCADOR_SOLICITUD_PADRE.length);
  }

  [PROPUESTA_ENCARGADO, PROPUESTA_DOCENTE].forEach(marca => {
    const posicion = texto.indexOf(marca);

    if (posicion >= 0) {
      texto = texto.slice(posicion + marca.length);
    }
  });

  return texto.trim();
}

export async function aceptarSolicitud(idCita) {
  return solicitarApi(`${RUTAS.CITAS}/${idCita}`, {
    method: "PATCH",
    body: JSON.stringify({ citEstado: "ACEPTADA" })
  });
}

// Rechaza la solicitud y guarda el motivo. Dejo el marcador para no perder
// de vista que la cita la pidió el encargado.
export async function rechazarSolicitud(idCita, motivo) {
  const cuerpo = { citEstado: "RECHAZADA" };

  if (motivo && motivo.trim()) {
    cuerpo.citObservaciones =
      `${MARCADOR_SOLICITUD_PADRE} ${motivo.trim()}`.slice(0, 300);
  }

  return solicitarApi(`${RUTAS.CITAS}/${idCita}`, {
    method: "PATCH",
    body: JSON.stringify(cuerpo)
  });
}

export { MARCADOR_SOLICITUD_PADRE };