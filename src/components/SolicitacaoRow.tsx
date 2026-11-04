import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { formatDate } from '../lib/format'
import type { Solicitacao } from '../types'
import { StatusBadge } from './StatusBadge'

interface Props {
  solicitacao: Solicitacao
  perspective: 'aluno' | 'orientador'
  to: string
  actions?: ReactNode
}

export function SolicitacaoRow({ solicitacao: s, perspective, to, actions }: Props) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <Link to={to} className="font-medium text-brand-700 hover:underline">{s.titulo}</Link>
        <p className="text-sm text-ink-muted">
          {perspective === 'aluno' ? `Para ${s.professorNome}` : `${s.alunoNome} · ${s.alunoCurso}`} · {s.area} · enviada em {formatDate(s.enviadaEm)}
        </p>
      </div>
      <StatusBadge kind="solicitacao" value={s.status} />
      {actions && <div className="flex w-full gap-2">{actions}</div>}
    </li>
  )
}
