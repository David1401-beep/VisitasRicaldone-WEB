import {
  obtenerEspecialidades, guardarEspecialidad, eliminarEspecialidad,
  obtenerMaterias, guardarMateria, eliminarMateria,
  obtenerSecciones, guardarSeccion, eliminarSeccion,
  obtenerAsignaciones, obtenerDocentesParaAsignar, asignarMateria, quitarAsignacion
} from "../Service/CatalogosService.js";
import { avisoExito, avisoError, confirmarAccion } from "../../avisos.js";
import { revisar, avisoValidacion } from "../../validaciones.js";

function mostrarMensaje(elemento, mensaje, tipo) {
  if (elemento) {
    elemento.textContent = mensaje;
    elemento.className = `alert alert-${tipo}`;
  }

  if (tipo === "success") {
    avisoExito(mensaje);
  } else if (tipo === "danger") {
    avisoError(mensaje);
  }
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

function crearCelda(texto) {
  const celda = document.createElement("td");
  celda.textContent = texto;
  return celda;
}

// ---------------------------------------------------------------
// ESPECIALIDADES
// ---------------------------------------------------------------
(function iniciarEspecialidades() {
  const form = document.getElementById("formEspecialidad");
  const idInput = document.getElementById("especialidadId");
  const nombreInput = document.getElementById("nombreEspecialidad");
  const tabla = document.getElementById("tablaEspecialidadesBody");
  const titulo = document.getElementById("tituloFormularioEspecialidad");
  const btnGuardar = document.getElementById("btnGuardarEspecialidad");
  const btnCancelar = document.getElementById("btnCancelarEspecialidad");
  const btnRecargar = document.getElementById("btnRecargarEspecialidades");
  const mensaje = document.getElementById("mensajeEspecialidad");

  if (!form || !tabla) return;

  let lista = [];

  async function cargar() {
    tabla.innerHTML = `<tr><td colspan="2" class="text-center text-secondary py-4">Cargando...</td></tr>`;

    try {
      lista = await obtenerEspecialidades();
    } catch (error) {
      tabla.innerHTML = `<tr><td colspan="2" class="text-center text-danger py-4">${error.message}</td></tr>`;
      return;
    }

    dibujar();
  }

  function dibujar() {
    tabla.innerHTML = "";

    if (lista.length === 0) {
      tabla.innerHTML = `<tr><td colspan="2" class="text-center text-secondary py-4">No hay especialidades registradas.</td></tr>`;
      return;
    }

    lista.forEach(item => {
      const fila = document.createElement("tr");
      const celdaAcciones = document.createElement("td");
      const contenedor = document.createElement("div");

      contenedor.className = "admin-acciones";
      contenedor.append(
        crearBotonAccion("Editar", "bi-pencil-fill", "btn-warning", "editar", item.idEspecialidad),
        crearBotonAccion("Eliminar", "bi-trash-fill", "btn-danger", "eliminar", item.idEspecialidad)
      );
      celdaAcciones.appendChild(contenedor);

      fila.append(crearCelda(item.especialidad), celdaAcciones);
      tabla.appendChild(fila);
    });
  }

  function limpiar() {
    form.reset();
    form.classList.remove("was-validated");
    idInput.value = "";
    titulo.textContent = "Agregar o editar especialidad";
    btnGuardar.textContent = "Guardar";
    btnCancelar.classList.add("d-none");
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    // El nombre de una especialidad son palabras, no lleva numeros.
    const problema = revisar([
      { el: nombreInput, nombre: "nombre de la especialidad", tipo: "letras", min: 3, max: 60 }
    ]);

    if (problema) {
      avisoValidacion(problema);
      return;
    }

    btnGuardar.disabled = true;
    const resultado = await guardarEspecialidad(idInput.value, nombreInput.value);
    btnGuardar.disabled = false;

    mostrarMensaje(mensaje, resultado.mensaje, resultado.exito ? "success" : "danger");

    if (resultado.exito) {
      limpiar();
      await cargar();
    }
  });

  tabla.addEventListener("click", async function (e) {
    const boton = e.target.closest("[data-accion]");
    if (!boton) return;

    const id = boton.dataset.id;

    if (boton.dataset.accion === "editar") {
      const item = lista.find(registro => String(registro.idEspecialidad) === String(id));
      if (!item) return;

      idInput.value = item.idEspecialidad;
      nombreInput.value = item.especialidad;
      titulo.textContent = "Editar especialidad";
      btnGuardar.textContent = "Actualizar";
      btnCancelar.classList.remove("d-none");
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (boton.dataset.accion === "eliminar") {
      const item = lista.find(registro => String(registro.idEspecialidad) === String(id));
      const confirmado = await confirmarAccion(
        "¿Eliminar la especialidad?",
        `Se eliminará "${item?.especialidad || "este registro"}". Esta acción no se puede deshacer.`,
        "Sí, eliminar"
      );
      if (!confirmado) return;

      const resultado = await eliminarEspecialidad(id);
      mostrarMensaje(mensaje, resultado.mensaje, resultado.exito ? "success" : "danger");

      if (resultado.exito) {
        if (idInput.value === id) limpiar();
        await cargar();
      }
    }
  });

  btnCancelar?.addEventListener("click", limpiar);
  btnRecargar?.addEventListener("click", cargar);

  cargar();
})();

// ---------------------------------------------------------------
// MATERIAS
// ---------------------------------------------------------------
(function iniciarMaterias() {
  const form = document.getElementById("formMateria");
  const idInput = document.getElementById("materiaId");
  const nombreInput = document.getElementById("nombreMateria");
  const tipoInput = document.getElementById("tipoMateria");
  const tabla = document.getElementById("tablaMateriasBody");
  const titulo = document.getElementById("tituloFormularioMateria");
  const btnGuardar = document.getElementById("btnGuardarMateria");
  const btnCancelar = document.getElementById("btnCancelarMateria");
  const btnRecargar = document.getElementById("btnRecargarMaterias");
  const mensaje = document.getElementById("mensajeMateria");

  if (!form || !tabla) return;

  const NOMBRES_TIPO = { ACADEMICA: "Académica", TECNICA: "Técnica" };
  let lista = [];

  async function cargar() {
    tabla.innerHTML = `<tr><td colspan="3" class="text-center text-secondary py-4">Cargando...</td></tr>`;

    try {
      lista = await obtenerMaterias();
    } catch (error) {
      tabla.innerHTML = `<tr><td colspan="3" class="text-center text-danger py-4">${error.message}</td></tr>`;
      return;
    }

    dibujar();
  }

  function dibujar() {
    tabla.innerHTML = "";

    if (lista.length === 0) {
      tabla.innerHTML = `<tr><td colspan="3" class="text-center text-secondary py-4">No hay materias registradas.</td></tr>`;
      return;
    }

    lista.forEach(item => {
      const fila = document.createElement("tr");
      const celdaAcciones = document.createElement("td");
      const contenedor = document.createElement("div");

      contenedor.className = "admin-acciones";
      contenedor.append(
        crearBotonAccion("Editar", "bi-pencil-fill", "btn-warning", "editar", item.idMateria),
        crearBotonAccion("Eliminar", "bi-trash-fill", "btn-danger", "eliminar", item.idMateria)
      );
      celdaAcciones.appendChild(contenedor);

      fila.append(
        crearCelda(item.matNombre),
        crearCelda(NOMBRES_TIPO[item.matTipo] || item.matTipo),
        celdaAcciones
      );
      tabla.appendChild(fila);
    });
  }

  function limpiar() {
    form.reset();
    form.classList.remove("was-validated");
    idInput.value = "";
    titulo.textContent = "Agregar o editar materia";
    btnGuardar.textContent = "Guardar";
    btnCancelar.classList.add("d-none");
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    btnGuardar.disabled = true;
    // Una materia puede llevar numero ("Taller 1"), pero no ser solo numeros.
    const problema = revisar([
      { el: nombreInput, nombre: "nombre de la materia", tipo: "texto", min: 3, max: 60 }
    ]);

    if (problema) {
      avisoValidacion(problema);
      return;
    }

    const resultado = await guardarMateria(idInput.value, nombreInput.value, tipoInput.value);
    btnGuardar.disabled = false;

    mostrarMensaje(mensaje, resultado.mensaje, resultado.exito ? "success" : "danger");

    if (resultado.exito) {
      limpiar();
      await cargar();
    }
  });

  tabla.addEventListener("click", async function (e) {
    const boton = e.target.closest("[data-accion]");
    if (!boton) return;

    const id = boton.dataset.id;

    if (boton.dataset.accion === "editar") {
      const item = lista.find(registro => String(registro.idMateria) === String(id));
      if (!item) return;

      idInput.value = item.idMateria;
      nombreInput.value = item.matNombre;
      tipoInput.value = item.matTipo;
      titulo.textContent = "Editar materia";
      btnGuardar.textContent = "Actualizar";
      btnCancelar.classList.remove("d-none");
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (boton.dataset.accion === "eliminar") {
      const item = lista.find(registro => String(registro.idMateria) === String(id));
      const confirmado = await confirmarAccion(
        "¿Eliminar la materia?",
        `Se eliminará "${item?.matNombre || "este registro"}". Esta acción no se puede deshacer.`,
        "Sí, eliminar"
      );
      if (!confirmado) return;

      const resultado = await eliminarMateria(id);
      mostrarMensaje(mensaje, resultado.mensaje, resultado.exito ? "success" : "danger");

      if (resultado.exito) {
        if (idInput.value === id) limpiar();
        await cargar();
      }
    }
  });

  btnCancelar?.addEventListener("click", limpiar);
  btnRecargar?.addEventListener("click", cargar);

  cargar();
})();

// ---------------------------------------------------------------
// SECCIONES
// ---------------------------------------------------------------
(function iniciarSecciones() {
  const form = document.getElementById("formSeccion");
  const idInput = document.getElementById("seccionId");
  const nombreInput = document.getElementById("nombreSeccion");
  const tabla = document.getElementById("tablaSeccionesBody");
  const titulo = document.getElementById("tituloFormularioSeccion");
  const btnGuardar = document.getElementById("btnGuardarSeccion");
  const btnCancelar = document.getElementById("btnCancelarSeccion");
  const btnRecargar = document.getElementById("btnRecargarSecciones");
  const mensaje = document.getElementById("mensajeSeccion");

  if (!form || !tabla) return;

  let lista = [];

  // Se escribe siempre en mayuscula y solo con letras y numeros.
  nombreInput.addEventListener("input", function () {
    const limpio = this.value.toUpperCase().replace(/[^A-Z0-9]/g, "");

    if (limpio !== this.value) {
      this.value = limpio;
    }
  });

  async function cargar() {
    tabla.innerHTML = `<tr><td colspan="2" class="text-center text-secondary py-4">Cargando...</td></tr>`;

    try {
      lista = await obtenerSecciones();
    } catch (error) {
      tabla.innerHTML = `<tr><td colspan="2" class="text-center text-danger py-4">${error.message}</td></tr>`;
      return;
    }

    dibujar();
  }

  function dibujar() {
    tabla.innerHTML = "";

    if (lista.length === 0) {
      tabla.innerHTML = `<tr><td colspan="2" class="text-center text-secondary py-4">No hay secciones registradas.</td></tr>`;
      return;
    }

    lista.forEach(item => {
      const fila = document.createElement("tr");
      const celdaAcciones = document.createElement("td");
      const contenedor = document.createElement("div");

      contenedor.className = "admin-acciones";
      contenedor.append(
        crearBotonAccion("Editar", "bi-pencil-fill", "btn-warning", "editar", item.idAcademica),
        crearBotonAccion("Eliminar", "bi-trash-fill", "btn-danger", "eliminar", item.idAcademica)
      );
      celdaAcciones.appendChild(contenedor);

      fila.append(crearCelda(item.academica), celdaAcciones);
      tabla.appendChild(fila);
    });
  }

  function limpiar() {
    form.reset();
    form.classList.remove("was-validated");
    idInput.value = "";
    titulo.textContent = "Agregar o editar sección";
    btnGuardar.textContent = "Guardar";
    btnCancelar.classList.add("d-none");
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    // Una letra para tercer ciclo (A, G...) o letra y numero para
    // bachillerato (A1, B5...). Es el mismo formato que revisa la API.
    const problema = revisar([
      { el: nombreInput, nombre: "nombre de la sección", tipo: "texto", max: 2 }
    ]) || (!/^[A-Z][0-9]?$/.test(nombreInput.value.trim())
      ? { el: nombreInput, mensaje: "La sección debe ser una letra o una letra con un número (ej. G o B5)." }
      : null);

    if (problema) {
      avisoValidacion(problema);
      return;
    }

    btnGuardar.disabled = true;
    const resultado = await guardarSeccion(idInput.value, nombreInput.value);
    btnGuardar.disabled = false;

    mostrarMensaje(mensaje, resultado.mensaje, resultado.exito ? "success" : "danger");

    if (resultado.exito) {
      limpiar();
      await cargar();
    }
  });

  tabla.addEventListener("click", async function (e) {
    const boton = e.target.closest("[data-accion]");
    if (!boton) return;

    const id = boton.dataset.id;
    const item = lista.find(registro => String(registro.idAcademica) === String(id));

    if (boton.dataset.accion === "editar") {
      if (!item) return;

      idInput.value = item.idAcademica;
      nombreInput.value = item.academica;
      titulo.textContent = "Editar sección";
      btnGuardar.textContent = "Actualizar";
      btnCancelar.classList.remove("d-none");
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (boton.dataset.accion === "eliminar") {
      const confirmado = await confirmarAccion(
        "¿Eliminar la sección?",
        `Se eliminará "${item?.academica || "este registro"}". Esta acción no se puede deshacer.`,
        "Sí, eliminar"
      );
      if (!confirmado) return;

      const resultado = await eliminarSeccion(id);
      mostrarMensaje(mensaje, resultado.mensaje, resultado.exito ? "success" : "danger");

      if (resultado.exito) {
        if (idInput.value === id) limpiar();
        await cargar();
      }
    }
  });

  btnCancelar?.addEventListener("click", limpiar);
  btnRecargar?.addEventListener("click", cargar);

  cargar();
})();

// ---------------------------------------------------------------
// MATERIAS POR DOCENTE
// ---------------------------------------------------------------
(function iniciarAsignaciones() {
  const form = document.getElementById("formAsignacion");
  const docenteInput = document.getElementById("docenteAsignacion");
  const materiaInput = document.getElementById("materiaAsignacion");
  const tabla = document.getElementById("tablaAsignacionesBody");
  const btnGuardar = document.getElementById("btnGuardarAsignacion");
  const btnRecargar = document.getElementById("btnRecargarAsignaciones");
  const mensaje = document.getElementById("mensajeAsignacion");

  if (!form || !tabla) return;

  let lista = [];
  let docentes = [];
  let materias = [];

  function llenarSelect(select, opciones, textoVacio, textoSinRegistros = "No hay registros") {
    select.innerHTML = "";

    const vacia = new Option(opciones.length ? textoVacio : textoSinRegistros, "");
    vacia.disabled = true;
    vacia.selected = true;
    select.add(vacia);

    opciones.forEach(opcion => select.add(new Option(opcion.texto, opcion.valor)));
  }

  // El docente tecnico solo da materias tecnicas y el academico solo
  // academicas, asi que la lista de materias depende del docente elegido.
  function tipoDeMateriaPara(idDocente) {
    const docente = docentes.find(d => String(d.idDocente) === String(idDocente));
    const tipo = (docente?.tipo || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

    if (tipo.includes("TECNICO")) return "TECNICA";
    if (tipo.includes("ACADEMICO")) return "ACADEMICA";
    return null;
  }

  function llenarMaterias() {
    const tipo = tipoDeMateriaPara(docenteInput.value);

    if (!tipo) {
      llenarSelect(materiaInput, [], "", "Primero seleccione el docente");
      materiaInput.disabled = true;
      return;
    }

    const delTipo = materias
      .filter(m => m.matTipo === tipo)
      .map(m => ({ texto: m.matNombre, valor: m.idMateria }));

    materiaInput.disabled = false;
    llenarSelect(
      materiaInput,
      delTipo,
      tipo === "TECNICA" ? "Seleccionar materia técnica" : "Seleccionar materia académica",
      tipo === "TECNICA" ? "No hay materias técnicas registradas" : "No hay materias académicas registradas"
    );
  }

  async function cargarListas() {
    try {
      [docentes, materias] = await Promise.all([
        obtenerDocentesParaAsignar(),
        obtenerMaterias()
      ]);

      llenarSelect(
        docenteInput,
        docentes.map(d => ({ texto: d.nombre, valor: d.idDocente })),
        "Seleccionar docente"
      );

      llenarMaterias();

      // Si la tabla llego antes que los docentes, se vuelve a dibujar con el tipo.
      if (lista.length) dibujar();
    } catch (error) {
      mostrarMensaje(mensaje, error.message, "danger");
    }
  }

  docenteInput.addEventListener("change", llenarMaterias);

  async function cargar() {
    tabla.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-4">Cargando...</td></tr>`;

    try {
      lista = await obtenerAsignaciones();
    } catch (error) {
      tabla.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-4">${error.message}</td></tr>`;
      return;
    }

    dibujar();
  }

  // El tipo sale de la lista de docentes que ya se cargo para el formulario.
  function crearCeldaTipo(idDocente) {
    const celda = document.createElement("td");
    const tipo = tipoDeMateriaPara(idDocente);

    if (!tipo) {
      celda.textContent = docentes.length ? "Sin tipo" : "...";
      return celda;
    }

    const etiqueta = document.createElement("span");
    etiqueta.className = `tipo-docente ${tipo === "TECNICA" ? "tipo-tecnico" : "tipo-academico"}`;
    etiqueta.textContent = tipo === "TECNICA" ? "Técnico" : "Académico";
    celda.appendChild(etiqueta);
    return celda;
  }

  function dibujar() {
    tabla.innerHTML = "";

    if (lista.length === 0) {
      tabla.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-4">No hay materias asignadas.</td></tr>`;
      return;
    }

    lista.forEach(item => {
      const fila = document.createElement("tr");
      const celdaAcciones = document.createElement("td");
      const contenedor = document.createElement("div");

      contenedor.className = "admin-acciones";
      contenedor.appendChild(
        crearBotonAccion("Quitar", "bi-trash-fill", "btn-danger", "eliminar", item.idMateriaDocente)
      );
      celdaAcciones.appendChild(contenedor);

      fila.append(
        crearCelda(item.nombreDocente || "Docente"),
        crearCeldaTipo(item.idDocente),
        crearCelda(item.nombreMateria || "Materia"),
        celdaAcciones
      );
      tabla.appendChild(fila);
    });
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    // Lo unico prohibido es repetir el mismo par: la misma materia en otro
    // docente si se permite, que es justo lo que se pidio.
    const repetida = lista.some(item =>
      String(item.idDocente) === String(docenteInput.value) &&
      String(item.idMateria) === String(materiaInput.value)
    );

    if (repetida) {
      mostrarMensaje(mensaje, "Ese docente ya tiene asignada esa materia.", "danger");
      return;
    }

    btnGuardar.disabled = true;
    const resultado = await asignarMateria(docenteInput.value, materiaInput.value);
    btnGuardar.disabled = false;

    mostrarMensaje(mensaje, resultado.mensaje, resultado.exito ? "success" : "danger");

    if (resultado.exito) {
      form.reset();
      form.classList.remove("was-validated");
      llenarMaterias();
      await cargar();
    }
  });

  tabla.addEventListener("click", async function (e) {
    const boton = e.target.closest("[data-accion]");
    if (!boton || boton.dataset.accion !== "eliminar") return;

    const id = boton.dataset.id;
    const item = lista.find(registro => String(registro.idMateriaDocente) === String(id));

    const confirmado = await confirmarAccion(
      "¿Quitar la asignación?",
      `${item?.nombreMateria || "La materia"} dejará de estar asignada a ${item?.nombreDocente || "este docente"}.`,
      "Sí, quitar"
    );
    if (!confirmado) return;

    const resultado = await quitarAsignacion(id);
    mostrarMensaje(mensaje, resultado.mensaje, resultado.exito ? "success" : "danger");

    if (resultado.exito) await cargar();
  });

  btnRecargar?.addEventListener("click", cargar);

  cargarListas();
  cargar();
})();
