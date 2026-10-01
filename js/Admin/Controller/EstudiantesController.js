import {
  correoDesdeCodigo,
  eliminarEstudiante,
  etiquetaGrado,
  guardarEstudiante,
  obtenerAcademicas,
  obtenerEstudiantePorId,
  obtenerEstudiantes,
  obtenerGrados
} from "../Service/EstudiantesService.js";
import { avisoExito, avisoError, avisoCredenciales, confirmarAccion } from "../../avisos.js";

const formEstudiante = document.getElementById("formEstudiante");
const estudianteIdInput = document.getElementById("estudianteId");
const nombreEstudianteInput = document.getElementById("nombreEstudiante");
const apellidoEstudianteInput = document.getElementById("apellidoEstudiante");
const codigoEstudianteInput = document.getElementById("codigoEstudiante");
const correoEstudianteInput = document.getElementById("correoEstudiante");
const gradoEstudianteInput = document.getElementById("gradoEstudiante");
const academicaEstudianteInput = document.getElementById("academicaEstudiante");
const contrasenaEstudianteInput = document.getElementById("contrasenaEstudiante");
const tablaEstudiantesBody = document.getElementById("tablaEstudiantesBody");
const tituloFormularioEstudiante = document.getElementById("tituloFormularioEstudiante");
const btnGuardarEstudiante = document.getElementById("btnGuardarEstudiante");
const btnCancelarEdicion = document.getElementById("btnCancelarEdicionEstudiante");
const btnRecargarEstudiantes = document.getElementById("btnRecargarEstudiantes");
const mensajeEstudiante = document.getElementById("mensajeEstudiante");
const inputBuscarEstudiante = document.getElementById("inputBuscarEstudiante");

// La lista completa se guarda para que el buscador filtre sobre ella
// sin volver a consultar la API en cada tecla.
let estudiantesCompletos = [];
let grados = [];
let academicas = [];

// Mientras el administrador no escriba el correo a mano, se arma solo
// a partir del código del estudiante.
let correoEditadoAMano = false;

function mostrarMensaje(mensaje, tipo, conAviso = true) {
  if (mensajeEstudiante) {
    mensajeEstudiante.textContent = mensaje;
    mensajeEstudiante.className = `alert alert-${tipo}`;
  }

  if (!conAviso) return;

  if (tipo === "success") {
    avisoExito(mensaje);
  } else if (tipo === "danger") {
    avisoError(mensaje);
  }
}

function crearCelda(texto) {
  const celda = document.createElement("td");
  celda.textContent = texto;
  return celda;
}

function crearBotonAccion(texto, icono, clase, accion, id) {
  const boton = document.createElement("button");
  const iconoBoton = document.createElement("i");

  boton.type = "button";
  boton.className = `btn btn-sm ${clase}`;
  boton.dataset.accion = accion;
  boton.dataset.id = id;

  iconoBoton.className = `bi ${icono}`;
  iconoBoton.setAttribute("aria-hidden", "true");

  boton.append(iconoBoton, document.createTextNode(` ${texto}`));
  return boton;
}

function buscarGrado(id) {
  return grados.find(grado => String(grado.idGrado) === String(id)) || null;
}

function buscarAcademica(id) {
  return academicas.find(academica => String(academica.idAcademica) === String(id)) || null;
}

function textoGrado(estudiante) {
  return etiquetaGrado(buscarGrado(estudiante.idGrado)) || estudiante.nombreGrado || estudiante.estGrado || "";
}

function textoSeccion(estudiante) {
  return estudiante.nombreAcademica || estudiante.estSeccion || "";
}

// Catálogos para los select

function crearOpcionVacia(texto) {
  const opcion = new Option(texto, "", true, true);
  opcion.disabled = true;
  return opcion;
}

function llenarGrados() {
  gradoEstudianteInput.innerHTML = "";
  gradoEstudianteInput.add(crearOpcionVacia(grados.length ? "Seleccionar grado" : "No hay grados registrados"));

  // Se agrupan por nivel (tercer ciclo, bachillerato...) para que la lista sea fácil de leer.
  const gradosPorNivel = new Map();

  grados.forEach(grado => {
    const nivel = grado.nombreNivel || "Sin nivel";
    if (!gradosPorNivel.has(nivel)) gradosPorNivel.set(nivel, []);
    gradosPorNivel.get(nivel).push(grado);
  });

  gradosPorNivel.forEach((lista, nivel) => {
    const grupo = document.createElement("optgroup");
    grupo.label = nivel;

    lista
      .sort((a, b) => etiquetaGrado(a).localeCompare(etiquetaGrado(b), "es", { numeric: true }))
      .forEach(grado => grupo.appendChild(new Option(etiquetaGrado(grado), grado.idGrado)));

    gradoEstudianteInput.appendChild(grupo);
  });
}

function llenarAcademicas() {
  academicaEstudianteInput.innerHTML = "";
  academicaEstudianteInput.add(crearOpcionVacia(academicas.length ? "Seleccionar sección" : "No hay secciones registradas"));

  [...academicas]
    .sort((a, b) => String(a.academica).localeCompare(String(b.academica), "es", { numeric: true }))
    .forEach(academica => academicaEstudianteInput.add(new Option(academica.academica, academica.idAcademica)));
}

async function cargarCatalogos() {
  try {
    [grados, academicas] = await Promise.all([obtenerGrados(), obtenerAcademicas()]);
  } catch (error) {
    gradoEstudianteInput.innerHTML = "";
    gradoEstudianteInput.add(crearOpcionVacia("No se pudieron cargar los grados"));
    academicaEstudianteInput.innerHTML = "";
    academicaEstudianteInput.add(crearOpcionVacia("No se pudieron cargar las secciones"));
    mostrarMensaje(error.message, "danger");
    return;
  }

  llenarGrados();
  llenarAcademicas();
}

// Lista

async function mostrarEstudiantes() {
  if (!tablaEstudiantesBody) return false;

  tablaEstudiantesBody.innerHTML = `
    <tr>
      <td colspan="7" class="text-center text-secondary py-4">Cargando estudiantes...</td>
    </tr>
  `;

  try {
    estudiantesCompletos = await obtenerEstudiantes();
  } catch (error) {
    tablaEstudiantesBody.innerHTML = "";
    const fila = document.createElement("tr");
    const celda = crearCelda(error.message);
    celda.colSpan = 7;
    celda.className = "text-center text-danger py-4";
    fila.appendChild(celda);
    tablaEstudiantesBody.appendChild(fila);
    mostrarMensaje(error.message, "danger");
    return false;
  }

  dibujarFilas(aplicarFiltro(inputBuscarEstudiante?.value || ""));
  return true;
}

function aplicarFiltro(texto) {
  const busqueda = texto.trim().toLowerCase();

  if (!busqueda) {
    return estudiantesCompletos;
  }

  return estudiantesCompletos.filter(estudiante =>
    [
      estudiante.estNombre,
      estudiante.estApellido,
      estudiante.estCorreo,
      estudiante.estCodigo,
      textoGrado(estudiante),
      textoSeccion(estudiante)
    ].some(campo => String(campo || "").toLowerCase().includes(busqueda))
  );
}

function dibujarFilas(lista) {
  tablaEstudiantesBody.innerHTML = "";

  if (lista.length === 0) {
    const filaVacia = document.createElement("tr");
    const celdaVacia = document.createElement("td");

    celdaVacia.colSpan = 7;
    celdaVacia.className = "text-center text-secondary py-4";

    celdaVacia.textContent = inputBuscarEstudiante?.value.trim()
      ? "No se encontraron coincidencias."
      : "No hay estudiantes registrados.";

    filaVacia.appendChild(celdaVacia);
    tablaEstudiantesBody.appendChild(filaVacia);
    return;
  }

  lista.forEach(estudiante => {
    const fila = document.createElement("tr");
    const celdaAcciones = document.createElement("td");
    const contenedorAcciones = document.createElement("div");

    contenedorAcciones.className = "admin-acciones";
    contenedorAcciones.append(
      crearBotonAccion("Editar", "bi-pencil-fill", "btn-warning", "editar", estudiante.idEstudiante),
      crearBotonAccion("Eliminar", "bi-trash-fill", "btn-danger", "eliminar", estudiante.idEstudiante)
    );

    celdaAcciones.appendChild(contenedorAcciones);
    fila.append(
      crearCelda(estudiante.estCodigo),
      crearCelda(estudiante.estNombre),
      crearCelda(estudiante.estApellido),
      crearCelda(estudiante.estCorreo),
      crearCelda(textoGrado(estudiante)),
      crearCelda(textoSeccion(estudiante)),
      celdaAcciones
    );

    tablaEstudiantesBody.appendChild(fila);
  });
}

// Formulario

function limpiarFormulario() {
  if (!formEstudiante) return;

  formEstudiante.reset();
  formEstudiante.classList.remove("was-validated");
  estudianteIdInput.value = "";
  correoEditadoAMano = false;
  tituloFormularioEstudiante.textContent = "Registrar estudiante";
  btnGuardarEstudiante.textContent = "Guardar";
  btnCancelarEdicion.classList.add("d-none");
}

async function editarEstudiante(id) {
  try {
    const estudiante = await obtenerEstudiantePorId(id);

    if (!estudiante) {
      mostrarMensaje("No se encontró el estudiante seleccionado.", "danger");
      return;
    }

    estudianteIdInput.value = estudiante.idEstudiante;
    nombreEstudianteInput.value = estudiante.estNombre ?? "";
    apellidoEstudianteInput.value = estudiante.estApellido ?? "";
    codigoEstudianteInput.value = estudiante.estCodigo ?? "";
    correoEstudianteInput.value = estudiante.estCorreo ?? "";
    gradoEstudianteInput.value = String(estudiante.idGrado ?? "");
    academicaEstudianteInput.value = String(estudiante.idAcademica ?? "");
    contrasenaEstudianteInput.value = "";

    // Si el correo guardado no sigue el formato del código, se respeta
    // y no se reemplaza al cambiar el código.
    correoEditadoAMano = correoEstudianteInput.value.toLowerCase() !== correoDesdeCodigo(codigoEstudianteInput.value);

    tituloFormularioEstudiante.textContent = "Editar estudiante";
    btnGuardarEstudiante.textContent = "Actualizar";
    btnCancelarEdicion.classList.remove("d-none");
    formEstudiante.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    mostrarMensaje(error.message, "danger");
  }
}

codigoEstudianteInput?.addEventListener("input", function () {
  if (!correoEditadoAMano) {
    correoEstudianteInput.value = correoDesdeCodigo(this.value);
  }
});

correoEstudianteInput?.addEventListener("input", function () {
  const correo = this.value.trim().toLowerCase();

  // Si lo deja vacío o igual al sugerido, vuelve a llenarse solo.
  correoEditadoAMano = correo !== "" && correo !== correoDesdeCodigo(codigoEstudianteInput.value);
});

formEstudiante?.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!formEstudiante.checkValidity()) {
    formEstudiante.classList.add("was-validated");
    return;
  }

  // Se guardan antes de limpiar el formulario para poder mostrarlas al final.
  const correoIngresado = correoEstudianteInput.value.trim().toLowerCase();
  const contrasenaIngresada = contrasenaEstudianteInput.value.trim();

  const textoBoton = btnGuardarEstudiante.textContent;
  btnGuardarEstudiante.disabled = true;
  btnGuardarEstudiante.textContent = "Guardando...";

  const resultado = await guardarEstudiante(
    {
      id: estudianteIdInput.value,
      nombre: nombreEstudianteInput.value,
      apellido: apellidoEstudianteInput.value,
      codigo: codigoEstudianteInput.value,
      correo: correoEstudianteInput.value,
      contrasena: contrasenaEstudianteInput.value
    },
    buscarGrado(gradoEstudianteInput.value),
    buscarAcademica(academicaEstudianteInput.value)
  );

  btnGuardarEstudiante.disabled = false;
  btnGuardarEstudiante.textContent = textoBoton;

  // Si se asignó contraseña, el aviso de éxito muestra las credenciales.
  const mostrarCredenciales = resultado.exito && Boolean(contrasenaIngresada);
  mostrarMensaje(resultado.mensaje, resultado.exito ? "success" : "danger", !mostrarCredenciales);

  if (mostrarCredenciales) {
    avisoCredenciales(correoIngresado, contrasenaIngresada, resultado.mensaje);
  }

  if (resultado.exito) {
    limpiarFormulario();
    await mostrarEstudiantes();
  }
});

tablaEstudiantesBody?.addEventListener("click", async function (e) {
  const botonAccion = e.target.closest("[data-accion]");

  if (!botonAccion) return;

  const id = botonAccion.dataset.id;

  if (botonAccion.dataset.accion === "editar") {
    await editarEstudiante(id);
    return;
  }

  if (botonAccion.dataset.accion === "eliminar") {
    const estudiante = estudiantesCompletos.find(registro => String(registro.idEstudiante) === id);
    const nombre = estudiante
      ? `${estudiante.estNombre} ${estudiante.estApellido}`
      : "este estudiante";

    const confirmado = await confirmarAccion(
      "¿Eliminar al estudiante?",
      `Se eliminará a ${nombre} del sistema. Esta acción no se puede deshacer.`,
      "Sí, eliminar"
    );

    if (!confirmado) return;

    const resultado = await eliminarEstudiante(id);
    mostrarMensaje(resultado.mensaje, resultado.exito ? "success" : "danger");

    if (resultado.exito) {
      if (estudianteIdInput.value === id) limpiarFormulario();
      await mostrarEstudiantes();
    }
  }
});

// Búsqueda
inputBuscarEstudiante?.addEventListener("input", function () {
  dibujarFilas(aplicarFiltro(this.value));
});

btnCancelarEdicion?.addEventListener("click", limpiarFormulario);

btnRecargarEstudiantes?.addEventListener("click", async function () {
  const listaActualizada = await mostrarEstudiantes();

  if (listaActualizada && mensajeEstudiante) {
    mensajeEstudiante.textContent = "Lista actualizada.";
    mensajeEstudiante.className = "alert alert-info";
  }
});

// Los grados se cargan primero para que la tabla muestre su nombre completo.
async function iniciar() {
  await cargarCatalogos();
  await mostrarEstudiantes();
}

if (tablaEstudiantesBody) iniciar();
