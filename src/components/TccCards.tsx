import { Link } from 'react-router-dom'
import { ProgressBar } from '../design-system'
import { plural } from '../lib/format'
import type { Tcc } from '../types'
import { StatusBadge } from './StatusBadge'

/** Orientandos em cartões: o cartão inteiro abre o trabalho. */
export function TccCards({ items, basePath }: { items: Tcc[]; basePath: string }) {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {items.map((t) => (
        <li key={t.id}>
          <Link
            to={`${basePath}/${t.id}`}
            className="group flex h-full flex-col gap-3 rounded-card border border-border p-5 transition-colors hover:border-brand-500 hover:bg-brand-50/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-brand-700 group-hover:underline">{t.aluno.nome}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">{t.titulo}</p>
              </div>
              <StatusBadge kind="tcc" value={t.status} />
            </div>
            <p className="text-sm">
              <span className="font-medium">{t.fase === 'TCC1' ? 'TCC 1' : 'TCC 2'}</span>
              <span className="text-ink-muted"> · {t.etapaAtual}</span>
            </p>
            <div className="mt-auto">
              <ProgressBar value={t.progresso} label={`Progresso de ${t.aluno.nome}`} />
              <p className="mt-1 text-xs text-ink-muted">
                {t.progresso}%{t.pendencias > 0 && ` · ${plural(t.pendencias, 'pendência', 'pendências')}`}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
