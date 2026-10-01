// Boton del ojito que va junto a los campos de contraseña. Al tocarlo
// cambia el input entre "password" y "text" para que el administrador
// pueda revisar lo que esta escribiendo.
//
// En el HTML se pone asi:
//   <div class="input-group">
//     <input type="password" id="miContrasena" ...>
//     <button type="button" class="btn btn-outline-secondary" id="btnVerMiContrasena">
//       <i class="bi bi-eye" aria-hidden="true"></i>
//     </button>
//   </div>

function aplicarEstado(input, boton, visible) {
  const icono = boton.querySelector("i");

  input.type = visible ? "text" : "password";
  boton.setAttribute("aria-pressed", String(visible));
  boton.setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
  boton.title = visible ? "Ocultar contraseña" : "Mostrar contraseña";

  if (icono) {
    icono.className = `bi ${visible ? "bi-eye-slash" : "bi-eye"}`;
  }
}

export function activarVerContrasena(input, boton) {
  if (!input || !boton) return;

  aplicarEstado(input, boton, false);

  boton.addEventListener("click", () => {
    aplicarEstado(input, boton, input.type === "password");
  });
}

// Se usa al limpiar el formulario para que la siguiente contraseña
// vuelva a escribirse oculta.
export function ocultarContrasena(input, boton) {
  if (!input || !boton) return;
  aplicarEstado(input, boton, false);
}
