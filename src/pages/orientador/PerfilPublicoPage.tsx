import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ProfessorCard } from '../../components/ProfessorCard'
import { useCurrentUser } from '../../auth/useAuth'
import { Badge, Button, Checkbox, DataBoundary, Field, Icon, Input, PageHeader, SectionCard, Textarea } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { getMeuPerfil, listAreas, listCursos, saveMeuPerfil } from '../../services/api'
import type { AreaOrientacao, Curso, ProfessorPublico } from '../../types'

function PerfilForm({ inicial, cursos, catalogo }: { inicial: ProfessorPublico; cursos: Curso[]; catalogo: AreaOrientacao[] }) {
  const user = useCurrentUser()
  const [apresentacao, setApresentacao] = useState(inicial.apresentacao ?? '')
  const [cursoIds, setCursoIds] = useState(inicial.cursos.map((c) => c.id))
  const [areas, setAreas] = useState(inicial.areas.map((a) => a.nome))
  const [nova, setNova] = useState('')
  const [aceitando, setAceitando] = useState(inicial.aceitandoSolicitacoes)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null)

  const addArea = () => {
    const n = nova.trim()
    if (n && !areas.some((a) => a.toLowerCase() === n.toLowerCase())) setAreas([...areas, n])
    setNova('')
    setMsg(null)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    setMsg(null)
    try {
      await saveMeuPerfil(user, { apresentacao, cursoIds, areas, aceitandoSolicitacoes: aceitando })
      setMsg({ ok: true, texto: 'Perfil público atualizado.' })
    } catch (err) {
      setMsg({ ok: false, texto: err instanceof Error ? err.message : 'Não foi possível salvar.' })
    } finally {
      setSalvando(false)
    }
  }

  const preview: ProfessorPublico = {
    ...inicial,
    cursos: cursos.filter((c) => cursoIds.includes(c.id)),
    areas: areas.map((nome, i) => ({ id: `${i}-${nome}`, nome })),
    apresentacao: apresentacao.trim() || undefined,
    aceitandoSolicitacoes: aceitando,
  }
  const sugestoes = catalogo.filter((a) => !areas.some((x) => x.toLowerCase() === a.nome.toLowerCase()))

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <form onSubmit={submit} className="space-y-6">
        <SectionCard title="Disponibilidade">
          <Checkbox label="Estou recebendo novas solicitações de orientação" checked={aceitando} onChange={(e) => { setAceitando(e.target.checked); setMsg(null) }} />
          <p className="text-xs text-ink-muted">Quando desligado, o botão “Solicitar orientação” fica indisponível no seu perfil público.</p>
        </SectionCard>

        <SectionCard title="Apresentação" description="Opcional. Aparece na página pública.">
          <Field label="Breve apresentação acadêmica">
            {(p) => <Textarea {...p} value={apresentacao} onChange={(e) => { setApresentacao(e.target.value); setMsg(null) }} maxLength={400} />}
          </Field>
          <p className="mt-1 text-right text-xs text-ink-muted">{apresentacao.length}/400</p>
        </SectionCard>

        <SectionCard title="Cursos de atuação">
          <fieldset>
            <legend className="sr-only">Cursos de atuação</legend>
            <div className="grid gap-1 sm:grid-cols-2">
              {cursos.map((c) => (
                <Checkbox
                  key={c.id}
                  label={c.nome}
                  checked={cursoIds.includes(c.id)}
                  onChange={(e) => { setCursoIds(e.target.checked ? [...cursoIds, c.id] : cursoIds.filter((x) => x !== c.id)); setMsg(null) }}
                />
              ))}
            </div>
          </fieldset>
        </SectionCard>

        <SectionCard title="Áreas de orientação" description="Temas em que você tem interesse ou disponibilidade. Você pode criar áreas novas.">
          {areas.length ? (
            <ul className="mb-4 flex flex-wrap gap-2">
              {areas.map((a) => (
                <li key={a}>
                  <span className="inline-flex items-center gap-1 rounded-full border border-brand-100 bg-brand-50 py-0.5 pr-1 pl-3 text-sm text-brand-700">
                    {a}
                    <button type="button" aria-label={`Remover área ${a}`} onClick={() => { setAreas(areas.filter((x) => x !== a)); setMsg(null) }} className="grid size-8 place-items-center rounded-full hover:bg-brand-100">
                      <Icon name="close" size={14} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-sm text-ink-muted">Nenhuma área cadastrada ainda.</p>
          )}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="Adicionar área" hint="Escolha uma sugestão ou digite uma nova.">
                {(p) => (
                  <>
                    <Input
                      {...p}
                      list="areas-sugeridas"
                      value={nova}
                      onChange={(e) => setNova(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addArea() } }}
                    />
                    <datalist id="areas-sugeridas">{sugestoes.map((a) => <option key={a.id} value={a.nome} />)}</datalist>
                  </>
                )}
              </Field>
            </div>
            <Button variant="secondary" onClick={addArea} className="mb-[1.625rem]">Adicionar área</Button>
          </div>
        </SectionCard>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={salvando}>Salvar perfil</Button>
          <Link to={`/orientadores/${inicial.id}`} className="inline-flex min-h-11 items-center text-sm font-medium text-brand-700 hover:underline">Ver página pública</Link>
          {msg && <p role={msg.ok ? 'status' : 'alert'} className={`text-sm ${msg.ok ? 'text-success' : 'text-danger'}`}>{msg.texto}</p>}
        </div>
      </form>

      <aside aria-label="Pré-visualização" className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Como aparece na busca pública</p>
          <Badge>Pré-visualização</Badge>
        </div>
        <ProfessorCard professor={preview} />
        <p className="mt-2 text-xs text-ink-muted">Somente estes dados são públicos. Seu e-mail e informações internas não são exibidos.</p>
      </aside>
    </div>
  )
}

export default function PerfilPublicoPage() {
  const user = useCurrentUser()
  const { state, reload } = useAsync(async () => {
    const [perfil, cursos, areas] = await Promise.all([getMeuPerfil(user), listCursos(), listAreas()])
    return { perfil, cursos, areas }
  }, [user.id])
  return (
    <>
      <PageHeader title="Perfil público" description="Gerencie o que alunos e visitantes veem ao buscar orientadores." />
      <DataBoundary state={state} reload={reload}>
        {({ perfil, cursos, areas }) => <PerfilForm inicial={perfil} cursos={cursos} catalogo={areas} />}
      </DataBoundary>
    </>
  )
}
