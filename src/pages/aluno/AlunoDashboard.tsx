import { ActivityList } from '../../components/ActivityList'
import { DocumentList } from '../../components/DocumentList'
import { FeedbackList } from '../../components/FeedbackList'
import { InscricaoBanner } from '../../components/InscricaoBanner'
import { SolicitacaoRow } from '../../components/SolicitacaoRow'
import { StatusBadge } from '../../components/StatusBadge'
import { useCurrentUser } from '../../auth/useAuth'
import { ButtonLink, DataBoundary, PageHeader, ProgressBar, SectionCard } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { plural } from '../../lib/format'
import { getMinhaInscricao, getPeriodoInscricao, listAtividades, listDocumentos, listFeedbacks, listSolicitacoes, listTccs } from '../../services/api'

export default function AlunoDashboard() {
  const user = useCurrentUser()
  const { state, reload } = useAsync(async () => {
    const [tccs, atividades, documentos, feedbacks, solicitacoes, periodo, inscricao] = await Promise.all([
      listTccs(user),
      listAtividades(user),
      listDocumentos(user),
      listFeedbacks(user),
      listSolicitacoes(user),
      getPeriodoInscricao(),
      getMinhaInscricao(user),
    ])
    return { tcc: tccs[0], atividades, documentos, feedbacks, solicitacoes, periodo, inscricao }
  }, [user.id])

  return (
    <>
      <PageHeader title={`Olá, ${user.nome.split(' ')[0]}`} description="Veja em que etapa você está, o que precisa fazer e os próximos prazos." />
      <DataBoundary
        state={state}
        reload={reload}
      >
        {({ tcc, atividades, documentos, feedbacks, solicitacoes, periodo, inscricao }) => {
          if (!tcc) {
            return (
              <div className="space-y-6">
                <InscricaoBanner periodo={periodo} inscricao={inscricao} />
                <SectionCard title="Você ainda não tem um TCC vinculado">
                  <p className="text-sm text-ink-muted">
                    O primeiro passo é encontrar um orientador. Busque por curso ou área de interesse e envie sua proposta.
                    A vinculação oficial segue os procedimentos da UnB.
                  </p>
                  <div className="mt-4"><ButtonLink to="/orientadores">Buscar orientador</ButtonLink></div>
                </SectionCard>
                <SectionCard title="Minhas solicitações de orientação" action={<ButtonLink to="/aluno/solicitacoes" variant="ghost" size="sm">Ver todas</ButtonLink>}>
                  {solicitacoes.length === 0 ? (
                    <p className="text-sm text-ink-muted">Você ainda não enviou solicitações.</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {solicitacoes.slice(0, 3).map((s) => (
                        <SolicitacaoRow key={s.id} solicitacao={s} perspective="aluno" to={`/aluno/solicitacoes/${s.id}`} />
                      ))}
                    </ul>
                  )}
                </SectionCard>
              </div>
            )
          }
          const pendentes = atividades.filter((a) => a.status !== 'concluida')
          return (
            <div className="space-y-6">
              <InscricaoBanner periodo={periodo} inscricao={inscricao} />
              <SectionCard title="Situação do TCC" action={<StatusBadge kind="tcc" value={tcc.status} />}>
                <p className="font-medium">{tcc.titulo}</p>
                <p className="text-sm text-ink-muted">Orientador(a): {tcc.orientador.nome}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_2fr] sm:items-center">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{tcc.fase === 'TCC1' ? 'TCC 1' : 'TCC 2'} · etapa atual</p>
                    <p className="text-lg font-semibold text-brand-700">{tcc.etapaAtual}</p>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Progresso geral</span>
                      <span className="font-medium">{tcc.progresso}%</span>
                    </div>
                    <ProgressBar value={tcc.progresso} label="Progresso geral do TCC" />
                  </div>
                </div>
              </SectionCard>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="O que fazer agora"
                  description={pendentes.length ? `${plural(pendentes.length, 'atividade em aberto', 'atividades em aberto')}, da mais próxima para a mais distante` : undefined}
                  className="lg:col-span-2"
                  action={<ButtonLink to="/aluno/cronograma" variant="ghost" size="sm">Ver cronograma</ButtonLink>}
                >
                  {pendentes.length === 0 ? (
                    <p className="text-sm text-ink-muted">Nenhuma atividade em aberto. Bom trabalho!</p>
                  ) : (
                    <ActivityList items={pendentes.slice(0, 4)} />
                  )}
                </SectionCard>

                <SectionCard
                  title="Documentos e entregas"
                  action={<ButtonLink to="/aluno/documentos" variant="ghost" size="sm">Abrir documentos</ButtonLink>}
                >
                  {documentos.length === 0 ? <p className="text-sm text-ink-muted">Você ainda não enviou documentos.</p> : <DocumentList items={documentos.slice(0, 3)} hrefFor={(d) => `/aluno/documentos/${d.id}`} />}
                </SectionCard>

                <SectionCard
                  title="Últimos feedbacks"
                  action={<ButtonLink to="/aluno/documentos" variant="ghost" size="sm">Ver nos documentos</ButtonLink>}
                >
                  {feedbacks.length === 0 ? <p className="text-sm text-ink-muted">Nenhum feedback recebido ainda.</p> : <FeedbackList items={feedbacks.slice(0, 2)} />}
                </SectionCard>
              </div>
            </div>
          )
        }}
      </DataBoundary>
    </>
  )
}
