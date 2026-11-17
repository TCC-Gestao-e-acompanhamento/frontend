import { useCurrentUser } from '../../auth/useAuth'
import { EtapasAcompanhamento } from '../../components/EtapasAcompanhamento'
import { DataBoundary, PageHeader, SectionCard } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { listTccs } from '../../services/api'

export default function EtapasPage() {
  const user = useCurrentUser()
  const { state, reload } = useAsync(async () => (await listTccs(user))[0], [user.id])
  return (
    <>
      <PageHeader title="Etapas do TCC" description="Acompanhe o caminho percorrido no TCC 1 e no TCC 2. Quando terminar a etapa atual, conclua-a aqui." />
      <DataBoundary state={state} reload={reload} isEmpty={(t) => !t} empty={{ title: 'Nenhum TCC vinculado' }}>
        {(tcc) => (
          <SectionCard title={tcc.titulo} description={`Etapa atual: ${tcc.etapaAtual}`}>
            <EtapasAcompanhamento tcc={tcc} podeConcluir onChanged={reload} />
          </SectionCard>
        )}
      </DataBoundary>
    </>
  )
}
