import { Badge } from '../design-system'
import { daysUntil, formatDate, relativeDays } from '../lib/format'
import type { PrazoInstitucional } from '../types'

export function DeadlineList({ items }: { items: PrazoInstitucional[] }) {
  return (
    <ol className="divide-y divide-border">
      {items.map((p) => (
        <li key={p.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
          <div className="w-14 shrink-0 rounded-lg bg-brand-50 py-1.5 text-center text-brand-700">
            <p className="text-lg leading-none font-semibold">{formatDate(p.data).slice(0, 2)}</p>
            <p className="text-xs uppercase">{new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{p.titulo}</p>
            <p className="text-sm text-ink-muted">
              {formatDate(p.data)} · {daysUntil(p.data) >= 0 ? relativeDays(p.data) : 'encerrado'}
            </p>
          </div>
          <Badge tone={p.fase === 'TCC1' ? 'brand' : 'neutral'}>{p.fase === 'TCC1' ? 'TCC 1' : 'TCC 2'}</Badge>
        </li>
      ))}
    </ol>
  )
}
