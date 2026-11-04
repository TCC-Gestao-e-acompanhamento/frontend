import { Link } from 'react-router-dom'
import { StatusBadge } from '../../components/StatusBadge'
import { useCurrentUser } from '../../auth/useAuth'
import { DataBoundary, PageHeader, SectionCard } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { listTccs } from '../../services/api'
import type { Tcc, User } from '../../types'

export default function OrientadoresPage() {
  const user = useCurrentUser()
  const { state, reload } = useAsync(() => listTccs(user), [user.id])
  return (
    <>
      <PageHeader title="Orientadores e orientandos" description="Vínculos entre professores e alunos neste semestre. Alteração de vínculos depende de confirmação das atribuições institucionais." />
      <DataBoundary state={state} reload={reload} isEmpty={(d) => d.length === 0} empty={{ title: 'Nenhum vínculo cadastrado' }}>
        {(tccs) => {
          const grupos = tccs.reduce<Map<string, { orientador: User; tccs: Tcc[] }>>((m, t) => {
            const g = m.get(t.orientador.id) ?? { orientador: t.orientador, tccs: [] }
            g.tccs.push(t)
            return m.set(t.orientador.id, g)
          }, new Map())
          return (
            <div className="grid gap-6 lg:grid-cols-2">
              {[...grupos.values()].map(({ orientador, tccs: lista }) => (
                <SectionCard key={orientador.id} title={orientador.nome} description={`${lista.length} orientando(s) · ${orientador.email}`}>
                  <ul className="divide-y divide-border">
                    {lista.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <Link to={`/coordenacao/tccs/${t.id}`} className="font-medium text-brand-700 hover:underline">{t.aluno.nome}</Link>
                          <p className="truncate text-sm text-ink-muted">{t.fase === 'TCC1' ? 'TCC 1' : 'TCC 2'} · {t.etapaAtual}</p>
                        </div>
                        <StatusBadge kind="tcc" value={t.status} />
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              ))}
            </div>
          )
        }}
      </DataBoundary>
    </>
  )
}
