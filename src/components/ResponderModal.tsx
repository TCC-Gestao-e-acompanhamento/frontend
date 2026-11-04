import { useState } from 'react'
import { useCurrentUser } from '../auth/useAuth'
import { Button, Field, Modal, Textarea } from '../design-system'
import { responderSolicitacao } from '../services/api'
import type { Solicitacao } from '../types'

interface Props {
  solicitacao: Solicitacao | null
  decisao: 'aceita' | 'recusada'
  onClose: () => void
  onDone: () => void
}

/** Aceite/recusa com mensagem opcional. Usado no dashboard e no detalhe. */
export function ResponderModal({ solicitacao, decisao, onClose, onDone }: Props) {
  const user = useCurrentUser()
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState<string>()
  const [enviando, setEnviando] = useState(false)
  const aceitar = decisao === 'aceita'

  const fechar = () => {
    setTexto('')
    setErro(undefined)
    onClose()
  }

  const confirmar = async () => {
    if (!solicitacao) return
    setEnviando(true)
    setErro(undefined)
    try {
      await responderSolicitacao(user, solicitacao.id, { decisao, texto })
      setTexto('')
      onDone()
      onClose()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível registrar a resposta.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal open={!!solicitacao} title={aceitar ? 'Aceitar solicitação' : 'Recusar solicitação'} onClose={fechar}>
      {solicitacao && (
        <div className="space-y-4">
          <p className="text-sm">
            <span className="font-medium">{solicitacao.alunoNome}</span> · “{solicitacao.titulo}”
          </p>
          <Field label={aceitar ? 'Mensagem ao aluno (opcional)' : 'Justificativa (opcional)'} error={erro}>
            {(p) => <Textarea {...p} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={aceitar ? 'Ex.: próximos passos e horário da primeira reunião' : 'Ex.: não tenho vagas neste semestre'} />}
          </Field>
          {aceitar && (
            <p className="rounded-lg bg-surface-muted p-3 text-xs text-ink-muted">
              O aceite registra o interesse em orientar. Ele não equivale à vinculação ou designação institucional, que segue os
              procedimentos da UnB (a confirmar).
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={fechar}>Cancelar</Button>
            <Button variant={aceitar ? 'primary' : 'danger'} loading={enviando} onClick={confirmar}>
              {aceitar ? 'Confirmar aceite' : 'Confirmar recusa'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
