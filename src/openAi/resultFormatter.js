// Función para preparar datos crudos para que GPT los analice completamente

export const formatearResultadosParaIA = (resultados) => {
    if (!resultados || !resultados.paciente) {
        return null; // GPT manejará este caso
    }

    const { paciente, ghq12, dass21 } = resultados;
    
    // Preparar datos estructurados para GPT - SIN interpretaciones predefinidas
    const datosParaIA = {
        paciente: {
            nombre: paciente.primerNombre || 'Sin especificar',
            apellido: paciente.primerApellido || '',
            telefono: paciente.telefonoPersonal,
            fechaRegistro: new Date(paciente.fechaCreacion).toLocaleDateString()
        },
        ghq12: null,
        dass21: null
    };

    // Datos crudos GHQ-12
    if (ghq12 && ghq12.preguntaActual >= 0) {
        // Calcular cuántas preguntas realmente ha respondido
        const respuestasContadas = ghq12.resPreg ? 
            Object.values(ghq12.resPreg).reduce((total, arr) => total + (arr?.length || 0), 0) : 0;
        
        datosParaIA.ghq12 = {
            preguntasRespondidas: respuestasContadas,
            totalPreguntas: 12,
            completado: ghq12.preguntaActual >= 12,
            puntaje: ghq12.preguntaActual >= 12 ? ghq12.Puntaje : null,
            respuestas: ghq12.resPreg || null
        };
    }

    // Datos crudos DASS-21
    if (dass21 && dass21.preguntaActual >= 0) {
        // Para DASS-21, las respuestas están en un array, así que es más fácil
        const respuestasContadas = dass21.respuestas ? dass21.respuestas.length : 0;
        
        datosParaIA.dass21 = {
            preguntasRespondidas: respuestasContadas,
            totalPreguntas: 21,
            completado: dass21.preguntaActual >= 21,
            puntajes: dass21.preguntaActual >= 21 ? {
                depresion: dass21.puntajeDep,
                ansiedad: dass21.puntajeAns,
                estres: dass21.puntajeEstr
            } : null,
            respuestas: dass21.respuestas || null
        };
    }

    return JSON.stringify(datosParaIA, null, 2);
};

// Función para obtener lista resumida de pacientes
export const formatearListaPacientes = (pacientes) => {
    if (!pacientes || pacientes.length === 0) {
        return "No tienes pacientes asignados actualmente.";
    }

    let lista = `**PACIENTES ASIGNADOS (${pacientes.length})**\n\n`;
    
    pacientes.forEach((paciente, index) => {
        lista += `${index + 1}. ${paciente.primerNombre || 'Sin nombre'} ${paciente.primerApellido || ''}\n`;
        lista += `   Teléfono: ${paciente.telefonoPersonal}\n`;
        lista += `   Registro: ${new Date(paciente.fechaCreacion).toLocaleDateString()}\n\n`;
    });

    return lista;
};
