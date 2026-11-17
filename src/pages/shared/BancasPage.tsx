import { useState } from 'react'
import { BancaCard } from '../../components/BancaCard'
import { BancaForm } from '../../components/BancaForm'
import { useCurrentUser } from '../../auth/useAuth'
import { Button, Card, DataBoundary, Field, Modal, PageHeader, SectionCard, Textarea } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { formatDate } from '../../lib/format'
import { cancelBanca, confirmarBanca, createBanca, listBancas, listTccs, rejeitarBanca, updateBanca } from '../../services/api'
import type { Banca, Tcc } from '../../types'

/**
 * Bancas no escopo do perfil (aluno: a sua; orientador: dos orientandos; coordenação: todas).
 * Aluno e orientador propõem, editam e removem a banca até a coordenação validar. A coordenação valida ou rejeita a proposta (a rejeitada volta
 * para quem a fez, que pode ajustar e reenviar). Depois de validada, só a coordenação altera ou cancela.
 */
export default function BancasPage() {
  const user = useCurrentUser()
  const aluno = user.role === 'aluno'
  const orientador = user.role === 'orientador'
  const coordenacao = user.role === 'coordenacao'
  const { state, reload } = useAsync(async () => {
    const [bancas, tccs] = await Promise.all([listBancas(user), orientador ? listTccs(user) : Promise.resolve<Tcc[]>([])])
    // banca "a definir" é só um TCC sem proposta: o orientador vê esses trabalhos à parte, com a ação de propor
    const ativas = bancas.filter((b) => !orientador || b.situacao !== 'a_definir')
    const semBanca = tccs.filter((t) => !bancas.some((b) => b.tccId === t.id && b.situacao !== 'a_definir'))
    return { bancas: ativas, semBanca }
  }, [user.id])
  const [editandoId, setEditandoId] = useState<string>()
  const [propondoId, setPropondoId] = useState<string>()
  const [acao, setAcao] = useState<{ tipo: 'confirmar' | 'rejeitar' | 'cancelar' | 'remover'; banca: Banca }>()
  const [motivo, setMotivo] = useState('')
  const [executando, setExecutando] = useState(false)
  const [erro, setErro] = useState<string>()
  const [aviso, setAviso] = useState<string>()

  const executar = async () => {
    if (!acao) return
    setExecutando(true)
    setErro(undefined)
    try {
      if (acao.tipo === 'confirmar') await confirmarBanca(user, acao.banca.id)
      else if (acao.tipo === 'rejeitar') await rejeitarBanca(user, acao.banca.id, motivo)
      else await cancelBanca(user, acao.banca.id)
      const nome = acao.banca.alunoNome
      setAviso(
        acao.tipo === 'confirmar'
          ? `Banca de ${nome} validada. Ela já aparece no site e no calendário.`
          : acao.tipo === 'rejeitar'
            ? `Proposta de banca de ${nome} rejeitada. Quem a fez vê a rejeição e pode ajustar e reenviar.`
            : acao.tipo === 'cancelar'
              ? `Banca de ${nome} cancelada.`
              : `Banca de ${nome} removida.`,
      )
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
    // defesas sem TCC (dados de exemplo) são só de consulta
    if (!b.tccId) return undefined
    if (orientador) {
      if (b.situacao !== 'proposta' && b.situacao !== 'rejeitada') return undefined
      return (
        <>
          <Button size="sm" variant="neutral" onClick={() => { setAviso(undefined); setEditandoId(b.id) }}>{b.situacao === 'rejeitada' ? 'Ajustar e reenviar' : 'Editar proposta'}</Button>
          <Button size="sm" variant="danger-quiet" className="ml-auto" onClick={() => { setErro(undefined); setAcao({ tipo: 'remover', banca: b }) }}>Remover proposta</Button>
        </>
      )
    }
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
        {b.situacao === 'proposta' ? (
          <Button size="sm" variant="danger-quiet" className="ml-auto" onClick={() => { setErro(undefined); setMotivo(''); setAcao({ tipo: 'rejeitar', banca: b }) }}>Rejeitar</Button>
        ) : (
          <Button size="sm" variant="danger-quiet" className="ml-auto" onClick={() => { setErro(undefined); setAcao({ tipo: 'cancelar', banca: b }) }}>Cancelar banca</Button>
        )}
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
            ? 'Valide ou rejeite as bancas propostas por alunos e orientadores e ajuste data, local e membros. Depois de validada, só a coordenação altera ou cancela a banca.'
            : orientador
              ? 'Proponha a banca dos seus orientandos e ajuste a proposta até a coordenação validar. Depois de validada, só a coordenação altera.'
              : 'Composição, data e local das defesas. A coordenação valida as bancas propostas.'
        }
      />
      {aviso && <p role="status" className="mb-4 rounded-lg bg-accent-50 p-3 text-sm text-success">{aviso}</p>}
      <DataBoundary
        state={state}
        reload={reload}
        isEmpty={(d) => d.bancas.length === 0 && d.semBanca.length === 0}
        empty={{ title: 'Nenhuma banca registrada', description: 'A banca aparece aqui após ser definida.' }}
      >
        {(d) => (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {d.bancas.map((b) =>
              editandoId === b.id ? (
                <div key={b.id} className="md:col-span-2">
                  <SectionCard title={`Editar banca de ${b.alunoNome}`} description={b.situacao === 'agendada' ? 'Banca já validada: a data é obrigatória.' : b.situacao === 'rejeitada' ? 'Proposta rejeitada: ajuste o que for preciso e reenvie para a coordenação.' : 'Proposta: ajuste o que for preciso antes de validar.'}>
                    <BancaForm
                      inicial={b}
                      submitLabel={b.situacao === 'rejeitada' ? 'Reenviar proposta' : 'Salvar alterações'}
                      onCancel={() => setEditandoId(undefined)}
                      onSubmit={async (dados) => {
                        await updateBanca(user, b.id, dados)
                        setEditandoId(undefined)
                        setAviso(b.situacao === 'rejeitada' ? 'Proposta reenviada. A coordenação ainda precisa validar.' : 'Banca atualizada.')
                        reload()
                      }}
                    />
                  </SectionCard>
                </div>
              ) : (
                <BancaCard key={b.id} banca={b} acoes={acoesDe(b)} />
              ),
            )}
            {d.semBanca.map((t) =>
              propondoId === t.id ? (
                <div key={t.id} className="md:col-span-2">
                  <SectionCard title={`Propor banca de ${t.aluno.nome}`} description="A proposta só vale depois de validada pela coordenação. Até lá você e o aluno podem ajustá-la.">
                    <BancaForm
                      orientadorNome={user.nome}
                      submitLabel="Enviar proposta"
                      onCancel={() => setPropondoId(undefined)}
                      onSubmit={async (dados) => {
                        await createBanca(user, { tccId: t.id, ...dados })
                        setPropondoId(undefined)
                        setAviso(`Proposta de banca de ${t.aluno.nome} enviada. A coordenação ainda precisa validar.`)
                        reload()
                      }}
                    />
                  </SectionCard>
                </div>
              ) : (
                <Card key={t.id} className="p-5">
                  <h3 className="font-semibold">{t.titulo}</h3>
                  <p className="text-sm text-ink-muted">{t.aluno.nome}</p>
                  <p className="mt-3 text-sm text-ink-muted">Banca ainda não definida.</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                    <Button size="sm" variant="secondary" onClick={() => { setAviso(undefined); setPropondoId(t.id) }}>Propor banca</Button>
                  </div>
                </Card>
              ),
            )}
          </div>
        )}
      </DataBoundary>

      <Modal
        open={!!acao}
        title={acao?.tipo === 'confirmar' ? 'Validar a banca?' : acao?.tipo === 'rejeitar' ? 'Rejeitar a proposta?' : acao?.tipo === 'cancelar' ? 'Cancelar a banca?' : 'Remover a banca?'}
        bloqueado={executando}
        onClose={() => setAcao(undefined)}
      >
        {acao && (
          <div className="space-y-4 text-sm">
            <p>
              {acao.tipo === 'confirmar'
                ? `A banca de ${acao.banca.alunoNome} passa a Agendada${acao.banca.data ? ` para ${formatDate(acao.banca.data)}` : ''} e fica pública no site e no calendário. Depois de validada, o aluno e o orientador não alteram mais a banca.`
                : acao.tipo === 'rejeitar'
                  ? `A proposta de banca de ${acao.banca.alunoNome} fica marcada como Rejeitada e não é pública. O aluno e o orientador veem a rejeição e podem ajustar e reenviar a proposta.`
                  : acao.tipo === 'cancelar'
                    ? `A banca de ${acao.banca.alunoNome} deixa de ser pública e sai do calendário. Os dados serão apagados e o TCC volta a ficar sem banca definida.`
                    : `Os dados da banca de ${acao.banca.alunoNome} serão apagados e o TCC volta a ficar sem banca definida. O aluno ou o orientador poderão propor de novo.`}
            </p>
            {acao.tipo === 'rejeitar' && (
              <Field label="Motivo (opcional)" hint="Aparece para o aluno e o orientador. Até 300 caracteres.">
                {(p) => <Textarea {...p} value={motivo} maxLength={300} onChange={(e) => setMotivo(e.target.value)} className="min-h-20" />}
              </Field>
            )}
            {erro && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-danger">{erro}</p>}
            <div className="flex flex-wrap gap-2">
              <Button variant={acao.tipo === 'confirmar' ? 'success' : 'danger'} loading={executando} onClick={executar}>
                {acao.tipo === 'confirmar' ? 'Validar banca' : acao.tipo === 'rejeitar' ? 'Rejeitar proposta' : acao.tipo === 'cancelar' ? 'Cancelar banca' : 'Remover banca'}
              </Button>
              <Button variant="neutral" disabled={executando} onClick={() => setAcao(undefined)}>Voltar</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
