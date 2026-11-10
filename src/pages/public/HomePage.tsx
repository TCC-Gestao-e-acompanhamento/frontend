import { BancaCard } from '../../components/BancaCard'
import { DeadlineList } from '../../components/DeadlineList'
import { ButtonLink, DataBoundary, Icon, SectionCard, StatCard, StatGroup } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { getIndicadoresPublicos, listBancasPublicas, listPrazosInstitucionais } from '../../services/api'
import { useAuth } from '../../auth/useAuth'
import { homePath } from '../../routes/navigation'

const PASSOS = [
  { titulo: 'Encontre um professor', texto: 'Filtre por curso e área de interesse.' },
  { titulo: 'Envie sua proposta', texto: 'Entre com sua conta de aluno e apresente a ideia do TCC.' },
  { titulo: 'Acompanhe a resposta', texto: 'O professor aceita ou recusa, e você vê o retorno na sua área.' },
]

export default function HomePage() {
  const { user } = useAuth()
  const indicadores = useAsync(getIndicadoresPublicos)
  const bancas = useAsync(listBancasPublicas)
  const prazos = useAsync(listPrazosInstitucionais)

  return (
    <div className="space-y-12">
      <section className="grid gap-8 py-4 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div>
          <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-brand-700 text-balance sm:text-4xl">
            Encontre um orientador e acompanhe seu TCC na UnB
          </h1>
          <p className="mt-3 max-w-xl text-ink-muted">
            Busque professores por curso e área, envie sua proposta e acompanhe etapas, prazos, entregas e feedbacks. Abaixo, as informações públicas do semestre.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ButtonLink to="/orientadores">
              Encontrar orientador
              <Icon name="arrow" size={16} />
            </ButtonLink>
            <ButtonLink to="/bancas" variant="secondary">Ver bancas públicas</ButtonLink>
          </div>
          {user && (
            <p className="mt-4 text-sm text-ink-muted">
              Você já está conectado. <ButtonLink to={homePath(user.role)} variant="ghost" size="sm" className="-ml-1 inline-flex">Ir para minha área</ButtonLink>
            </p>
          )}
        </div>

        <section aria-labelledby="como-title" className="rounded-card border border-border bg-surface-muted p-6">
          <h2 id="como-title" className="mb-4 text-base font-semibold">Como pedir orientação</h2>
          <ol className="space-y-4">
            {PASSOS.map((p, i) => (
              <li key={p.titulo} className="flex gap-3">
                <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-700 text-xs font-semibold text-white">{i + 1}</span>
                <div>
                  <p className="font-medium">{p.titulo}</p>
                  <p className="text-sm text-ink-muted">{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </section>

      <section aria-labelledby="ind-title">
        <h2 id="ind-title" className="mb-4 text-lg font-semibold">
          Semestre {indicadores.state.status === 'success' ? indicadores.state.data.semestre : ''}
        </h2>
        <DataBoundary
          state={indicadores.state}
          reload={indicadores.reload}
          isEmpty={(d) => d.totalTccs === 0}
          empty={{ title: 'Ainda não há dados do semestre', description: 'Os indicadores aparecem assim que houver TCCs cadastrados.' }}
        >
          {(d) => (
            <StatGroup>
              <StatCard label="TCCs em andamento" value={d.totalTccs} hint={`${d.tcc1} em TCC 1 · ${d.tcc2} em TCC 2`} />
              <StatCard label="Defesas agendadas" value={d.defesasAgendadas} tone="success" />
              <StatCard label="Defesas realizadas" value={d.defesasRealizadas} />
            </StatGroup>
          )}
        </DataBoundary>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <SectionCard
          title="Próximas defesas"
          description="Abertas ao público."
          action={<ButtonLink to="/bancas" variant="ghost" size="sm">Ver todas</ButtonLink>}
        >
          <DataBoundary
            state={bancas.state}
            reload={bancas.reload}
            isEmpty={(d) => d.filter((b) => b.situacao === 'agendada').length === 0}
            empty={{ title: 'Nenhuma defesa agendada', description: 'Quando uma banca for marcada, ela aparece aqui.' }}
          >
            {(d) => (
              <div className="space-y-3">
                {d.filter((b) => b.situacao === 'agendada').slice(0, 2).map((b) => <BancaCard key={b.id} banca={b} />)}
              </div>
            )}
          </DataBoundary>
        </SectionCard>

        <SectionCard
          title="Calendário acadêmico"
          description="Prazos institucionais"
          action={<ButtonLink to="/calendario" variant="ghost" size="sm">Ver tudo</ButtonLink>}
        >
          <DataBoundary
            state={prazos.state}
            reload={prazos.reload}
            isEmpty={(d) => d.length === 0}
            empty={{ title: 'Calendário ainda não publicado' }}
          >
            {(d) => <DeadlineList items={d.slice(0, 4)} />}
          </DataBoundary>
        </SectionCard>
      </div>
    </div>
  )
}
