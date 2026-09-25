import { AUTH_BASE_URL } from "./config.js";

// El sitio web solo usa el login de personal (admin, docente,
// recepcionista); el de encargado es solo de la app movil.
//
// El token no se guarda aqui: la API lo manda en una cookie. Por eso
// todas las llamadas llevan credentials: "include".

export async function iniciarSesionPersonal(correo, contrasena) {
  let respuesta;

  try {
    respuesta = await fetch(`${AUTH_BASE_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ email: correo, password: contrasena })
    });
  } catch (error) {
    return {
      exito: false,
      mensaje: "No fue posible conectar con el servicio de autenticación. Verifique que esté ejecutándose en el puerto 8081."
    };
  }

  const contenido = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    return {
      exito: false,
      // La API-AUTH devuelve el detalle del error en "mensaje" (ApiErrorDTO), no en "message".
      mensaje: contenido?.mensaje || contenido?.message || "El correo o la contraseña son incorrectos."
    };
  }

  return { exito: true, datos: contenido?.data };
}

// Pregunta a la API si la sesion sigue activa. Si no hay, devuelve null.
export async function obtenerSesion() {
  try {
    const respuesta = await fetch(`${AUTH_BASE_URL}/auth/me`, {
      credentials: "include",
      headers: { Accept: "application/json" }
    });

    if (!respuesta.ok) {
      return null;
    }

    const contenido = await respuesta.json().catch(() => null);
    return contenido?.data ?? null;
  } catch (error) {
    return null;
  }
}

// Cierra la sesion y borra la cookie.
export async function cerrarSesionApi() {
  try {
    await fetch(`${AUTH_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include"
    });
  } catch (error) {
    console.error("No fue posible cerrar la sesión en el servidor.", error);
  }

  sessionStorage.clear();
}
