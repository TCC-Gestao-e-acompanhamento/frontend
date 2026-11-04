import { Link, useParams } from 'react-router-dom'
import { SolicitarButton } from '../../components/SolicitarButton'
import { Badge, DataBoundary, SectionCard } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { getProfessorPublico } from '../../services/api'
import { initials } from '../../lib/format'

export default function ProfessorPerfilPage() {
  const { id = '' } = useParams()
  const { state, reload } = useAsync(() => getProfessorPublico(id), [id])
  return (
    <>
      <Link to="/orientadores" className="mb-3 inline-block text-sm text-brand-700 hover:underline">← Voltar para a busca</Link>
      <DataBoundary state={state} reload={reload}>
        {(p) => (
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <span aria-hidden="true" className="grid size-16 place-items-center rounded-full bg-brand-700 text-xl font-semibold text-white">{initials(p.nome)}</span>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold tracking-tight">{p.nome}</h1>
                <p className="text-ink-muted">Professor(a) da Universidade de Brasília</p>
              </div>
              <Badge tone={p.aceitandoSolicitacoes ? 'success' : 'neutral'}>
                {p.aceitandoSolicitacoes ? 'Recebendo solicitações' : 'Sem vagas no momento'}
              </Badge>
            </div>

            <SectionCard title="Apresentação">
              {p.apresentacao ? <p>{p.apresentacao}</p> : <p className="text-sm text-ink-muted">O professor ainda não publicou uma apresentação.</p>}
            </SectionCard>

            <div className="grid gap-6 sm:grid-cols-2">
              <SectionCard title="Cursos">
                {p.cursos.length ? <ul className="space-y-1">{p.cursos.map((c) => <li key={c.id}>{c.nome}</li>)}</ul> : <p className="text-sm text-ink-muted">Não informado.</p>}
              </SectionCard>
              <SectionCard title="Áreas de orientação">
                {p.areas.length ? (
                  <ul className="flex flex-wrap gap-1.5">{p.areas.map((a) => <li key={a.id}><Badge tone="brand">{a.nome}</Badge></li>)}</ul>
                ) : (
                  <p className="text-sm text-ink-muted">Nenhuma área cadastrada.</p>
                )}
              </SectionCard>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-card bg-brand-50 p-5">
              <div className="flex-1">
                <p className="font-medium">Quer ser orientado por {p.nome.split(' ').slice(0, 3).join(' ')}?</p>
                <p className="text-sm text-ink-muted">Você precisará entrar com sua conta de aluno. Se ainda não entrou, voltamos a este professor depois do login.</p>
              </div>
              <SolicitarButton professor={p} />
            </div>
          </div>
        )}
      </DataBoundary>
    </>
  )
}
