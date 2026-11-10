import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ActivityList } from '../../components/ActivityList'
import { DocumentList } from '../../components/DocumentList'
import { FeedbackList } from '../../components/FeedbackList'
import { StatusBadge } from '../../components/StatusBadge'
import { useCurrentUser } from '../../auth/useAuth'
import { Button, DataBoundary, Field, PageHeader, ProgressBar, SectionCard, Select, Stepper, Tabs, Textarea } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { addFeedback, getTcc, listAtividades, listDocumentos, listFeedbacks } from '../../services/api'
import type { FeedbackTipo } from '../../types'

type Aba = 'etapas' | 'cronograma' | 'documentos' | 'feedbacks'

function FeedbackForm({ tccId, onSaved }: { tccId: string; onSaved: () => void }) {
  const user = useCurrentUser()
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState<FeedbackTipo>('comentario')
  const [erro, setErro] = useState<string>()
  const [salvando, setSalvando] = useState(false)
  const [ok, setOk] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (texto.trim().length < 5) return setErro('Escreva ao menos 5 caracteres.')
    setErro(undefined)
    setSalvando(true)
    try {
      await addFeedback(user, { tccId, texto: texto.trim(), tipo })
      setTexto('')
      setOk(true)
      onSaved()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mb-5 space-y-4 rounded-lg bg-surface-muted p-4">
      <Field label="Novo feedback" error={erro}>
        {(p) => <Textarea {...p} value={texto} onChange={(e) => { setTexto(e.target.value); setOk(false) }} placeholder="Descreva o comentário ou a correção solicitada…" />}
      </Field>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <Field label="Tipo">
            {(p) => (
              <Select {...p} value={tipo} onChange={(e) => setTipo(e.target.value as FeedbackTipo)}>
                <option value="comentario">Comentário</option>
                <option value="correcao">Solicitar correção</option>
              </Select>
            )}
          </Field>
        </div>
        <Button type="submit" loading={salvando}>Registrar feedback</Button>
        {ok && <p role="status" className="pb-2.5 text-sm text-success">Feedback registrado.</p>}
      </div>
    </form>
  )
}

/** Detalhe de um TCC. Orientador pode registrar feedback; coordenação só consulta. */
export default function TccDetailPage() {
  const user = useCurrentUser()
  const { id = '' } = useParams()
  const [aba, setAba] = useState<Aba>('etapas')
  const voltar = user.role === 'coordenacao' ? '/coordenacao/tccs' : '/orientador/orientandos'

  const { state, reload } = useAsync(async () => {
    const [tcc, atividades, documentos, feedbacks] = await Promise.all([
      getTcc(user, id),
      listAtividades(user, id),
      listDocumentos(user, id),
      listFeedbacks(user, id),
    ])
    return { tcc, atividades, documentos, feedbacks }
  }, [user.id, id])

  return (
    <>
      <Link to={voltar} className="mb-3 inline-block text-sm text-brand-700 hover:underline">← Voltar para a lista</Link>
      <DataBoundary state={state} reload={reload}>
        {({ tcc, atividades, documentos, feedbacks }) => (
          <div className="space-y-6">
            <PageHeader title={tcc.titulo} description={`${tcc.aluno.nome} · orientação de ${tcc.orientador.nome} · ${tcc.semestre}`} actions={<StatusBadge kind="tcc" value={tcc.status} />} />
            <SectionCard title="Resumo">
              <div className="grid gap-4 sm:grid-cols-3">
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
              ]}
            >
              {aba === 'etapas' && <Stepper etapas={tcc.etapas} />}
              {aba === 'cronograma' &&
                (atividades.length ? <ActivityList items={atividades} /> : <p className="text-sm text-ink-muted">Sem atividades no cronograma.</p>)}
              {aba === 'documentos' &&
                (documentos.length ? <DocumentList items={documentos} /> : <p className="text-sm text-ink-muted">O aluno ainda não enviou documentos.</p>)}
              {aba === 'feedbacks' && (
                <>
                  {user.role === 'orientador' && <FeedbackForm tccId={tcc.id} onSaved={reload} />}
                  {feedbacks.length ? <FeedbackList items={feedbacks} /> : <p className="text-sm text-ink-muted">Nenhum feedback registrado.</p>}
                </>
              )}
            </Tabs>
          </div>
        )}
      </DataBoundary>
    </>
  )
}
