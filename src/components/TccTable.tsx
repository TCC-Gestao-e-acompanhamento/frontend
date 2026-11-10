import { Link } from 'react-router-dom'
import { ProgressBar } from '../design-system'
import { plural } from '../lib/format'
import type { Tcc } from '../types'
import { StatusBadge } from './StatusBadge'

interface Props {
  items: Tcc[]
  /** Caminho base do detalhe, ex.: /orientador/orientandos */
  basePath: string
  showOrientador?: boolean
  caption: string
}

export function TccTable({ items, basePath, showOrientador = false, caption }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-border text-xs tracking-wide text-ink-muted uppercase">
          <tr>
            <th scope="col" className="py-2 pr-4 font-medium">Aluno / trabalho</th>
            {showOrientador && <th scope="col" className="py-2 pr-4 font-medium">Orientador</th>}
            <th scope="col" className="py-2 pr-4 font-medium">Etapa</th>
            <th scope="col" className="py-2 pr-4 font-medium">Progresso</th>
            <th scope="col" className="py-2 font-medium">Situação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((t) => (
            <tr key={t.id}>
              <td className="max-w-xs py-3 pr-4">
                <Link to={`${basePath}/${t.id}`} className="font-medium text-brand-700 hover:underline">
                  {t.aluno.nome}
                </Link>
                <p className="truncate text-ink-muted" title={t.titulo}>{t.titulo}</p>
              </td>
              {showOrientador && <td className="py-3 pr-4">{t.orientador.nome}</td>}
              <td className="py-3 pr-4">
                <span className="font-medium">{t.fase === 'TCC1' ? 'TCC 1' : 'TCC 2'}</span>
                <p className="text-ink-muted">{t.etapaAtual}</p>
              </td>
              <td className="w-36 py-3 pr-4">
                <ProgressBar value={t.progresso} label={`Progresso de ${t.aluno.nome}`} />
                <span className="text-xs text-ink-muted">{t.progresso}%</span>
              </td>
              <td className="py-3">
                <StatusBadge kind="tcc" value={t.status} />
                {t.pendencias > 0 && <p className="mt-1 text-xs text-ink-muted">{plural(t.pendencias, 'pendência', 'pendências')}</p>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
