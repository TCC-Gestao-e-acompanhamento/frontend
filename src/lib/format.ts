const MS_DIA = 86_400_000

/** Interpreta "yyyy-mm-dd" (ou ISO completo) como data local, sem deslocamento de fuso. */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDate(iso: string): string {
  return parseDate(iso).toLocaleDateString('pt-BR')
}

export function formatMonth(iso: string): string {
  const s = parseDate(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function daysUntil(iso: string): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.round((parseDate(iso).getTime() - hoje.getTime()) / MS_DIA)
}

export function relativeDays(iso: string): string {
  const n = daysUntil(iso)
  if (n === 0) return 'hoje'
  if (n === 1) return 'amanhã'
  if (n > 1) return `em ${n} dias`
  if (n === -1) return 'ontem'
  return `há ${Math.abs(n)} dias`
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function initials(nome: string): string {
  return nome
    .replace(/^(Prof\.?a?\.?|Dr\.?a?\.?)\s+/gi, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}
