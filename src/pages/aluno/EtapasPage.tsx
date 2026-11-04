import { useCurrentUser } from '../../auth/useAuth'
import { DataBoundary, PageHeader, SectionCard, Stepper } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { listTccs } from '../../services/api'

export default function EtapasPage() {
  const user = useCurrentUser()
  const { state, reload } = useAsync(async () => (await listTccs(user))[0], [user.id])
  return (
    <>
      <PageHeader title="Etapas do TCC" description="Acompanhe o caminho percorrido no TCC 1 e no TCC 2." />
      <DataBoundary state={state} reload={reload} isEmpty={(t) => !t} empty={{ title: 'Nenhum TCC vinculado' }}>
        {(tcc) => (
          <SectionCard title={tcc.titulo} description={`Etapa atual: ${tcc.etapaAtual}`}>
            <Stepper etapas={tcc.etapas} />
          </SectionCard>
        )}
      </DataBoundary>
    </>
  )
}
