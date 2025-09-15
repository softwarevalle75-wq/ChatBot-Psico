// Función para formatear resultados, de manera que muestre información relevante

export const formatearResultadosParaIA = (resultados) => {
    if (!resultados || !resultados.paciente) {
        return "No se encontraron resultados para este paciente.";
    }

    const { paciente, ghq12, dass21 } = resultados;
    let resumen = `**RESULTADOS DEL PACIENTE**\n`;
    resumen += `Nombre: ${paciente.nombre || 'Sin especificar'} ${paciente.apellido || ''}\n`;
    resumen += `Teléfono: ${paciente.telefonoPersonal}\n`;
    resumen += `Fecha registro: ${new Date(paciente.fechaCreacion).toLocaleDateString()}\n\n`;

    // Formatear resultados GHQ-12
    if (ghq12 && ghq12.preguntaActual >= 3) { // Solo si completó al menos 3 preguntas
        resumen += `**GHQ-12 (Salud Mental General)**\n`;
        resumen += `Puntaje: ${ghq12.Puntaje}\n`;
        
        // Interpretación del puntaje
        let interpretacion;
        if (ghq12.Puntaje <= 11) {
            interpretacion = "🟢 Sin síntomas significativos de malestar psicológico";
        } else if (ghq12.Puntaje <= 18) {
            interpretacion = "🟡 Cierto grado de preocupación emocional";
        } else {
            interpretacion = "🔴 Indicador de malestar psicológico significativo";
        }
        resumen += `Interpretación: ${interpretacion}\n`;
        
        // Resumen de respuestas por categoría
        if (ghq12.resPreg) {
            const respuestas = ghq12.resPreg;
            resumen += `Distribución de respuestas:\n`;
            resumen += `- Respuestas 0 (mejor/igual habitual): ${respuestas[0]?.length || 0}\n`;
            resumen += `- Respuestas 1 (igual habitual): ${respuestas[1]?.length || 0}\n`;
            resumen += `- Respuestas 2 (peor que habitual): ${respuestas[2]?.length || 0}\n`;
            resumen += `- Respuestas 3 (mucho peor): ${respuestas[3]?.length || 0}\n`;
        }
        resumen += `\n`;
    }

    // Formatear resultados DASS-21
    if (dass21 && dass21.preguntaActual >= 21) { // Solo si completó el test
        resumen += `**DASS-21 (Depresión, Ansiedad, Estrés)**\n`;
        resumen += `Depresión: ${dass21.puntajeDep} puntos - ${interpretarDASS21('depresion', dass21.puntajeDep)}\n`;
        resumen += `Ansiedad: ${dass21.puntajeAns} puntos - ${interpretarDASS21('ansiedad', dass21.puntajeAns)}\n`;
        resumen += `Estrés: ${dass21.puntajeEstr} puntos - ${interpretarDASS21('estres', dass21.puntajeEstr)}\n\n`;
    }

    // Si no hay tests completados
    if ((!ghq12 || ghq12.preguntaActual < 3) && (!dass21 || dass21.preguntaActual < 21)) {
        resumen += `**ESTADO DE TESTS**\n`;
        resumen += `No hay tests completados disponibles para este paciente.\n`;
        if (ghq12 && ghq12.preguntaActual > 0) {
            resumen += `GHQ-12: En progreso (${ghq12.preguntaActual}/3 preguntas)\n`;
        }
        if (dass21 && dass21.preguntaActual > 0) {
            resumen += `DASS-21: En progreso (${dass21.preguntaActual}/21 preguntas)\n`;
        }
    }

    return resumen;
};

// Función auxiliar para interpretar puntajes DASS-21
const interpretarDASS21 = (escala, puntaje) => {
    const umbrales = {
        depresion: {
            normal: { max: 4, texto: "Normal" },
            leve: { min: 5, max: 6, texto: "Leve" },
            moderada: { min: 7, max: 10, texto: "Moderada" },
            severa: { min: 11, max: 13, texto: "Severa" },
            extrema: { min: 14, texto: "Extremadamente severa" }
        },
        ansiedad: {
            normal: { max: 3, texto: "Normal" },
            leve: { min: 4, max: 4, texto: "Leve" },
            moderada: { min: 5, max: 7, texto: "Moderada" },
            severa: { min: 8, max: 9, texto: "Severa" },
            extrema: { min: 10, texto: "Extremadamente severa" }
        },
        estres: {
            normal: { max: 7, texto: "Normal" },
            leve: { min: 8, max: 9, texto: "Leve" },
            moderado: { min: 10, max: 12, texto: "Moderado" },
            severo: { min: 13, max: 16, texto: "Severo" },
            extremo: { min: 17, texto: "Extremadamente severo" }
        }
    };

    const u = umbrales[escala];
    if (!u) return "Desconocido";

    if (puntaje <= u.normal.max) return u.normal.texto;
    if (puntaje >= u.leve.min && puntaje <= u.leve.max) return u.leve.texto;
    if (puntaje >= u.moderada?.min && puntaje <= u.moderada?.max) return u.moderada?.texto || u.moderado?.texto;
    if (puntaje >= u.severa?.min && puntaje <= u.severa?.max) return u.severa?.texto || u.severo?.texto;
    if (puntaje >= u.extrema?.min) return u.extrema?.texto || u.extremo?.texto;

    return "Fuera de rango";
};

// Función para obtener lista resumida de pacientes
export const formatearListaPacientes = (pacientes) => {
    if (!pacientes || pacientes.length === 0) {
        return "No tienes pacientes asignados actualmente.";
    }

    let lista = `**PACIENTES ASIGNADOS (${pacientes.length})**\n\n`;
    
    pacientes.forEach((paciente, index) => {
        lista += `${index + 1}. ${paciente.nombre || 'Sin nombre'} ${paciente.apellido || ''}\n`;
        lista += `   Teléfono: ${paciente.telefonoPersonal}\n`;
        lista += `   Registro: ${new Date(paciente.fechaCreacion).toLocaleDateString()}\n\n`;
    });

    return lista;
};
