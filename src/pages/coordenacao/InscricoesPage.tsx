import { useState, type FormEvent } from 'react'
import { useCurrentUser } from '../../auth/useAuth'
import { StatusBadge } from '../../components/StatusBadge'
import { Badge, Button, DataBoundary, EmptyState, Field, Icon, Input, PageHeader, SectionCard, Select, StatCard, StatGroup } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { baixarCsv, buildCsv } from '../../lib/csv'
import { daysUntil, formatDate, formatDateLong, plural } from '../../lib/format'
import { getPeriodoInscricao, listInscricoes, savePeriodoInscricao } from '../../services/api'
import type { Fase, Inscricao, PeriodoInscricao } from '../../types'

function PeriodoCard({ periodo, onSaved }: { periodo: PeriodoInscricao | null; onSaved: () => void }) {
  const user = useCurrentUser()
  const [editando, setEditando] = useState(!periodo)
  const [semestre, setSemestre] = useState(periodo?.semestre ?? '')
  const [inicio, setInicio] = useState(periodo?.inicio ?? '')
  const [fim, setFim] = useState(periodo?.fim ?? '')
  const [erro, setErro] = useState<string>()
  const [salvando, setSalvando] = useState(false)
  const [ok, setOk] = useState(false)

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    setErro(undefined)
    try {
      await savePeriodoInscricao(user, { semestre, inicio, fim })
      setEditando(false)
      setOk(true)
      onSaved()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar o período.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <SectionCard
      title="Período de inscrições"
      description="Alunos só conseguem se inscrever dentro destas datas."
      action={periodo && !editando ? <StatusBadge kind="periodo" value={periodo.situacao} /> : undefined}
    >
      {editando ? (
        <form onSubmit={salvar} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Semestre" hint="Ex.: 2027/1">{(p) => <Input {...p} value={semestre} onChange={(e) => setSemestre(e.target.value)} />}</Field>
            <Field label="Início das inscrições">{(p) => <Input {...p} type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />}</Field>
            <Field label="Fim das inscrições">{(p) => <Input {...p} type="date" value={fim} onChange={(e) => setFim(e.target.value)} />}</Field>
          </div>
          {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
          <div className="flex gap-3">
            <Button type="submit" loading={salvando}>Salvar período</Button>
            {periodo && <Button variant="secondary" onClick={() => { setEditando(false); setErro(undefined) }}>Cancelar</Button>}
          </div>
        </form>
      ) : periodo ? (
        <div className="space-y-3">
          {ok && <p role="status" className="rounded-lg bg-accent-50 p-3 text-sm text-success">Período atualizado. O calendário público e a página dos alunos já refletem as novas datas.</p>}
          <p className="text-sm">
            Semestre <span className="font-medium">{periodo.semestre}</span>: de <span className="font-medium">{formatDateLong(periodo.inicio)}</span> a <span className="font-medium">{formatDateLong(periodo.fim)}</span>.
          </p>
          <p className="text-sm text-ink-muted">
            {periodo.situacao === 'antes' && `Abrem em ${plural(daysUntil(periodo.inicio), 'dia', 'dias')}.`}
            {periodo.situacao === 'aberto' && `Terminam em ${plural(daysUntil(periodo.fim), 'dia', 'dias')}.`}
            {periodo.situacao === 'encerrado' && 'Encerradas.'}
          </p>
          <Button variant="secondary" onClick={() => { setEditando(true); setOk(false) }}>Editar período</Button>
        </div>
      ) : null}
    </SectionCard>
  )
}

function Tabela({ itens }: { itens: Inscricao[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[52rem] text-left text-sm">
        <caption className="sr-only">Inscritos no TCC</caption>
        <thead className="border-b border-border text-xs tracking-wide text-ink-muted uppercase">
          <tr>
            <th scope="col" className="py-2 pr-4 font-medium">Aluno</th>
            <th scope="col" className="py-2 pr-4 font-medium">TCC</th>
            <th scope="col" className="py-2 pr-4 font-medium">Orientador</th>
            <th scope="col" className="py-2 pr-4 font-medium">Aviso ao orientador</th>
            <th scope="col" className="py-2 font-medium">Inscrição</th>
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
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={i.avisoOrientador === 'sistema' ? 'brand' : 'neutral'}>{i.avisoOrientador === 'sistema' ? 'No sistema' : 'Por e-mail'}</Badge>
                  <Badge tone={i.ciente ? 'success' : 'warning'}>{i.ciente ? 'Ciente' : 'Aguardando ciência'}</Badge>
                </div>
              </td>
              <td className="py-3">{formatDate(i.atualizadaEm ?? i.criadaEm)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function InscricoesPage() {
  const user = useCurrentUser()
  const { state, reload } = useAsync(async () => {
    const [periodo, inscritos] = await Promise.all([getPeriodoInscricao(), listInscricoes(user)])
    return { periodo, inscritos }
  }, [user.id])
  const [busca, setBusca] = useState('')
  const [fase, setFase] = useState<'' | Fase>('')

  return (
    <>
      <PageHeader title="Inscrições no TCC" description="Defina o período e acompanhe quem se inscreveu e com quem pretende fazer o TCC." />
      <DataBoundary state={state} reload={reload}>
        {({ periodo, inscritos }) => {
          const q = busca.trim().toLowerCase()
          const filtrados = inscritos.filter(
            (i) =>
              (!fase || i.fase === fase) &&
              (!q || `${i.alunoNome} ${i.matricula} ${i.orientadorNome} ${i.orientadorEmail ?? ''}`.toLowerCase().includes(q)),
          )
          const exportar = () => {
            const linhas = [
              ['Nome', 'Matrícula', 'Curso', 'TCC', 'Orientador', 'E-mail do orientador', 'Aviso', 'Ciência do orientador', 'Data da inscrição'],
              ...filtrados.map((i) => [
                i.alunoNome,
                i.matricula,
                i.curso,
                i.fase === 'TCC1' ? 'TCC 1' : 'TCC 2',
                i.orientadorNome,
                i.orientadorEmail ?? '',
                i.avisoOrientador === 'sistema' ? 'No sistema' : 'Por e-mail',
                i.ciente ? 'Ciente' : 'Aguardando',
                formatDate(i.atualizadaEm ?? i.criadaEm),
              ]),
            ]
            baixarCsv(`inscricoes-tcc-${periodo?.semestre.replace('/', '-') ?? 'semestre'}.csv`, buildCsv(linhas))
          }
          return (
            <div className="space-y-6">
              <PeriodoCard periodo={periodo} onSaved={reload} />

              <StatGroup>
                <StatCard label="Inscritos" value={inscritos.length} />
                <StatCard label="TCC 1" value={inscritos.filter((i) => i.fase === 'TCC1').length} />
                <StatCard label="TCC 2" value={inscritos.filter((i) => i.fase === 'TCC2').length} />
                <StatCard label="Aguardando ciência" value={inscritos.filter((i) => !i.ciente).length} tone={inscritos.some((i) => !i.ciente) ? 'warning' : 'default'} hint="Orientadores ainda sem confirmar" />
              </StatGroup>

              <SectionCard
                title="Inscritos"
                description={periodo ? `Semestre ${periodo.semestre}` : undefined}
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
                    <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
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
                    {filtrados.length ? <Tabela itens={filtrados} /> : <p role="status" className="py-4 text-center text-sm text-ink-muted">Nenhum resultado para os filtros aplicados.</p>}
                  </div>
                )}
              </SectionCard>
            </div>
          )
        }}
      </DataBoundary>
    </>
  )
}
