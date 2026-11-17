import { useState } from 'react'
import { useCurrentUser } from '../auth/useAuth'
import { Button, Modal, Stepper } from '../design-system'
import { concluirEtapa } from '../services/api'
import type { Tcc } from '../types'

interface Props {
  tcc: Tcc
  /** Aluno e orientador do trabalho concluem a etapa; a coordenação só acompanha. */
  podeConcluir: boolean
  onChanged: () => void
}

/** Linha do tempo das etapas, com a ação "Concluir etapa" na etapa atual (igual para aluno e orientador). */
export function EtapasAcompanhamento({ tcc, podeConcluir, onChanged }: Props) {
  const user = useCurrentUser()
  const [aberto, setAberto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string>()
  const atual = tcc.etapas.find((e) => e.situacao === 'atual')
  const proxima = tcc.etapas[tcc.etapas.findIndex((e) => e.situacao === 'atual') + 1]
  const todasConcluidas = !atual

  const concluir = async () => {
    setEnviando(true)
    setErro(undefined)
    try {
      await concluirEtapa(user, tcc.id, atual?.nome ?? '')
      setAberto(false)
      onChanged()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível concluir a etapa.')
      onChanged() // a tela pode estar desatualizada (a outra parte concluiu antes)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-4">
      {todasConcluidas && <p role="status" className="rounded-lg bg-accent-50 p-3 text-sm text-success">Todas as etapas deste trabalho foram concluídas.</p>}
      <Stepper
        etapas={tcc.etapas}
        acaoAtual={
          podeConcluir && atual ? (
            <Button size="sm" variant="success" onClick={() => { setErro(undefined); setAberto(true) }}>
              Concluir etapa
            </Button>
          ) : undefined
        }
      />
      <Modal open={aberto && !!atual} title="Concluir a etapa?" bloqueado={enviando} onClose={() => setAberto(false)}>
        {atual && (
          <div className="space-y-4 text-sm">
            <p>
              A etapa <strong>{atual.nome}</strong> será marcada como concluída por você, hoje.{' '}
              {proxima ? (
                <>
                  A próxima, <strong>{proxima.nome}</strong>, passa a ser a etapa atual.
                </>
              ) : (
                'Era a última etapa: o trabalho fica com todas as etapas concluídas.'
              )}{' '}
              {user.role === 'aluno' ? 'O orientador pode ajustar a etapa atual se discordar.' : 'O aluno vê a mudança no acompanhamento.'}
            </p>
            {erro && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-danger">{erro}</p>}
            <div className="flex flex-wrap gap-2">
              <Button variant="success" loading={enviando} onClick={concluir}>Concluir etapa</Button>
              <Button variant="neutral" disabled={enviando} onClick={() => setAberto(false)}>Cancelar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
