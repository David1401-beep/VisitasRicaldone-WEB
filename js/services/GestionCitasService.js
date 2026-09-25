import { ENDPOINTS } from "../config.js";
import { validarDatosCita } from "../validaciones/validaciones.js";

export { validarDatosCita };


// READ — Obtener todas las citas desde la API

export async function obtenerCitas() {
    try {
        const respuesta = await fetch(ENDPOINTS.CITAS, { credentials: "include" });

        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);

        const json = await respuesta.json();

        // La API devuelve: { success: true, message: "...", data: [...] }
        return json.data ?? [];

    } catch (error) {
        console.warn("API desconectada, usando datos de demostración:", error);
        return citasDemostracion;
    }
}


// READ — Obtener una cita por ID

export async function obtenerCitaPorId(idCita) {
    try {
        const respuesta = await fetch(`${ENDPOINTS.CITAS}/${idCita}`, { credentials: "include" });

        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);

        const json = await respuesta.json();
        return json.data ?? null;

    } catch (error) {
        console.warn("No se pudo obtener la cita con ID:", idCita, error);
        return null;
    }
}


// CREATE — Agregar una nueva cita
// Los datos vienen del formulario del docente

export async function agregarCita(datosCita) {
    // Construir el DTO que espera la API Java
    const citaDTO = construirDTO(datosCita, "PENDIENTE");

    try {
        const respuesta = await fetch(ENDPOINTS.CITAS, {
            credentials: "include",
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(citaDTO)
        });

        if (!respuesta.ok) {
            const errorJson = await respuesta.json();
            throw new Error(errorJson.message ?? `Error ${respuesta.status}`);
        }

        const json = await respuesta.json();
        return json.data;

    } catch (error) {
        console.warn("Servidor no disponible, guardando localmente:", error);
        // Fallback local mientras la API no esté disponible
        const nuevaCita = { ...citaDTO, idCita: Date.now() };
        citasDemostracion.push(nuevaCita);
        return nuevaCita;
    }
}


// UPDATE — Actualizar una cita existente (PUT /citas/{id})

export async function actualizarCita(idCita, datosCita, estadoActual) {
    const citaDTO = construirDTO(datosCita, estadoActual);

    try {
        const respuesta = await fetch(`${ENDPOINTS.CITAS}/${idCita}`, {
            credentials: "include",
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(citaDTO)
        });

        if (!respuesta.ok) {
            const errorJson = await respuesta.json();
            throw new Error(errorJson.message ?? `Error ${respuesta.status}`);
        }

        const json = await respuesta.json();
        return json.data;

    } catch (error) {
        console.warn("Error al actualizar cita:", error);
        throw error;
    }
}


// UPDATE ESTADO — Cambiar solo el estado de una cita (PATCH)
// Usado para: ACEPTADA, RECHAZADA, CANCELADA, FINALIZADA

export async function cambiarEstadoCita(idCita, nuevoEstado) {
    try {
        const respuesta = await fetch(`${ENDPOINTS.CITAS}/${idCita}`, {
            credentials: "include",
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: nuevoEstado.toUpperCase() })
        });

        if (!respuesta.ok) {
            const errorJson = await respuesta.json();
            throw new Error(errorJson.message ?? `Error ${respuesta.status}`);
        }

        const json = await respuesta.json();
        return json.data;

    } catch (error) {
        console.warn("Error al cambiar estado de cita:", error);
        throw error;
    }
}


// DELETE — Eliminar una cita por ID

export async function eliminarCita(idCita) {
    try {
        const respuesta = await fetch(`${ENDPOINTS.CITAS}/${idCita}`, {
            credentials: "include",
            method: "DELETE"
        });

        if (!respuesta.ok) {
            const errorJson = await respuesta.json();
            throw new Error(errorJson.message ?? `Error ${respuesta.status}`);
        }

        return true;

    } catch (error) {
        console.warn("Error al eliminar cita:", error);
        throw error;
    }
}


// FILTER — Filtrar citas por estado en el cliente

export async function filtrarCitasPorEstado(estado) {
    const listaCitas = await obtenerCitas();

    if (estado === "Todos") return listaCitas;

    // La API guarda estados en MAYÚSCULAS
    return listaCitas.filter(
        cita => cita.estado?.toUpperCase() === estado.toUpperCase()
    );
}


// UTILIDADES PRIVADAS


function construirDTO(datosCita, estado) {

    const idEmpleado = parseInt(sessionStorage.getItem("idEmpleado") ?? "1");

    const idEstudianteEncargado = parseInt(
        datosCita.idEstudianteEncargado ?? "1"
    );

    return {
        idEmpleado:             idEmpleado,
        idEstudianteEncargado:  idEstudianteEncargado,
        motivo:                 datosCita.motivo,
        estado:                 estado.toUpperCase(),
        observaciones:          datosCita.observaciones ?? "",
        fechaReunion:           `${datosCita.fecha}T${datosCita.hora}:00`
    };
}


// FORMATEO DE FECHAS (para mostrar en la tabla del historial)


export function formatearFechaEspanol(fechaISO) {
    if (!fechaISO) return "";

    // Acepta "2026-05-14T11:25:00" o "2026-05-14"
    const fecha = new Date(fechaISO);
    const meses = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    return `${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

export function formatearHoraAMPM(fechaISO) {
    if (!fechaISO) return "";

    const fecha = new Date(fechaISO);
    let horas = fecha.getHours();
    const minutos = String(fecha.getMinutes()).padStart(2, "0");
    const periodo = horas >= 12 ? "P.M" : "A.M";

    horas = horas % 12;
    horas = horas === 0 ? 12 : horas;

    return `${horas}:${minutos} ${periodo}`;
}

// DATOS DE DEMOSTRACIÓN (fallback cuando la API no responde)
// Usan el mismo formato que devuelve la API Java

const citasDemostracion = [
    {
        idCita: 1,
        idEmpleado: 1,
        idEstudianteEncargado: 1,
        motivo: "SEGUIMIENTO ACADEMICO",
        estado: "PENDIENTE",
        observaciones: "Primera reunión de seguimiento",
        fechaReunion: "2026-08-03T08:00:00"
    },
    {
        idCita: 2,
        idEmpleado: 2,
        idEstudianteEncargado: 2,
        motivo: "REVISION DE CALIFICACIONES",
        estado: "ACEPTADA",
        observaciones: "Revisar avances del periodo",
        fechaReunion: "2026-08-04T09:00:00"
    },
    {
        idCita: 3,
        idEmpleado: 3,
        idEstudianteEncargado: 3,
        motivo: "CONDUCTA Y CONVIVENCIA",
        estado: "PENDIENTE",
        observaciones: "Conversar sobre convivencia escolar",
        fechaReunion: "2026-08-05T10:00:00"
    }
];