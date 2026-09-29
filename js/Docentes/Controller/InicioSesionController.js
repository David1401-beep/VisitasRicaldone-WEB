import { iniciarSesion } from "../Service/InicioSesionService.js";

const formInicioSesion = document.getElementById("loginForm");
const correoInput = document.getElementById("loginCorreo");
const contrasenaInput = document.getElementById("loginContrasena");

// Ya no exijo el dominio del colegio: quien dice si el correo sirve es
// la base de datos, porque hay cuentas registradas con otro dominio.
correoInput?.addEventListener("input", () => {
    correoInput.setCustomValidity("");
});

contrasenaInput?.addEventListener("input", () => {
    contrasenaInput.setCustomValidity("");
});

if (formInicioSesion) {
    formInicioSesion.addEventListener("submit", async function(e) {
        e.preventDefault();

        correoInput.setCustomValidity("");
        contrasenaInput.setCustomValidity("");

        if (!formInicioSesion.checkValidity()) {
            formInicioSesion.reportValidity();
            return;
        }

        const correo = correoInput.value.trim().toLowerCase();
        const contrasena = contrasenaInput.value;
        const botonIngresar = formInicioSesion.querySelector('button[type="submit"]');

        botonIngresar.disabled = true;
        const resultado = await iniciarSesion(correo, contrasena);
        botonIngresar.disabled = false;

        if (resultado.exito) {
            sessionStorage.setItem("userCorreo", resultado.sesion.correo);
            sessionStorage.setItem("userRol", resultado.sesion.rol);
            sessionStorage.setItem("docenteId", resultado.sesion.idDocente);
            window.location.href = resultado.redireccion;
        } else {
            contrasenaInput.setCustomValidity(resultado.mensaje);
            contrasenaInput.reportValidity();
        }
    });
}
