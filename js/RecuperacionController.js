import { solicitarCodigo, verificarCodigo, cambiarPassword } from "./RecuperacionService.js";
import { revisar, avisoValidacion, bloquearLetras } from "./validaciones.js";
import { avisoError } from "./avisos.js";

// Los tres pasos viven en la misma pagina. Voy mostrando uno a la vez
// para no perder el correo ni el codigo entre pantallas.

document.addEventListener("DOMContentLoaded", function () {
  const formCorreo = document.getElementById("formCorreo");
  const formCodigo = document.getElementById("formCodigo");
  const formPassword = document.getElementById("formPassword");

  const inputCorreo = document.getElementById("recuperarCorreo");
  const inputCodigo = document.getElementById("recuperarCodigo");
  const inputPassword = document.getElementById("passwordNueva");
  const inputRepetida = document.getElementById("passwordRepetida");

  const btnEnviar = document.getElementById("btnEnviarCodigo");
  const btnVerificar = document.getElementById("btnVerificarCodigo");
  const btnCambiar = document.getElementById("btnCambiarPassword");
  const btnReenviar = document.getElementById("btnReenviar");

  const mensaje = document.getElementById("recuperarMensaje");
  const enlaceVolver = document.getElementById("enlaceVolver");

  // El codigo es de 6 digitos: no deja escribir letras.
  bloquearLetras(inputCodigo);

  // Si vino desde el login de docentes, que regrese a ese mismo.
  const origen = new URLSearchParams(window.location.search).get("origen");

  if (origen === "docente") {
    enlaceVolver.href = "inicioSesion-docente.html";
  }

  let correo = "";
  let codigo = "";

  formCorreo.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    if (!formCorreo.checkValidity()) {
      formCorreo.reportValidity();
      return;
    }

    const problemaCorreo = revisar([
      { el: inputCorreo, nombre: "correo", tipo: "correo" }
    ]);

    if (problemaCorreo) {
      avisoValidacion(problemaCorreo);
      return;
    }

    correo = inputCorreo.value.trim().toLowerCase();

    await conBoton(btnEnviar, "Enviando...", async function () {
      const resultado = await solicitarCodigo(correo);

      // Si el correo no existe se queda en este paso y lo avisa, en vez de
      // pasar a pedir un codigo que nunca va a llegar.
      if (!resultado.exito) {
        avisoError(
          resultado.mensaje,
          resultado.estado === 404 ? "Correo no registrado" : "No se pudo enviar el código"
        );
        return;
      }

      mostrarAviso(resultado.mensaje);
      mostrarPaso(formCodigo);
      inputCodigo.focus();
    });
  });

  formCodigo.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    if (!formCodigo.checkValidity()) {
      formCodigo.reportValidity();
      return;
    }

    const problemaCodigo = revisar([
      { el: inputCodigo, nombre: "código", tipo: "codigo" }
    ]);

    if (problemaCodigo) {
      avisoValidacion(problemaCodigo);
      return;
    }

    codigo = inputCodigo.value.trim();

    await conBoton(btnVerificar, "Verificando...", async function () {
      const resultado = await verificarCodigo(correo, codigo);

      if (!resultado.exito) {
        mostrarError(resultado.mensaje);
        return;
      }

      limpiarMensaje();
      mostrarPaso(formPassword);
      inputPassword.focus();
    });
  });

  formPassword.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    if (!formPassword.checkValidity()) {
      formPassword.reportValidity();
      return;
    }

    const problemaPassword = revisar([
      { el: inputPassword, nombre: "contraseña nueva", min: 6 }
    ]);

    if (problemaPassword) {
      avisoValidacion(problemaPassword);
      return;
    }

    if (inputPassword.value !== inputRepetida.value) {
      avisoValidacion({ mensaje: "Las contraseñas no coinciden.", el: inputRepetida });
      return;
    }

    await conBoton(btnCambiar, "Guardando...", async function () {
      const resultado = await cambiarPassword(correo, codigo, inputPassword.value);

      if (!resultado.exito) {
        mostrarError(resultado.mensaje);
        return;
      }

      formPassword.hidden = true;
      mostrarAviso(resultado.mensaje);

      // Lo regreso al login para que entre con la contrasena nueva.
      setTimeout(() => window.location.replace(enlaceVolver.getAttribute("href")), 2500);
    });
  });

  btnReenviar.addEventListener("click", async function () {
    inputCodigo.value = "";

    const resultado = await solicitarCodigo(correo);

    if (resultado.exito) {
      mostrarAviso("Le enviamos un código nuevo. El anterior ya no sirve.");
    } else {
      mostrarError(resultado.mensaje);
    }
  });

  // Apoyo

  function mostrarPaso(formulario) {
    formCorreo.hidden = formulario !== formCorreo;
    formCodigo.hidden = formulario !== formCodigo;
    formPassword.hidden = formulario !== formPassword;
  }

  async function conBoton(boton, textoEspera, accion) {
    const original = boton.textContent;
    boton.disabled = true;
    boton.textContent = textoEspera;

    try {
      await accion();
    } finally {
      boton.disabled = false;
      boton.textContent = original;
    }
  }

  function mostrarError(texto) {
    mensaje.textContent = texto;
    mensaje.className = "alert alert-danger text-start";
  }

  function mostrarAviso(texto) {
    mensaje.textContent = texto;
    mensaje.className = "alert alert-success text-start";
  }

  function limpiarMensaje() {
    mensaje.textContent = "";
    mensaje.className = "alert d-none text-start";
  }
});
