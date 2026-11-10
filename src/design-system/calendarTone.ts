export type CalendarTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger'

export const DOT: Record<CalendarTone, string> = {
  brand: 'bg-brand-700',
  neutral: 'bg-ink-muted',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

export function eventDot(tone: CalendarTone): string {
  return DOT[tone]
}
