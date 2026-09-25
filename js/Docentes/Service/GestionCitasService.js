import { solicitarApi } from "./ApiService.js";
import { RUTAS } from "../../config.js";
import { validarDatosCita } from "./validaciones.js";

let citas = [];
let estudiantesEncargados = [];

const MARCADOR_SOLICITUD_PADRE = "[SOLICITUD_PADRE]";

// Uso estos textos para saber cuál de los dos mandó la última propuesta
// y a quién le toca contestar.
const PROPUESTA_ENCARGADO = "Encargado propone otra fecha:";
const PROPUESTA_DOCENTE = "Docente propone otra fecha:";

const nombresEstado = {
  PENDIENTE: "Pendiente",
  ACEPTADA: "Aprobado",
  POSPUESTA: "Pospuesta",
  RECHAZADA: "Rechazado",
  CANCELADA: "Cancelado",
  FINALIZADA: "Finalizado"
};

const estadosApi = Object.fromEntries(
  Object.entries(nombresEstado).map(([clave, valor]) => [valor, clave])
);

export { validarDatosCita };


// Lectura

export async function obtenerCitas(idDocente) {
  if (!idDocente) {
    throw new Error("No se encontró el docente de la sesión.");
  }

  const citasApi = await solicitarApi(
    `${RUTAS.CITAS}/por-docente/${encodeURIComponent(idDocente)}`
  );

  citas = (Array.isArray(citasApi) ? citasApi : [])
    .filter(cita => !cita.citObservaciones?.startsWith(MARCADOR_SOLICITUD_PADRE))
    .map(convertirCitaParaVista)
    .sort(compararCitas);

  return citas;
}

// Arriba las que hay que contestar y al final las rechazadas.
const PRIORIDAD_ESTADO = {
  POSPUESTA: 1,
  PENDIENTE: 2,
  ACEPTADA: 3,
  FINALIZADA: 4,
  CANCELADA: 5,
  RECHAZADA: 6
};

function compararCitas(primera, segunda) {
  const diferencia =
    (PRIORIDAD_ESTADO[primera.estadoApi] || 7) - (PRIORIDAD_ESTADO[segunda.estadoApi] || 7);

  if (diferencia !== 0) {
    return diferencia;
  }

  // Si están en el mismo estado, primero la más cercana.
  return (primera.fechaReunion || "").localeCompare(segunda.fechaReunion || "");
}


export async function obtenerEstudiantesEncargados() {
  if (estudiantesEncargados.length === 0) {
    const relacionesApi = await solicitarApi(RUTAS.ESTUDIANTES_ENCARGADOS);
    estudiantesEncargados = Array.isArray(relacionesApi) ? relacionesApi : [];
  }

  return estudiantesEncargados;
}


export async function buscarCitas(idDocente, texto) {
  if (!texto || !texto.trim()) {
    return obtenerCitas(idDocente);
  }

  const resultados = await solicitarApi(
    `${RUTAS.CITAS}/buscar?idDocente=${encodeURIComponent(idDocente)}` +
    `&texto=${encodeURIComponent(texto.trim())}`
  );

  return (Array.isArray(resultados) ? resultados : []).map(convertirCitaParaVista);
}


// Crear
export async function agregarCita(datosCita, idDocente) {
  const validacion = validarDatosCita(datosCita);

  if (!validacion.valido) {
    throw new Error(validacion.mensaje);
  }

  const citaGuardada = await solicitarApi(RUTAS.CITAS, {
    method: "POST",
    body: JSON.stringify({
      idDocente: Number(idDocente),
      idEstudianteEncargado: Number(datosCita.idEstudianteEncargado),
      citMotivo: datosCita.asunto,
      citEstado: "PENDIENTE",
      citObservaciones: datosCita.descripcion,
      // La API espera LocalDateTime: 2026-09-11T14:30:00
      citFechaReunion: `${datosCita.fecha}T${datosCita.hora}:00`
    })
  });

  const nuevaCita = convertirCitaParaVista(citaGuardada);
  citas.push(nuevaCita);

  return nuevaCita;
}


// Actualizar
export async function actualizarCita(idCita, datos) {
  const citaActual = citas.find(cita => Number(cita.idCita) === Number(idCita));

  if (!citaActual) {
    throw new Error("No se encontró la cita que intenta actualizar.");
  }

  const fecha = datos.fecha || citaActual.fechaCruda;
  const hora = datos.hora || citaActual.horaCruda || "00:00";

  const citaActualizada = await solicitarApi(`${RUTAS.CITAS}/${idCita}`, {
    method: "PUT",
    body: JSON.stringify({
      idDocente: Number(citaActual.idDocente),
      idEstudianteEncargado: Number(
        datos.idEstudianteEncargado ?? citaActual.idEstudianteEncargado
      ),
      citMotivo: datos.asunto ?? citaActual.asunto,
      citEstado: datos.estado ?? citaActual.estadoApi,
      citObservaciones: datos.descripcion ?? citaActual.descripcion,
      citFechaReunion: `${fecha}T${hora}:00`
    })
  });

  return actualizarEnMemoria(convertirCitaParaVista(citaActualizada));
}

export async function reprogramarCita(idCita, fecha, hora, observaciones) {
  const citaActualizada = await solicitarApi(`${RUTAS.CITAS}/${idCita}`, {
    method: "PATCH",
    body: JSON.stringify({
      citFechaReunion: `${fecha}T${hora}:00`,
      citObservaciones: observaciones,
      citEstado: "POSPUESTA"
    })
  });

  return actualizarEnMemoria(convertirCitaParaVista(citaActualizada));
}

// El docente acepta la fecha que le propuso el encargado.
export async function aceptarPropuesta(idCita) {
  const citaActualizada = await solicitarApi(`${RUTAS.CITAS}/${idCita}`, {
    method: "PATCH",
    body: JSON.stringify({ citEstado: "ACEPTADA" })
  });

  return actualizarEnMemoria(convertirCitaParaVista(citaActualizada));
}

// El docente no puede ese día y le manda otra fecha al encargado.
// La dejo en PENDIENTE porque ahora el que espera es el docente.
export async function proponerOtraFecha(idCita, fecha, hora, motivo) {
  if (!fecha || !hora) {
    throw new Error("Debe indicar la nueva fecha y hora.");
  }

  if (!motivo || !motivo.trim()) {
    throw new Error("Debe explicar por qué propone otra fecha.");
  }

  const citaActualizada = await solicitarApi(`${RUTAS.CITAS}/${idCita}`, {
    method: "PATCH",
    body: JSON.stringify({
      citEstado: "PENDIENTE",
      citFechaReunion: `${fecha}T${hora}:00`,
      citObservaciones: `${PROPUESTA_DOCENTE} ${motivo.trim()}`.slice(0, 300)
    })
  });

  return actualizarEnMemoria(convertirCitaParaVista(citaActualizada));
}

export async function cambiarEstadoCita(idCita, estado, observaciones) {
  const cuerpo = { citEstado: estado };

  if (observaciones !== undefined) {
    cuerpo.citObservaciones = observaciones;
  }

  const citaActualizada = await solicitarApi(`${RUTAS.CITAS}/${idCita}`, {
    method: "PATCH",
    body: JSON.stringify(cuerpo)
  });

  return actualizarEnMemoria(convertirCitaParaVista(citaActualizada));
}

// Eliminar
export async function eliminarCita(idCita) {
  await solicitarApi(`${RUTAS.CITAS}/${idCita}`, { method: "DELETE" });

  citas = citas.filter(cita => Number(cita.idCita) !== Number(idCita));

  return true;
}


// Filtro en pantalla


export function filtrarCitasPorEstado(estado) {
  if (estado === "Todos") {
    return citas;
  }

  return citas.filter(cita => cita.estado === estado);
}


export async function filtrarCitasEnApi(idDocente, estadoVisible) {
  if (estadoVisible === "Todos") {
    return obtenerCitas(idDocente);
  }

  const estadoApi = estadosApi[estadoVisible] || estadoVisible.toUpperCase();

  const resultados = await solicitarApi(
    `${RUTAS.CITAS}/por-docente/${encodeURIComponent(idDocente)}?estado=${estadoApi}`
  );

  citas = (Array.isArray(resultados) ? resultados : []).map(convertirCitaParaVista);

  return citas;
}


// Conversión API → vista

function convertirCitaParaVista(cita) {
  const fechaHora = separarFechaHora(cita.citFechaReunion);

  const relacion = estudiantesEncargados.find(
    registro => Number(registro.idEstudianteEncargado) === Number(cita.idEstudianteEncargado)
  );

  return {
    idCita: cita.idCita,
    idDocente: cita.idDocente,
    idEstudianteEncargado: cita.idEstudianteEncargado,
    fechaReunion: cita.citFechaReunion,
    fecha: formatearFechaEspanol(fechaHora.fecha),
    hora: formatearHoraAMPM(fechaHora.hora),
    fechaHora: `${formatearFechaEspanol(fechaHora.fecha)}, ${formatearHoraAMPM(fechaHora.hora)}`,
    // Campos crudos, útiles para rellenar formularios de edición.
    fechaCruda: fechaHora.fecha,
    horaCruda: fechaHora.hora,
    estudiante: cita.nombreEstudiante || relacion?.nombreEstudiante || "Estudiante no disponible",
    encargado: cita.nombreEncargado || relacion?.nombreEncargado || "Encargado no disponible",
    docente: cita.nombreDocente || "",
    asunto: cita.citMotivo || "",
    descripcion: cita.citObservaciones || "",
    estado: nombresEstado[cita.citEstado] || cita.citEstado,
    estadoApi: cita.citEstado,
    // Quién mandó esta fecha y el motivo que escribió.
    propuestaDe: quienPropuso(cita.citObservaciones),
    motivoPropuesta: motivoDeLaPropuesta(cita.citObservaciones)
  };
}

// Me dice quién propuso la fecha: el encargado, el docente, o nadie.
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

// Me quedo solo con el motivo y le quito el texto de quién propuso.
function motivoDeLaPropuesta(observaciones) {
  const texto = String(observaciones || "");
  const marcador = texto.includes(PROPUESTA_ENCARGADO)
    ? PROPUESTA_ENCARGADO
    : texto.includes(PROPUESTA_DOCENTE) ? PROPUESTA_DOCENTE : "";

  if (!marcador) {
    return "";
  }

  return texto.slice(texto.indexOf(marcador) + marcador.length).trim();
}

function actualizarEnMemoria(citaConvertida) {
  const indice = citas.findIndex(
    cita => Number(cita.idCita) === Number(citaConvertida.idCita)
  );

  if (indice >= 0) {
    citas[indice] = citaConvertida;
  }

  return citaConvertida;
}

function separarFechaHora(fechaReunion) {
  if (!fechaReunion) {
    return { fecha: "", hora: "" };
  }

  const partes = String(fechaReunion).split("T");

  return {
    fecha: partes[0] || "",
    hora: (partes[1] || "").slice(0, 5)
  };
}

// Formato


// Convierte 2026-07-23 en "23 de julio de 2026".
export function formatearFechaEspanol(fecha) {
  if (!fecha) {
    return "";
  }

  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  const anio = partes[0];
  const indiceMes = parseInt(partes[1], 10) - 1;
  const dia = parseInt(partes[2], 10);

  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];

  return `${dia} de ${meses[indiceMes]} de ${anio}`;
}

// Convierte 14:30 en "2:30 P.M".
export function formatearHoraAMPM(hora) {
  if (!hora) {
    return "";
  }

  const partes = hora.split(":");

  if (partes.length < 2) {
    return hora;
  }

  let horas = parseInt(partes[0], 10);
  const minutos = partes[1];
  const periodo = horas >= 12 ? "P.M" : "A.M";

  horas = horas % 12;
  horas = horas === 0 ? 12 : horas;

  return `${horas}:${minutos} ${periodo}`;
}