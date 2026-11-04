import { useState } from 'react'
import { ProfessorCard } from '../../components/ProfessorCard'
import { SolicitarButton } from '../../components/SolicitarButton'
import { Checkbox, DataBoundary, Field, Icon, Input, PageHeader, Select, ButtonLink } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { listAreas, listCursos, listProfessoresPublicos } from '../../services/api'

/** Busca pública de orientadores: não exige autenticação. */
export default function OrientadoresPage() {
  const { state, reload } = useAsync(async () => {
    const [professores, cursos, areas] = await Promise.all([listProfessoresPublicos(), listCursos(), listAreas()])
    return { professores, cursos, areas }
  })
  const [busca, setBusca] = useState('')
  const [curso, setCurso] = useState('')
  const [area, setArea] = useState('')
  const [soDisponiveis, setSoDisponiveis] = useState(false)

  const limpar = () => {
    setBusca('')
    setCurso('')
    setArea('')
    setSoDisponiveis(false)
  }

  return (
    <>
      <PageHeader
        title="Encontre um orientador"
        description="Consulte professores da UnB que orientam TCC, por curso e área de interesse. A consulta é aberta; o login só é necessário para solicitar orientação."
      />
      <DataBoundary
        state={state}
        reload={reload}
        isEmpty={(d) => d.professores.length === 0}
        empty={{ title: 'Nenhum professor cadastrado', description: 'Os professores aparecem aqui assim que publicarem seus perfis.' }}
      >
        {({ professores, cursos, areas }) => {
          const q = busca.trim().toLowerCase()
          const lista = professores.filter(
            (p) =>
              (!q || p.nome.toLowerCase().includes(q)) &&
              (!curso || p.cursos.some((c) => c.id === curso)) &&
              (!area || p.areas.some((a) => a.id === area)) &&
              (!soDisponiveis || p.aceitandoSolicitacoes),
          )
          return (
            <div className="space-y-6">
              <form role="search" aria-label="Filtrar orientadores" onSubmit={(e) => e.preventDefault()} className="grid gap-4 rounded-card border border-border p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
                <Field label="Nome do professor">
                  {(p) => (
                    <div className="relative">
                      <Icon name="search" size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" />
                      <Input {...p} type="search" value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" placeholder="Buscar por nome" />
                    </div>
                  )}
                </Field>
                <Field label="Curso">
                  {(p) => (
                    <Select {...p} value={curso} onChange={(e) => setCurso(e.target.value)}>
                      <option value="">Todos os cursos</option>
                      {cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="Área de interesse">
                  {(p) => (
                    <Select {...p} value={area} onChange={(e) => setArea(e.target.value)}>
                      <option value="">Todas as áreas</option>
                      {areas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                    </Select>
                  )}
                </Field>
                <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2 lg:col-span-3">
                  <Checkbox label="Mostrar apenas quem está recebendo solicitações" checked={soDisponiveis} onChange={(e) => setSoDisponiveis(e.target.checked)} />
                  <p role="status" className="text-sm text-ink-muted">{lista.length} professor(es) encontrado(s)</p>
                </div>
              </form>

              {lista.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="font-medium">Nenhum professor encontrado</p>
                  <p className="mt-1 text-sm text-ink-muted">Tente outro curso ou área, ou remova algum filtro.</p>
                  <button type="button" onClick={limpar} className="mt-3 min-h-11 text-sm font-medium text-brand-700 hover:underline">Limpar filtros</button>
                </div>
              ) : (
                <ul className="grid gap-4 md:grid-cols-2">
                  {lista.map((p) => (
                    <li key={p.id}>
                      <ProfessorCard
                        professor={p}
                        href={`/orientadores/${p.id}`}
                        footer={
                          <>
                            <ButtonLink to={`/orientadores/${p.id}`} variant="secondary">Ver perfil</ButtonLink>
                            <SolicitarButton professor={p} />
                          </>
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        }}
      </DataBoundary>
    </>
  )
}
