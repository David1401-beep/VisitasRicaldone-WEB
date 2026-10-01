import { solicitarApi } from "../../Docentes/Service/ApiService.js";
import { RUTAS } from "../../config.js";

// Los estudiantes inician sesión con su correo institucional, que se arma
// con el código (carnet) del estudiante: 20240087 -> 20240087@ricaldone.edu.sv
export const DOMINIO_CORREO = "@ricaldone.edu.sv";
const FORMATO_CODIGO = /^\d{8}$/;

export function correoDesdeCodigo(codigo) {
  const limpio = String(codigo || "").trim();
  return limpio ? `${limpio}${DOMINIO_CORREO}` : "";
}

// Texto que identifica a un grado en las listas: "1° año - Desarrollo de Software (1A)"
export function etiquetaGrado(grado) {
  if (!grado) return "";

  let texto = grado.grado ?? "";

  if (grado.nombreEspecialidad) texto += ` - ${grado.nombreEspecialidad}`;
  if (grado.nombreTecnica) texto += ` (${grado.nombreTecnica})`;

  return texto;
}

function interpretarError(error, accion) {
  const mensaje = error.message || "";

  if (mensaje.includes("ORA-02292") || mensaje.includes("integrity constraint")) {
    return "No se puede eliminar: el estudiante tiene encargados o citas registradas. Elimine esas relaciones primero.";
  }

  if (mensaje.includes("ORA-00001") || mensaje.includes("unique constraint")) {
    return "Ya existe un estudiante con ese correo o ese código.";
  }

  return mensaje || `No fue posible ${accion}.`;
}

// Lectura

export async function obtenerEstudiantes() {
  const lista = await solicitarApi(RUTAS.ESTUDIANTES);

  return (Array.isArray(lista) ? lista : []).sort((a, b) =>
    String(a.estApellido || "").localeCompare(String(b.estApellido || ""), "es") ||
    String(a.estNombre || "").localeCompare(String(b.estNombre || ""), "es")
  );
}

export async function obtenerEstudiantePorId(id) {
  return solicitarApi(`${RUTAS.ESTUDIANTES}/${id}`);
}

export async function obtenerGrados() {
  const lista = await solicitarApi(RUTAS.GRADOS);
  return Array.isArray(lista) ? lista : [];
}

export async function obtenerAcademicas() {
  const lista = await solicitarApi(RUTAS.ACADEMICAS);
  return Array.isArray(lista) ? lista : [];
}

// Crear y actualizar

function normalizarDatos(datosFormulario) {
  return {
    id: datosFormulario.id || null,
    nombre: datosFormulario.nombre.trim(),
    apellido: datosFormulario.apellido.trim(),
    codigo: datosFormulario.codigo.trim(),
    correo: datosFormulario.correo.trim().toLowerCase(),
    contrasena: (datosFormulario.contrasena ?? "").trim()
  };
}

// La tabla ESTUDIANTE guarda, además de los IDs, el grado, la especialidad
// y la sección como texto. Se toman del grado y la académica elegidos para
// que siempre coincidan con el catálogo.
function construirCuerpo(datos, grado, academica) {
  const cuerpo = {
    estNombre: datos.nombre,
    estApellido: datos.apellido,
    estCorreo: datos.correo,
    estCodigo: datos.codigo,
    estGrado: grado.grado,
    estEspecialidad: grado.nombreEspecialidad || null,
    estSeccion: academica.academica,
    idGrado: grado.idGrado,
    idAcademica: academica.idAcademica
  };

  if (datos.contrasena) {
    cuerpo.estPassword = datos.contrasena;
  }

  return cuerpo;
}

export async function guardarEstudiante(datosFormulario, grado, academica) {
  const datos = normalizarDatos(datosFormulario);

  if (!FORMATO_CODIGO.test(datos.codigo)) {
    return { exito: false, mensaje: "El código del estudiante debe tener 8 dígitos (por ejemplo 20240087)." };
  }

  if (!datos.correo.endsWith(DOMINIO_CORREO)) {
    return { exito: false, mensaje: `El correo debe ser institucional (${DOMINIO_CORREO}).` };
  }

  if (!grado || !academica) {
    return { exito: false, mensaje: "Seleccione el grado y la sección académica del estudiante." };
  }

  if (!datos.id && !datos.contrasena) {
    return { exito: false, mensaje: "Debe ingresar una contraseña para registrar al estudiante." };
  }

  try {
    // La API solo revisa duplicados al crear; al editar se revisa aquí
    // para dar un mensaje claro en lugar del error de la base de datos.
    const estudiantes = await obtenerEstudiantes();
    const otros = estudiantes.filter(est => String(est.idEstudiante) !== String(datos.id));

    if (otros.some(est => String(est.estCorreo || "").trim().toLowerCase() === datos.correo)) {
      return { exito: false, mensaje: "Ya existe un estudiante registrado con ese correo." };
    }

    if (otros.some(est => String(est.estCodigo || "").trim() === datos.codigo)) {
      return { exito: false, mensaje: "Ya existe un estudiante registrado con ese código." };
    }

    const cuerpo = construirCuerpo(datos, grado, academica);

    if (!datos.id) {
      await solicitarApi(RUTAS.ESTUDIANTES, {
        method: "POST",
        body: JSON.stringify(cuerpo)
      });

      return { exito: true, mensaje: "Estudiante registrado correctamente." };
    }

    await solicitarApi(`${RUTAS.ESTUDIANTES}/${datos.id}`, {
      method: "PUT",
      body: JSON.stringify(cuerpo)
    });

    return { exito: true, mensaje: "Estudiante actualizado correctamente." };

  } catch (error) {
    return { exito: false, mensaje: interpretarError(error, "guardar el estudiante") };
  }
}

// Eliminar

export async function eliminarEstudiante(id) {
  try {
    await solicitarApi(`${RUTAS.ESTUDIANTES}/${id}`, { method: "DELETE" });
    return { exito: true, mensaje: "Estudiante eliminado correctamente." };
  } catch (error) {
    return { exito: false, mensaje: interpretarError(error, "eliminar el estudiante") };
  }
}
