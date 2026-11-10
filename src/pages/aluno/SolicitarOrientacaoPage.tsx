import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProfessorCard } from '../../components/ProfessorCard'
import { useCurrentUser } from '../../auth/useAuth'
import { Button, ButtonLink, DataBoundary, EmptyState, Field, Input, PageHeader, SectionCard, Select, Textarea } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { createSolicitacao, getProfessorPublico, listCursos, listSolicitacoes } from '../../services/api'

type Erros = Partial<Record<'titulo' | 'area' | 'descricao', string>>

export default function SolicitarOrientacaoPage() {
  const user = useCurrentUser()
  const { professorId = '' } = useParams()
  const navigate = useNavigate()
  const { state, reload } = useAsync(async () => {
    const [professor, cursos, enviadas] = await Promise.all([getProfessorPublico(professorId), listCursos(), listSolicitacoes(user)])
    return {
      professor,
      curso: cursos.find((c) => c.id === user.cursoId)?.nome ?? 'Não informado',
      pendente: enviadas.find((s) => s.professorId === professorId && s.status === 'pendente'),
    }
  }, [professorId, user.id])

  const [titulo, setTitulo] = useState('')
  const [area, setArea] = useState('')
  const [descricao, setDescricao] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erros, setErros] = useState<Erros>({})
  const [erroEnvio, setErroEnvio] = useState<string>()
  const [enviando, setEnviando] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const novos: Erros = {
      titulo: titulo.trim() ? undefined : 'Informe um título provisório.',
      area: area ? undefined : 'Selecione uma área de interesse.',
      descricao: descricao.trim().length >= 20 ? undefined : 'Descreva a proposta com pelo menos 20 caracteres.',
    }
    setErros(novos)
    if (novos.titulo || novos.area || novos.descricao) return
    setEnviando(true)
    setErroEnvio(undefined)
    try {
      const s = await createSolicitacao(user, { professorId, titulo, area, descricao, mensagem })
      navigate(`/aluno/solicitacoes/${s.id}`, { replace: true, state: { enviada: true } })
    } catch (err) {
      setErroEnvio(err instanceof Error ? err.message : 'Não foi possível enviar a solicitação.')
      setEnviando(false)
    }
  }

  return (
    <>
      <Link to="/orientadores" className="mb-1 inline-flex min-h-11 items-center text-sm text-brand-700 hover:underline">← Voltar para a busca</Link>
      <PageHeader title="Solicitar orientação" description="Apresente sua proposta de TCC. Leva poucos minutos." />
      <DataBoundary state={state} reload={reload}>
        {({ professor, curso, pendente }) =>
          pendente ? (
            <EmptyState
              title={`Você já pediu orientação a ${professor.nome}`}
              description="A solicitação está pendente. Acompanhe a resposta ou cancele para enviar outra."
              action={<ButtonLink to={`/aluno/solicitacoes/${pendente.id}`}>Ver minha solicitação</ButtonLink>}
            />
          ) : !professor.aceitandoSolicitacoes ? (
            <EmptyState
              title="Este professor não está recebendo solicitações"
              description="A disponibilidade é definida pelo próprio professor. Escolha outro orientador na busca."
              action={<Link to="/orientadores" className="min-h-11 text-sm font-medium text-brand-700 hover:underline">Voltar para a busca</Link>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
              <form onSubmit={submit} noValidate className="space-y-5 xl:order-1">
                <SectionCard title="Sua proposta">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Aluno" hint="Identificado pela sua sessão.">{(p) => <Input {...p} value={user.nome} readOnly className="bg-surface-muted" />}</Field>
                      <Field label="Curso" hint="Conforme seu cadastro.">{(p) => <Input {...p} value={curso} readOnly className="bg-surface-muted" />}</Field>
                    </div>
                    <Field label="Título provisório" error={erros.titulo}>
                      {(p) => <Input {...p} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Detecção de fraudes com aprendizado de máquina" />}
                    </Field>
                    <Field label="Área de interesse" error={erros.area} hint="Áreas em que este professor orienta.">
                      {(p) => (
                        <Select {...p} value={area} onChange={(e) => setArea(e.target.value)}>
                          <option value="">Selecione…</option>
                          {professor.areas.map((a) => <option key={a.id} value={a.nome}>{a.nome}</option>)}
                        </Select>
                      )}
                    </Field>
                    <Field label="Descrição da proposta" error={erros.descricao}>
                      {(p) => <Textarea {...p} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Qual é a ideia, o problema e o que pretende investigar?" />}
                    </Field>
                    <Field label="Mensagem ao professor (opcional)">
                      {(p) => <Textarea {...p} value={mensagem} onChange={(e) => setMensagem(e.target.value)} className="min-h-20" />}
                    </Field>
                  </div>
                </SectionCard>
                {erroEnvio && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{erroEnvio}</p>}
                <div className="flex gap-3">
                  <Button type="submit" loading={enviando}>Enviar solicitação</Button>
                  <Button variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
                </div>
              </form>

              <aside aria-label="Professor selecionado" className="order-first xl:order-2">
                <p className="mb-2 text-sm font-medium">Professor selecionado</p>
                <ProfessorCard professor={professor} href={`/orientadores/${professor.id}`} />
              </aside>
            </div>
          )
        }
      </DataBoundary>
    </>
  )
}
