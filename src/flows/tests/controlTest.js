/*
Aqui se maneja el flujo de los cuestionarios
*/

import { procesarDass21, DASS21info } from "./dass21";
import { procesarGHQ12, GHQ12info } from "./ghq12";

export const TIPOS_TEST = {
    GHQ12: 'ghq12',
    DASS21: 'dass21',
}

export const procesarCuestionario = async (numeroUsuario, tipoTest, respuestas) => {
    console.log(`Procesando cuestionario ${tipoTest} para el usuario:`, numeroUsuario)

    try {
        switch (tipoTest) {
            case TIPOS_TEST.GHQ12:
                return await procesarGHQ12(numeroUsuario, respuestas);

            case TIPOS_TEST.DASS21:
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

    return ` --* CUESTIONARIOS PSICOLÓGICOS DISPONIBLES *--
    
    Seleccionar el test a realizar:
    1. **${ghqInfo.nombre}**
    ${ghqInfo.descripcion}
    - Tiempo estimado: ${ghqInfo.tiempoEstimado}
    - Preguntas: ${ghqInfo.preguntas.length}

    2. **${dassInfo.nombre}**
    ${dassInfo.descripcion}
    Tiempo estimado: ${dassInfo.tiempoEstimado}
    Preguntas: ${dassInfo.preguntas.length}
    Evalúa: ${dassInfo.subescalas.map(s => s.nombre).join(', ')}	

    ** Responde con el número 1 o 2 para realizar el cuestionario de tpu elección **`	
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
        case TIPOS_TEST.GHQ12:
            return GHQ12info();
        case TIPOS_TEST.DASS21:
            return DASS21info();
        default:
            return null
    }
}

export const parsearSeleccionTest = (seleccion) => {
    switch (seleccion) {
        case '1':
            return TIPOS_TEST.GHQ12;	
        case '2':
            return TIPOS_TEST.DASS21;
        default:
            return null;
    }
}
