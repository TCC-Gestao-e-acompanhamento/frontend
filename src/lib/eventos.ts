import type { CalendarTone } from '../design-system'
import type { EventoCalendario } from '../types'

export function toneDoEvento(e: EventoCalendario): CalendarTone {
  if (e.tipo === 'defesa') return 'success'
  return e.fase === 'TCC1' ? 'brand' : 'neutral'
}

export function rotuloDoEvento(e: EventoCalendario): string {
  if (e.tipo === 'defesa') return 'Defesa'
  return e.fase === 'TCC1' ? 'Prazo TCC 1' : 'Prazo TCC 2'
}
