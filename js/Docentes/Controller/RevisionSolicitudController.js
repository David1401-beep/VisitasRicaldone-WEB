import {
  aceptarSolicitud,
  rechazarSolicitud,
  obtenerDetalleSolicitud
} from "../Service/RevisionSolicitudService.js";
import { avisoError, avisoExito, confirmarAccion } from "../../avisos.js";

const parametros = new URLSearchParams(window.location.search);
const idCita = Number(parametros.get("id"));
const btnAceptarSolicitud = document.getElementById("btnAceptarSolicitud");
const btnPosponerSolicitud = document.getElementById("btnPosponerSolicitud");
const btnRechazarSolicitud = document.getElementById("btnRechazarSolicitud");
const modalSolicitudAceptada = document.getElementById("modalSolicitudAceptada");
const btnCerrarModal = document.getElementById("btnCerrarModal");

let detalleSolicitud = null;

btnAceptarSolicitud?.classList.add("disabled");

document.addEventListener("DOMContentLoaded", cargarSolicitud);

async function cargarSolicitud() {
  if (!idCita) {
    avisoError("No se recibió el ID de la solicitud.");

    setTimeout(() => window.location.replace("solicitudes-docente.html"), 2000);
    return;
  }

  try {
    detalleSolicitud = await obtenerDetalleSolicitud(idCita);
    mostrarDetalle(detalleSolicitud);

    if (btnPosponerSolicitud) {
      btnPosponerSolicitud.href = `posponer-docente.html?id=${idCita}`;
    }

    btnAceptarSolicitud?.classList.remove("disabled");
  } catch (error) {
    console.error("No fue posible cargar el detalle de la solicitud.", error);
    avisoError(error.message, "No se pudo cargar la solicitud");
  }
}

function mostrarDetalle(detalle) {
  escribir("tituloRevisionSolicitud", `Revisión de Detalles de Solicitud: ${detalle.solicitante}`);
  escribir("detalleNombreEstudiante", detalle.estudiante);
  escribir("detalleCorreoEstudiante", detalle.correo);
  escribir("detalleCodigoEstudiante", detalle.codigo);
  escribir("detalleFechaOriginal", detalle.fecha);
  escribir("detalleMotivoSolicitud", detalle.motivo);
  escribir("detalleHoraSolicitada", detalle.hora);
}

function escribir(id, valor) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = valor;
  }
}

// Aceptar
if (btnAceptarSolicitud && modalSolicitudAceptada) {
  btnAceptarSolicitud.addEventListener("click", async function (e) {
    e.preventDefault();
    btnAceptarSolicitud.classList.add("disabled");

    try {
      const resultado = await aceptarSolicitud(idCita);

      if (resultado.exito) {
        escribir("modalSolicitudPersonas",
          `${detalleSolicitud.estudiante} y su encargado ${detalleSolicitud.solicitante} serán notificados`);
        escribir("modalSolicitudFecha",
          `Reunión programada para el ${detalleSolicitud.fecha} a las ${detalleSolicitud.hora}`);

        modalSolicitudAceptada.classList.add("active");
      }
    } catch (error) {
      avisoError(error.message);
      btnAceptarSolicitud.classList.remove("disabled");
    }
  });
}

// Rechazar
if (btnRechazarSolicitud) {
  btnRechazarSolicitud.addEventListener("click", async function (e) {
    e.preventDefault();

    const confirmado = await confirmarAccion(
      "¿Rechazar la solicitud?",
      "El encargado verá que la reunión no fue aceptada.",
      "Sí, rechazar"
    );

    if (!confirmado) {
      return;
    }

    let motivo = "";

    if (window.Swal) {
      const respuesta = await Swal.fire({
        title: "Motivo del rechazo",
        input: "textarea",
        inputPlaceholder: "Explique brevemente por qué no puede atender la reunión...",
        inputAttributes: { maxlength: 250 },
        showCancelButton: true,
        confirmButtonText: "Enviar",
        cancelButtonText: "Cancelar",
        reverseButtons: true
      });

      if (!respuesta.isConfirmed) {
        return;
      }

      motivo = respuesta.value || "";
    }

    btnRechazarSolicitud.classList.add("disabled");

    try {
      await rechazarSolicitud(idCita, motivo);
      avisoExito("La solicitud fue rechazada.");
      setTimeout(() => window.location.href = "solicitudes-docente.html", 1800);
    } catch (error) {
      avisoError(error.message);
      btnRechazarSolicitud.classList.remove("disabled");
    }
  });
}

// Cierre del modal
if (btnCerrarModal && modalSolicitudAceptada) {
  btnCerrarModal.addEventListener("click", function () {
    modalSolicitudAceptada.classList.remove("active");
    window.location.href = "solicitudes-docente.html";
  });
}