import { solicitarApi } from "./ApiService.js";
import { RUTAS } from "../../config.js";
import { validarPropuesta } from "./validaciones.js";

const MARCADOR_SOLICITUD_PADRE = "[SOLICITUD_PADRE]";

// Uso el mismo texto que la app móvil, para que al encargado le
// aparezca como propuesta del docente.
const PROPUESTA_DOCENTE = "Docente propone otra fecha:";

const LIMITE_OBSERVACIONES = 300;

export { validarPropuesta };

export function obtenerFechaActual() {
    const hoy = new Date();

    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

export function formatearFecha(fecha) {
    if (!fecha) {
        return "";
    }

    const partes = fecha.split("-");

    if (partes.length !== 3) {
        return fecha;
    }

    const anio = partes[0];
    const mes = parseInt(partes[1], 10);
    const dia = parseInt(partes[2], 10);

    return `${dia}/${mes}/${anio}`;
}

export function formatearHora(hora) {
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

export function crearPropuesta(fecha, hora) {
    return {
        fecha: formatearFecha(fecha),
        hora: formatearHora(hora)
    };
}

export async function obtenerCita(idCita) {
    const cita = await solicitarApi(`${RUTAS.CITAS}/${idCita}`);
    const partes = String(cita.citFechaReunion || "").split("T");

    return {
        idCita: cita.idCita,
        estudiante: cita.nombreEstudiante || "Estudiante no disponible",
        encargado: cita.nombreEncargado || "Encargado no disponible",
        motivo: cita.citMotivo || "",
        estado: cita.citEstado,
        fecha: partes[0] || "",
        hora: (partes[1] || "").slice(0, 5)
    };
}

export async function guardarPropuesta(idCita, fecha, hora, justificacion) {
    const validacion = validarPropuesta(fecha, hora);

    if (!validacion.valido) {
        throw new Error(validacion.mensaje);
    }

    const motivo = (justificacion || "").trim();

    if (!motivo) {
        throw new Error("Debe explicar por qué propone otra fecha.");
    }

    return solicitarApi(`${RUTAS.CITAS}/${idCita}`, {
        method: "PATCH",
        body: JSON.stringify({
            citEstado: "POSPUESTA",
            citObservaciones: construirObservaciones(motivo),
            citFechaReunion: `${fecha}T${hora}:00`
        })
    });
}

// Piso el texto anterior en vez de irlo pegando. Si no, después de
// varias idas y vueltas se pasa del límite y se corta.
function construirObservaciones(motivo) {
    return `${MARCADOR_SOLICITUD_PADRE} ${PROPUESTA_DOCENTE} ${motivo}`
        .slice(0, LIMITE_OBSERVACIONES);
}

export { MARCADOR_SOLICITUD_PADRE };