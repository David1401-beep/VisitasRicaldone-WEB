// La API desplegada en Heroku. Es la que se usa cuando el sitio esta
// publicado en Vercel.
const API_EN_LA_NUBE = "https://gestor-de-visitas-itr-53fe7294e1e4.herokuapp.com/api/v1";

// Abriendo el sitio desde XAMPP se usa la API local, para poder seguir
// trabajando sin tocar la que esta publicada.
const EN_LOCAL = ["", "localhost", "127.0.0.1"].includes(window.location.hostname);
const API_LOCAL = "http://localhost:8080/api/v1";

export const API_BASE_URL = EN_LOCAL ? API_LOCAL : API_EN_LA_NUBE;

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


