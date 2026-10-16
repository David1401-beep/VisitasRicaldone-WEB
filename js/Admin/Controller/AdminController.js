import {
  correoDesdeCarnet,
  eliminarEmpleado,
  etiquetaGrado,
  guardarEmpleado,
  obtenerAcademicas,
  obtenerEmpleadoPorId,
  obtenerEmpleados,
  obtenerGrados,
  obtenerSiguienteClaveDocente
} from "../Service/AdminService.js";
import { avisoExito, avisoError, avisoInfo, avisoCredenciales, confirmarAccion } from "../../avisos.js";
import { revisar, avisoValidacion, bloquearNumeros } from "../../validaciones.js";

const formEmpleado = document.getElementById("formEmpleado");
const empleadoIdInput = document.getElementById("empleadoId");
const nombreEmpleadoInput = document.getElementById("nombreEmpleado");
const apellidoEmpleadoInput = document.getElementById("apellidoEmpleado");
const claveEmpleadoInput = document.getElementById("claveEmpleado");
const contrasenaEmpleadoInput = document.getElementById("contrasenaEmpleado");
const correoEmpleadoInput = document.getElementById("correoEmpleado");
const rolEmpleadoInput = document.getElementById("rolEmpleado");
const tablaEmpleadosBody = document.getElementById("tablaEmpleadosBody");
const tituloFormularioEmpleado = document.getElementById("tituloFormularioEmpleado");
const btnGuardarEmpleado = document.getElementById("btnGuardarEmpleado");
const btnCancelarEdicion = document.getElementById("btnCancelarEdicion");
const btnRecargarEmpleados = document.getElementById("btnRecargarEmpleados");
const mensajeEmpleado = document.getElementById("mensajeEmpleado");
const inputBuscarEmpleado = document.getElementById("inputBuscarEmpleado");
const etiquetaClaveEmpleado = document.getElementById("etiquetaClaveEmpleado");
const campoClaveEmpleado = document.getElementById("campoClaveEmpleado");
const ayudaClaveEmpleado = document.getElementById("ayudaClaveEmpleado");
const camposEstudiante = document.getElementById("camposEstudiante");
const gradoEmpleadoInput = document.getElementById("gradoEmpleado");
const academicaEmpleadoInput = document.getElementById("academicaEmpleado");
const camposEncargado = document.getElementById("camposEncargado");
const nombreEncargadoInput = document.getElementById("nombreEncargado");
const apellidoEncargadoInput = document.getElementById("apellidoEncargado");
const telefonoEncargadoInput = document.getElementById("telefonoEncargado");
const tipoEncargadoInput = document.getElementById("tipoEncargado");
const campoOtroParentesco = document.getElementById("campoOtroParentesco");
const tipoEncargadoOtroInput = document.getElementById("tipoEncargadoOtro");

// La lista completa se guarda para que el buscador filtre sobre ella
// sin volver a consultar la API en cada tecla.
let personalCompleto = [];
let grados = [];
let academicas = [];
// Al editar un estudiante se espera a que los grados estén cargados para poder seleccionarlo.
let catalogosListos = Promise.resolve();

// Para estudiantes el correo se arma solo con el carnet, mientras el
// administrador no lo escriba a mano.
let correoEditadoAMano = false;

// La clave del docente que se esta editando, para volver a mostrarla si
// cambian el rol y lo regresan a docente.
let claveDelRegistro = "";

function esEstudiante() {
  return rolEmpleadoInput.value === "ESTUDIANTE";
}

function esDocente() {
  return rolEmpleadoInput.value.startsWith("DOCENTE");
}

// Que se le pide a cada campo. Al estudiante se le pide el carnet de 8
// digitos; la clave del docente no se revisa porque la pone la API.
function camposAValidar() {
  const estudiante = esEstudiante();
  const esAlta = !empleadoIdInput.value;

  const campos = [
    { el: nombreEmpleadoInput, nombre: "nombre", tipo: "letras", max: 50 },
    { el: apellidoEmpleadoInput, nombre: "apellido", tipo: "letras", max: 50 },
    { el: correoEmpleadoInput, nombre: "correo", tipo: "correo" }
  ];

  if (estudiante) {
    campos.push({ el: claveEmpleadoInput, nombre: "carnet", tipo: "carnet" });
  }

  // Al editar se deja en blanco para no cambiarla.
  campos.push({
    el: contrasenaEmpleadoInput,
    nombre: "contraseña",
    min: 6,
    opcional: !esAlta
  });

  if (estudiante && esAlta) {
    campos.push(
      { el: nombreEncargadoInput, nombre: "nombre del encargado", tipo: "letras", max: 50 },
      { el: apellidoEncargadoInput, nombre: "apellido del encargado", tipo: "letras", max: 50 },
      { el: telefonoEncargadoInput, nombre: "teléfono del encargado", tipo: "telefono" }
    );
  }

  return campos;
}

// Solo hay encargado que registrar cuando se da de alta un estudiante.
function datosDelEncargado() {
  if (!esEstudiante() || empleadoIdInput.value) {
    return null;
  }

  return {
    nombre: nombreEncargadoInput.value.trim(),
    apellido: apellidoEncargadoInput.value.trim(),
    telefono: telefonoEncargadoInput.value.trim(),
    tipo: parentescoElegido()
  };
}

// "Otro" no es un parentesco de verdad: el valor bueno esta en la segunda lista.
function parentescoElegido() {
  return tipoEncargadoInput.value === "OTRO"
    ? tipoEncargadoOtroInput.value
    : tipoEncargadoInput.value;
}

// Muestra la segunda lista solo cuando hace falta. Nunca la dejo obligatoria
// estando escondida, porque entonces el formulario no se enviaria y no se
// veria por que.
function actualizarCampoOtroParentesco() {
  const pidiendoEncargado = !camposEncargado.classList.contains("d-none");
  const esOtro = pidiendoEncargado && tipoEncargadoInput.value === "OTRO";

  campoOtroParentesco.classList.toggle("d-none", !esOtro);
  tipoEncargadoOtroInput.required = esOtro;

  if (!esOtro) {
    tipoEncargadoOtroInput.value = "";
  }
}

tipoEncargadoInput?.addEventListener("change", actualizarCampoOtroParentesco);

// El telefono solo admite digitos y el guion se pone solo, para que siempre
// salga con el formato 0000-0000 que piden la API y la base.
telefonoEncargadoInput?.addEventListener("input", function () {
  const digitos = this.value.replace(/[^0-9]/g, "").slice(0, 8);

  this.value = digitos.length > 4
    ? `${digitos.slice(0, 4)}-${digitos.slice(4)}`
    : digitos;
});

// Muestra los campos de grado y sección solo para estudiantes, y cambia
// la "clave" por el carnet.
function actualizarCamposPorRol() {
  const estudiante = esEstudiante();

  camposEstudiante?.classList.toggle("d-none", !estudiante);
  gradoEmpleadoInput.required = estudiante;
  academicaEmpleadoInput.required = estudiante;

  // El encargado solo se pide al dar de alta. Al editar un estudiante que
  // ya existe se oculta, porque su encargado ya esta registrado y volver a
  // pedirlo crearia uno repetido.
  const pedirEncargado = estudiante && !empleadoIdInput.value;

  camposEncargado?.classList.toggle("d-none", !pedirEncargado);
  nombreEncargadoInput.required = pedirEncargado;
  apellidoEncargadoInput.required = pedirEncargado;
  telefonoEncargadoInput.required = pedirEncargado;
  tipoEncargadoInput.required = pedirEncargado;
  actualizarCampoOtroParentesco();

  actualizarCampoClave();

  if (estudiante && !correoEditadoAMano && claveEmpleadoInput.value.trim()) {
    correoEmpleadoInput.value = correoDesdeCarnet(claveEmpleadoInput.value);
  }
}

// Administradores y recepcionistas no tienen identificador. El del docente
// no se escribe: se muestra el que tiene, o el que le tocara si es nuevo.
function actualizarCampoClave() {
  const estudiante = esEstudiante();
  const docente = esDocente();
  const editandoDocente = empleadoIdInput.value.startsWith("docentes:");

  campoClaveEmpleado.classList.toggle("d-none", !estudiante && !docente);
  claveEmpleadoInput.readOnly = docente;
  etiquetaClaveEmpleado.textContent = estudiante ? "Carnet" : "Identificador";

  if (estudiante) {
    claveEmpleadoInput.placeholder = "Carnet de 8 dígitos (ej. 20240087)";
    ayudaClaveEmpleado.textContent = "El correo se llena solo con el carnet.";

    // Si venia de docente, la clave DOC no sirve como carnet.
    if (/^DOC/i.test(claveEmpleadoInput.value)) {
      claveEmpleadoInput.value = "";
    }
    return;
  }

  if (!docente) return;

  claveEmpleadoInput.placeholder = "Se asigna al guardar";
  ayudaClaveEmpleado.textContent = "Se genera solo y en orden (DOC001, DOC002...).";

  if (editandoDocente) {
    claveEmpleadoInput.value = claveDelRegistro;
  } else {
    mostrarSiguienteClave();
  }
}

async function mostrarSiguienteClave() {
  claveEmpleadoInput.value = "";

  try {
    const clave = await obtenerSiguienteClaveDocente();

    // Pudieron cambiar el rol mientras llegaba la respuesta.
    if (esDocente() && !empleadoIdInput.value.startsWith("docentes:")) {
      claveEmpleadoInput.value = clave || "";
    }
  } catch (error) {
    // Si no llega, el campo queda con "Se asigna al guardar" y la API la pone igual.
  }
}

// Catálogos de grados y secciones para el estudiante

function crearOpcionVacia(texto) {
  const opcion = new Option(texto, "", true, true);
  opcion.disabled = true;
  return opcion;
}

function llenarGrados() {
  gradoEmpleadoInput.innerHTML = "";
  gradoEmpleadoInput.add(crearOpcionVacia(grados.length ? "Seleccionar grado" : "No hay grados registrados"));

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

    gradoEmpleadoInput.appendChild(grupo);
  });
}

// Tercer ciclo solo usa secciones de una letra (A a F) y bachillerato las de
// letra y numero (A1 a A5, B1 a B4).
function seccionesDelGrado(grado) {
  const nivel = String(grado.nombreNivel || "").toUpperCase();
  const nombre = academica => String(academica.academica || "").trim();

  if (nivel.includes("TERCER CICLO")) {
    return academicas.filter(academica => /^[A-Z]$/i.test(nombre(academica)));
  }

  if (nivel.includes("BACHILLERATO")) {
    return academicas.filter(academica => /^[A-Z]\d$/i.test(nombre(academica)));
  }

  return academicas;
}

// La lista de secciones depende del grado, por eso se vuelve a llenar cada
// vez que cambia. Si la seccion que estaba elegida sigue valida, se mantiene.
function llenarAcademicas() {
  const grado = buscarGrado(gradoEmpleadoInput.value);
  const anterior = academicaEmpleadoInput.value;

  academicaEmpleadoInput.innerHTML = "";

  if (!grado) {
    academicaEmpleadoInput.add(crearOpcionVacia(academicas.length ? "Primero seleccione el grado" : "No hay secciones registradas"));
    academicaEmpleadoInput.disabled = true;
    return;
  }

  const lista = seccionesDelGrado(grado);

  academicaEmpleadoInput.disabled = false;
  academicaEmpleadoInput.add(crearOpcionVacia(lista.length ? "Seleccionar sección" : "No hay secciones para este grado"));

  [...lista]
    .sort((a, b) => String(a.academica).localeCompare(String(b.academica), "es", { numeric: true }))
    .forEach(academica => academicaEmpleadoInput.add(new Option(academica.academica, academica.idAcademica)));

  if (lista.some(academica => String(academica.idAcademica) === anterior)) {
    academicaEmpleadoInput.value = anterior;
  }
}

async function cargarCatalogos() {
  if (!gradoEmpleadoInput || !academicaEmpleadoInput) return;

  try {
    [grados, academicas] = await Promise.all([obtenerGrados(), obtenerAcademicas()]);
  } catch (error) {
    gradoEmpleadoInput.innerHTML = "";
    gradoEmpleadoInput.add(crearOpcionVacia("No se pudieron cargar los grados"));
    academicaEmpleadoInput.innerHTML = "";
    academicaEmpleadoInput.add(crearOpcionVacia("No se pudieron cargar las secciones"));
    return;
  }

  llenarGrados();
  llenarAcademicas();
}

function buscarGrado(id) {
  return grados.find(grado => String(grado.idGrado) === String(id)) || null;
}

function buscarAcademica(id) {
  return academicas.find(academica => String(academica.idAcademica) === String(id)) || null;
}

function mostrarMensaje(mensaje, tipo, conAviso = true) {
  if (mensajeEmpleado) {
    mensajeEmpleado.textContent = mensaje;
    mensajeEmpleado.className = `alert alert-${tipo}`;
  }

  if (!conAviso) return;

  if (tipo === "success") {
    avisoExito(mensaje);
  } else if (tipo === "danger") {
    avisoError(mensaje);
  } else if (tipo === "warning") {
    // Se guardo a medias: el aviso tiene que verse, no solo el recuadro.
    avisoInfo(mensaje, "Revise el registro");
  }
}

function crearCelda(texto) {
  const celda = document.createElement("td");
  celda.textContent = texto;
  return celda;
}

// El correo puede partirse antes de la @ para que la tabla no se haga tan ancha.
function crearCeldaCorreo(correo) {
  const celda = document.createElement("td");
  const arroba = correo.indexOf("@");

  if (arroba > 0) {
    celda.append(correo.slice(0, arroba), document.createElement("wbr"), correo.slice(arroba));
  } else {
    celda.textContent = correo;
  }

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

async function mostrarEmpleados() {
  if (!tablaEmpleadosBody) return false;

  tablaEmpleadosBody.innerHTML = `
    <tr>
      <td colspan="5" class="text-center text-secondary py-4">Cargando personal...</td>
    </tr>
  `;

  try {
    personalCompleto = await obtenerEmpleados();
  } catch (error) {
    tablaEmpleadosBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger py-4">${error.message}</td>
      </tr>
    `;
    mostrarMensaje(error.message, "danger");
    return false;
  }

  dibujarFilas(aplicarFiltro(inputBuscarEmpleado?.value || ""));
  return true;
}


function aplicarFiltro(texto) {
  const busqueda = texto.trim().toLowerCase();

  if (!busqueda) {
    return personalCompleto;
  }

  return personalCompleto.filter(persona =>
    [persona.nombre, persona.apellido, persona.correo, persona.clave, persona.rol]
      .some(campo => String(campo || "").toLowerCase().includes(busqueda))
  );
}

function dibujarFilas(lista) {
  tablaEmpleadosBody.innerHTML = "";

  if (lista.length === 0) {
    const filaVacia = document.createElement("tr");
    const celdaVacia = document.createElement("td");

    celdaVacia.colSpan = 5;
    celdaVacia.className = "text-center text-secondary py-4";

    celdaVacia.textContent = inputBuscarEmpleado?.value.trim()
      ? "No se encontraron coincidencias."
      : "No hay personal registrado.";

    filaVacia.appendChild(celdaVacia);
    tablaEmpleadosBody.appendChild(filaVacia);
    return;
  }

  lista.forEach(empleado => {
    const fila = document.createElement("tr");
    const celdaAcciones = document.createElement("td");
    const contenedorAcciones = document.createElement("div");

    contenedorAcciones.className = "admin-acciones";
    contenedorAcciones.append(
      crearBotonAccion("Editar", "bi-pencil-fill", "btn-warning", "editar", empleado.id),
      crearBotonAccion("Eliminar", "bi-trash-fill", "btn-danger", "eliminar", empleado.id)
    );

    celdaAcciones.appendChild(contenedorAcciones);
    fila.append(
      crearCelda(`${empleado.nombre} ${empleado.apellido}`),
      crearCelda(empleado.clave),
      crearCeldaCorreo(empleado.correo),
      crearCelda(empleado.rol),
      celdaAcciones
    );

    tablaEmpleadosBody.appendChild(fila);
  });
}

function limpiarFormulario() {
  if (!formEmpleado) return;

  formEmpleado.reset();
  formEmpleado.classList.remove("was-validated");
  empleadoIdInput.value = "";
  correoEditadoAMano = false;
  claveDelRegistro = "";
  llenarAcademicas();
  actualizarCamposPorRol();
  tituloFormularioEmpleado.textContent = "Agregar o editar personal";
  btnGuardarEmpleado.textContent = "Guardar";
  btnCancelarEdicion.classList.add("d-none");
}

async function editarEmpleado(id) {
  try {
    const empleado = await obtenerEmpleadoPorId(id);

    if (!empleado) {
      mostrarMensaje("No se encontró el registro seleccionado.", "danger");
      return;
    }

    empleadoIdInput.value = empleado.id;
    nombreEmpleadoInput.value = empleado.nombre;
    apellidoEmpleadoInput.value = empleado.apellido;
    claveEmpleadoInput.value = empleado.clave;
    claveDelRegistro = empleado.clave;
    contrasenaEmpleadoInput.value = "";
    correoEmpleadoInput.value = empleado.correo;
    rolEmpleadoInput.value = empleado.rol;

    await catalogosListos;
    gradoEmpleadoInput.value = String(empleado.idGrado ?? "");
    llenarAcademicas();
    academicaEmpleadoInput.value = String(empleado.idAcademica ?? "");

    // Si el correo guardado no sigue el formato del carnet, se respeta
    // y no se reemplaza al cambiar el carnet.
    correoEditadoAMano = empleado.correo.toLowerCase() !== correoDesdeCarnet(empleado.clave);
    actualizarCamposPorRol();

    tituloFormularioEmpleado.textContent = "Editar registro";
    btnGuardarEmpleado.textContent = "Actualizar";
    btnCancelarEdicion.classList.remove("d-none");
    formEmpleado.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    mostrarMensaje(error.message, "danger");
  }
}

formEmpleado?.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!formEmpleado.checkValidity()) {
    formEmpleado.classList.add("was-validated");
    return;
  }

  const problema = revisar(camposAValidar());

  if (problema) {
    avisoValidacion(problema);
    return;
  }

  // Se guardan antes de limpiar el formulario para poder mostrarlas al final.
  const correoIngresado = correoEmpleadoInput.value.trim().toLowerCase();
  const contrasenaIngresada = contrasenaEmpleadoInput.value.trim();

  const textoBoton = btnGuardarEmpleado.textContent;
  btnGuardarEmpleado.disabled = true;
  btnGuardarEmpleado.textContent = "Guardando...";

  const resultado = await guardarEmpleado({
    id: empleadoIdInput.value,
    nombre: nombreEmpleadoInput.value,
    apellido: apellidoEmpleadoInput.value,
    clave: claveEmpleadoInput.value,
    contrasena: contrasenaEmpleadoInput.value,
    correo: correoEmpleadoInput.value,
    rol: rolEmpleadoInput.value,
    grado: esEstudiante() ? buscarGrado(gradoEmpleadoInput.value) : null,
    academica: esEstudiante() ? buscarAcademica(academicaEmpleadoInput.value) : null,
    encargado: datosDelEncargado()
  });

  btnGuardarEmpleado.disabled = false;
  btnGuardarEmpleado.textContent = textoBoton;

  // Si se asignó contraseña, el aviso de éxito muestra las credenciales.
  const mostrarCredenciales = resultado.exito && Boolean(contrasenaIngresada);
  mostrarMensaje(resultado.mensaje, resultado.tipo || (resultado.exito ? "success" : "danger"), !mostrarCredenciales);

  if (mostrarCredenciales) {
    avisoCredenciales(correoIngresado, contrasenaIngresada, resultado.mensaje);
  }

  if (resultado.exito) {
    limpiarFormulario();
    await mostrarEmpleados();
  }
});

tablaEmpleadosBody?.addEventListener("click", async function (e) {
  const botonAccion = e.target.closest("[data-accion]");

  if (!botonAccion) return;

  const id = botonAccion.dataset.id;

  if (botonAccion.dataset.accion === "editar") {
    await editarEmpleado(id);
    return;
  }

  if (botonAccion.dataset.accion === "eliminar") {

    const persona = personalCompleto.find(registro => registro.id === id);
    const nombre = persona
      ? `${persona.nombre} ${persona.apellido}`
      : "este registro";

    const confirmado = await confirmarAccion(
      "¿Eliminar el registro?",
      `Se eliminará a ${nombre} del sistema. Esta acción no se puede deshacer.`,
      "Sí, eliminar"
    );

    if (!confirmado) return;

    const resultado = await eliminarEmpleado(id);
    mostrarMensaje(resultado.mensaje, resultado.tipo || (resultado.exito ? "success" : "danger"));

    if (resultado.exito) {
      if (empleadoIdInput.value === id) limpiarFormulario();
      await mostrarEmpleados();
    }
  }
});

// Búsqueda
inputBuscarEmpleado?.addEventListener("input", function () {
  dibujarFilas(aplicarFiltro(this.value));
});

btnCancelarEdicion?.addEventListener("click", limpiarFormulario);

// En los nombres el numero ni siquiera se alcanza a escribir: se descarta
// mientras teclean, para que se entienda que ahi no van.
bloquearNumeros(
  nombreEmpleadoInput,
  apellidoEmpleadoInput,
  nombreEncargadoInput,
  apellidoEncargadoInput
);

rolEmpleadoInput?.addEventListener("change", actualizarCamposPorRol);

gradoEmpleadoInput?.addEventListener("change", llenarAcademicas);

claveEmpleadoInput?.addEventListener("input", function () {
  if (esEstudiante() && !correoEditadoAMano) {
    correoEmpleadoInput.value = correoDesdeCarnet(this.value);
  }
});

correoEmpleadoInput?.addEventListener("input", function () {
  const correo = this.value.trim().toLowerCase();

  // Si lo deja vacío o igual al sugerido, vuelve a llenarse solo con el carnet.
  correoEditadoAMano = correo !== "" && correo !== correoDesdeCarnet(claveEmpleadoInput.value);
});

btnRecargarEmpleados?.addEventListener("click", async function () {
  const listaActualizada = await mostrarEmpleados();

  if (listaActualizada && mensajeEmpleado) {
    mensajeEmpleado.textContent = "Lista actualizada.";
    mensajeEmpleado.className = "alert alert-info";
  }
});

if (tablaEmpleadosBody) {
  catalogosListos = cargarCatalogos();
  mostrarEmpleados();
}