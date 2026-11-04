import { SolicitacaoRow } from '../../components/SolicitacaoRow'
import { useCurrentUser } from '../../auth/useAuth'
import { ButtonLink, DataBoundary, PageHeader, SectionCard } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { listSolicitacoes } from '../../services/api'

export default function MinhasSolicitacoesPage() {
  const user = useCurrentUser()
  const { state, reload } = useAsync(() => listSolicitacoes(user), [user.id])
  return (
    <>
      <PageHeader
        title="Minhas solicitações de orientação"
        description="Acompanhe as solicitações enviadas e as respostas dos professores."
        actions={<ButtonLink to="/orientadores">Buscar orientador</ButtonLink>}
      />
      <SectionCard title="Solicitações enviadas">
        <DataBoundary
          state={state}
          reload={reload}
          isEmpty={(d) => d.length === 0}
          empty={{
            title: 'Você ainda não enviou solicitações',
            description: 'Encontre um professor pelo curso ou área e apresente sua proposta de TCC.',
            action: <ButtonLink to="/orientadores" variant="secondary">Buscar orientador</ButtonLink>,
          }}
        >
          {(d) => (
            <ul className="divide-y divide-border">
              {d.map((s) => <SolicitacaoRow key={s.id} solicitacao={s} perspective="aluno" to={`/aluno/solicitacoes/${s.id}`} />)}
            </ul>
          )}
        </DataBoundary>
      </SectionCard>
    </>
  )
}
