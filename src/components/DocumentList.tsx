import { Link } from 'react-router-dom'
import { Icon } from '../design-system'
import { formatDate, plural } from '../lib/format'
import type { Documento } from '../types'
import { StatusBadge } from './StatusBadge'

interface Props {
  items: Documento[]
  showAluno?: boolean
  /** Quando informado, a linha inteira abre o visualizador com os comentários e o retorno do orientador. */
  hrefFor?: (d: Documento) => string
}

export function DocumentList({ items, showAluno = false, hrefFor }: Props) {
  return (
    <ul className="divide-y divide-border">
      {items.map((d) => {
        const href = hrefFor?.(d)
        const conteudo = (
          <>
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
              <Icon name="file" size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-brand-700 group-hover:underline">
                {d.nome} <span className="font-normal text-ink-muted">· versão {d.versao}</span>
              </p>
              <p className="text-sm text-ink-muted">
                {d.tipo}
                {showAluno && <> · {d.alunoNome}</>} · enviado em {formatDate(d.enviadoEm)}
                {d.anotacoes && d.anotacoes.total > 0 && (
                  <> · {plural(d.anotacoes.total, 'comentário', 'comentários')}{d.anotacoes.abertas > 0 && `, ${plural(d.anotacoes.abertas, 'aberto', 'abertos')}`}</>
                )}
                {!!d.correcoesPendentes && <> · {plural(d.correcoesPendentes, 'correção pendente', 'correções pendentes')}</>}
              </p>
            </div>
            <StatusBadge kind="documento" value={d.status} />
          </>
        )
        return (
          <li key={d.id}>
            {href ? (
              <Link to={href} className="group -mx-3 flex min-h-11 items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-surface-muted">
                {conteudo}
              </Link>
            ) : (
              <div className="flex items-start gap-3 py-3">{conteudo}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
