import { useCurrentUser } from '../../auth/useAuth'
import { LinhaDoTempo } from '../../components/LinhaDoTempo'
import { DataBoundary, PageHeader, SectionCard } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { listLinhaDoTempo, listTccs } from '../../services/api'

/** Histórico do TCC: reuniões de orientação, entregas, feedbacks e comentários em um só lugar. */
export default function HistoricoPage() {
  const user = useCurrentUser()
  const { state, reload } = useAsync(async () => {
    const [tcc] = await listTccs(user)
    return tcc ? { tcc, eventos: await listLinhaDoTempo(user, tcc.id) } : null
  }, [user.id])

  return (
    <>
      <PageHeader title="Histórico de orientações" description="Reuniões, entregas, feedbacks e comentários do seu TCC, do mais recente ao mais antigo." />
      <DataBoundary
        state={state}
        reload={reload}
        isEmpty={(d) => !d || d.eventos.length === 0}
        empty={{ title: 'Nada registrado ainda', description: 'As reuniões registradas pelo orientador e as suas entregas aparecem aqui.' }}
      >
        {(d) =>
          d && (
            <SectionCard title={d.tcc.titulo} description={`Orientação de ${d.tcc.orientador.nome}`}>
              <LinhaDoTempo eventos={d.eventos} documentoHref={(id) => `/aluno/documentos/${id}`} />
            </SectionCard>
          )
        }
      </DataBoundary>
    </>
  )
}
