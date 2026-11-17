import { useState } from 'react'
import { BancaCard } from '../../components/BancaCard'
import { BancaForm } from '../../components/BancaForm'
import { useCurrentUser } from '../../auth/useAuth'
import { Button, DataBoundary, Modal, PageHeader, SectionCard } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { formatDate } from '../../lib/format'
import { cancelBanca, confirmarBanca, listBancas, updateBanca } from '../../services/api'
import type { Banca } from '../../types'

/**
 * Bancas no escopo do perfil (aluno: a sua; orientador: dos orientandos; coordenação: todas).
 * A coordenação confirma as propostas dos alunos e é a única que altera ou remove uma banca depois de confirmada.
 */
export default function BancasPage() {
  const user = useCurrentUser()
  const { state, reload } = useAsync(() => listBancas(user), [user.id])
  const aluno = user.role === 'aluno'
  const coordenacao = user.role === 'coordenacao'
  const [editandoId, setEditandoId] = useState<string>()
  const [acao, setAcao] = useState<{ tipo: 'confirmar' | 'remover'; banca: Banca }>()
  const [executando, setExecutando] = useState(false)
  const [erro, setErro] = useState<string>()
  const [aviso, setAviso] = useState<string>()

  const executar = async () => {
    if (!acao) return
    setExecutando(true)
    setErro(undefined)
    try {
      if (acao.tipo === 'confirmar') await confirmarBanca(user, acao.banca.id)
      else await cancelBanca(user, acao.banca.id)
      setAviso(acao.tipo === 'confirmar' ? `Banca de ${acao.banca.alunoNome} validada. Ela já aparece no site e no calendário.` : `Banca de ${acao.banca.alunoNome} removida.`)
      setAcao(undefined)
      reload()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível concluir a ação.')
      reload() // o cartão pode estar desatualizado (ex.: a banca mudou de situação)
    } finally {
      setExecutando(false)
    }
  }

  const acoesDe = (b: Banca) => {
    if (!coordenacao || (b.situacao !== 'proposta' && b.situacao !== 'agendada')) return undefined
    return (
      <>
        {b.situacao === 'proposta' && (
          <Button
            size="sm"
            variant="success"
            disabled={!b.data}
            title={b.data ? undefined : 'Informe a data em Editar para poder validar'}
            onClick={() => { setErro(undefined); setAcao({ tipo: 'confirmar', banca: b }) }}
          >
            Validar
          </Button>
        )}
        <Button size="sm" variant="neutral" onClick={() => { setAviso(undefined); setEditandoId(b.id) }}>Editar</Button>
        <Button size="sm" variant="danger-quiet" className="ml-auto" onClick={() => { setErro(undefined); setAcao({ tipo: 'remover', banca: b }) }}>Remover</Button>
        {b.situacao === 'proposta' && !b.data && <p className="w-full text-xs text-ink-muted">Para validar, edite a banca e informe a data.</p>}
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={aluno ? 'Minha banca' : 'Bancas examinadoras'}
        description={
          coordenacao
            ? 'Valide as bancas propostas pelos alunos e ajuste data, local e membros. Depois de validada, só a coordenação altera ou remove a banca.'
            : 'Composição, data e local das defesas. A coordenação valida as bancas propostas pelos alunos.'
        }
      />
      {aviso && <p role="status" className="mb-4 rounded-lg bg-accent-50 p-3 text-sm text-success">{aviso}</p>}
      <DataBoundary
        state={state}
        reload={reload}
        isEmpty={(d) => d.length === 0}
        empty={{ title: 'Nenhuma banca registrada', description: 'A banca aparece aqui após ser definida.' }}
      >
        {(d) => (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {d.map((b) =>
              editandoId === b.id ? (
                <div key={b.id} className="md:col-span-2">
                  <SectionCard title={`Editar banca de ${b.alunoNome}`} description={b.situacao === 'agendada' ? 'Banca já validada: a data é obrigatória.' : 'Proposta do aluno: ajuste o que for preciso antes de validar.'}>
                    <BancaForm
                      inicial={b}
                      submitLabel="Salvar alterações"
                      onCancel={() => setEditandoId(undefined)}
                      onSubmit={async (dados) => {
                        await updateBanca(user, b.id, dados)
                        setEditandoId(undefined)
                        setAviso('Banca atualizada.')
                        reload()
                      }}
                    />
                  </SectionCard>
                </div>
              ) : (
                <BancaCard key={b.id} banca={b} acoes={acoesDe(b)} />
              ),
            )}
          </div>
        )}
      </DataBoundary>

      <Modal
        open={!!acao}
        title={acao?.tipo === 'confirmar' ? 'Validar a banca?' : 'Remover a banca?'}
        bloqueado={executando}
        onClose={() => setAcao(undefined)}
      >
        {acao && (
          <div className="space-y-4 text-sm">
            <p>
              {acao.tipo === 'confirmar'
                ? `A banca de ${acao.banca.alunoNome} passa a Agendada${acao.banca.data ? ` para ${formatDate(acao.banca.data)}` : ''} e fica pública no site e no calendário. Depois de validada, o aluno não altera mais a banca.`
                : `Os dados da banca de ${acao.banca.alunoNome} serão apagados e o TCC volta a ficar sem banca definida. O aluno poderá propor de novo.`}
            </p>
            {erro && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-danger">{erro}</p>}
            <div className="flex flex-wrap gap-2">
              <Button variant={acao.tipo === 'confirmar' ? 'success' : 'danger'} loading={executando} onClick={executar}>
                {acao.tipo === 'confirmar' ? 'Validar banca' : 'Remover banca'}
              </Button>
              <Button variant="neutral" disabled={executando} onClick={() => setAcao(undefined)}>Cancelar</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
