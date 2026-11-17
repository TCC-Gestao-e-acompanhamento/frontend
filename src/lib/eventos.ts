import type { CalendarTone } from '../design-system'
import type { EventoCalendario } from '../types'

export function toneDoEvento(e: EventoCalendario): CalendarTone {
  return e.tipo === 'defesa' ? 'success' : 'warning'
}

export function rotuloDoEvento(e: EventoCalendario): string {
  return e.tipo === 'defesa' ? 'Defesa' : 'Inscrição'
}
