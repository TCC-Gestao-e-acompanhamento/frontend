import { Link } from 'react-router-dom'
import type { Tcc } from '../types'

interface Props {
  items: Tcc[]
  /** Caminho base do detalhe, ex.: /coordenacao/tccs */
  basePath: string
  caption: string
}

/** TCCs cadastrados: tema, aluno, orientador e etapa (TCC 1 ou TCC 2). */
export function TccTable({ items, basePath, caption }: Props) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-border text-xs tracking-wide text-ink-muted uppercase">
          <tr>
            <th scope="col" className="py-2 pr-4 font-medium">Tema</th>
            <th scope="col" className="py-2 pr-4 font-medium">Aluno</th>
            <th scope="col" className="py-2 pr-4 font-medium">Orientador</th>
            <th scope="col" className="py-2 font-medium">Etapa</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((t) => (
            <tr key={t.id}>
              <td className="max-w-sm py-3 pr-4">
                <Link to={`${basePath}/${t.id}`} className="font-medium text-brand-700 hover:underline">
                  {t.titulo}
                </Link>
              </td>
              <td className="py-3 pr-4">{t.aluno.nome}</td>
              <td className="py-3 pr-4">{t.orientador.nome}</td>
              <td className="py-3 font-medium whitespace-nowrap">{t.fase === 'TCC1' ? 'TCC 1' : 'TCC 2'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
