import { solicitarApi } from "../../Docentes/Service/ApiService.js";
import { RUTAS } from "../../config.js";


// Mapa de roles → tabla que le corresponde

const ROLES = {
    "ADMINISTRADOR": {
        recurso: "administradores",
        ruta: RUTAS.ADMINISTRADORES,
        prefijo: "adm",
        campoId: "idAdministrador"
    },
    "RECEPCIONISTA": {
        recurso: "recepcionistas",
        ruta: RUTAS.RECEPCIONISTAS,
        prefijo: "rec",
        campoId: "idRecepcionista"
    },
    "DOCENTE TÉCNICO": {
        recurso: "docentes",
        ruta: RUTAS.DOCENTES,
        prefijo: "doc",
        campoId: "idDocente",
        tipoDocente: "DOCENTE TÉCNICO"
    },
    "DOCENTE ACADÉMICO": {
        recurso: "docentes",
        ruta: RUTAS.DOCENTES,
        prefijo: "doc",
        campoId: "idDocente",
        tipoDocente: "DOCENTE ACADÉMICO"
    },
    "ESTUDIANTE": {
        recurso: "estudiantes",
        ruta: RUTAS.ESTUDIANTES,
        prefijo: "est",
        campoId: "idEstudiante"
    }
};


const RECURSOS = [
    ROLES["ADMINISTRADOR"],
    ROLES["DOCENTE TÉCNICO"],
    ROLES["RECEPCIONISTA"],
    ROLES["ESTUDIANTE"]
];

// Los estudiantes usan como "clave" su carnet, y su correo se arma con él:
// 20240087 -> 20240087@ricaldone.edu.sv
export const DOMINIO_CORREO = "@ricaldone.edu.sv";
const FORMATO_CARNET = /^\d{8}$/;

export function correoDesdeCarnet(carnet) {
    const limpio = String(carnet || "").trim();
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
// Identificadores compuestos

function construirId(recurso, id) {
    return `${recurso}:${id}`;
}

function separarId(idCompuesto) {
    const [recurso, id] = String(idCompuesto).split(":");
    return { recurso, id };
}

function buscarConfigPorRecurso(recurso) {
    return RECURSOS.find(config => config.recurso === recurso) || null;
}

// Conversión API → formulario

function convertirRegistro(registro, config) {
    const p = config.prefijo;

    let rol = registro[`${p}Rol`];

    if (config.recurso === "docentes") rol = registro.docTipo;
    if (config.recurso === "estudiantes") rol = "ESTUDIANTE";

    return {
        id: construirId(config.recurso, registro[config.campoId]),
        nombre: registro[`${p}Nombre`] ?? "",
        apellido: registro[`${p}Apellido`] ?? "",
        // Docentes: su clave (DOC001). Estudiantes: su carnet.
        clave: registro.docClave ?? registro.estCodigo ?? "",
        correo: registro[`${p}Correo`] ?? "",
        rol: rol ?? "",
        idGrado: registro.idGrado ?? null,
        idAcademica: registro.idAcademica ?? null
    };
}

// Conversión formulario → API

function construirCuerpo(datos, config) {
    const p = config.prefijo;

    const cuerpo = {
        [`${p}Nombre`]: datos.nombre,
        [`${p}Apellido`]: datos.apellido,
        [`${p}Correo`]: datos.correo
    };


    if (config.recurso === "docentes") {
        cuerpo.docClave = datos.clave;
        cuerpo.docTipo = config.tipoDocente;
    }

    // La tabla ESTUDIANTE guarda, además de los IDs, el grado, la especialidad
    // y la sección como texto; se toman del catálogo para que siempre coincidan.
    if (config.recurso === "estudiantes") {
        cuerpo.estCodigo = datos.clave;
        cuerpo.estGrado = datos.grado.grado;
        cuerpo.estEspecialidad = datos.grado.nombreEspecialidad || null;
        cuerpo.estSeccion = datos.academica.academica;
        cuerpo.idGrado = datos.grado.idGrado;
        cuerpo.idAcademica = datos.academica.idAcademica;
    }

    if (datos.contrasena) {
        cuerpo[`${p}Password`] = datos.contrasena;
    }

    return cuerpo;
}

function normalizarDatos(datosFormulario) {
    return {
        id: datosFormulario.id || null,
        nombre: datosFormulario.nombre.trim(),
        apellido: datosFormulario.apellido.trim(),
        clave: datosFormulario.clave.trim(),
        contrasena: (datosFormulario.contrasena ?? "").trim(),
        correo: datosFormulario.correo.trim().toLowerCase(),
        rol: datosFormulario.rol.trim().toUpperCase(),
        grado: datosFormulario.grado ?? null,
        academica: datosFormulario.academica ?? null,
        encargado: datosFormulario.encargado ?? null
    };
}

// Crea el encargado y lo une al estudiante recien dado de alta. Son dos
// llamadas aparte, asi que si alguna falla aviso que el estudiante si quedo
// creado: hay que volver a entrar y asignarle el encargado.
async function vincularEncargado(idEstudiante, encargado) {
    if (!idEstudiante) {
        return {
            exito: true,
            tipo: "warning",
            mensaje: "El estudiante se creó, pero no se pudo obtener su ID para asignarle el encargado."
        };
    }

    try {
        const nuevoEncargado = await solicitarApi(RUTAS.ENCARGADOS, {
            method: "POST",
            body: JSON.stringify({
                encNombre: encargado.nombre,
                encApellido: encargado.apellido,
                encTelefono: encargado.telefono,
                encTipo: encargado.tipo
            })
        });

        await solicitarApi(RUTAS.ESTUDIANTES_ENCARGADOS, {
            method: "POST",
            body: JSON.stringify({
                idEstudiante: Number(idEstudiante),
                idEncargado: Number(nuevoEncargado.idEncargado)
            })
        });

        return { exito: true, mensaje: "Estudiante y encargado registrados correctamente." };
    } catch (error) {
        return {
            exito: true,
            tipo: "warning",
            mensaje: `El estudiante se creó, pero no se pudo registrar su encargado: ${error.message}`
        };
    }
}


// Validaciones

// El correo no se puede repetir en ninguna tabla porque todas comparten el mismo login.
function correoEstaDisponible(personal, correo, idActual) {
    return !personal.some(persona =>
        persona.correo.trim().toLowerCase() === correo &&
        persona.id !== idActual
    );
}

function carnetEstaDisponible(personal, carnet, idActual) {
    return !personal.some(persona =>
        persona.rol === "ESTUDIANTE" &&
        persona.clave.trim() === carnet &&
        persona.id !== idActual
    );
}

function interpretarError(error, accion) {
    const mensaje = error.message || "";

    if (mensaje.includes("ORA-02292") || mensaje.includes("integrity constraint")) {
        return "No se puede eliminar: la persona tiene citas, materias, grados o encargados asignados. Reasigne esos registros primero.";
    }

    if (mensaje.includes("ORA-00001") || mensaje.includes("unique constraint")) {
        return "Ya existe un registro con ese correo o esa clave.";
    }

    if (mensaje.includes("ORA-00942")) {
        return "La tabla consultada no existe en la base de datos. Verifique que el script se haya ejecutado completo.";
    }

    return mensaje || `No fue posible ${accion}.`;
}

// Lectura

export async function obtenerEmpleados() {
    // Las tres consultas van en paralelo para que la tabla cargue rápido.
    const respuestas = await Promise.all(
        RECURSOS.map(async config => {
            const registros = await solicitarApi(config.ruta);
            const lista = Array.isArray(registros) ? registros : [];
            return lista.map(registro => convertirRegistro(registro, config));
        })
    );

    return respuestas
        .flat()
        .sort((a, b) => a.apellido.localeCompare(b.apellido, "es"));
}

export async function obtenerEmpleadoPorId(idCompuesto) {
    const { recurso, id } = separarId(idCompuesto);
    const config = buscarConfigPorRecurso(recurso);

    if (!config) {
        throw new Error("No se reconoce el tipo de registro seleccionado.");
    }

    const registro = await solicitarApi(`${config.ruta}/${id}`);
    return convertirRegistro(registro, config);
}

// Catálogos que necesita el formulario cuando el rol es ESTUDIANTE

export async function obtenerGrados() {
    const lista = await solicitarApi(RUTAS.GRADOS);
    return Array.isArray(lista) ? lista : [];
}

export async function obtenerAcademicas() {
    const lista = await solicitarApi(RUTAS.ACADEMICAS);
    return Array.isArray(lista) ? lista : [];
}

// Crear y actualizar

export async function guardarEmpleado(datosFormulario) {
    const datos = normalizarDatos(datosFormulario);
    const config = ROLES[datos.rol];

    if (!config) {
        return {
            exito: false,
            mensaje: `El rol "${datos.rol}" no tiene una tabla asignada en la base de datos. Seleccione administrador, recepcionista, docente o estudiante.`
        };
    }

    if (config.recurso === "estudiantes") {
        if (!FORMATO_CARNET.test(datos.clave)) {
            return {
                exito: false,
                mensaje: "El carnet del estudiante debe tener 8 dígitos (por ejemplo 20240087)."
            };
        }

        if (!datos.correo.endsWith(DOMINIO_CORREO)) {
            return {
                exito: false,
                mensaje: `El correo del estudiante debe ser institucional (${DOMINIO_CORREO}).`
            };
        }

        if (!datos.grado || !datos.academica) {
            return {
                exito: false,
                mensaje: "Seleccione el grado y la sección académica del estudiante."
            };
        }

        // Se revisa antes de crear nada: si falta un dato del encargado y el
        // estudiante ya se hubiera creado, quedaria sin encargado igual que antes.
        if (!datos.id) {
            const encargado = datos.encargado;

            if (!encargado || !encargado.nombre || !encargado.apellido || !encargado.tipo) {
                return {
                    exito: false,
                    mensaje: "Complete el nombre, el apellido y el parentesco del encargado."
                };
            }

            if (!/^[0-9]{4}-[0-9]{4}$/.test(encargado.telefono)) {
                return {
                    exito: false,
                    mensaje: "Escriba los 8 dígitos del teléfono del encargado."
                };
            }
        }
    }

    if (config.recurso === "docentes" && !datos.clave) {
        return {
            exito: false,
            mensaje: "Los docentes necesitan una clave (por ejemplo DOC001)."
        };
    }

    if (!datos.id && !datos.contrasena) {
        return {
            exito: false,
            mensaje: "Debe ingresar una contraseña para crear el registro."
        };
    }

    try {
        const personal = await obtenerEmpleados();

        if (!correoEstaDisponible(personal, datos.correo, datos.id)) {
            return {
                exito: false,
                mensaje: "Ya existe una persona registrada con ese correo."
            };
        }

        if (config.recurso === "estudiantes" && !carnetEstaDisponible(personal, datos.clave, datos.id)) {
            return {
                exito: false,
                mensaje: "Ya existe un estudiante registrado con ese carnet."
            };
        }

        const cuerpo = construirCuerpo(datos, config);

        // --- Alta ---
        if (!datos.id) {
            const creado = await solicitarApi(config.ruta, {
                method: "POST",
                body: JSON.stringify(cuerpo)
            });

            // Un estudiante sin encargado no puede pedir reuniones, asi que
            // el encargado se registra y se vincula en el mismo guardado.
            if (config.recurso === "estudiantes" && datos.encargado) {
                return await vincularEncargado(creado?.idEstudiante, datos.encargado);
            }

            return { exito: true, mensaje: "Registro creado correctamente." };
        }

        const { recurso: recursoActual, id } = separarId(datos.id);

        // --- Edición dentro de la misma tabla ---
        if (recursoActual === config.recurso) {
            await solicitarApi(`${config.ruta}/${id}`, {
                method: "PUT",
                body: JSON.stringify(cuerpo)
            });

            return { exito: true, mensaje: "Registro actualizado correctamente." };
        }

        // --- Cambio de rol: crea un registro nuevo en otra tabla, que también exige contraseña ---
        if (!datos.contrasena) {
            return {
                exito: false,
                mensaje: "Debe ingresar una contraseña para crear el registro con el nuevo rol."
            };
        }

        await solicitarApi(config.ruta, {
            method: "POST",
            body: JSON.stringify(cuerpo)
        });

        const configAnterior = buscarConfigPorRecurso(recursoActual);

        try {
            await solicitarApi(`${configAnterior.ruta}/${id}`, { method: "DELETE" });
        } catch (error) {
            return {
                exito: true,
                tipo: "warning",
                mensaje: `Se creó el registro con el nuevo rol, pero no se pudo eliminar el anterior: ${interpretarError(error, "eliminarlo")}`
            };
        }

        return { exito: true, mensaje: "Rol actualizado correctamente." };

    } catch (error) {
        return { exito: false, mensaje: interpretarError(error, "guardar el registro") };
    }
}

// Eliminar

export async function eliminarEmpleado(idCompuesto) {
    const { recurso, id } = separarId(idCompuesto);
    const config = buscarConfigPorRecurso(recurso);

    if (!config) {
        return {
            exito: false,
            tipo: "danger",
            mensaje: "No se reconoce el tipo de registro seleccionado."
        };
    }

    try {
        await solicitarApi(`${config.ruta}/${id}`, { method: "DELETE" });
        return { exito: true, tipo: "success", mensaje: "Registro eliminado correctamente." };
    } catch (error) {
        return { exito: false, tipo: "danger", mensaje: interpretarError(error, "eliminar el registro") };
    }
}