import { solicitarApi } from "./ApiService.js";
import { RUTAS } from "../../config.js";

const MARCADOR_SOLICITUD_PADRE = "[SOLICITUD_PADRE]";
const PROPUESTA_ENCARGADO = "Encargado propone otra fecha:";
const PROPUESTA_DOCENTE = "Docente propone otra fecha:";


export async function obtenerDetalleSolicitud(idCita) {
  if (!idCita) {
    throw new Error("No se indicó qué solicitud revisar.");
  }

 
  const cita = await solicitarApi(`${RUTAS.CITAS}/${idCita}`);

  const relacion = await solicitarApi(
    `${RUTAS.ESTUDIANTES_ENCARGADOS}/${cita.idEstudianteEncargado}`
  );

  const estudiante = await solicitarApi(
    `${RUTAS.ESTUDIANTES}/${relacion.idEstudiante}`
  );

  const fechaHora = separarFechaHora(cita.citFechaReunion);

  return {
    idCita: cita.idCita,
    idDocente: cita.idDocente,
    idEstudianteEncargado: cita.idEstudianteEncargado,

    solicitante: cita.nombreEncargado || "No disponible",
    estudiante: cita.nombreEstudiante ||
                `${estudiante.estNombre || ""} ${estudiante.estApellido || ""}`.trim(),

    correo: estudiante.estCorreo || "No disponible",
    codigo: estudiante.estCodigo || "No disponible",

    motivo: cita.citMotivo || "No disponible",

    descripcion: limpiarMarcador(cita.citObservaciones),

    // Si el encargado pospuso, aqui viene su razon y abajo quien propuso.
    // Sin esto el docente veria solo la solicitud original y no sabria
    // que le estan proponiendo otra fecha.
    propuestaDe: quienPropuso(cita.citObservaciones),

    estado: cita.citEstado,
    fecha: formatearFechaCompleta(fechaHora.fecha),
    hora: formatearHora(fechaHora.hora),

    fechaCruda: fechaHora.fecha,
    horaCruda: fechaHora.hora
  };
}


export async function aceptarSolicitud(idCita) {
  const citaActualizada = await solicitarApi(`${RUTAS.CITAS}/${idCita}`, {
    method: "PATCH",
    body: JSON.stringify({ citEstado: "ACEPTADA" })
  });

  return {
    exito: true,
    mensaje: "La solicitud fue aceptada correctamente.",
    cita: citaActualizada
  };
}

export async function rechazarSolicitud(idCita, motivo) {
  const cuerpo = { citEstado: "RECHAZADA" };

  if (motivo && motivo.trim()) {
    cuerpo.citObservaciones =
      `${MARCADOR_SOLICITUD_PADRE} ${motivo.trim()}`.slice(0, 300);
  }

  const citaActualizada = await solicitarApi(`${RUTAS.CITAS}/${idCita}`, {
    method: "PATCH",
    body: JSON.stringify(cuerpo)
  });

  return {
    exito: true,
    mensaje: "La solicitud fue rechazada.",
    cita: citaActualizada
  };
}

// Apoyo

// Quien mando la ultima propuesta de fecha, si es que hubo alguna.
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

function limpiarMarcador(observaciones) {
  let texto = String(observaciones || "");

  if (!texto) {
    return "";
  }

  if (texto.startsWith(MARCADOR_SOLICITUD_PADRE)) {
    texto = texto.slice(MARCADOR_SOLICITUD_PADRE.length).trim();
  }

  // Quito tambien el "fulano propone otra fecha:", porque eso se muestra
  // aparte y dentro del motivo solo estorba.
  for (const prefijo of [PROPUESTA_ENCARGADO, PROPUESTA_DOCENTE]) {
    if (texto.startsWith(prefijo)) {
      texto = texto.slice(prefijo.length).trim();
      break;
    }
  }

  return texto;
}

function separarFechaHora(fechaReunion) {
  const partes = String(fechaReunion || "").split("T");

  return {
    fecha: partes[0] || "",
    hora: (partes[1] || "").slice(0, 5)
  };
}

function formatearFechaCompleta(fecha) {
  if (!fecha) {
    return "No disponible";
  }

  const [anio, mes, dia] = fecha.split("-").map(Number);

  const fechaLocal = new Date(anio, mes - 1, dia);

  return new Intl.DateTimeFormat("es-SV", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(fechaLocal);
}

function formatearHora(hora) {
  if (!hora) {
    return "No disponible";
  }

  const [horasTexto, minutos] = hora.split(":");
  let horas = Number(horasTexto);
  const periodo = horas >= 12 ? "P.M" : "A.M";

  horas = horas % 12 || 12;

  return `${horas}:${minutos} ${periodo}`;
}

export { MARCADOR_SOLICITUD_PADRE };