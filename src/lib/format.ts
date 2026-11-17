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

/** "1 pendência" / "3 pendências". */
export function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`
}

/** Date -> "yyyy-mm-dd" (data local). */
export function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

export function monthTitle(d: Date): string {
  const s = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** "5 de novembro de 2026" */
export function formatDateLong(iso: string): string {
  return parseDate(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Semestre letivo de uma data: março a julho = 1; agosto a dezembro (e janeiro/fevereiro) = 2. Ex.: "2026/2". */
export function semestreDe(data: Date): string {
  const m = data.getMonth()
  return m >= 2 && m <= 6 ? `${data.getFullYear()}/1` : `${m <= 1 ? data.getFullYear() - 1 : data.getFullYear()}/2`
}

/** O semestre atual e os dois seguintes, para escolher o semestre pretendido. */
export function proximosSemestres(base: Date = new Date()): string[] {
  const out = [semestreDe(base)]
  for (let i = 0; i < 2; i++) {
    const [ano, parte] = out[out.length - 1].split('/').map(Number)
    out.push(parte === 1 ? `${ano}/2` : `${ano + 1}/1`)
  }
  return out
}

/** Máscara de semestre letivo enquanto se digita: só números, no formato 2027/1 (o último dígito é 1 ou 2). */
export function mascaraSemestre(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 5)
  if (digitos.length <= 4) return digitos
  return /[12]/.test(digitos[4]) ? `${digitos.slice(0, 4)}/${digitos[4]}` : digitos.slice(0, 4)
}

