import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Función para generar el PDF con los resultados detallados del DASS-21
export const generarPDFResultadosDASS21 = async (numeroUsuario, puntajes, respuestas) => {
    return new Promise((resolve, reject) => {
        try {
            // Crear documento PDF
            const doc = new PDFDocument({ margin: 50 });
            const fileName = `DASS21_${numeroUsuario}.pdf`;
            const filePath = path.join('./temp', fileName);
            
            // Asegurar que existe la carpeta temp
            if (!fs.existsSync('./temp')) {
                fs.mkdirSync('./temp', { recursive: true });
            }
            
            // Pipe del PDF a archivo
            doc.pipe(fs.createWriteStream(filePath));
            
            // ENCABEZADO
            doc.fontSize(20)
               .font('Helvetica-Bold')
               .text('REPORTE DE EVALUACIÓN PSICOLÓGICA', { align: 'center' })
               .moveDown();
            
            doc.fontSize(16)
               .text('Escala de Depresión, Ansiedad y Estrés (DASS-21)', { align: 'center' })
               .moveDown(1.5);
            
            // INFORMACIÓN DEL PACIENTE
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('INFORMACIÓN DEL PACIENTE:', { underline: true })
               .moveDown(0.5);
            
            doc.font('Helvetica')
               .text(`Número de identificación: ${numeroUsuario}`)
               .text(`Fecha de evaluación: ${new Date().toLocaleDateString('es-ES')}`)
               .text(`Hora de evaluación: ${new Date().toLocaleTimeString('es-ES')}`)
               .moveDown(1);
            
            // DESCRIPCIÓN DEL INSTRUMENTO
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('DESCRIPCIÓN DEL INSTRUMENTO:', { underline: true })
               .moveDown(0.5);
            
            doc.font('Helvetica')
               .fontSize(12)
               .text('El DASS-21 (Depression, Anxiety and Stress Scale) es un instrumento de autoevaluación que mide tres dimensiones relacionadas con el malestar emocional: depresión, ansiedad y estrés. Es ampliamente utilizado en contextos clínicos y de investigación.')
               .moveDown(0.5)
               .text('• Número total de preguntas: 21 (7 por subescala)')
               .text('• Tiempo de administración: 5-10 minutos')
               .text('• Rango de puntuación: 0-63 puntos por subescala')
               .text('• Subescalas: Depresión, Ansiedad, Estrés')
               .moveDown(1.5);
            
            // RESULTADOS GENERALES
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('RESULTADOS GENERALES:', { underline: true })
               .moveDown(0.5);
            
            doc.font('Helvetica')
               .fontSize(12)
               .text(`Puntaje total obtenido: ${puntajes.total}/63`)
               .moveDown(0.5);
            
            // RESULTADOS POR SUBESCALA
            doc.fontSize(13)
               .font('Helvetica-Bold')
               .text('RESULTADOS POR SUBESCALA:', { underline: true })
               .moveDown(0.5);
            
            // Depresión
            const categoriaDepresion = determinarCategoriaDASS21(puntajes.depresion, 'depresion');
            doc.font('Helvetica')
               .fontSize(12)
               .text(`🔹 DEPRESIÓN: ${puntajes.depresion}/21 puntos`)
               .text(`   Categoría: ${categoriaDepresion.nombre}`)
               .text(`   Interpretación: ${categoriaDepresion.interpretacion}`)
               .moveDown(0.5);
            
            // Ansiedad
            const categoriaAnsiedad = determinarCategoriaDASS21(puntajes.ansiedad, 'ansiedad');
            doc.text(`🔹 ANSIEDAD: ${puntajes.ansiedad}/21 puntos`)
               .text(`   Categoría: ${categoriaAnsiedad.nombre}`)
               .text(`   Interpretación: ${categoriaAnsiedad.interpretacion}`)
               .moveDown(0.5);
            
            // Estrés
            const categoriaEstres = determinarCategoriaDASS21(puntajes.estres, 'estres');
            doc.text(`🔹 ESTRÉS: ${puntajes.estres}/21 puntos`)
               .text(`   Categoría: ${categoriaEstres.nombre}`)
               .text(`   Interpretación: ${categoriaEstres.interpretacion}`)
               .moveDown(1.5);
            
            // ANÁLISIS DETALLADO POR PREGUNTA
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('ANÁLISIS DETALLADO DE RESPUESTAS:', { underline: true })
               .moveDown(0.5);
            
            const preguntasCompletas = obtenerPreguntasCompletasDASS21();
            
            for (let i = 0; i < preguntasCompletas.length; i++) {
                const pregunta = preguntasCompletas[i];
                const respuestaUsuario = obtenerRespuestaUsuarioDASS21(respuestas, i + 1);
                
                // Verificar si necesitamos nueva página
                if (doc.y > 700) {
                    doc.addPage();
                }
                
                doc.fontSize(11)
                   .font('Helvetica-Bold')
                   .text(`Pregunta ${i + 1} (${pregunta.subescala}):`, { continued: false })
                   .font('Helvetica')
                   .text(pregunta.texto)
                   .moveDown(0.3);
                
                doc.text(`Respuesta seleccionada: ${respuestaUsuario.texto} (${respuestaUsuario.puntos} puntos)`)
                   .fontSize(10)
                   .font('Helvetica-Oblique')
                   .text(`Interpretación: ${respuestaUsuario.interpretacion}`)
                   .moveDown(0.8)
                   .font('Helvetica');
            }
            
            // ANÁLISIS PSICOLÓGICO PROFESIONAL
            doc.addPage();
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('ANÁLISIS PSICOLÓGICO PROFESIONAL:', { underline: true })
               .moveDown(0.5);
            
            const analisisDetallado = generarAnalisisDetalladoDASS21(puntajes, respuestas);
            doc.font('Helvetica')
               .fontSize(11)
               .text(analisisDetallado.areas_preocupacion, { align: 'justify' })
               .moveDown(0.5)
               .text(analisisDetallado.fortalezas, { align: 'justify' })
               .moveDown(0.5)
               .text(analisisDetallado.recomendaciones, { align: 'justify' });
            
            // RECOMENDACIONES CLÍNICAS
            doc.moveDown(1)
               .fontSize(14)
               .font('Helvetica-Bold')
               .text('RECOMENDACIONES CLÍNICAS:', { underline: true })
               .moveDown(0.5);
            
            const recomendaciones = generarRecomendacionesClinicasDASS21(puntajes);
            doc.font('Helvetica')
               .fontSize(11);
            
            recomendaciones.forEach(rec => {
                doc.text(`• ${rec}`, { indent: 10 })
                   .moveDown(0.3);
            });
            
            // PIE DE PÁGINA
            doc.moveDown(2)
               .fontSize(10)
               .font('Helvetica-Oblique')
               .text('Este reporte es generado automáticamente como herramienta de apoyo clínico.', { align: 'center' })
               .text('Los resultados deben ser interpretados por un profesional de la salud mental cualificado.', { align: 'center' });
            
            // Finalizar documento
            doc.end();
            
            // Resolver con la ruta del archivo cuando termine
            doc.on('end', () => {
                resolve(filePath);
            });
            
        } catch (error) {
            reject(error);
        }
    });
};

// Función auxiliar para determinar la categoría del resultado DASS-21
const determinarCategoriaDASS21 = (puntaje, subescala) => {
    const umbrales = {
        depresion: {
            normal: { min: 0, max: 4 },
            leve: { min: 5, max: 6 },
            moderado: { min: 7, max: 10 },
            severo: { min: 11, max: 13 },
            extremo: { min: 14, max: 21 }
        },
        ansiedad: {
            normal: { min: 0, max: 3 },
            leve: { min: 4, max: 5 },
            moderado: { min: 6, max: 7 },
            severo: { min: 8, max: 9 },
            extremo: { min: 10, max: 21 }
        },
        estres: {
            normal: { min: 0, max: 7 },
            leve: { min: 8, max: 9 },
            moderado: { min: 10, max: 12 },
            severo: { min: 13, max: 16 },
            extremo: { min: 17, max: 21 }
        }
    };

    const umbral = umbrales[subescala];
    
    if (puntaje <= umbral.normal.max) {
        return {
            nombre: "Normal",
            interpretacion: `No se evidencian síntomas significativos de ${subescala}. Funcionamiento dentro de parámetros normales.`
        };
    } else if (puntaje >= umbral.leve.min && puntaje <= umbral.leve.max) {
        return {
            nombre: "Leve",
            interpretacion: `Síntomas leves de ${subescala}. Se recomienda monitoreo y estrategias de autocuidado.`
        };
    } else if (puntaje >= umbral.moderado.min && puntaje <= umbral.moderado.max) {
        return {
            nombre: "Moderado",
            interpretacion: `Síntomas moderados de ${subescala}. Se recomienda evaluación profesional e intervención.`
        };
    } else if (puntaje >= umbral.severo.min && puntaje <= umbral.severo.max) {
        return {
            nombre: "Severo",
            interpretacion: `Síntomas severos de ${subescala}. Requiere atención psicológica inmediata.`
        };
    } else {
        return {
            nombre: "Extremadamente severo",
            interpretacion: `Síntomas extremadamente severos de ${subescala}. Requiere intervención psicológica urgente.`
        };
    }
};

// Función para obtener las preguntas completas del DASS-21
const obtenerPreguntasCompletasDASS21 = () => {
    return [
        { texto: "Me ha costado mucho descargar la tensión", subescala: "Estrés" },
        { texto: "Me di cuenta que tenía la boca seca", subescala: "Ansiedad" },
        { texto: "No podía sentir ningún sentimiento positivo", subescala: "Depresión" },
        { texto: "Se me hizo difícil respirar", subescala: "Ansiedad" },
        { texto: "Se me hizo difícil tomar la iniciativa para hacer cosas", subescala: "Depresión" },
        { texto: "Reaccioné exageradamente en ciertas situaciones", subescala: "Estrés" },
        { texto: "Sentí que mis manos temblaban", subescala: "Ansiedad" },
        { texto: "He sentido que estaba gastando una gran cantidad de energía nerviosa", subescala: "Estrés" },
        { texto: "Estaba preocupado por situaciones en las cuales podía tener pánico", subescala: "Ansiedad" },
        { texto: "He sentido que no había nada que me ilusionara", subescala: "Depresión" },
        { texto: "Me he sentido inquieto", subescala: "Estrés" },
        { texto: "Se me hizo difícil relajarme", subescala: "Estrés" },
        { texto: "Me sentí triste y deprimido", subescala: "Depresión" },
        { texto: "No toleré nada que no me permitiera continuar con lo que estaba haciendo", subescala: "Estrés" },
        { texto: "Sentí que estaba al punto de pánico", subescala: "Ansiedad" },
        { texto: "No me pude entusiasmar por nada", subescala: "Depresión" },
        { texto: "Sentí que valía muy poco como persona", subescala: "Depresión" },
        { texto: "Sentí que estaba muy irritable", subescala: "Estrés" },
        { texto: "Sentí los latidos de mi corazón a pesar de no haber hecho ningún esfuerzo físico", subescala: "Ansiedad" },
        { texto: "Tuve miedo sin razón", subescala: "Ansiedad" },
        { texto: "Sentí que la vida no tenía ningún sentido", subescala: "Depresión" }
    ];
};

// Función para obtener la respuesta del usuario para una pregunta específica
const obtenerRespuestaUsuarioDASS21 = (respuestas, numeroPregunta) => {
    // Buscar en qué categoría (0,1,2,3) está esta pregunta
    for (let puntos = 0; puntos <= 3; puntos++) {
        if (respuestas[puntos] && respuestas[puntos].includes(numeroPregunta)) {
            return {
                puntos: puntos,
                texto: obtenerTextoRespuestaDASS21(puntos),
                interpretacion: obtenerInterpretacionRespuestaDASS21(puntos)
            };
        }
    }
    return { puntos: 0, texto: "No respondida", interpretacion: "Pregunta sin respuesta" };
};

// Función auxiliar para obtener el texto de la respuesta DASS-21
const obtenerTextoRespuestaDASS21 = (puntos) => {
    const respuestasTexto = [
        "No me ha ocurrido",
        "Me ha ocurrido un poco, o durante parte del tiempo",
        "Me ha ocurrido bastante, o durante una buena parte del tiempo",
        "Me ha ocurrido mucho, o la mayor parte del tiempo"
    ];
    
    return respuestasTexto[puntos] || "Respuesta no encontrada";
};

// Función para interpretar cada respuesta individualmente
const obtenerInterpretacionRespuestaDASS21 = (puntos) => {
    if (puntos === 0) return "Respuesta que indica ausencia del síntoma evaluado.";
    if (puntos === 1) return "Respuesta que indica presencia leve o ocasional del síntoma.";
    if (puntos === 2) return "Respuesta que indica presencia moderada del síntoma, requiere atención.";
    if (puntos === 3) return "Respuesta que indica presencia severa del síntoma, requiere intervención.";
    return "Interpretación no disponible.";
};

// Función para generar análisis detallado DASS-21
const generarAnalisisDetalladoDASS21 = (puntajes, respuestas) => {
    const areasAltas = [];
    const areasNormales = [];
    
    // Analizar respuestas por área
    for (let puntos = 2; puntos <= 3; puntos++) {
        if (respuestas[puntos] && respuestas[puntos].length > 0) {
            areasAltas.push(...respuestas[puntos]);
        }
    }
    
    for (let puntos = 0; puntos <= 1; puntos++) {
        if (respuestas[puntos] && respuestas[puntos].length > 0) {
            areasNormales.push(...respuestas[puntos]);
        }
    }
    
    return {
        areas_preocupacion: areasAltas.length > 0 ? 
            `ÁREAS DE PREOCUPACIÓN: Se identificaron síntomas significativos en ${areasAltas.length} ítems evaluados. Las subescalas muestran: Depresión (${puntajes.depresion}/21), Ansiedad (${puntajes.ansiedad}/21), Estrés (${puntajes.estres}/21). Estos resultados sugieren la necesidad de evaluación clínica más detallada.` :
            "ÁREAS DE PREOCUPACIÓN: No se identificaron síntomas significativos en la evaluación actual.",
        
        fortalezas: areasNormales.length > 0 ?
            `FORTALEZAS IDENTIFICADAS: El paciente muestra un funcionamiento adecuado en ${areasNormales.length} áreas evaluadas, lo cual representa recursos importantes para el bienestar emocional y el proceso terapéutico.` :
            "FORTALEZAS IDENTIFICADAS: Se requiere evaluación adicional para identificar recursos personales del paciente.",
        
        recomendaciones: (puntajes.depresion >= 11 || puntajes.ansiedad >= 8 || puntajes.estres >= 13) ?
            "RECOMENDACIONES GENERALES: Los resultados indican niveles severos en una o más subescalas. Se recomienda evaluación psicológica inmediata y consideración de intervención terapéutica especializada." :
            (puntajes.depresion >= 7 || puntajes.ansiedad >= 6 || puntajes.estres >= 10) ?
            "RECOMENDACIONES GENERALES: Se evidencian síntomas moderados que requieren atención profesional. Se sugiere evaluación psicológica y posible inicio de intervención terapéutica." :
            "RECOMENDACIONES GENERALES: Los resultados actuales se encuentran en rangos normales a leves. Se recomienda mantener estrategias de autocuidado y reevaluación periódica."
    };
};

// Función para generar recomendaciones clínicas específicas DASS-21
const generarRecomendacionesClinicasDASS21 = (puntajes) => {
    const recomendaciones = [];
    
    // Recomendaciones basadas en depresión
    if (puntajes.depresion >= 11) {
        recomendaciones.push("Evaluación inmediata para síntomas depresivos severos");
        recomendaciones.push("Considerar derivación a psiquiatría para evaluación de medicación");
        recomendaciones.push("Implementar protocolo de seguridad y evaluación de riesgo suicida");
    } else if (puntajes.depresion >= 7) {
        recomendaciones.push("Iniciar terapia cognitivo-conductual para síntomas depresivos");
        recomendaciones.push("Monitoreo regular del estado de ánimo");
    }
    
    // Recomendaciones basadas en ansiedad
    if (puntajes.ansiedad >= 8) {
        recomendaciones.push("Intervención especializada para trastornos de ansiedad");
        recomendaciones.push("Enseñar técnicas de relajación y manejo de la ansiedad");
        recomendaciones.push("Evaluar necesidad de medicación ansiolítica");
    } else if (puntajes.ansiedad >= 6) {
        recomendaciones.push("Implementar técnicas de manejo de ansiedad");
        recomendaciones.push("Terapia de exposición gradual si es apropiada");
    }
    
    // Recomendaciones basadas en estrés
    if (puntajes.estres >= 13) {
        recomendaciones.push("Intervención inmediata para manejo del estrés severo");
        recomendaciones.push("Identificar y modificar factores estresantes");
        recomendaciones.push("Implementar técnicas de afrontamiento efectivas");
    } else if (puntajes.estres >= 10) {
        recomendaciones.push("Enseñar estrategias de manejo del estrés");
        recomendaciones.push("Evaluar factores estresantes en el entorno del paciente");
    }
    
    // Recomendaciones generales
    if (recomendaciones.length === 0) {
        recomendaciones.push("Continuar con estrategias de autocuidado y bienestar");
        recomendaciones.push("Reevaluación en 6 meses o según necesidad clínica");
        recomendaciones.push("Mantener rutinas saludables de ejercicio y sueño");
    } else {
        recomendaciones.push("Involucrar red de apoyo familiar y social");
        recomendaciones.push("Seguimiento regular para monitorear progreso");
        recomendaciones.push("Psicoeducación sobre síntomas y estrategias de afrontamiento");
    }
    
    return recomendaciones;
};
