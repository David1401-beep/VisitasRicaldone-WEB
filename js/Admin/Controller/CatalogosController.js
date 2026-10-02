import {
  obtenerEspecialidades, guardarEspecialidad, eliminarEspecialidad,
  obtenerMaterias, guardarMateria, eliminarMateria
} from "../Service/CatalogosService.js";
import { avisoExito, avisoError, confirmarAccion } from "../../avisos.js";

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
