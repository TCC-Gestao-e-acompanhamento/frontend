import { Link } from 'react-router-dom'
import { EventoItem } from '../../components/EventoItem'
import { ButtonLink, DataBoundary, Icon } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { daysUntil, formatDate, plural } from '../../lib/format'
import { getIndicadoresPublicos, getPeriodoInscricao, listAreas, listEventosPublicos } from '../../services/api'
import { useAuth } from '../../auth/useAuth'
import { homePath } from '../../routes/navigation'

const PASSOS = [
  { titulo: 'Encontre um professor', texto: 'Filtre por curso e área de interesse.' },
  { titulo: 'Envie sua proposta', texto: 'Entre com sua conta de aluno e apresente a ideia.' },
  { titulo: 'Acompanhe a resposta', texto: 'O professor aceita ou recusa, e você vê o retorno.' },
]

export default function HomePage() {
  const { user } = useAuth()
  const indicadores = useAsync(getIndicadoresPublicos)
  const eventos = useAsync(listEventosPublicos)
  const areas = useAsync(listAreas)
  const periodo = useAsync(getPeriodoInscricao)
  const aberto = periodo.state.status === 'success' && periodo.state.data?.situacao === 'aberto' ? periodo.state.data : null
  const ind = indicadores.state.status === 'success' ? indicadores.state.data : null

  return (
    <>
      <section className="bg-brand-700 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:px-8 lg:py-16">
          <div>
            <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Encontre um orientador e acompanhe seu TCC na UnB
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/85">
              Busque professores por curso e área, envie sua proposta e acompanhe etapas, prazos e feedbacks.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink to="/orientadores" variant="inverse">
                Encontrar orientador
                <Icon name="arrow" size={16} />
              </ButtonLink>
              <ButtonLink to={user ? homePath(user.role) : '/entrar'} variant="outline-inverse">
                {user ? 'Ir para minha área' : 'Entrar'}
              </ButtonLink>
            </div>
            {aberto && (!user || user.role !== 'orientador') && (
              <p className="mt-6">
                <Link
                  to={!user ? '/entrar' : user.role === 'aluno' ? '/aluno/inscricao' : '/coordenacao/inscricoes'}
                  state={!user ? { from: '/aluno/inscricao' } : undefined}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-medium hover:bg-white/20"
                >
                  Inscrições de TCC {aberto.semestre} abertas até {formatDate(aberto.fim)}
                  <Icon name="arrow" size={16} />
                </Link>
              </p>
            )}
            {ind && ind.totalTccs > 0 && (
              <p className="mt-8 text-sm text-white/80">
                Semestre {ind.semestre}: {plural(ind.totalTccs, 'TCC em andamento', 'TCCs em andamento')} ·{' '}
                {plural(ind.defesasAgendadas, 'defesa agendada', 'defesas agendadas')}
              </p>
            )}
          </div>

          <section aria-labelledby="como-title" className="rounded-card bg-surface p-6 text-ink shadow-lg">
            <h2 id="como-title" className="mb-4 text-base font-semibold">Como pedir orientação</h2>
            <ol className="space-y-4">
              {PASSOS.map((p, i) => (
                <li key={p.titulo} className="flex gap-3">
                  <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-600 text-xs font-semibold text-white">{i + 1}</span>
                  <div>
                    <p className="font-medium">{p.titulo}</p>
                    <p className="text-sm text-ink-muted">{p.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
        <section aria-labelledby="prox-title">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 id="prox-title" className="text-xl font-semibold">Próximas datas</h2>
            <ButtonLink to="/calendario" variant="ghost" size="sm">Abrir calendário</ButtonLink>
          </div>
          <DataBoundary
            state={eventos.state}
            reload={eventos.reload}
            isEmpty={(d) => d.filter((e) => daysUntil(e.data) >= 0).length === 0}
            empty={{ title: 'Nenhuma data próxima', description: 'Prazos e defesas aparecem aqui assim que forem divulgados.' }}
          >
            {(d) => (
              <ul className="divide-y divide-border rounded-card border border-border p-5">
                {d.filter((e) => daysUntil(e.data) >= 0).slice(0, 4).map((e) => <EventoItem key={e.id} evento={e} />)}
              </ul>
            )}
          </DataBoundary>
        </section>
      </div>

      <section className="bg-surface-muted" aria-labelledby="areas-title">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
          <h2 id="areas-title" className="text-xl font-semibold">Procurando um tema?</h2>
          <p className="mt-1 text-ink-muted">Veja quem orienta na sua área de interesse.</p>
          <DataBoundary state={areas.state} reload={areas.reload} isEmpty={(d) => d.length === 0} empty={{ title: 'Nenhuma área cadastrada ainda' }}>
            {(d) => (
              <ul className="mt-5 flex flex-wrap gap-2">
                {d.map((a) => (
                  <li key={a.id}>
                    <Link to={`/orientadores?area=${a.id}`} className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-sm font-medium hover:border-brand-500 hover:text-brand-700">
                      {a.nome}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </DataBoundary>
        </div>
      </section>
    </>
  )
}
