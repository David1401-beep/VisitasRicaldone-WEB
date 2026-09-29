// URL de la API ya desplegada. Cuando este en Heroku se pone aqui, por
// ejemplo: "https://visitas-itr-api.herokuapp.com/api/v1"
// Mientras este vacio se usa la de abajo, que sirve para trabajar en local.
const API_EN_LA_NUBE = "";

const EN_LOCAL = ["", "localhost", "127.0.0.1"].includes(window.location.hostname);

// En local el login y los datos salen de la misma API, por eso un solo puerto.
const PUERTO_API = 8080;
const HOST_API = EN_LOCAL ? "localhost" : window.location.hostname;

export const API_BASE_URL = API_EN_LA_NUBE
    ? API_EN_LA_NUBE
    : `http://${HOST_API}:${PUERTO_API}/api/v1`;

export const AUTH_BASE_URL = API_BASE_URL;

export const RUTAS = {

    ADMINISTRADORES: "/administradores",   
    DOCENTES: "/docentes",                 
    RECEPCIONISTAS: "/recepcionistas",    
    ESTUDIANTES: "/estudiantes",           
    ENCARGADOS: "/encargados",             


    NIVELES: "/niveles",                     
    GRADOS: "/grados",                    
    ACADEMICAS: "/academicas",            
    SECCIONES_TECNICAS: "/secciones-tecnicas", 
    ESPECIALIDADES: "/especialidades",        
    MATERIAS: "/materias",                  


    MATERIA_DOCENTE: "/materia-docente",     
    DOCENTE_GRADO: "/docente-grado",         
    CITAS: "/citas-reuniones", 
    ESTUDIANTES_ENCARGADOS: "/estudiante-encargados"   
};


