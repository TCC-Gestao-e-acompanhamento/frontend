import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card } from '../design-system'
import { initials } from '../lib/format'
import type { ProfessorPublico } from '../types'

interface Props {
  professor: ProfessorPublico
  /** Quando informado, o nome vira link para o perfil público. */
  href?: string
  footer?: ReactNode
}

/** Cartão público: só exibe dados autorizados para divulgação. */
export function ProfessorCard({ professor: p, href, footer }: Props) {
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-700 text-sm font-semibold text-white">
          {initials(p.nome)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">
            {href ? <Link to={href} className="text-brand-700 hover:underline">{p.nome}</Link> : p.nome}
          </h3>
          <p className="text-sm text-ink-muted">{p.cursos.length ? p.cursos.map((c) => c.nome).join(' · ') : 'Curso não informado'}</p>
          <div className="mt-2">
            <Badge tone={p.aceitandoSolicitacoes ? 'success' : 'neutral'}>
              {p.aceitandoSolicitacoes ? 'Recebendo solicitações' : 'Sem vagas no momento'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-semibold tracking-wide text-ink-muted uppercase">Áreas de orientação</p>
        {p.areas.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {p.areas.map((a) => (
              <li key={a.id}><Badge tone="brand">{a.nome}</Badge></li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">Nenhuma área cadastrada.</p>
        )}
      </div>

      {p.apresentacao && <p className="mt-4 line-clamp-3 text-sm text-ink-muted">{p.apresentacao}</p>}
      {footer && <div className="mt-auto flex flex-wrap gap-2 pt-4">{footer}</div>}
    </Card>
  )
}
