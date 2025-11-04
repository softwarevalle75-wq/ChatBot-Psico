export const onlyDigits = (v) =>
  String(v ?? '').replace(/[^\d]/g, '')

export const toJid = (msisdn) => `${onlyDigits(msisdn)}@s.whatsapp.net`

export const phoneFromAny = (candidate) => {
  if (!candidate) return null
  
  const str = String(candidate)
  
  // 🔥 NUNCA extraer de LIDs
  if (str.includes('@lid')) {
    return null
  }
  
  // 🔥 LID con : en JID normal (310254561257:73@s.whatsapp.net)
  let match = str.match(/(\d{10,15}):\d+@s\.whatsapp\.net/)
  if (match) {
    console.log('🔍 LID en JID detectado:', match[1])
    return match[1]
  }
  
  // 🔥 JID normal (573122038876@s.whatsapp.net)
  match = str.match(/(\d{10,15})@s\.whatsapp\.net/)
  if (match) {
    console.log('🔍 JID normal detectado:', match[1])
    return match[1]
  }
  
  // 🔥 Solo dígitos (pero con validación de longitud)
  match = str.match(/\d{10,15}/)
  if (match) {
    console.log('🔍 Solo dígitos detectado:', match[0])
    return match[0]
  }
  
  return null
}

export const getRealPhoneFromCtx = (ctx) => {
  try {
    // 🔥 PRIORIDAD 1: ctx.senderPn
    if (ctx?.senderPn) {
      const clean = onlyDigits(ctx.senderPn)
      console.log('✅ Usando ctx.senderPn:', clean)
      return clean
    }
    
    // 🔥 PRIORIDAD 2: Evaluar remoteJid vs remoteJidAlt
    const remoteJid = ctx?.key?.remoteJid
    const remoteJidAlt = ctx?.key?.remoteJidAlt
    
    console.log('🔍 remoteJid:', remoteJid)
    console.log('🔍 remoteJidAlt:', remoteJidAlt)
    
    // Intentar extraer de remoteJidAlt primero (si no tiene @lid)
    if (remoteJidAlt && !remoteJidAlt.includes('@lid')) {
      const phone = phoneFromAny(remoteJidAlt)
      if (phone && phone.length >= 10) {
        console.log('✅ Número extraído de remoteJidAlt:', phone)
        return phone
      }
    }
    
    // Intentar extraer de remoteJid (si no tiene @lid)
    if (remoteJid && !remoteJid.includes('@lid')) {
      const phone = phoneFromAny(remoteJid)
      if (phone && phone.length >= 10) {
        console.log('✅ Número extraído de remoteJid:', phone)
        return phone
      }
    }
    
    // 🔥 PRIORIDAD 3: Otros candidatos (filtrando @lid)
    const cands = [
      ctx?.from,
      ctx?.key?.participant,
      ctx?.sender,
      ctx?.participant,
    ]
    
    for (const c of cands) {
      if (!c || c.includes('@lid')) continue
      
      const p = phoneFromAny(c)
      if (p && p.length >= 10) {
        console.log('✅ Número extraído de candidato:', p)
        return p
      }
    }
    
    console.log('❌ No se encontró número válido (solo LIDs disponibles)')
    return null
    
  } catch (e) {
    console.error('❌ Error en getRealPhoneFromCtx:', e)
    return null
  }
}

export const getRealJidFromCtx = (ctx) => {
  const p = getRealPhoneFromCtx(ctx)
  return p ? toJid(p) : null
}

export const ensureJid = (input) => {
  const phone = phoneFromAny(input)
  if (!phone) throw new Error(`Número/JID inválido: ${input}`)
  return toJid(phone)
}