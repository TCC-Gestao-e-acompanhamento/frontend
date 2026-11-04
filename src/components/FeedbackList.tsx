import { Badge } from '../design-system'
import { formatDate } from '../lib/format'
import type { Feedback } from '../types'

export function FeedbackList({ items, showAluno = false }: { items: Feedback[]; showAluno?: boolean }) {
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
        </li>
      ))}
    </ul>
  )
}
