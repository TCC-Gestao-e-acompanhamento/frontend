import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ActivityList } from '../../components/ActivityList'
import { AtividadeForm } from '../../components/AtividadeForm'
import { EtapasEditor } from '../../components/EtapasEditor'
import { DocumentList } from '../../components/DocumentList'
import { FeedbackList } from '../../components/FeedbackList'
import { LinhaDoTempo } from '../../components/LinhaDoTempo'
import { OrientacaoForm } from '../../components/OrientacaoForm'
import { StatusBadge } from '../../components/StatusBadge'
import { useCurrentUser } from '../../auth/useAuth'
import { Button, DataBoundary, PageHeader, ProgressBar, SectionCard, Stepper, Tabs } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { getTcc, listAtividades, listDocumentos, listFeedbacks, listLinhaDoTempo } from '../../services/api'

type Aba = 'etapas' | 'cronograma' | 'documentos' | 'feedbacks' | 'historico'

/** Detalhe de um TCC. Orientador pode registrar feedback; coordenação só consulta. */
export default function TccDetailPage() {
  const user = useCurrentUser()
  const { id = '' } = useParams()
  const [aba, setAba] = useState<Aba>('etapas')
  const [definindo, setDefinindo] = useState(false)
  const voltar = user.role === 'coordenacao' ? '/coordenacao/tccs' : '/orientador/orientandos'

  const { state, reload } = useAsync(async () => {
    const [tcc, atividades, documentos, feedbacks, historico] = await Promise.all([
      getTcc(user, id),
      listAtividades(user, id),
      listDocumentos(user, id),
      listFeedbacks(user, id),
      listLinhaDoTempo(user, id),
    ])
    return { tcc, atividades, documentos, feedbacks, historico }
  }, [user.id, id])

  return (
    <>
      <Link to={voltar} className="mb-1 inline-flex min-h-11 items-center text-sm text-brand-700 hover:underline">← Voltar para a lista</Link>
      <DataBoundary state={state} reload={reload}>
        {({ tcc, atividades, documentos, feedbacks, historico }) => (
          <div className="space-y-6">
            <PageHeader title={tcc.titulo} description={`${tcc.aluno.nome} · orientação de ${tcc.orientador.nome} · ${tcc.semestre}`} actions={<StatusBadge kind="tcc" value={tcc.status} />} />
            <SectionCard title="Resumo">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{tcc.fase === 'TCC1' ? 'TCC 1' : 'TCC 2'}</p>
                  <p className="font-medium">{tcc.etapaAtual}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">Pendências</p>
                  <p className="font-medium">{tcc.pendencias}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">Progresso · {tcc.progresso}%</p>
                  <ProgressBar value={tcc.progresso} label="Progresso do TCC" />
                </div>
              </div>
            </SectionCard>

            <Tabs<Aba>
              label="Detalhes do TCC"
              value={aba}
              onChange={setAba}
              items={[
                { key: 'etapas', label: 'Etapas' },
                { key: 'cronograma', label: 'Cronograma', count: atividades.length },
                { key: 'documentos', label: 'Documentos', count: documentos.length },
                { key: 'feedbacks', label: 'Feedbacks', count: feedbacks.length },
                { key: 'historico', label: 'Orientações', count: historico.length },
              ]}
            >
              {aba === 'etapas' &&
                (definindo ? (
                  <EtapasEditor tcc={tcc} onCancel={() => setDefinindo(false)} onSaved={() => { setDefinindo(false); reload() }} />
                ) : (
                  <div className="space-y-4">
                    {user.role === 'orientador' && (
                      <div className="flex justify-end">
                        <Button variant="secondary" onClick={() => setDefinindo(true)}>Definir etapas</Button>
                      </div>
                    )}
                    <Stepper etapas={tcc.etapas} />
                  </div>
                ))}
              {aba === 'cronograma' && (
                <div className="space-y-4">
                  {user.role === 'orientador' && <AtividadeForm tccId={tcc.id} onSaved={reload} />}
                  {atividades.length ? <ActivityList items={atividades} /> : <p className="text-sm text-ink-muted">Sem atividades no cronograma.</p>}
                </div>
              )}
              {aba === 'documentos' &&
                (documentos.length ? <DocumentList items={documentos} hrefFor={user.role === 'orientador' ? (d) => `/orientador/documentos/${d.id}` : undefined} /> : <p className="text-sm text-ink-muted">O aluno ainda não enviou documentos.</p>)}
              {aba === 'historico' && (
                <>
                  {user.role === 'orientador' && <OrientacaoForm tccId={tcc.id} onSaved={reload} />}
                  {historico.length ? (
                    <LinhaDoTempo eventos={historico} documentoHref={user.role === 'orientador' ? (docId) => `/orientador/documentos/${docId}` : undefined} />
                  ) : (
                    <p className="text-sm text-ink-muted">Nenhuma orientação registrada ainda.</p>
                  )}
                </>
              )}
              {aba === 'feedbacks' && (
                feedbacks.length ? <FeedbackList items={feedbacks} /> : <p className="text-sm text-ink-muted">Nenhum feedback registrado.</p>
              )}
            </Tabs>
          </div>
        )}
      </DataBoundary>
    </>
  )
}
