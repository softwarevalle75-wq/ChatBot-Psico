/*
Aqui se maneja el flujo de los cuestionarios
*/

import { procesarDass21, DASS21info } from "./dass21.js";
import { procesarGHQ12, GHQ12info } from "./ghq12.js";

export const TIPOS_TEST = {
    GHQ12: 'ghq12',
    DASS21: 'dass21',
}

export const procesarCuestionario = async (numeroUsuario, tipoTest, respuestas) => {
    //console.log(`Procesando cuestionario ${tipoTest} para el usuario:`, numeroUsuario)
    console.log(`=== DEBUG PROCESAR CUESTIONARIO ===`)
    console.log(`numeroUsuario: ${numeroUsuario}`)
    console.log(`respuestas: ${respuestas}`)  
    console.log(`tipoTest: ${tipoTest}`)
    console.log(`===============================`)

    try {
        switch (tipoTest) {
            case 'ghq12':
                return await procesarGHQ12(numeroUsuario, respuestas);

            case 'dass21':
                return await procesarDass21(numeroUsuario, respuestas);

            default:
                return { error: 'Cuestionario no reconocido. Los cuestionarios disponibles son: GHQ12 y DASS21' };
        }	
    } catch (error) {
        console.error('Error procesando el cuestionario:', error)
        return { error: 'Hubo un error al procesar el cuestionario. Por favor, inténtelo de nuevo más tarde.' }
    }
}

//Mostrar los test disponibles
export const menuCuestionarios = () => {
    const ghqInfo = GHQ12info();
    const dassInfo = DASS21info();

    return ` 
    ═════════════════════════
     🧠 *CUESTIONARIOS DISPONIBLES*  
    ═════════════════════════

1️⃣  *${ghqInfo.nombre}*
   ${ghqInfo.descripcion}
   • Tiempo estimado: ${ghqInfo.tiempoEstimado}
   • Nº de preguntas: ${ghqInfo.numPreguntas}

2️⃣  *${dassInfo.nombre}*
   ${dassInfo.descripcion}
   • Tiempo estimado: ${dassInfo.tiempoEstimado}
   • Nº de preguntas: ${dassInfo.numPreguntas}

───────────────────────────────
👉 *Responde con 1 o 2* para seleccionar el test que deseas realizar.`
}

export const iniciarTest = async (numeroUsuario, tipoTest) => {
    const respuestaInicial = '9'
    return await procesarCuestionario(numeroUsuario, tipoTest, respuestaInicial)
}

export const validarTipoTest = (tipoTest) => {
    return Object.values(TIPOS_TEST).includes(tipoTest);
}

export const getTestInfo = (tipoTest) => {
    switch (tipoTest) {
        case 'ghq12':
            return GHQ12info();
        case 'dass21':
            return DASS21info();
        default:
            return null
    }
}

export const parsearSeleccionTest = (seleccion) => {
    switch (seleccion) {
        case '1':
            return 'ghq12';	
        case '2':
            return 'dass21';
        default:
            return null;
    }
}
