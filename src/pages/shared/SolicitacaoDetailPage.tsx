import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ResponderModal } from '../../components/ResponderModal'
import { StatusBadge } from '../../components/StatusBadge'
import { useCurrentUser } from '../../auth/useAuth'
import { Button, ButtonLink, DataBoundary, PageHeader, SectionCard } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { formatDate } from '../../lib/format'
import { cancelSolicitacao, getSolicitacao } from '../../services/api'

/** Detalhe: aluno acompanha/cancela; professor destinatário aceita ou recusa. */
export default function SolicitacaoDetailPage() {
  const user = useCurrentUser()
  const { id = '' } = useParams()
  const location = useLocation()
  const enviada = (location.state as { enviada?: boolean } | null)?.enviada
  const { state, reload } = useAsync(() => getSolicitacao(user, id), [user.id, id])
  const [decisao, setDecisao] = useState<'aceita' | 'recusada' | null>(null)
  const [cancelando, setCancelando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [aviso, setAviso] = useState<string>()
  const [erro, setErro] = useState<string>()
  const aluno = user.role === 'aluno'
  const voltar = aluno ? '/aluno/solicitacoes' : '/orientador/solicitacoes'

  const cancelar = async () => {
    setCancelando(true)
    setErro(undefined)
    try {
      await cancelSolicitacao(user, id)
      setConfirmando(false)
      setAviso('Solicitação cancelada. Você pode enviar uma nova ao mesmo professor ou escolher outro.')
      reload()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível cancelar.')
    } finally {
      setCancelando(false)
    }
  }

  return (
    <>
      <Link to={voltar} className="mb-3 inline-block text-sm text-brand-700 hover:underline">← Voltar para as solicitações</Link>
      <DataBoundary state={state} reload={reload}>
        {(s) => (
          <div className="space-y-6">
            {aviso && <p role="status" className="rounded-lg border border-border bg-surface-muted p-3 text-sm">{aviso}</p>}
            {enviada && !aviso && (
              <p role="status" className="rounded-lg border border-success/30 bg-accent-50 p-3 text-sm text-success">
                Solicitação enviada. {s.professorNome} será avisado(a) e você acompanha a resposta aqui.
              </p>
            )}
            <PageHeader
              title={s.titulo}
              description={aluno ? `Para ${s.professorNome}` : `${s.alunoNome} · ${s.alunoCurso}`}
              actions={<StatusBadge kind="solicitacao" value={s.status} />}
            />

            <SectionCard title="Proposta">
              <dl className="space-y-4 text-sm">
                <div><dt className="text-ink-muted">Área de interesse</dt><dd className="font-medium">{s.area}</dd></div>
                <div><dt className="text-ink-muted">Descrição</dt><dd className="whitespace-pre-line">{s.descricao}</dd></div>
                {s.mensagem && <div><dt className="text-ink-muted">Mensagem ao professor</dt><dd className="whitespace-pre-line">{s.mensagem}</dd></div>}
                <div><dt className="text-ink-muted">Enviada em</dt><dd>{formatDate(s.enviadaEm)}</dd></div>
              </dl>
            </SectionCard>

            {s.status !== 'pendente' && s.status !== 'cancelada' && (
              <SectionCard title="Resposta do professor">
                <p className="text-sm text-ink-muted">{s.status === 'aceita' ? 'Aceita' : 'Recusada'} em {s.respondidaEm && formatDate(s.respondidaEm)}</p>
                <p className="mt-1">{s.resposta ?? 'O professor não deixou uma mensagem.'}</p>
                {s.status === 'aceita' && (
                  <p className="mt-3 rounded-lg bg-surface-muted p-3 text-xs text-ink-muted">
                    O aceite não é uma designação institucional. A vinculação oficial segue os procedimentos da UnB (a confirmar).
                  </p>
                )}
              </SectionCard>
            )}

            <SectionCard title="Histórico">
              <ol className="space-y-2 text-sm">
                {s.historico.map((h) => (
                  <li key={h.descricao} className="flex gap-3"><span className="w-24 shrink-0 text-ink-muted">{formatDate(h.data)}</span>{h.descricao}</li>
                ))}
              </ol>
            </SectionCard>

            {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
            {s.status === 'pendente' && aluno && (
              confirmando ? (
                <div role="group" aria-label="Confirmar cancelamento" className="space-y-3 rounded-lg border border-border p-4">
                  <p className="text-sm">Cancelar esta solicitação? O professor deixa de vê-la como pendente e não é possível desfazer.</p>
                  <div className="flex gap-3">
                    <Button variant="danger" loading={cancelando} onClick={cancelar}>Sim, cancelar solicitação</Button>
                    <Button variant="secondary" onClick={() => setConfirmando(false)}>Manter solicitação</Button>
                  </div>
                </div>
              ) : (
                <Button variant="secondary" onClick={() => setConfirmando(true)}>Cancelar solicitação</Button>
              )
            )}
            {s.status === 'cancelada' && aluno && (
              <ButtonLink to="/orientadores" variant="secondary">Buscar outro orientador</ButtonLink>
            )}
            {s.status === 'recusada' && aluno && (
              <ButtonLink to="/orientadores">Buscar outro orientador</ButtonLink>
            )}
            {s.status === 'pendente' && !aluno && (
              <div className="flex gap-3">
                <Button onClick={() => setDecisao('aceita')}>Aceitar</Button>
                <Button variant="secondary" onClick={() => setDecisao('recusada')}>Recusar</Button>
              </div>
            )}
            <ResponderModal solicitacao={decisao ? s : null} decisao={decisao ?? 'aceita'} onClose={() => setDecisao(null)} onDone={(m) => { setAviso(m); reload() }} />
          </div>
        )}
      </DataBoundary>
    </>
  )
}
