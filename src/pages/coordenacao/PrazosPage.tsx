import { DeadlineList } from '../../components/DeadlineList'
import { DataBoundary, PageHeader, SectionCard } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { listPrazosInstitucionais } from '../../services/api'

export default function PrazosPage() {
  const { state, reload } = useAsync(listPrazosInstitucionais)
  return (
    <>
      <PageHeader title="Etapas e prazos" description="Prazos institucionais do semestre. A edição do calendário depende de confirmação das atribuições da coordenação." />
      <SectionCard title="Calendário do semestre">
        <DataBoundary state={state} reload={reload} isEmpty={(d) => d.length === 0} empty={{ title: 'Nenhum prazo cadastrado' }}>
          {(d) => <DeadlineList items={d} />}
        </DataBoundary>
      </SectionCard>
    </>
  )
}
