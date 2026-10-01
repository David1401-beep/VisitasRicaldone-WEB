export function avisoExito(mensaje, titulo = "Listo") {
  if (window.Swal) {
    Swal.fire({
      icon: "success",
      title: titulo,
      text: mensaje,
      timer: 1800,
      showConfirmButton: false
    });
  } else {
    alert(mensaje);
  }
}

export function avisoError(mensaje, titulo = "Ocurrió un problema") {
  if (window.Swal) {
    Swal.fire({ icon: "error", title: titulo, text: mensaje });
  } else {
    alert(mensaje);
  }
}

export function avisoInfo(mensaje, titulo = "Información") {
  if (window.Swal) {
    Swal.fire({ icon: "info", title: titulo, text: mensaje });
  } else {
    alert(mensaje);
  }
}

// La API guarda las contraseñas cifradas (BCrypt), asi que despues de
// guardar ya no se pueden consultar. Por eso se muestran una sola vez,
// justo al crear o cambiar la contraseña, para que el administrador
// las anote o se las pase al usuario.
export async function avisoCredenciales(correo, contrasena, titulo = "Registro guardado") {
  if (!window.Swal) {
    alert(`${titulo}\n\nCorreo: ${correo}\nContraseña: ${contrasena}\n\nAnótela: no se podrá volver a consultar.`);
    return;
  }

  // Se arma con nodos de texto para que ningun dato se interprete como HTML.
  const contenido = document.createElement("div");
  contenido.className = "text-start";

  const fila = (etiqueta, valor) => {
    const parrafo = document.createElement("p");
    const negrita = document.createElement("strong");
    const codigo = document.createElement("code");

    parrafo.className = "mb-2";
    negrita.textContent = `${etiqueta}: `;
    codigo.className = "fs-6 user-select-all";
    codigo.textContent = valor;

    parrafo.append(negrita, codigo);
    return parrafo;
  };

  const nota = document.createElement("p");
  nota.className = "small text-secondary mt-3 mb-0";
  nota.textContent = "Anote o comparta esta contraseña ahora. Por seguridad se guarda cifrada y no se podrá volver a consultar; si se olvida, edite el registro y asigne una nueva.";

  contenido.append(fila("Correo", correo), fila("Contraseña", contrasena), nota);

  await Swal.fire({
    icon: "success",
    title: titulo,
    html: contenido,
    confirmButtonText: "Entendido",
    confirmButtonColor: "#212529"
  });
}

export async function confirmarAccion(titulo, mensaje, textoBoton = "Sí, continuar") {
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