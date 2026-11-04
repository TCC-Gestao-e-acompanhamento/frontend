import { BancaCard } from '../../components/BancaCard'
import { DeadlineList } from '../../components/DeadlineList'
import { ButtonLink, DataBoundary, Icon, SectionCard, StatCard } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { getIndicadoresPublicos, listBancasPublicas, listPrazosInstitucionais } from '../../services/api'
import { useAuth } from '../../auth/useAuth'
import { homePath } from '../../routes/navigation'

export default function HomePage() {
  const { user } = useAuth()
  const indicadores = useAsync(getIndicadoresPublicos)
  const bancas = useAsync(listBancasPublicas)
  const prazos = useAsync(listPrazosInstitucionais)

  return (
    <div className="space-y-10">
      <section className="grid items-center gap-6 py-4 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="mb-2 text-sm font-semibold tracking-wide text-accent-600 uppercase">Universidade de Brasília</p>
          <h1 className="text-3xl font-semibold tracking-tight text-brand-700 sm:text-4xl">
            Acompanhe o Trabalho de Conclusão de Curso em um só lugar
          </h1>
          <p className="mt-3 max-w-xl text-ink-muted">
            Alunos, orientadores e coordenação compartilham etapas, prazos, entregas e feedbacks. Consulte abaixo as informações públicas do semestre.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink to={user ? homePath(user.role) : '/entrar'}>
              {user ? 'Ir para minha área' : 'Entrar na minha área'}
              <Icon name="arrow" size={16} />
            </ButtonLink>
            <ButtonLink to="/orientadores" variant="secondary">Encontrar orientador</ButtonLink>
            <ButtonLink to="/bancas" variant="ghost">Ver bancas públicas</ButtonLink>
          </div>
        </div>
        <img src="/logo-unb.svg" alt="" className="hidden w-full max-w-xs justify-self-end rounded-card md:block" />
      </section>

      <section aria-labelledby="ind-title">
        <h2 id="ind-title" className="mb-4 text-lg font-semibold">
          Indicadores do semestre {indicadores.state.status === 'success' ? indicadores.state.data.semestre : ''}
        </h2>
        <DataBoundary
          state={indicadores.state}
          reload={indicadores.reload}
          isEmpty={(d) => d.totalTccs === 0}
          empty={{ title: 'Sem dados no semestre', description: 'Os indicadores aparecem assim que houver TCCs cadastrados.' }}
        >
          {(d) => (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="TCCs em andamento" value={d.totalTccs} hint={`${d.tcc1} em TCC 1 · ${d.tcc2} em TCC 2`} />
              <StatCard label="Defesas agendadas" value={d.defesasAgendadas} tone="success" />
              <StatCard label="Defesas realizadas" value={d.defesasRealizadas} />
              <StatCard label="Em TCC 2" value={d.tcc2} hint="Etapa de desenvolvimento e defesa" />
            </div>
          )}
        </DataBoundary>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <SectionCard
          title="Próximas defesas"
          description="Defesas são abertas ao público."
          action={<ButtonLink to="/bancas" variant="ghost" size="sm">Ver todas</ButtonLink>}
        >
          <DataBoundary
            state={bancas.state}
            reload={bancas.reload}
            isEmpty={(d) => d.length === 0}
            empty={{ title: 'Nenhuma defesa divulgada', description: 'Quando uma banca for agendada, ela aparece aqui.' }}
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
