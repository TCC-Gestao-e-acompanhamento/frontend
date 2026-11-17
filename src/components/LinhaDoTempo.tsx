import { Link } from 'react-router-dom'
import { Icon, type IconName } from '../design-system'
import { formatDate, formatMonth } from '../lib/format'
import type { EventoTempo, EventoTempoTipo, Role } from '../types'

const ICONE: Record<EventoTempoTipo, IconName> = { reuniao: 'users', documento: 'file', feedback: 'message', comentario: 'message', atividade: 'calendar' }
const ROTULO: Record<EventoTempoTipo, string> = { reuniao: 'Reunião', documento: 'Entrega', feedback: 'Feedback', comentario: 'Comentário no texto', atividade: 'Atividade' }
const PAPEL: Record<Role, string> = { aluno: 'aluno', orientador: 'orientador', coordenacao: 'coordenação' }

interface Props {
  eventos: EventoTempo[]
  /** Quando informado, eventos ligados a um documento ganham link para abri-lo. */
  documentoHref?: (documentoId: string) => string
}

/** Linha do tempo do TCC: reuniões, atividades, entregas, feedbacks e comentários, do mais recente ao mais antigo. */
export function LinhaDoTempo({ eventos, documentoHref }: Props) {
  const grupos = eventos.reduce<Record<string, EventoTempo[]>>((acc, e) => {
    ;(acc[formatMonth(e.data)] ??= []).push(e)
    return acc
  }, {})
  return (
    <div className="space-y-6">
      {Object.entries(grupos).map(([mes, itens]) => (
        <section key={mes} aria-label={mes}>
          <h3 className="mb-3 text-sm font-semibold text-ink-muted">{mes}</h3>
          <ol className="space-y-0">
            {itens.map((e, i) => (
              <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
                {i < itens.length - 1 && <span aria-hidden="true" className="absolute top-9 left-[1.0625rem] -ml-px h-[calc(100%-2rem)] w-0.5 bg-border" />}
                <span aria-hidden="true" className="z-10 grid size-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-brand-700">
                  <Icon name={ICONE[e.tipo]} size={18} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-xs text-ink-muted">
                    {formatDate(e.data)} · {ROTULO[e.tipo]} · por {e.autorNome} ({PAPEL[e.autorRole]})
                  </p>
                  <p className="font-medium">{e.titulo}</p>
                  {e.detalhe && <p className="mt-0.5 text-sm text-ink-muted">{e.detalhe}</p>}
                  {e.documentoId && documentoHref && (
                    <Link to={documentoHref(e.documentoId)} className="mt-1 inline-flex min-h-11 items-center text-sm font-medium text-brand-700 hover:underline">
                      Abrir documento
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
