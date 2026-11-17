import { useState, type FormEvent } from 'react'
import { useCurrentUser } from '../../auth/useAuth'
import { InscricaoForm } from '../../components/InscricaoForm'
import { StatusBadge } from '../../components/StatusBadge'
import { Badge, Button, DataBoundary, EmptyState, Field, Icon, Input, Modal, PageHeader, SectionCard, Select, StatCard, StatGroup } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { baixarCsv, buildCsv } from '../../lib/csv'
import { daysUntil, formatDate, mascaraSemestre, plural, semestreDe } from '../../lib/format'
import { cancelInscricao, listInscricoes, listPeriodosInscricao, listProfessoresPublicos, savePeriodoInscricao, updateInscricao } from '../../services/api'
import type { Fase, Inscricao, PeriodoResumo, ProfessorPublico } from '../../types'

type ModoForm = { tipo: 'novo' } | { tipo: 'editar'; periodo: PeriodoResumo }

/** Adiciona o período de inscrições de um semestre (com o semestre atual já preenchido) ou ajusta as datas de um existente. */
function PeriodoForm({ modo, existentes, onSaved, onCancel }: { modo: ModoForm; existentes: string[]; onSaved: (semestre: string) => void; onCancel: () => void }) {
  const user = useCurrentUser()
  const editando = modo.tipo === 'editar'
  const [semestre, setSemestre] = useState(() => (modo.tipo === 'editar' ? modo.periodo.semestre : semestreDe(new Date())))
  const [inicio, setInicio] = useState(modo.tipo === 'editar' ? modo.periodo.inicio : '')
  const [fim, setFim] = useState(modo.tipo === 'editar' ? modo.periodo.fim : '')
  const [erro, setErro] = useState<string>()
  const [salvando, setSalvando] = useState(false)

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    if (!editando && existentes.includes(semestre)) return setErro(`O semestre ${semestre} já tem um período. Use "Editar" na tabela para ajustar as datas.`)
    setSalvando(true)
    setErro(undefined)
    try {
      await savePeriodoInscricao(user, { semestre, inicio, fim })
      onSaved(semestre)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar o período.')
      setSalvando(false)
    }
  }

  return (
    <SectionCard
      title={editando ? `Editar período de ${modo.periodo.semestre}` : 'Adicionar semestre'}
      description="Os alunos só conseguem se inscrever entre as datas de início e de fim."
    >
      <form onSubmit={salvar} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Semestre" hint="Ex.: 2027/1">
            {(p) => (
              <Input
                {...p}
                value={semestre}
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                placeholder="0000/0"
                readOnly={editando}
                onChange={(e) => setSemestre(mascaraSemestre(e.target.value))}
              />
            )}
          </Field>
          <Field label="Início das inscrições">{(p) => <Input {...p} type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />}</Field>
          <Field label="Fim das inscrições">{(p) => <Input {...p} type="date" value={fim} onChange={(e) => setFim(e.target.value)} />}</Field>
        </div>
        {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
        <div className="flex gap-3">
          <Button type="submit" loading={salvando}>{editando ? 'Salvar datas' : 'Adicionar semestre'}</Button>
          <Button variant="neutral" disabled={salvando} onClick={onCancel}>Cancelar</Button>
        </div>
      </form>
    </SectionCard>
  )
}

/** Histórico: um período por semestre, com o número de inscritos. "Ver inscritos" troca a lista abaixo. */
function Historico({ periodos, selecionado, onVer, onEditar }: { periodos: PeriodoResumo[]; selecionado: string; onVer: (semestre: string) => void; onEditar: (p: PeriodoResumo) => void }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">Histórico de inscrições por semestre</caption>
        <thead className="border-b border-border text-xs tracking-wide text-ink-muted uppercase">
          <tr>
            <th scope="col" className="py-2 pr-4 font-medium">Semestre</th>
            <th scope="col" className="py-2 pr-4 font-medium">Período de inscrição</th>
            <th scope="col" className="py-2 pr-4 font-medium">Situação</th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">Inscritos</th>
            <th scope="col" className="py-2 pr-4 font-medium whitespace-nowrap">TCC 1 · TCC 2</th>
            <th scope="col" className="py-2 font-medium"><span className="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {periodos.map((p) => (
            <tr key={p.semestre} className={p.semestre === selecionado ? 'bg-brand-50/60' : undefined}>
              <th scope="row" className="py-3 pr-4 font-semibold whitespace-nowrap">{p.semestre}</th>
              <td className="py-3 pr-4 whitespace-nowrap">
                {formatDate(p.inicio)} a {formatDate(p.fim)}
                {p.situacao === 'antes' && <p className="text-xs text-ink-muted">Abrem em {plural(daysUntil(p.inicio), 'dia', 'dias')}</p>}
                {p.situacao === 'aberto' && <p className="text-xs text-ink-muted">Terminam em {plural(daysUntil(p.fim), 'dia', 'dias')}</p>}
              </td>
              <td className="py-3 pr-4">
                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge kind="periodo" value={p.situacao} />
                  {p.ativo && <Badge tone="brand">Em vigor</Badge>}
                </div>
              </td>
              <td className="py-3 pr-4 text-right font-medium tabular-nums">{p.total}</td>
              <td className="py-3 pr-4 whitespace-nowrap tabular-nums text-ink-muted">{p.tcc1} · {p.tcc2}</td>
              <td className="py-3">
                <div className="flex justify-end gap-2 whitespace-nowrap">
                  <Button size="sm" variant={p.semestre === selecionado ? 'primary' : 'neutral'} aria-pressed={p.semestre === selecionado} aria-label={`Ver inscritos de ${p.semestre}`} onClick={() => onVer(p.semestre)}>
                    Inscritos
                  </Button>
                  <Button size="sm" variant="warning" aria-label={`Editar o período de ${p.semestre}`} onClick={() => onEditar(p)}>Editar</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Tabela({ itens, editavel, onEditar, onCancelar }: { itens: Inscricao[]; editavel: boolean; onEditar: (i: Inscricao) => void; onCancelar: (i: Inscricao) => void }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[54rem] text-left text-sm">
        <caption className="sr-only">Inscritos no TCC</caption>
        <thead className="border-b border-border text-xs tracking-wide text-ink-muted uppercase">
          <tr>
            <th scope="col" className="py-2 pr-4 font-medium">Aluno</th>
            <th scope="col" className="py-2 pr-4 font-medium">TCC</th>
            <th scope="col" className="py-2 pr-4 font-medium">Orientador</th>
            <th scope="col" className="py-2 pr-4 font-medium">Aviso ao orientador</th>
            <th scope="col" className="py-2 pr-4 font-medium">Inscrição</th>
            {editavel && <th scope="col" className="py-2 font-medium"><span className="sr-only">Ações</span></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {itens.map((i) => (
            <tr key={i.id}>
              <td className="py-3 pr-4">
                <p className="font-medium">{i.alunoNome}</p>
                <p className="text-ink-muted">{i.matricula} · {i.curso}</p>
              </td>
              <td className="py-3 pr-4 font-medium whitespace-nowrap">{i.fase === 'TCC1' ? 'TCC 1' : 'TCC 2'}</td>
              <td className="py-3 pr-4">
                <p>{i.orientadorNome}</p>
                <p className="text-ink-muted">{i.orientadorEmail}</p>
              </td>
              <td className="py-3 pr-4">
                <Badge tone={i.ciente ? 'success' : 'warning'}>{i.ciente ? 'Ciente' : 'Aguardando ciência'}</Badge>
              </td>
              <td className="py-3 pr-4">{formatDate(i.atualizadaEm ?? i.criadaEm)}</td>
              {editavel && (
                <td className="py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="warning" onClick={() => onEditar(i)} aria-label={`Editar inscrição de ${i.alunoNome}`}>Editar</Button>
                    <Button size="sm" variant="secondary" onClick={() => onCancelar(i)} aria-label={`Cancelar inscrição de ${i.alunoNome}`}>Cancelar</Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CancelarInscricao({ i, onDone, onClose }: { i: Inscricao; onDone: (m: string) => void; onClose: () => void }) {
  const user = useCurrentUser()
  const [cancelando, setCancelando] = useState(false)
  const [erro, setErro] = useState<string>()
  const confirmar = async () => {
    setCancelando(true)
    setErro(undefined)
    try {
      await cancelInscricao(user, i.id)
      onDone(`Inscrição de ${i.alunoNome} cancelada.`)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível cancelar.')
      setCancelando(false)
    }
  }
  return (
    <div className="space-y-4">
      <p className="text-sm">
        Cancelar a inscrição de <span className="font-medium">{i.alunoNome}</span> ({i.fase === 'TCC1' ? 'TCC 1' : 'TCC 2'}, orientador {i.orientadorNome})? Ela some desta lista.
        O aluno poderá enviar uma nova inscrição se o período ainda estiver aberto.
      </p>
      {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" autoFocus onClick={onClose}>Manter inscrição</Button>
        <Button variant="danger" loading={cancelando} onClick={confirmar}>Sim, cancelar inscrição</Button>
      </div>
    </div>
  )
}

export default function InscricoesPage() {
  const user = useCurrentUser()
  // semestre cuja lista de inscritos está aberta; vazio = o período em vigor
  const [semestreSel, setSemestreSel] = useState<string>()
  const { state, reload } = useAsync(async () => {
    const [periodos, professores] = await Promise.all([listPeriodosInscricao(user), listProfessoresPublicos()])
    const semestre = semestreSel ?? periodos.find((p) => p.ativo)?.semestre
    const inscritos = await listInscricoes(user, semestre)
    return { periodos, inscritos, professores, semestre }
  }, [user.id, semestreSel])
  const [busca, setBusca] = useState('')
  const [fase, setFase] = useState<'' | Fase>('')
  const [acao, setAcao] = useState<{ i: Inscricao; tipo: 'editar' | 'cancelar' } | null>(null)
  const [form, setForm] = useState<ModoForm | null>(null)
  const [aviso, setAviso] = useState<string>()
  const fechar = () => setAcao(null)

  return (
    <>
      <PageHeader
        title="Inscrições no TCC"
        description="Cada semestre tem o seu período de inscrições. Adicione o do semestre e acompanhe o histórico de inscritos."
        actions={!form ? <Button onClick={() => { setAviso(undefined); setForm({ tipo: 'novo' }) }}>Adicionar semestre</Button> : undefined}
      />
      <DataBoundary state={state} reload={reload}>
        {({ periodos, inscritos, professores, semestre }: { periodos: PeriodoResumo[]; inscritos: Inscricao[]; professores: ProfessorPublico[]; semestre: string | undefined }) => {
          const q = busca.trim().toLowerCase()
          const filtrados = inscritos.filter(
            (i) =>
              (!fase || i.fase === fase) &&
              (!q || `${i.alunoNome} ${i.matricula} ${i.orientadorNome} ${i.orientadorEmail ?? ''}`.toLowerCase().includes(q)),
          )
          const doPeriodo = periodos.find((p) => p.semestre === semestre)
          const editavel = !!doPeriodo?.ativo
          const exportar = () => {
            const linhas = [
              ['Nome', 'Matrícula', 'Curso', 'TCC', 'Orientador', 'E-mail do orientador', 'Ciência do orientador', 'Data da inscrição'],
              ...filtrados.map((i) => [
                i.alunoNome,
                i.matricula,
                i.curso,
                i.fase === 'TCC1' ? 'TCC 1' : 'TCC 2',
                i.orientadorNome,
                i.orientadorEmail ?? '',
                i.ciente ? 'Ciente' : 'Aguardando',
                formatDate(i.atualizadaEm ?? i.criadaEm),
              ]),
            ]
            baixarCsv(`inscricoes-tcc-${(semestre ?? 'semestre').replace('/', '-')}.csv`, buildCsv(linhas))
          }
          return (
            <div className="space-y-6">
              {aviso && <p role="status" className="rounded-lg border border-border bg-surface-muted p-3 text-sm">{aviso}</p>}

              {form && (
                <PeriodoForm
                  key={form.tipo === 'editar' ? form.periodo.semestre : 'novo'}
                  modo={form}
                  existentes={periodos.map((p) => p.semestre)}
                  onCancel={() => setForm(null)}
                  onSaved={(s) => {
                    setForm(null)
                    setSemestreSel(s)
                    setAviso(form.tipo === 'novo' ? `Semestre ${s} adicionado. O calendário público e a página dos alunos já refletem o período em vigor.` : `Datas de ${s} atualizadas.`)
                    reload()
                  }}
                />
              )}

              {doPeriodo && (
                <StatGroup>
                  <StatCard label="Inscritos" value={inscritos.length} />
                  <StatCard label="TCC 1" value={inscritos.filter((i) => i.fase === 'TCC1').length} />
                  <StatCard label="TCC 2" value={inscritos.filter((i) => i.fase === 'TCC2').length} />
                  <StatCard label="Aguardando ciência" value={inscritos.filter((i) => !i.ciente).length} tone={inscritos.some((i) => !i.ciente) ? 'warning' : 'default'} />
                </StatGroup>
              )}

              <SectionCard title="Histórico por semestre" description="Um período por semestre. Escolha um semestre para ver os inscritos.">
                {periodos.length === 0 ? (
                  <EmptyState title="Nenhum semestre cadastrado" description='Use "Adicionar semestre" para definir o primeiro período de inscrições.' />
                ) : (
                  <Historico
                    periodos={periodos}
                    selecionado={semestre ?? ''}
                    onVer={(s) => { setSemestreSel(s); setBusca(''); setFase('') }}
                    onEditar={(p) => { setAviso(undefined); setForm({ tipo: 'editar', periodo: p }) }}
                  />
                )}
              </SectionCard>

              {doPeriodo && (
                <>
                  <SectionCard
                    title={`Inscritos · ${doPeriodo.semestre}`}
                    description={editavel ? 'Período em vigor: dá para editar ou cancelar inscrições.' : 'Semestre anterior: só consulta.'}
                    action={
                      <Button variant="secondary" size="sm" disabled={filtrados.length === 0} onClick={exportar}>
                        <Icon name="upload" size={16} className="rotate-180" />
                        Exportar CSV
                      </Button>
                    }
                  >
                    {inscritos.length === 0 ? (
                      <EmptyState title="Ninguém se inscreveu ainda" description="Os inscritos aparecem aqui assim que os alunos enviarem a inscrição." />
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
                          <Field label="Buscar por aluno, matrícula ou orientador">{(p) => <Input {...p} type="search" value={busca} onChange={(e) => setBusca(e.target.value)} />}</Field>
                          <Field label="TCC">
                            {(p) => (
                              <Select {...p} value={fase} onChange={(e) => setFase(e.target.value as '' | Fase)}>
                                <option value="">Todos</option>
                                <option value="TCC1">TCC 1</option>
                                <option value="TCC2">TCC 2</option>
                              </Select>
                            )}
                          </Field>
                        </div>
                        {filtrados.length ? (
                          <Tabela
                            itens={filtrados}
                            editavel={editavel}
                            onEditar={(i) => { setAviso(undefined); setAcao({ i, tipo: 'editar' }) }}
                            onCancelar={(i) => { setAviso(undefined); setAcao({ i, tipo: 'cancelar' }) }}
                          />
                        ) : (
                          <p role="status" className="py-4 text-center text-sm text-ink-muted">Nenhum resultado para os filtros aplicados.</p>
                        )}
                      </div>
                    )}
                  </SectionCard>
                </>
              )}

              <Modal open={acao?.tipo === 'editar'} title="Editar inscrição" onClose={fechar}>
                {acao?.tipo === 'editar' && (
                  <InscricaoForm
                    professores={professores}
                    alunoNome={acao.i.alunoNome}
                    matricula={acao.i.matricula}
                    inicial={acao.i}
                    submitLabel="Salvar alterações"
                    onCancel={fechar}
                    onSubmit={async (dados) => {
                      await updateInscricao(user, acao.i.id, dados)
                      setAviso(`Inscrição de ${acao.i.alunoNome} atualizada. O orientador é avisado de novo se mudou.`)
                      fechar()
                      reload()
                    }}
                  />
                )}
              </Modal>
              <Modal open={acao?.tipo === 'cancelar'} title="Cancelar inscrição" onClose={fechar}>
                {acao?.tipo === 'cancelar' && (
                  <CancelarInscricao i={acao.i} onClose={fechar} onDone={(m) => { setAviso(m); fechar(); reload() }} />
                )}
              </Modal>
            </div>
          )
        }}
      </DataBoundary>
    </>
  )
}
