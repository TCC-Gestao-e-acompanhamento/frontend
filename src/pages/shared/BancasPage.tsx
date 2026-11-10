import { BancaCard } from '../../components/BancaCard'
import { useCurrentUser } from '../../auth/useAuth'
import { DataBoundary, PageHeader } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { listBancas } from '../../services/api'

/** Bancas no escopo do perfil (aluno: a sua; orientador: dos orientandos; coordenação: todas). */
export default function BancasPage() {
  const user = useCurrentUser()
  const { state, reload } = useAsync(() => listBancas(user), [user.id])
  const aluno = user.role === 'aluno'
  return (
    <>
      <PageHeader
        title={aluno ? 'Minha banca' : 'Bancas examinadoras'}
        description={
          user.role === 'coordenacao'
            ? 'Consulta de bancas. Aprovação e alteração de composição dependem de confirmação das atribuições institucionais.'
            : 'Composição, data e local das defesas.'
        }
      />
      <DataBoundary
        state={state}
        reload={reload}
        isEmpty={(d) => d.length === 0}
        empty={{ title: 'Nenhuma banca registrada', description: 'A banca aparece aqui após ser definida.' }}
      >
        {(d) => <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{d.map((b) => <BancaCard key={b.id} banca={b} />)}</div>}
      </DataBoundary>
    </>
  )
}
