import {
  obtenerCitas,
  obtenerEstudiantesEncargados,
  agregarCita,
  actualizarCita,
  eliminarCita,
  filtrarCitasPorEstado,
  buscarCitas,
  validarDatosCita,
  formatearFechaEspanol,
  formatearHoraAMPM,
  aceptarPropuesta,
  proponerOtraFecha
} from "../Service/GestionCitasService.js";
import { obtenerIdDocenteActivo } from "../Service/ApiService.js";

const formCita = document.getElementById("formCita");
const mensajeVacio = document.getElementById("mensajeVacio");
const tablaHistorial = document.getElementById("contenedorTablaCitas");
const cuerpoTablaCitas = document.getElementById("cuerpoTablaCitas");
const filtros = document.querySelectorAll('input[name="filtro"]');
const fechaInput = document.getElementById("fechaCita");
const estudianteEncargadoSelect = document.getElementById("idEstudianteEncargado");
const asuntoInput = document.getElementById("asuntoCita");
const descripcionInput = document.getElementById("descripcionCita");
const inputBuscar = document.getElementById("inputBuscarCita");

const modalCita = document.getElementById("modalCitaAgendada");
const btnCerrarModalCitas = document.getElementById("btn-cerrar-modal-citas");
const btnVerCitas = document.getElementById("btn-ver-citas");

let idDocenteSesion = 0;
let relacionesEnMemoria = [];

const INTERVALO_ACTUALIZACION = 15000;
let actualizacionEnCurso = false;


const RETRASO_BUSQUEDA = 350;
let temporizadorBusqueda = null;

const ESTADOS_DISPONIBLES = {
  PENDIENTE: "Pendiente",
  ACEPTADA: "Aprobado",
  POSPUESTA: "Pospuesta",
  RECHAZADA: "Rechazado",
  CANCELADA: "Cancelado",
  FINALIZADA: "Finalizado"
};

// Avisos

function avisoExito(mensaje) {
  if (window.Swal) {
    Swal.fire({
      icon: "success",
      title: "Listo",
      text: mensaje,
      timer: 1800,
      showConfirmButton: false
    });
  } else {
    alert(mensaje);
  }
}

function avisoError(mensaje) {
  if (window.Swal) {
    Swal.fire({ icon: "error", title: "Ocurrió un problema", text: mensaje });
  } else {
    alert(mensaje);
  }
}

async function confirmarAccion(titulo, mensaje, textoBoton) {
  if (!window.Swal) {
    return window.confirm(`${titulo}\n\n${mensaje}`);
  }

  const resultado = await Swal.fire({
    icon: "warning",
    title: titulo,
    text: mensaje,
    showCancelButton: true,
    confirmButtonText: textoBoton,
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    reverseButtons: true
  });

  return resultado.isConfirmed;
}

// Configuración inicial.
configurarFechaMinima();
cargarDatosIniciales();

async function cargarDatosIniciales() {
  try {
    idDocenteSesion = await obtenerIdDocenteActivo();

    const [relaciones, listaCitas] = await Promise.all([
      obtenerEstudiantesEncargados(),
      obtenerCitas(idDocenteSesion)
    ]);

    relacionesEnMemoria = relaciones;
    cargarOpcionesEstudiantes(relaciones);
    mostrarCitas(listaCitas);
    configurarActualizacionAutomatica();
  } catch (error) {
    console.error("No fue posible cargar las citas al abrir la página.", error);
    mostrarCitas([]);
  }
}

function cargarOpcionesEstudiantes(relaciones) {
  if (!estudianteEncargadoSelect) {
    return;
  }

  estudianteEncargadoSelect.innerHTML = '<option value="">Seleccione estudiante</option>';

  relaciones.forEach(relacion => {
    const opcion = document.createElement("option");
    opcion.value = relacion.idEstudianteEncargado;
    opcion.textContent = relacion.nombreEstudiante;
    opcion.dataset.nombreEstudiante = relacion.nombreEstudiante;
    opcion.dataset.idEstudiante = relacion.idEstudiante;
    estudianteEncargadoSelect.appendChild(opcion);
  });
}


// Crear

if (formCita) {
  formCita.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const datosCita = obtenerDatosFormulario();
    const resultadoValidacion = validarDatosCita(datosCita);

    if (!resultadoValidacion.valido) {
      avisoError(resultadoValidacion.mensaje);
      return;
    }

    const botonRegistrar = formCita.querySelector('button[type="submit"]');
    botonRegistrar.disabled = true;

    try {
      await agregarCita(datosCita, idDocenteSesion);
      mostrarConfirmacionCita(datosCita);

      formCita.reset();
      configurarFechaMinima();
      await actualizarHistorial();
    } catch (error) {
      avisoError(error.message);
    } finally {
      botonRegistrar.disabled = false;
    }
  });
}

function obtenerDatosFormulario() {
  const opcionEstudiante = estudianteEncargadoSelect.options[estudianteEncargadoSelect.selectedIndex];

  return {
    idEstudianteEncargado: estudianteEncargadoSelect.value,
    nombre: opcionEstudiante?.dataset.nombreEstudiante || "",
    fecha: document.getElementById("fechaCita").value,
    hora: document.getElementById("horaCita").value,
    asunto: asuntoInput.value.trim(),
    descripcion: descripcionInput.value.trim()
  };
}

function configurarFechaMinima() {
  if (!fechaInput) {
    return;
  }

  fechaInput.min = fechaDeHoy();
}

function fechaDeHoy() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function mostrarConfirmacionCita(datosCita) {
  const modalNombre = document.getElementById("modalNombreEstudiante");
  const modalDetalle = document.getElementById("modalDetalleFechaHora");
  const fechaFormateada = formatearFechaEspanol(datosCita.fecha);
  const horaFormateada = formatearHoraAMPM(datosCita.hora);

  if (modalNombre) {
    modalNombre.textContent = datosCita.nombre;
  }

  if (modalDetalle) {
    modalDetalle.textContent =
      `Sobre la convocatoria, el día ${fechaFormateada} ` +
      `a las ${horaFormateada}.`;
  }

  if (modalCita) {
    modalCita.classList.add("active");
  }
}

if (btnCerrarModalCitas && modalCita) {
  btnCerrarModalCitas.addEventListener("click", function () {
    modalCita.classList.remove("active");
  });
}

if (btnVerCitas && modalCita) {
  btnVerCitas.addEventListener("click", function () {
    modalCita.classList.remove("active");

    const botonHistorial = document.querySelector('[data-bs-target="#historialCitas"]');

    if (botonHistorial) {
      const tabHistorial = new bootstrap.Tab(botonHistorial);
      tabHistorial.show();
    }
  });
}


// Editar

async function abrirEdicion(idCita) {
  const fila = cuerpoTablaCitas.querySelector(`tr[data-id="${idCita}"]`);

  if (!fila) {
    return;
  }

  if (!window.Swal) {
    avisoError("No se pudo abrir el formulario de edición.");
    return;
  }

  const datos = fila.dataset;

  const opcionesEstudiante = relacionesEnMemoria
    .map(relacion => {
      const seleccionado = Number(relacion.idEstudianteEncargado) === Number(datos.relacion)
        ? "selected"
        : "";
      return `<option value="${relacion.idEstudianteEncargado}" ${seleccionado}>
                ${escaparHtml(relacion.nombreEstudiante)}
              </option>`;
    })
    .join("");

  const opcionesEstado = Object.entries(ESTADOS_DISPONIBLES)
    .map(([clave, texto]) => {
      const seleccionado = clave === datos.estadoApi ? "selected" : "";
      return `<option value="${clave}" ${seleccionado}>${texto}</option>`;
    })
    .join("");

  const resultado = await Swal.fire({
    title: "Editar cita",
    width: 520,
    html: `
      <div class="text-start">
        <label class="form-label mt-2">Estudiante</label>
        <select id="swalEstudiante" class="form-select">${opcionesEstudiante}</select>

        <div class="row">
          <div class="col-6">
            <label class="form-label mt-2">Fecha</label>
            <input type="date" id="swalFecha" class="form-control"
                   value="${datos.fechaCruda}">
          </div>
          <div class="col-6">
            <label class="form-label mt-2">Hora</label>
            <input type="time" id="swalHora" class="form-control" value="${datos.horaCruda}">
          </div>
        </div>

        <label class="form-label mt-2">Asunto</label>
        <input type="text" id="swalAsunto" class="form-control"
               maxlength="250" value="${escaparHtml(datos.asunto)}">

        <label class="form-label mt-2">Descripción</label>
        <textarea id="swalDescripcion" class="form-control" rows="2"
                  maxlength="300">${escaparHtml(datos.descripcion)}</textarea>

        <label class="form-label mt-2">Estado</label>
        <select id="swalEstado" class="form-select">${opcionesEstado}</select>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Guardar cambios",
    cancelButtonText: "Cancelar",
    reverseButtons: true,
    focusConfirm: false,

    preConfirm: function () {
      const valores = {
        idEstudianteEncargado: document.getElementById("swalEstudiante").value,
        fecha: document.getElementById("swalFecha").value,
        hora: document.getElementById("swalHora").value,
        asunto: document.getElementById("swalAsunto").value.trim(),
        descripcion: document.getElementById("swalDescripcion").value.trim(),
        estado: document.getElementById("swalEstado").value
      };

      if (!valores.asunto) {
        Swal.showValidationMessage("El asunto es obligatorio.");
        return false;
      }

      if (valores.asunto.length > 250) {
        Swal.showValidationMessage("El asunto no puede exceder 250 caracteres.");
        return false;
      }

      if (!valores.fecha || !valores.hora) {
        Swal.showValidationMessage("Debe indicar fecha y hora.");
        return false;
      }

      if (valores.descripcion.length > 300) {
        Swal.showValidationMessage("La descripción no puede exceder 300 caracteres.");
        return false;
      }

      return valores;
    }
  });

  if (!resultado.isConfirmed) {
    return;
  }

  try {
    await actualizarCita(idCita, resultado.value);
    await actualizarHistorial(false);
    avisoExito("La cita se actualizó correctamente.");
  } catch (error) {
    avisoError(error.message);
  }
}


// Revisar la propuesta del encargado

// Solo para ver. El docente no puede cambiar lo que mandó el encargado.
async function abrirRevisionPropuesta(idCita) {
  const fila = cuerpoTablaCitas.querySelector(`tr[data-id="${idCita}"]`);

  if (!fila || !window.Swal) {
    return;
  }

  const datos = fila.dataset;
  const fecha = formatearFechaEspanol(datos.fechaCruda);
  const hora = formatearHoraAMPM(datos.horaCruda);

  const resultado = await Swal.fire({
    title: "Propuesta del encargado",
    width: 520,
    html: `
      <div class="text-start">
        <p class="mb-2"><strong>Estudiante:</strong> ${escaparHtml(datos.estudiante)}</p>
        <p class="mb-2"><strong>Nueva fecha:</strong> ${escaparHtml(fecha)}</p>
        <p class="mb-2"><strong>Nueva hora:</strong> ${escaparHtml(hora)}</p>
        <p class="mb-2"><strong>Estado:</strong> Pospuesta</p>

        <label class="form-label mt-2"><strong>Motivo del encargado</strong></label>
        <textarea class="form-control" rows="3" readonly
                  style="background-color:#f1f1f1;">${escaparHtml(datos.motivoPropuesta || "No indicó un motivo.")}</textarea>

        <p class="text-secondary small mt-3 mb-0">
          Si no puede en esa fecha, proponga otra y el encargado la revisará.
        </p>
      </div>
    `,
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: "Aceptar propuesta",
    denyButtonText: "Proponer otra fecha",
    cancelButtonText: "Cerrar",
    confirmButtonColor: "#198754",
    denyButtonColor: "#f0ad4e",
    reverseButtons: true
  });

  if (resultado.isConfirmed) {
    try {
      await aceptarPropuesta(idCita);
      await actualizarHistorial(false);
      avisoExito("Aceptó la fecha propuesta por el encargado.");
    } catch (error) {
      avisoError(error.message);
    }
    return;
  }

  if (resultado.isDenied) {
    abrirContrapropuesta(idCita, datos.estudiante);
  }
}

// El docente manda su fecha y ahora le toca contestar al encargado.
async function abrirContrapropuesta(idCita, estudiante) {
  const resultado = await Swal.fire({
    title: "Proponer otra fecha",
    width: 520,
    html: `
      <div class="text-start">
        <p class="mb-3"><strong>Estudiante:</strong> ${escaparHtml(estudiante)}</p>

        <div class="row">
          <div class="col-6">
            <label class="form-label">Fecha</label>
            <input type="date" id="swalNuevaFecha" class="form-control" min="${fechaDeHoy()}">
          </div>
          <div class="col-6">
            <label class="form-label">Hora</label>
            <input type="time" id="swalNuevaHora" class="form-control">
          </div>
        </div>

        <label class="form-label mt-2">Motivo</label>
        <textarea id="swalMotivo" class="form-control" rows="3" maxlength="250"
                  placeholder="Explique por qué no puede en la fecha propuesta."></textarea>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Enviar propuesta",
    cancelButtonText: "Cancelar",
    reverseButtons: true,
    focusConfirm: false,

    preConfirm: function () {
      const valores = {
        fecha: document.getElementById("swalNuevaFecha").value,
        hora: document.getElementById("swalNuevaHora").value,
        motivo: document.getElementById("swalMotivo").value.trim()
      };

      if (!valores.fecha || !valores.hora) {
        Swal.showValidationMessage("Debe indicar la nueva fecha y hora.");
        return false;
      }

      if (new Date(`${valores.fecha}T${valores.hora}:00`) <= new Date()) {
        Swal.showValidationMessage("La fecha y hora deben ser futuras.");
        return false;
      }

      if (!valores.motivo) {
        Swal.showValidationMessage("Debe explicar por qué propone otra fecha.");
        return false;
      }

      return valores;
    }
  });

  if (!resultado.isConfirmed) {
    return;
  }

  try {
    await proponerOtraFecha(
      idCita, resultado.value.fecha, resultado.value.hora, resultado.value.motivo
    );
    await actualizarHistorial(false);
    avisoExito("Se envió su propuesta al encargado.");
  } catch (error) {
    avisoError(error.message);
  }
}


// Eliminar

async function confirmarEliminacion(idCita) {
  const fila = cuerpoTablaCitas.querySelector(`tr[data-id="${idCita}"]`);
  const estudiante = fila?.dataset.estudiante || "esta cita";

  const confirmado = await confirmarAccion(
    "¿Eliminar la cita?",
    `Se eliminará la cita de ${estudiante}. Esta acción no se puede deshacer.`,
    "Sí, eliminar"
  );

  if (!confirmado) {
    return;
  }

  try {
    await eliminarCita(idCita);
    await actualizarHistorial(false);
    avisoExito("La cita se eliminó correctamente.");
  } catch (error) {
    avisoError(error.message);
  }
}


// Filtro por estado

filtros.forEach(filtro => {
  filtro.addEventListener("change", function () {
    if (inputBuscar) {
      inputBuscar.value = "";
    }

    mostrarCitas(filtrarCitasPorEstado(this.value));
  });
});


// Búsqueda

if (inputBuscar) {
  inputBuscar.addEventListener("input", function () {
    clearTimeout(temporizadorBusqueda);

    const texto = this.value.trim();

    temporizadorBusqueda = setTimeout(async function () {
      try {
        mostrarCitas(await buscarCitas(idDocenteSesion, texto));

        const filtroTodos = document.getElementById("filtroHistorial");

        if (texto && filtroTodos) {
          filtroTodos.checked = true;
        }
      } catch (error) {
        console.error("No fue posible realizar la búsqueda.", error);
        mostrarCitas([]);
      }
    }, RETRASO_BUSQUEDA);
  });
}


// Sincronización automática

async function actualizarHistorial(mostrarError = true) {
  if (actualizacionEnCurso || !idDocenteSesion) {
    return;
  }


  if (inputBuscar && inputBuscar.value.trim()) {
    return;
  }

  actualizacionEnCurso = true;

  try {
    await obtenerCitas(idDocenteSesion);
    const filtroActivo = document.querySelector('input[name="filtro"]:checked')?.value || "Todos";
    mostrarCitas(filtrarCitasPorEstado(filtroActivo));
  } catch (error) {
    if (mostrarError) {
      avisoError(error.message);
    } else {
      console.error("No fue posible actualizar el historial de citas.", error);
    }
  } finally {
    actualizacionEnCurso = false;
  }
}

function configurarActualizacionAutomatica() {
  window.addEventListener("focus", () => actualizarHistorial(false));

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      actualizarHistorial(false);
    }
  });

  window.setInterval(() => {
    if (!document.hidden) {
      actualizarHistorial(false);
    }
  }, INTERVALO_ACTUALIZACION);
}


// Render de la tabla

function mostrarCitas(listaCitas) {
  cuerpoTablaCitas.innerHTML = "";

  if (listaCitas.length === 0) {
    mostrarMensajeVacio();
    tablaHistorial.style.display = "none";
    return;
  }

  if (mensajeVacio) {
    mensajeVacio.style.display = "none";
  }

  tablaHistorial.style.display = "block";

  listaCitas.forEach(cita => {
    cuerpoTablaCitas.innerHTML += `
      <tr data-id="${cita.idCita}"
          data-relacion="${cita.idEstudianteEncargado}"
          data-fecha-cruda="${cita.fechaCruda || ""}"
          data-hora-cruda="${cita.horaCruda || ""}"
          data-asunto="${escaparHtml(cita.asunto)}"
          data-descripcion="${escaparHtml(cita.descripcion)}"
          data-estado-api="${cita.estadoApi || ""}"
          data-propuesta-de="${cita.propuestaDe || ""}"
          data-motivo-propuesta="${escaparHtml(cita.motivoPropuesta)}"
          data-estudiante="${escaparHtml(cita.estudiante)}">
        <td>${escaparHtml(cita.fecha)}</td>
        <td>${escaparHtml(cita.hora)}</td>
        <td>${escaparHtml(cita.estudiante)}</td>
        <td>${escaparHtml(cita.asunto)}</td>
        <td>
          <span class="estado-cita estado-${escaparHtml(cita.estado.toLowerCase())}">
            ${escaparHtml(cita.estado)}
          </span>
          ${etiquetaDeTurno(cita)}
        </td>
        <td>${accionesDeFila(cita)}</td>
      </tr>
    `;
  });
}

// El encargado mandó otra fecha y el docente todavía no contesta.
function esperaRespuestaDelDocente(cita) {
  return cita.estadoApi === "POSPUESTA" && cita.propuestaDe === "ENCARGADO";
}

// Avisa a quién le toca mientras se ponen de acuerdo en la fecha.
function etiquetaDeTurno(cita) {
  if (esperaRespuestaDelDocente(cita)) {
    return '<div class="turno-cita turno-docente">Debe revisar la propuesta</div>';
  }

  if (cita.estadoApi === "PENDIENTE" && cita.propuestaDe === "DOCENTE") {
    return '<div class="turno-cita turno-encargado">Esperando al encargado</div>';
  }

  return "";
}

// Si el encargado mandó una fecha, lo único que se puede hacer es
// revisarla. No tiene sentido editar ni borrar lo que él mandó.
function accionesDeFila(cita) {
  if (esperaRespuestaDelDocente(cita)) {
    return `
      <button type="button" class="btn btn-sm btn-outline-warning btn-revisar-propuesta"
              title="Revisar propuesta" aria-label="Revisar propuesta">
        <i class="bi bi-calendar2-check"></i> Revisar
      </button>
    `;
  }

  return `
    <button type="button" class="btn btn-sm btn-outline-primary me-1 btn-editar-cita"
            title="Editar cita" aria-label="Editar cita">
      <i class="bi bi-pencil-square"></i>
    </button>
    <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-cita"
            title="Eliminar cita" aria-label="Eliminar cita">
      <i class="bi bi-trash"></i>
    </button>
  `;
}

function mostrarMensajeVacio() {
  if (!mensajeVacio) {
    return;
  }

  const hayBusqueda = inputBuscar && inputBuscar.value.trim();
  const parrafo = mensajeVacio.querySelector("p");
  const subtitulo = mensajeVacio.querySelector("h4");

  if (parrafo) {
    parrafo.textContent = hayBusqueda
      ? "No se encontraron coincidencias"
      : "No hay citas registradas";
  }

  if (subtitulo) {
    subtitulo.textContent = hayBusqueda
      ? "Pruebe con otro nombre o asunto"
      : "Registre una nueva cita para comenzar";
  }

  mensajeVacio.style.display = "block";
}


// Acciones de la tabla

if (cuerpoTablaCitas) {
  cuerpoTablaCitas.addEventListener("click", function (evento) {
    const botonEditar = evento.target.closest(".btn-editar-cita");
    const botonEliminar = evento.target.closest(".btn-eliminar-cita");
    const botonRevisar = evento.target.closest(".btn-revisar-propuesta");

    if (!botonEditar && !botonEliminar && !botonRevisar) {
      return;
    }

    const idCita = evento.target.closest("tr")?.dataset.id;

    if (!idCita) {
      return;
    }

    if (botonRevisar) {
      abrirRevisionPropuesta(idCita);
    } else if (botonEditar) {
      abrirEdicion(idCita);
    } else {
      confirmarEliminacion(idCita);
    }
  });
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}