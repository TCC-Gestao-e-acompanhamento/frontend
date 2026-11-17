import type { ReactNode } from 'react'
import type { Etapa } from '../types'
import { cn, formatDate } from '../lib/format'
import { Icon } from './Icon'

/** Linha do tempo das etapas do TCC 1 e TCC 2. `acaoAtual` aparece sob a etapa atual (ex.: concluir a etapa). */
export function Stepper({ etapas, acaoAtual }: { etapas: Etapa[]; acaoAtual?: ReactNode }) {
  return (
    <ol className="space-y-0">
      {etapas.map((e, i) => {
        const last = i === etapas.length - 1
        const novaFase = i === 0 || etapas[i - 1].fase !== e.fase
        return (
          <li key={e.nome} aria-current={e.situacao === 'atual' ? 'step' : undefined} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && (
              <span
                aria-hidden="true"
                className={cn('absolute top-7 left-3.5 -ml-px h-[calc(100%-1.75rem)] w-0.5', e.situacao === 'concluida' ? 'bg-accent-600' : 'bg-border')}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                'z-10 grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold',
                e.situacao === 'concluida' && 'border-accent-600 bg-accent-600 text-white',
                e.situacao === 'atual' && 'border-brand-700 bg-surface text-brand-700',
                e.situacao === 'futura' && 'border-border bg-surface text-ink-muted',
              )}
            >
              {e.situacao === 'concluida' ? <Icon name="check" size={14} /> : i + 1}
            </span>
            <div className="pt-0.5">
              {novaFase && <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{e.fase === 'TCC1' ? 'TCC 1' : 'TCC 2'}</p>}
              <p className={cn('text-sm', e.situacao === 'atual' ? 'font-semibold' : 'font-medium', e.situacao === 'futura' && 'text-ink-muted')}>
                {e.nome}
              </p>
              <p className="text-xs text-ink-muted">
                {e.situacao === 'concluida' ? 'Concluída' : e.situacao === 'atual' ? 'Etapa atual' : 'Próxima etapa'}
                {e.concluidaEm && ` em ${formatDate(e.concluidaEm)}${e.concluidaPor ? ` por ${e.concluidaPor}` : ''}`}
                {e.prazo && e.situacao !== 'concluida' && ` · até ${formatDate(e.prazo)}`}
              </p>
              {e.situacao === 'atual' && acaoAtual && <div className="mt-2">{acaoAtual}</div>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
