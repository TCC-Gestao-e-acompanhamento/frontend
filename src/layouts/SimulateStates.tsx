import { Link, useLocation } from 'react-router-dom'
import { cn } from '../lib/format'

const MODES = [
  { key: '', label: 'Normal' },
  { key: 'loading', label: 'Carregando' },
  { key: 'error', label: 'Erro' },
  { key: 'empty', label: 'Vazio' },
]

/** Apenas protótipo: permite demonstrar os estados de tela via ?mock=. */
export function SimulateStates() {
  const { pathname, search } = useLocation()
  const current = new URLSearchParams(search).get('mock') ?? ''
  return (
    <div className="rounded-lg border border-dashed border-border p-3">
      <p className="mb-2 text-xs font-medium text-ink-muted">Protótipo · simular estado</p>
      <div className="flex flex-wrap gap-1">
        {MODES.map((m) => (
          <Link
            key={m.key}
            to={{ pathname, search: m.key ? `?mock=${m.key}` : '' }}
            aria-current={current === m.key ? 'true' : undefined}
            className={cn(
              'inline-flex min-h-8 items-center rounded-md px-2.5 text-xs',
              current === m.key ? 'bg-brand-700 text-white' : 'bg-surface-muted text-ink-muted hover:text-ink',
            )}
          >
            {m.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
