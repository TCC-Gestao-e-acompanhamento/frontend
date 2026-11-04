import type { ReactNode } from 'react'
import { cn } from '../lib/format'

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-muted text-ink-muted border-border',
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  success: 'bg-accent-50 text-success border-accent-50',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
}

/** O texto sempre descreve o estado: cor nunca é o único indicador. */
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', tones[tone])}>
      {children}
    </span>
  )
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-2 w-full overflow-hidden rounded-full bg-brand-100"
    >
      <div className="h-full rounded-full bg-accent-600" style={{ width: `${value}%` }} />
    </div>
  )
}
