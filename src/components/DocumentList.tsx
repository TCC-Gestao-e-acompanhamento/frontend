import { Icon } from '../design-system'
import { formatDate } from '../lib/format'
import type { Documento } from '../types'
import { StatusBadge } from './StatusBadge'

export function DocumentList({ items, showAluno = false }: { items: Documento[]; showAluno?: boolean }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((d) => (
        <li key={d.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
            <Icon name="file" size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {d.nome} <span className="font-normal text-ink-muted">· versão {d.versao}</span>
            </p>
            <p className="text-sm text-ink-muted">
              {d.tipo}
              {showAluno && <> · {d.alunoNome}</>} · enviado em {formatDate(d.enviadoEm)}
            </p>
          </div>
          <StatusBadge kind="documento" value={d.status} />
        </li>
      ))}
    </ul>
  )
}
