import {
    obtenerFechaActual,
    validarPropuesta,
    crearPropuesta,
    guardarPropuesta
} from "../Service/PosponerService.js";
import { ajustarCampoHora } from "../../horarioCitas.js";
import { avisoError } from "../../avisos.js";

const fechaSugeridaInput = document.getElementById("fechaSugerida");
const formPosponer = document.getElementById("formPosponer");
const modalPropuestaEnviada = document.getElementById("modalPropuestaEnviada");
const btnCerrarModalPropuesta = document.getElementById("btn-cerrar-modal-propuesta");
const modalPropuestaFecha = document.getElementById("modalPropuestaFecha");
const modalPropuestaHora = document.getElementById("modalPropuestaHora");
const justificacionInput = document.getElementById("justificacionPosponer");
const parametros = new URLSearchParams(window.location.search);
const idCita = Number(parametros.get("id"));


if (fechaSugeridaInput) {
    fechaSugeridaInput.min = obtenerFechaActual();

    // Ajusta el rango de la hora segun el dia que elija.
    ajustarCampoHora(fechaSugeridaInput, document.getElementById("horaSugerida"));
}

if (formPosponer && modalPropuestaEnviada) {
    formPosponer.addEventListener("submit", async function (e) {
        e.preventDefault();

        if (!idCita) {
            avisoError("No se recibió el ID de la cita que desea posponer.");
            return;
        }

        const fecha = document.getElementById("fechaSugerida").value;
        const hora = document.getElementById("horaSugerida").value;
        const justificacion = justificacionInput.value.trim();
        const resultadoValidacion = validarPropuesta(fecha, hora);

        if (!resultadoValidacion.valido) {
            avisoError(resultadoValidacion.mensaje, "Revise los datos");
            return;
        }

        const propuesta = crearPropuesta(fecha, hora);

        const botonEnviar = formPosponer.querySelector('button[type="submit"]');

        if (botonEnviar) {
            botonEnviar.disabled = true;
        }

        try {
            await guardarPropuesta(idCita, fecha, hora, justificacion);
        } catch (error) {
            avisoError(error.message);
            return;
        } finally {
            if (botonEnviar) {
                botonEnviar.disabled = false;
            }
        }

        if (modalPropuestaFecha) {
            modalPropuestaFecha.textContent = propuesta.fecha;
        }

        if (modalPropuestaHora) {
            modalPropuestaHora.textContent = propuesta.hora;
        }

        modalPropuestaEnviada.classList.add("active");
    });
}

if (btnCerrarModalPropuesta && modalPropuestaEnviada) {
    btnCerrarModalPropuesta.addEventListener("click", function () {
        modalPropuestaEnviada.classList.remove("active");
        window.location.href = "solicitudes-docente.html";
    });
}