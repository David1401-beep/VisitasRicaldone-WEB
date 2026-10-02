import { solicitarApi } from "../../Docentes/Service/ApiService.js";
import { RUTAS } from "../../config.js";

function interpretarError(error, accion) {
  const mensaje = error.message || "";

  if (mensaje.includes("ORA-02292") || mensaje.includes("integrity constraint")) {
    return "No se puede eliminar: hay grados, materias o estudiantes que dependen de este registro. Reasígnelos primero.";
  }

  if (mensaje.includes("ORA-00001") || mensaje.includes("unique constraint")) {
    return "Ya existe un registro con ese nombre.";
  }

  return mensaje || `No fue posible ${accion}.`;
}

// ESPECIALIDAD
export async function obtenerEspecialidades() {
  const lista = await solicitarApi(RUTAS.ESPECIALIDADES);
  return Array.isArray(lista) ? lista : [];
}

export async function guardarEspecialidad(id, nombre) {
  const cuerpo = { especialidad: nombre.trim() };

  try {
    if (id) {
      await solicitarApi(`${RUTAS.ESPECIALIDADES}/${id}`, { method: "PUT", body: JSON.stringify(cuerpo) });
    } else {
      await solicitarApi(RUTAS.ESPECIALIDADES, { method: "POST", body: JSON.stringify(cuerpo) });
    }
    return { exito: true, mensaje: id ? "Especialidad actualizada correctamente." : "Especialidad creada correctamente." };
  } catch (error) {
    return { exito: false, mensaje: interpretarError(error, "guardar la especialidad") };
  }
}

export async function eliminarEspecialidad(id) {
  try {
    await solicitarApi(`${RUTAS.ESPECIALIDADES}/${id}`, { method: "DELETE" });
    return { exito: true, mensaje: "Especialidad eliminada correctamente." };
  } catch (error) {
    return { exito: false, mensaje: interpretarError(error, "eliminar la especialidad") };
  }
}

// MATERIA
export async function obtenerMaterias() {
  const lista = await solicitarApi(RUTAS.MATERIAS);
  return Array.isArray(lista) ? lista : [];
}

export async function guardarMateria(id, nombre, tipo) {
  const cuerpo = { matNombre: nombre.trim(), matTipo: tipo };

  try {
    if (id) {
      await solicitarApi(`${RUTAS.MATERIAS}/${id}`, { method: "PUT", body: JSON.stringify(cuerpo) });
    } else {
      await solicitarApi(RUTAS.MATERIAS, { method: "POST", body: JSON.stringify(cuerpo) });
    }
    return { exito: true, mensaje: id ? "Materia actualizada correctamente." : "Materia creada correctamente." };
  } catch (error) {
    return { exito: false, mensaje: interpretarError(error, "guardar la materia") };
  }
}

export async function eliminarMateria(id) {
  try {
    await solicitarApi(`${RUTAS.MATERIAS}/${id}`, { method: "DELETE" });
    return { exito: true, mensaje: "Materia eliminada correctamente." };
  } catch (error) {
    return { exito: false, mensaje: interpretarError(error, "eliminar la materia") };
  }
}
