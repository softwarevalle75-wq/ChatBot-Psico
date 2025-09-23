import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Función para generar el PDF con los resultados detallados
export const generarPDFResultados = async (numeroUsuario, puntaje, respuestas, umbrales) => {
    return new Promise((resolve, reject) => {
        try {
            // Crear documento PDF
            const doc = new PDFDocument({ margin: 50 });
            const fileName = `GHQ12_${numeroUsuario}.pdf`;
            const filePath = path.resolve('./temp', fileName);
            
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
               .text('Cuestionario de Salud General (GHQ-12)', { align: 'center' })
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
               .text('El GHQ-12 (General Health Questionnaire) es un instrumento de screening diseñado para detectar trastornos psiquiátricos no psicóticos en entornos comunitarios y médicos. Evalúa el bienestar psicológico general y la presencia de síntomas de malestar emocional.')
               .moveDown(0.5)
               .text('• Número total de preguntas: 12')
               .text('• Tiempo de administración: 5-10 minutos')
               .text('• Rango de puntuación: 0-36 puntos')
               .moveDown(1.5);
            
            // RESULTADOS GENERALES
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('RESULTADOS GENERALES:', { underline: true })
               .moveDown(0.5);
            
            const categoria = determinarCategoria(puntaje, umbrales);
            doc.font('Helvetica')
               .fontSize(12)
               .text(`Puntaje total obtenido: ${puntaje}/36`)
               .text(`Categoría de resultado: ${categoria.nombre}`)
               .text(`Interpretación: ${categoria.interpretacion}`)
               .moveDown(1);
            
            // ANÁLISIS DETALLADO POR PREGUNTA
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('ANÁLISIS DETALLADO DE RESPUESTAS:', { underline: true })
               .moveDown(0.5);
            
            const preguntasCompletas = obtenerPreguntasCompletas();
            
            for (let i = 0; i < preguntasCompletas.length; i++) {
                const pregunta = preguntasCompletas[i];
                const respuestaUsuario = obtenerRespuestaUsuario(respuestas, i + 1);
                
                // Verificar si necesitamos nueva página
                if (doc.y > 700) {
                    doc.addPage();
                }
                
                doc.fontSize(11)
                   .font('Helvetica-Bold')
                   .text(`Pregunta ${i + 1}:`, { continued: false })
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
            
            const analisisDetallado = generarAnalisisDetallado(puntaje, respuestas, umbrales);
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
            
            const recomendaciones = generarRecomendacionesClinicas(puntaje, umbrales);
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

// Función auxiliar para determinar la categoría del resultado
const determinarCategoria = (puntaje, umbrales) => {
    if (puntaje <= umbrales.bajo.max) {
        return {
            nombre: "Bajo riesgo",
            interpretacion: "No se evidencian síntomas significativos de malestar psicológico. El paciente presenta un funcionamiento psicológico dentro de los parámetros normales."
        };
    } else if (puntaje >= umbrales.medio.min && puntaje <= umbrales.medio.max) {
        return {
            nombre: "Riesgo moderado",
            interpretacion: "Se evidencia cierto grado de preocupación emocional. Se recomienda evaluación más detallada y posible intervención psicológica."
        };
    } else {
        return {
            nombre: "Riesgo alto",
            interpretacion: "Se evidencia malestar psicológico significativo. Se requiere evaluación psicológica profesional inmediata y posible tratamiento."
        };
    }
};

// Función para obtener las preguntas completas (debes adaptarla a tu estructura)
const obtenerPreguntasCompletas = () => {
    return [
        { texto: "¿Ha podido concentrarse bien en lo que hace?" },
        { texto: "¿Sus preocupaciones le han hecho perder mucho el sueño?" },
        { texto: "¿Ha sentido que está desempeñando un papel útil en la vida?" },
        { texto: "¿Se ha sentido capaz de tomar decisiones?" },
        { texto: "¿Se ha sentido constantemente agobiado y en tensión?" },
        { texto: "¿Ha sentido que no puede superar sus dificultades?" },
        { texto: "¿Ha sido capaz de disfrutar de sus actividades normales de cada día?" },
        { texto: "¿Ha sido capaz de hacer frente adecuadamente a sus problemas?" },
        { texto: "¿Se ha sentido poco feliz o deprimido/a?" },
        { texto: "¿Ha perdido confianza en sí mismo/a?" },
        { texto: "¿Ha pensado que usted es una persona que no vale para nada?" },
        { texto: "¿Se siente razonablemente feliz considerando todas las circunstancias?" }
    ];
};

// Función para obtener la respuesta del usuario para una pregunta específica
const obtenerRespuestaUsuario = (respuestas, numeroPregunta) => {
    // Buscar en qué categoría (0,1,2,3) está esta pregunta
    for (let puntos = 0; puntos <= 3; puntos++) {
        if (respuestas[puntos] && respuestas[puntos].includes(numeroPregunta)) {
            return {
                puntos: puntos,
                texto: obtenerTextoRespuesta(numeroPregunta, puntos),
                interpretacion: obtenerInterpretacionRespuesta(numeroPregunta, puntos)
            };
        }
    }
    return { puntos: 0, texto: "No respondida", interpretacion: "Pregunta sin respuesta" };
};

// Función auxiliar para obtener el texto de la respuesta
const obtenerTextoRespuesta = (numeroPregunta, puntos) => {
    const respuestasTexto = {
        1: ["Mejor que lo habitual", "Igual que lo habitual", "Menos que lo habitual", "Mucho menos que lo habitual"],
        2: ["No, en absoluto", "Igual que lo habitual", "Más que lo habitual", "Mucho más que lo habitual"],
        3: ["Más que lo habitual", "Igual que lo habitual", "Menos que lo habitual", "Mucho menos que lo habitual"],
        // ... agregar todas las preguntas
    };
    
    return respuestasTexto[numeroPregunta] ? respuestasTexto[numeroPregunta][puntos] : "Respuesta no encontrada";
};

// Función para interpretar cada respuesta individualmente
const obtenerInterpretacionRespuesta = (numeroPregunta, puntos) => {
    if (puntos === 0) return "Respuesta que indica bienestar psicológico óptimo en esta área.";
    if (puntos === 1) return "Respuesta que indica funcionamiento normal sin alteraciones.";
    if (puntos === 2) return "Respuesta que sugiere cierta preocupación en esta área específica.";
    if (puntos === 3) return "Respuesta que indica malestar significativo en esta área, requiere atención.";
    return "Interpretación no disponible.";
};

// Función para generar análisis detallado
const generarAnalisisDetallado = (puntaje, respuestas, umbrales) => {
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
            `ÁREAS DE PREOCUPACIÓN: Se identificaron dificultades en ${areasAltas.length} áreas evaluadas (preguntas ${areasAltas.join(', ')}). Estas respuestas sugieren la presencia de síntomas que pueden estar interfiriendo con el funcionamiento diario del paciente y requieren atención clínica.` :
            "ÁREAS DE PREOCUPACIÓN: No se identificaron áreas significativas de preocupación en la evaluación.",
        
        fortalezas: areasNormales.length > 0 ?
            `FORTALEZAS IDENTIFICADAS: El paciente muestra un funcionamiento adecuado en ${areasNormales.length} áreas evaluadas (preguntas ${areasNormales.join(', ')}), lo cual representa recursos personales importantes para el proceso terapéutico.` :
            "FORTALEZAS IDENTIFICADAS: Se requiere evaluación adicional para identificar recursos personales del paciente.",
        
        recomendaciones: puntaje >= umbrales.alto.min ?
            "RECOMENDACIONES GENERALES: Los resultados sugieren la necesidad de una evaluación psicológica comprensiva y el inicio de intervención terapéutica. Se recomienda priorizar este caso debido al nivel significativo de malestar identificado." :
            puntaje >= umbrales.medio.min ?
            "RECOMENDACIONES GENERALES: Se sugiere monitoreo regular y evaluación de la necesidad de apoyo psicológico. Considerar factores estresantes actuales y recursos de afrontamiento del paciente." :
            "RECOMENDACIONES GENERALES: Mantener seguimiento de bienestar general. Los resultados actuales no sugieren necesidad inmediata de intervención, pero se recomienda reevaluación periódica."
    };
};

// Función para generar recomendaciones clínicas específicas
const generarRecomendacionesClinicas = (puntaje, umbrales) => {
    if (puntaje >= umbrales.alto.min) {
        return [
            "Programar evaluación psicológica completa en un plazo máximo de 7 días",
            "Considerar derivación a psiquiatría si se evidencian síntomas severos",
            "Evaluar riesgo suicida y factores de seguridad",
            "Iniciar intervención psicoterapéutica según el enfoque más adecuado",
            "Proporcionar recursos de crisis y números de emergencia",
            "Involucrar red de apoyo familiar y social cuando sea apropiado"
        ];
    } else if (puntaje >= umbrales.medio.min) {
        return [
            "Programar seguimiento en 2-4 semanas",
            "Evaluar factores estresantes específicos actuales",
            "Considerar intervenciones de apoyo psicológico breve",
            "Promover estrategias de autocuidado y manejo del estrés",
            "Monitorear evolución de síntomas",
            "Reevaluar necesidad de intervención más intensiva"
        ];
    } else {
        return [
            "Continuar con evaluaciones de rutina según protocolo",
            "Reforzar estrategias de bienestar y prevención",
            "Mantener canales de comunicación abiertos",
            "Reevaluar en 3-6 meses o según necesidad clínica",
            "Promover factores protectores de salud mental"
        ];
    }
};


// // ✅ FUNCIÓN PARA ENVIAR PDF AL PRACTICANTE
// export const enviarPDFAlPracticante = async (telefonoPracticante, rutaPDF, sendAutonomousMessage) => {
//     try {
//         // Mensaje previo
//         await sendAutonomousMessage(
//             telefonoPracticante,
//             "📎 *Enviando reporte PDF...*"
//         );
        
//         // Aquí puedes intentar diferentes métodos de envío
//         // Por ahora, notificamos que el PDF está listo
//         await sendAutonomousMessage(
//             telefonoPracticante, 
//             "✅ *PDF generado exitosamente*\n\n" +
//             "📋 *Reporte GHQ-12 - Evaluación Psicológica*\n\n" +
//             "El reporte detallado incluye:\n" +
//             "• 📊 Análisis completo por pregunta\n" +
//             "• 🧠 Interpretación psicológica profesional\n" +
//             "• 📋 Recomendaciones clínicas específicas\n" +
//             "• ⚠️ Evaluación de áreas críticas\n\n" +
//             `📄 *Archivo guardado:* ${path.basename(rutaPDF)}\n\n` +
//             "_El PDF está disponible para descarga o puede ser enviado por otro medio._"
//         );
        
//         console.log('✅ Notificación de PDF enviada exitosamente');
//         return true;
        
//     } catch (error) {
//         console.error('❌ Error notificando PDF:', error);
        
//         // Fallback: solo notificar que se completó
//         try {
//             await sendAutonomousMessage(
//                 telefonoPracticante,
//                 "📋 *Evaluación completada*\n\nSe generó un reporte pero hubo problemas en la notificación."
//             );
//         } catch (fallbackError) {
//             console.error('❌ Error en fallback de notificación:', fallbackError);
//         }
        
//         throw error;
//     }
// }