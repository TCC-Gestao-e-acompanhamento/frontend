import type { ReactNode } from 'react'
import { Badge } from '../design-system'
import { formatDate } from '../lib/format'
import type { Feedback } from '../types'

interface Props {
  items: Feedback[]
  showAluno?: boolean
  /** Ação opcional por item (ex.: marcar correção como resolvida). */
  acao?: (f: Feedback) => ReactNode
}

export function FeedbackList({ items, showAluno = false, acao }: Props) {
  return (
    <ul className="space-y-3">
      {items.map((f) => (
        <li key={f.id} className="rounded-lg border border-border p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone={f.tipo === 'correcao' ? 'warning' : 'neutral'}>{f.tipo === 'correcao' ? 'Correção solicitada' : 'Comentário'}</Badge>
            {f.tipo === 'correcao' && <Badge tone={f.resolvido ? 'success' : 'danger'}>{f.resolvido ? 'Resolvida' : 'Pendente'}</Badge>}
            <span className="text-sm text-ink-muted">
              {f.autorNome} · {formatDate(f.data)}
              {showAluno && <> · {f.alunoNome}</>}
            </span>
          </div>
          <p className="text-sm">{f.texto}</p>
          {f.documentoNome && <p className="mt-2 text-xs text-ink-muted">Sobre: {f.documentoNome}</p>}
          {acao && <div className="mt-3">{acao(f)}</div>}
        </li>
      ))}
    </ul>
  )
}
