/*  ------------------------ aiBack.js ---------------------------
	Este archivo se encarga de manejar la conexion con OpenAI
    Especificamente es para las respuestas con IA
	Back se refiere a que se usará para logica interna
    Solicita el historial (para contexto) y la acción a realizar
	--------------------------------------------------------------
*/

import OpenAI from 'openai'
import { obtenerHist, saveHist, registrarUsuario, switchFlujo } from '../../queries/queries.js'
import { registerPrompt } from '../../openAi/prompts.js'

//---------------------------------------------------------------------------------------------------------

const aiRegister = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

//---------------------------------------------------------------------------------------------------------

async function register(conversationHistory, number) {
	const hist = [...conversationHistory]
	hist.shift()
	hist.push({
		role: 'system',
		content: `Extrae en formato json la informacion del usuario con este formato:
		{
		"nombre":"",
		"apellido":"",
		}`,
	})
	const jsonRegister = await aiRegister.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: hist,
		response_format: { type: 'json_object' },
	})
	const responseJson = JSON.parse(jsonRegister.choices[0].message.content)

	const { nombre, apellido } = responseJson

	await registrarUsuario(nombre, apellido, number)
	await switchFlujo(number, 'assistantFlow')

	return {
		success: true,
		result: responseJson,
		message: 'Usuario registrado',
	}
}

//---------------------------------------------------------------------------------------------------------

// Definición de herramientas
const tools = [
	{
		type: 'function',
		function: {
			name: 'register',
			description: `Cuando los siguientes campos esten llenos y el usuario haya confirmado, se debe registrar el usuario:
			1. Nombres
			2. Apellidos

	`,
			parameters: {
				type: 'object',
				properties: {},
			},
		},
	},
]

//---------------------------------------------------------------------------------------------------------

export async function apiRegister(numero, msg) {
	const conversationHistory = await obtenerHist(numero)
	conversationHistory.unshift({ role: 'system', content: registerPrompt })
	conversationHistory.push({ role: 'user', content: msg })
	try {
		const response = await aiRegister.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: conversationHistory,
			tools: tools,
		})

		const assistantMessage = response.choices[0].message.content
		const toolCalls = response.choices[0].message.tool_calls

		if (toolCalls && toolCalls.length > 0) {
			for (const call of toolCalls) {
				if (call.type === 'function' && call.function.name === 'register') {
					await register(conversationHistory, numero)

					const answ =
						'Registrado con éxito'
					conversationHistory.push({ role: 'assistant', content: answ })
					conversationHistory.shift()
					await saveHist(numero, conversationHistory)
					return answ
				}
			}
		} else {
			conversationHistory.push({ role: 'assistant', content: assistantMessage })
			conversationHistory.shift()
			await saveHist(numero, conversationHistory)
			return assistantMessage
		}
	} catch (error) {
		console.error('Error al obtener la respuesta de OpenAI:', error)
		throw new Error('Hubo un error al procesar la solicitud.')
	}
}

//---------------------------------------------------------------------------------------------------------
