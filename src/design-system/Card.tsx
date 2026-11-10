import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/format'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-card border border-border bg-surface', className)} {...rest} />
}

interface SectionCardProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  id?: string
}

/** Cartão com cabeçalho. Usa <section> rotulado pelo título (acessibilidade). */
export function SectionCard({ title, description, action, children, className, id }: SectionCardProps) {
  const headingId = `${id ?? title.replace(/\W+/g, '-').toLowerCase()}-title`
  return (
    <section aria-labelledby={headingId} className={cn('rounded-card border border-border bg-surface', className)}>
      <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 id={headingId} className="text-base font-semibold">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: string
  tone?: 'default' | 'warning' | 'danger' | 'success'
}

const toneText = { default: 'text-ink', warning: 'text-warning', danger: 'text-danger', success: 'text-success' }

/** Indicadores lado a lado, separados por filetes finos dentro de uma única moldura. */
export function StatGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-fr', className)}>
      {children}
    </div>
  )
}

export function StatCard({ label, value, hint, tone = 'default' }: StatCardProps) {
  return (
    <div className="bg-surface p-5">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className={cn('mt-1 text-2xl font-semibold tabular-nums', toneText[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}
