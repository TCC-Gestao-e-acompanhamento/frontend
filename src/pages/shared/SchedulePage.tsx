import { useState } from 'react'
import { ActivityList } from '../../components/ActivityList'
import { useCurrentUser } from '../../auth/useAuth'
import { DataBoundary, PageHeader, Tabs } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { formatMonth } from '../../lib/format'
import { listAtividades } from '../../services/api'
import type { Atividade } from '../../types'

type Filtro = 'pendentes' | 'concluidas' | 'todas'

/** Cronograma e atividades. Aluno vê as próprias; orientador, as dos orientandos. */
export default function SchedulePage() {
  const user = useCurrentUser()
  const [filtro, setFiltro] = useState<Filtro>('pendentes')
  const { state, reload } = useAsync(() => listAtividades(user), [user.id])
  const isAluno = user.role === 'aluno'

  return (
    <>
      <PageHeader
        title={isAluno ? 'Cronograma' : 'Cronogramas dos orientandos'}
        description={isAluno ? 'Prazos e atividades do seu TCC, organizados por mês.' : 'Prazos e atividades de todos os trabalhos que você orienta.'}
      />
      <DataBoundary
        state={state}
        reload={reload}
        isEmpty={(d) => d.length === 0}
        empty={{ title: 'Nenhuma atividade no cronograma', description: 'As atividades aparecem quando o cronograma é definido.' }}
      >
        {(d) => {
          const pendentes = d.filter((a) => a.status !== 'concluida')
          const concluidas = d.filter((a) => a.status === 'concluida')
          const lista = filtro === 'pendentes' ? pendentes : filtro === 'concluidas' ? concluidas : d
          const grupos = lista.reduce<Record<string, Atividade[]>>((acc, a) => {
            const k = formatMonth(a.prazo)
            ;(acc[k] ??= []).push(a)
            return acc
          }, {})
          return (
            <Tabs<Filtro>
              label="Filtrar atividades"
              value={filtro}
              onChange={setFiltro}
              items={[
                { key: 'pendentes', label: 'Pendentes', count: pendentes.length },
                { key: 'concluidas', label: 'Concluídas', count: concluidas.length },
                { key: 'todas', label: 'Todas', count: d.length },
              ]}
            >
              {lista.length === 0 ? (
                <p className="text-sm text-ink-muted">Nenhuma atividade neste filtro.</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(grupos).map(([mes, itens]) => (
                    <section key={mes} aria-label={mes}>
                      <h2 className="mb-3 text-sm font-semibold text-ink-muted">{mes}</h2>
                      <div className="rounded-card border border-border p-5">
                        <ActivityList items={itens} showAluno={!isAluno} />
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </Tabs>
          )
        }}
      </DataBoundary>
    </>
  )
}
