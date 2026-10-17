// Funções de data compartilhadas (prazos e tempo relativo).

export function diasRestantes(prazo) {
  if (!prazo) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const data = new Date(prazo + 'T00:00:00')
  return Math.round((data - hoje) / (1000 * 60 * 60 * 24))
}

export function textoPrazo(prazo) {
  const dias = diasRestantes(prazo)
  if (dias === null) return { texto: '—', vencido: false }
  if (dias < 0) return { texto: `vencido há ${Math.abs(dias)} dia(s)`, vencido: true }
  if (dias === 0) return { texto: 'vence hoje', vencido: false, urgente: true }
  return { texto: `em ${dias} dia(s)`, vencido: false }
}

export function tempoRelativo(dataIso) {
  if (!dataIso) return ''
  const minutos = Math.round((Date.now() - new Date(dataIso).getTime()) / 60000)
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.round(horas / 24)
  if (dias === 1) return 'ontem'
  return `há ${dias} dias`
}
