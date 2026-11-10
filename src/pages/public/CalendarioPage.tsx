import { useMemo, useState } from 'react'
import { EventoItem } from '../../components/EventoItem'
import { Button, Calendar, DataBoundary, EmptyState, eventDot, Icon, PageHeader, Tabs, type CalendarEvent } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { cn, daysUntil, formatDateLong, formatMonth, parseDate, relativeDays, startOfMonth, toIso } from '../../lib/format'
import { baixarIcs, buildIcs } from '../../lib/ics'
import { rotuloDoEvento, toneDoEvento } from '../../lib/eventos'
import { listEventosPublicos } from '../../services/api'
import type { EventoCalendario } from '../../types'

type Vista = 'mes' | 'lista'
type Filtro = 'todos' | 'TCC1' | 'TCC2' | 'defesa' | 'inscricao'

const FILTROS: Array<{ key: Filtro; label: string; dot?: string }> = [
  { key: 'todos', label: 'Todos' },
  { key: 'TCC1', label: 'Prazos TCC 1', dot: eventDot('brand') },
  { key: 'TCC2', label: 'Prazos TCC 2', dot: eventDot('neutral') },
  { key: 'defesa', label: 'Defesas', dot: eventDot('success') },
  { key: 'inscricao', label: 'Inscrições', dot: eventDot('warning') },
]

const passa = (e: EventoCalendario, f: Filtro) =>
  f === 'todos' || (f === 'defesa' || f === 'inscricao' ? e.tipo === f : e.tipo === 'prazo' && e.fase === f)

export default function CalendarioPage() {
  const { state, reload } = useAsync(listEventosPublicos)
  const [vista, setVista] = useState<Vista>('mes')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [mes, setMes] = useState(() => startOfMonth(new Date()))
  const [dia, setDia] = useState<string>(() => toIso(new Date()))

  return (
    <>
      <PageHeader
        title="Calendário acadêmico"
        description="Prazos institucionais e defesas abertas ao público."
      />
      <DataBoundary
        state={state}
        reload={reload}
        isEmpty={(d) => d.length === 0}
        empty={{ title: 'Calendário ainda não publicado', description: 'A coordenação divulgará prazos e defesas nesta página.' }}
      >
        {(todos) => <Conteudo todos={todos} vista={vista} setVista={setVista} filtro={filtro} setFiltro={setFiltro} mes={mes} setMes={setMes} dia={dia} setDia={setDia} />}
      </DataBoundary>
    </>
  )
}

interface ConteudoProps {
  todos: EventoCalendario[]
  vista: Vista
  setVista: (v: Vista) => void
  filtro: Filtro
  setFiltro: (f: Filtro) => void
  mes: Date
  setMes: (d: Date) => void
  dia: string
  setDia: (d: string) => void
}

function Conteudo({ todos, vista, setVista, filtro, setFiltro, mes, setMes, dia, setDia }: ConteudoProps) {
  const eventos = useMemo(() => todos.filter((e) => passa(e, filtro)), [todos, filtro])
  const proximo = eventos.find((e) => daysUntil(e.data) >= 0)
  const doCalendario: CalendarEvent[] = eventos.map((e) => ({ id: e.id, date: e.data, label: e.titulo, tone: toneDoEvento(e) }))
  const doDia = eventos.filter((e) => e.data === dia)

  const irPara = (iso: string) => {
    setMes(startOfMonth(parseDate(iso)))
    setDia(iso)
    setVista('mes')
  }

  const grupos = eventos.reduce<Record<string, EventoCalendario[]>>((acc, e) => {
    ;(acc[formatMonth(e.data)] ??= []).push(e)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {proximo ? (
        <div className="flex flex-wrap items-center gap-4 rounded-card bg-brand-700 p-5 text-white">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/80">Próximo evento · {relativeDays(proximo.data)}</p>
            <p className="text-lg font-semibold">{proximo.titulo}</p>
            <p className="text-sm text-white/80">{formatDateLong(proximo.data)} · {rotuloDoEvento(proximo)}{proximo.detalhe && ` · ${proximo.detalhe}`}</p>
          </div>
          <Button variant="outline-inverse" onClick={() => irPara(proximo.data)}>Ver no calendário</Button>
        </div>
      ) : (
        <p className="rounded-card bg-surface-muted p-4 text-sm text-ink-muted">Nenhum evento futuro neste filtro.</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filtrar eventos" className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filtro === f.key}
              onClick={() => setFiltro(f.key)}
              className={cn(
                'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium',
                filtro === f.key ? 'border-brand-700 bg-brand-700 text-white' : 'border-border bg-surface text-ink hover:bg-surface-muted',
              )}
            >
              {f.dot && <span aria-hidden="true" className={cn('size-2 rounded-full', filtro === f.key ? 'bg-white' : f.dot)} />}
              {f.label}
            </button>
          ))}
        </div>
        <Button
          variant="secondary"
          disabled={eventos.length === 0}
          onClick={() => baixarIcs('calendario-tcc.ics', buildIcs(eventos))}
        >
          <Icon name="calendar" size={16} />
          Adicionar à minha agenda (.ics)
        </Button>
      </div>

      <Tabs<Vista>
        label="Forma de visualização"
        value={vista}
        onChange={setVista}
        items={[
          { key: 'mes', label: 'Mês' },
          { key: 'lista', label: 'Lista', count: eventos.length },
        ]}
      >
        {vista === 'mes' ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
            <Calendar month={mes} events={doCalendario} selected={dia} onSelect={setDia} onMonthChange={setMes} />
            <section aria-labelledby="dia-title" aria-live="polite" className="rounded-card border border-border p-5 lg:self-start">
              <h2 id="dia-title" className="text-base font-semibold">{formatDateLong(dia)}</h2>
              {doDia.length ? (
                <ul className="mt-3 divide-y divide-border">
                  {doDia.map((e) => <EventoItem key={e.id} evento={e} mostrarData={false} />)}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-ink-muted">Nenhum evento neste dia. Selecione outro dia ou veja a lista.</p>
              )}
            </section>
          </div>
        ) : eventos.length === 0 ? (
          <EmptyState title="Nenhum evento neste filtro" description="Escolha outra categoria para ver mais datas." />
        ) : (
          <div className="space-y-6">
            {Object.entries(grupos).map(([nome, itens]) => (
              <section key={nome} aria-label={nome}>
                <h2 className="mb-3 text-sm font-semibold text-ink-muted">{nome}</h2>
                <ul className="divide-y divide-border rounded-card border border-border p-5">
                  {itens.map((e) => <EventoItem key={e.id} evento={e} />)}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Tabs>
      <p className="text-xs text-ink-muted">Datas fictícias do protótipo.</p>
    </div>
  )
}
