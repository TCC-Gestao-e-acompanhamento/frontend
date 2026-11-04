import { DeadlineList } from '../../components/DeadlineList'
import { DataBoundary, PageHeader, SectionCard } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { listPrazosInstitucionais } from '../../services/api'

export default function CalendarioPage() {
  const { state, reload } = useAsync(listPrazosInstitucionais)
  return (
    <>
      <PageHeader title="Calendário acadêmico" description="Prazos institucionais de TCC 1 e TCC 2 do semestre." />
      <SectionCard title="Prazos do semestre">
        <DataBoundary
          state={state}
          reload={reload}
          isEmpty={(d) => d.length === 0}
          empty={{ title: 'Calendário ainda não publicado', description: 'A coordenação divulgará os prazos nesta página.' }}
        >
          {(d) => <DeadlineList items={d} />}
        </DataBoundary>
      </SectionCard>
    </>
  )
}
