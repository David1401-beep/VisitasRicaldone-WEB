import { solicitarCodigo, verificarCodigo, cambiarPassword } from "./RecuperacionService.js";

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

    correo = inputCorreo.value.trim().toLowerCase();

    await conBoton(btnEnviar, "Enviando...", async function () {
      const resultado = await solicitarCodigo(correo);

      if (!resultado.exito) {
        mostrarError(resultado.mensaje);
        return;
      }

      // La API siempre responde lo mismo, exista o no el correo.
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

    if (inputPassword.value !== inputRepetida.value) {
      mostrarError("Las contraseñas no coinciden.");
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
