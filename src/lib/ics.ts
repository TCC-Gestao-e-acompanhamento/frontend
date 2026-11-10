/** Exportação de eventos para .ics (importável no Google Agenda, Apple Calendário, Outlook). */
import { parseDate, toIso } from './format'

interface EventoIcs {
  id: string
  data: string
  titulo: string
  detalhe?: string
}

const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
const dia = (iso: string) => iso.replace(/-/g, '')

/** RFC 5545: linhas com mais de 75 octetos são dobradas (CRLF + espaço). */
function dobrar(linha: string): string {
  const enc = new TextEncoder()
  if (enc.encode(linha).length <= 75) return linha
  const partes: string[] = []
  let atual = ''
  let bytes = 0
  let limite = 75
  for (const ch of linha) {
    const n = enc.encode(ch).length
    if (bytes + n > limite) {
      partes.push(atual)
      atual = ''
      bytes = 0
      limite = 74 // o espaço inicial das linhas seguintes conta 1 octeto
    }
    atual += ch
    bytes += n
  }
  partes.push(atual)
  return partes.join('\r\n ')
}

export function buildIcs(eventos: EventoIcs[]): string {
  const carimbo = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
  const linhas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Gestao de TCC//PT-BR', 'CALSCALE:GREGORIAN']
  for (const e of eventos) {
    const fim = parseDate(e.data)
    fim.setDate(fim.getDate() + 1)
    linhas.push(
      'BEGIN:VEVENT',
      `UID:${e.id}@gestao-tcc.example`,
      `DTSTAMP:${carimbo}`,
      `DTSTART;VALUE=DATE:${dia(e.data)}`,
      `DTEND;VALUE=DATE:${dia(toIso(fim))}`,
      `SUMMARY:${esc(e.titulo)}`,
      ...(e.detalhe ? [`DESCRIPTION:${esc(e.detalhe)}`] : []),
      'END:VEVENT',
    )
  }
  linhas.push('END:VCALENDAR')
  return linhas.map(dobrar).join('\r\n') + '\r\n'
}

export function baixarIcs(nome: string, conteudo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revogar logo após o clique pode cancelar o download no Safari/Firefox.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
