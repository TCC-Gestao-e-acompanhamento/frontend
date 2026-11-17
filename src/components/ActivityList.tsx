import { useEffect, useRef, useState } from 'react'
import { useCurrentUser } from '../auth/useAuth'
import { Button, buttonClass, Icon, Modal, Tooltip, type IconName } from '../design-system'
import { cn, daysUntil, formatDate, relativeDays } from '../lib/format'
import { focarAvisoAtividade } from '../lib/foco'
import { deleteAtividade } from '../services/api'
import type { Atividade, Role } from '../types'
import { AtividadeForm } from './AtividadeForm'
import { StatusBadge } from './StatusBadge'

const TIPO_ICON: Record<Atividade['tipo'], IconName> = { entrega: 'upload', reuniao: 'users', marco: 'flag' }
const TIPO_LABEL: Record<Atividade['tipo'], string> = { entrega: 'Entrega', reuniao: 'Reunião', marco: 'Marco' }
const PAPEL: Record<Role, string> = { aluno: 'aluno', orientador: 'orientador', coordenacao: 'coordenação' }

interface Props {
  items: Atividade[]
  showAluno?: boolean
  /**
   * Quando informado, cada atividade ganha Editar e Excluir (aluno e orientador do TCC) e a função recebe o aviso de
   * sucesso para a tela mostrar. Sem ele, a lista é só de consulta.
   */
  onChanged?: (aviso: string) => void
  /** Chamada ao começar a editar ou excluir, para a tela limpar o aviso anterior. */
  onAbrir?: () => void
}

export function ActivityList({ items, showAluno = false, onChanged, onAbrir }: Props) {
  const user = useCurrentUser()
  const [editandoId, setEditandoId] = useState<string>()
  const [excluindo, setExcluindo] = useState<Atividade>()
  const [removendo, setRemovendo] = useState(false)
  const [erro, setErro] = useState<string>()
  // atividade cujo botão Editar deve receber o foco quando o formulário da linha fechar
  const voltarFoco = useRef<string>(undefined)
  // depois de cada desenho o pedido de foco já foi atendido (ou a linha não está visível): não deve valer para um desenho futuro
  useEffect(() => {
    voltarFoco.current = undefined
  })

  const excluir = async () => {
    if (!excluindo || !onChanged) return
    setRemovendo(true)
    setErro(undefined)
    try {
      await deleteAtividade(user, excluindo.id)
      setExcluindo(undefined)
      onChanged('Atividade excluída do cronograma.')
      // o botão que abriu o diálogo deixa de existir: o foco vai para o aviso
      focarAvisoAtividade()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível excluir a atividade.')
    } finally {
      setRemovendo(false)
    }
  }

  return (
    <>
      <ul className="divide-y divide-border">
        {items.map((a) => {
          if (editandoId === a.id && onChanged) {
            return (
              <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                <AtividadeForm
                  atividade={a}
                  onSaved={(aviso) => { voltarFoco.current = a.id; setEditandoId(undefined); onChanged(aviso) }}
                  onCancel={() => { voltarFoco.current = a.id; setEditandoId(undefined) }}
                />
              </li>
            )
          }
          const dias = daysUntil(a.prazo)
          const aberta = a.status !== 'concluida'
          return (
            <li key={a.id} className={cn('flex items-start gap-3 py-3 first:pt-0 last:pb-0', onChanged && 'flex-wrap sm:flex-nowrap')}>
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                <Icon name={TIPO_ICON[a.tipo]} size={18} />
              </span>
              <div className={cn('min-w-0 flex-1', onChanged && 'basis-[calc(100%-3rem)] sm:basis-auto')}>
                <p className="font-medium">{a.titulo}</p>
                <p className="text-sm text-ink-muted">
                  {TIPO_LABEL[a.tipo]}
                  {showAluno && <> · {a.alunoNome}</>} · {formatDate(a.prazo)}
                  {aberta && (
                    <span className={cn(dias < 0 && 'font-medium text-danger')}> ({relativeDays(a.prazo)})</span>
                  )}
                </p>
                {onChanged && (
                  <p className="text-xs text-ink-muted">
                    Criada por {a.criadaPorNome} ({PAPEL[a.criadaPorRole]})
                  </p>
                )}
              </div>
              {onChanged ? (
                // em tela estreita o selo e as ações vão para uma segunda linha, alinhadas ao texto
                <div className="flex w-full shrink-0 items-center gap-2 pl-12 sm:w-auto sm:pl-0">
                  <StatusBadge kind="atividade" value={a.status} />
                  <div className="ml-auto flex gap-1">
                    <Tooltip texto="Editar atividade">
                      <button
                        type="button"
                        ref={(el) => {
                          if (el && voltarFoco.current === a.id) {
                            voltarFoco.current = undefined
                            el.focus()
                          }
                        }}
                        onClick={() => { voltarFoco.current = undefined; onAbrir?.(); setEditandoId(a.id) }}
                        aria-label={`Editar a atividade ${a.titulo}`}
                        className={cn(buttonClass('neutral', 'sm'), 'min-w-11 px-0 sm:min-w-9')}
                      >
                        <Icon name="pencil" size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip texto="Excluir atividade" alinhar="fim">
                      <button
                        type="button"
                        onClick={() => { voltarFoco.current = undefined; onAbrir?.(); setErro(undefined); setExcluindo(a) }}
                        aria-label={`Excluir a atividade ${a.titulo}`}
                        className={cn(buttonClass('danger-quiet', 'sm'), 'min-w-11 px-0 sm:min-w-9')}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              ) : (
                <StatusBadge kind="atividade" value={a.status} />
              )}
            </li>
          )
        })}
      </ul>

      {onChanged && (
        <Modal open={!!excluindo} title="Excluir a atividade?" bloqueado={removendo} onClose={() => setExcluindo(undefined)}>
          {excluindo && (
            <div className="space-y-4 text-sm">
              <p>
                “{excluindo.titulo}” ({formatDate(excluindo.prazo)}) sai do cronograma de {excluindo.alunoNome}. Não dá para desfazer.
              </p>
              {erro && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-danger">{erro}</p>}
              <div className="flex flex-wrap gap-2">
                <Button variant="danger" loading={removendo} onClick={excluir}>Excluir atividade</Button>
                <Button variant="neutral" disabled={removendo} onClick={() => setExcluindo(undefined)}>Cancelar</Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  )
}
