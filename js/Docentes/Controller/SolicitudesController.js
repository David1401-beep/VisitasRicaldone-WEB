import { obtenerSolicitudes } from "../Service/SolicitudesService.js";
import { obtenerIdEmpleadoActivo } from "../Service/ApiService.js";

const tablaSolicitudesPendientesBody = document.getElementById("txtTablaSolicitudesPendientesBody");
const tablaSolicitudesAceptadasBody = document.getElementById("txtTablaSolicitudesAceptadasBody");

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const idEmpleadoSesion = await obtenerIdEmpleadoActivo();
    const solicitudes = await obtenerSolicitudes(idEmpleadoSesion);
    const solicitudesPendientes = solicitudes.filter(solicitud => solicitud.estado === "PENDIENTE");
    const solicitudesAceptadas = solicitudes.filter(solicitud => solicitud.estado === "ACEPTADA");

    mostrarSolicitudes(solicitudesPendientes);
    mostrarSolicitudesAceptadas(solicitudesAceptadas);
  } catch (error) {
    mostrarError(error.message);
  }
});

// Renderiza dinámicamente las solicitudes dentro de la tabla HTML.
function mostrarSolicitudes(listaSolicitudes) {
  if (!tablaSolicitudesPendientesBody) return;

  tablaSolicitudesPendientesBody.innerHTML = "";

  if (listaSolicitudes.length === 0) {
    tablaSolicitudesPendientesBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4">No hay solicitudes pendientes.</td>
      </tr>
    `;
    return;
  }

  listaSolicitudes.forEach(solicitud => {
    tablaSolicitudesPendientesBody.innerHTML += `
      <tr data-id-cita="${solicitud.id}">
        <td>${solicitud.padre}</td>
        <td>${solicitud.estudiante}</td>
        <td>${solicitud.codigo}</td>
        <td>${solicitud.correo}</td>
        <td><a href="revisionSolicitud-docente.html?id=${solicitud.id}" class="btn btn-warning">Revisar</a></td>
      </tr>
    `;
  });
}

// Renderiza las solicitudes que ya fueron aceptadas dentro de su propia tabla.
function mostrarSolicitudesAceptadas(listaSolicitudes) {
  if (!tablaSolicitudesAceptadasBody) return;

  tablaSolicitudesAceptadasBody.innerHTML = "";

  if (listaSolicitudes.length === 0) {
    tablaSolicitudesAceptadasBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4">No hay solicitudes aceptadas.</td>
      </tr>
    `;
    return;
  }

  listaSolicitudes.forEach(solicitud => {
    tablaSolicitudesAceptadasBody.innerHTML += `
      <tr data-id-cita="${solicitud.id}">
        <td>${solicitud.padre}</td>
        <td>${solicitud.estudiante}</td>
        <td>${solicitud.codigo}</td>
        <td>${solicitud.correo}</td>
        <td><span class="badge rounded-pill text-bg-success px-3 py-2">Aceptada</span></td>
      </tr>
    `;
  });
}

function mostrarError(mensaje) {
  const filaError = `
    <tr>
      <td colspan="5" class="text-center text-danger py-4">${mensaje}</td>
    </tr>
  `;

  if (tablaSolicitudesPendientesBody) tablaSolicitudesPendientesBody.innerHTML = filaError;
  if (tablaSolicitudesAceptadasBody) tablaSolicitudesAceptadasBody.innerHTML = filaError;
}
