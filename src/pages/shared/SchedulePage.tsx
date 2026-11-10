import { useState } from 'react'
import { ActivityList } from '../../components/ActivityList'
import { useCurrentUser } from '../../auth/useAuth'
import { Calendar, DataBoundary, EmptyState, PageHeader, Tabs, type CalendarEvent, type CalendarTone } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { cn, formatDateLong, formatMonth, startOfMonth, toIso } from '../../lib/format'
import { listAtividades } from '../../services/api'
import type { Atividade, AtividadeStatus } from '../../types'

type Filtro = 'pendentes' | 'concluidas' | 'todas'
type Vista = 'lista' | 'mes'

const TOM: Record<AtividadeStatus, CalendarTone> = { pendente: 'brand', em_andamento: 'brand', concluida: 'success', atrasada: 'danger' }

/** Cronograma e atividades. Aluno vê as próprias; orientador, as dos orientandos. Lista por mês ou calendário. */
export default function SchedulePage() {
  const user = useCurrentUser()
  const [filtro, setFiltro] = useState<Filtro>('pendentes')
  const [vista, setVista] = useState<Vista>('lista')
  const [mes, setMes] = useState(() => startOfMonth(new Date()))
  const [dia, setDia] = useState(() => toIso(new Date()))
  const { state, reload } = useAsync(() => listAtividades(user), [user.id])
  const isAluno = user.role === 'aluno'

  return (
    <>
      <PageHeader
        title={isAluno ? 'Cronograma' : 'Cronogramas dos orientandos'}
        description={isAluno ? 'Prazos e atividades do seu TCC.' : 'Prazos e atividades de todos os trabalhos que você orienta.'}
        actions={
          <div role="group" aria-label="Forma de visualização" className="flex rounded-lg border border-border p-1">
            {(['lista', 'mes'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={vista === v}
                onClick={() => setVista(v)}
                className={cn('min-h-9 rounded-md px-4 text-sm font-medium', vista === v ? 'bg-brand-700 text-white' : 'text-ink-muted hover:text-ink')}
              >
                {v === 'lista' ? 'Lista' : 'Calendário'}
              </button>
            ))}
          </div>
        }
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
          const eventos: CalendarEvent[] = lista.map((a) => ({ id: a.id, date: a.prazo, label: a.titulo, tone: TOM[a.status] }))
          const doDia = lista.filter((a) => a.prazo === dia)
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
              {vista === 'mes' ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
                  <Calendar month={mes} events={eventos} selected={dia} onSelect={setDia} onMonthChange={setMes} />
                  <section aria-labelledby="dia-ativ" aria-live="polite" className="rounded-card border border-border p-5 lg:self-start">
                    <h2 id="dia-ativ" className="mb-3 text-base font-semibold">{formatDateLong(dia)}</h2>
                    {doDia.length ? <ActivityList items={doDia} showAluno={!isAluno} /> : <p className="text-sm text-ink-muted">Nenhuma atividade neste dia.</p>}
                  </section>
                </div>
              ) : lista.length === 0 ? (
                <EmptyState title="Nenhuma atividade neste filtro" description="Troque o filtro acima para ver outras atividades." />
              ) : (
                <div className="space-y-6">
                  {Object.entries(grupos).map(([mesNome, itens]) => (
                    <section key={mesNome} aria-label={mesNome}>
                      <h2 className="mb-3 text-sm font-semibold text-ink-muted">{mesNome}</h2>
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
