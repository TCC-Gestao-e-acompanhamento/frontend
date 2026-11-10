import { useState } from 'react'
import { addMonths, cn, monthTitle, startOfMonth, toIso } from '../lib/format'
import { DOT, type CalendarTone } from './calendarTone'
import { Icon } from './Icon'

export interface CalendarEvent {
  id: string
  /** yyyy-mm-dd */
  date: string
  label: string
  tone: CalendarTone
}

const WEEK = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

interface Props {
  /** Qualquer data do mês exibido. */
  month: Date
  events: CalendarEvent[]
  selected?: string
  onSelect: (date: string) => void
  onMonthChange: (month: Date) => void
}

/** Calendário mensal. Cada dia é um botão; eventos aparecem como rótulos (telas largas) ou pontos. */
export function Calendar({ month, events, selected, onSelect, onMonthChange }: Props) {
  const first = startOfMonth(month)
  const diasNoMes = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const total = Math.ceil((first.getDay() + diasNoMes) / 7) * 7
  const [hoje] = useState(() => toIso(new Date()))

  const porDia = new Map<string, CalendarEvent[]>()
  for (const e of events) porDia.set(e.date, [...(porDia.get(e.date) ?? []), e])

  const celulas = Array.from({ length: total }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i - first.getDay() + 1))

  return (
    <div className="rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold" aria-live="polite">{monthTitle(first)}</h2>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => {
              const hojeIso = toIso(new Date())
              onMonthChange(startOfMonth(new Date()))
              onSelect(hojeIso)
            }} className="min-h-11 rounded-lg px-3 text-sm font-medium text-brand-700 hover:bg-brand-50">
            Hoje
          </button>
          <button type="button" aria-label="Mês anterior" onClick={() => onMonthChange(addMonths(first, -1))} className="grid size-11 place-items-center rounded-lg hover:bg-surface-muted">
            <Icon name="arrow" className="rotate-180" />
          </button>
          <button type="button" aria-label="Próximo mês" onClick={() => onMonthChange(addMonths(first, 1))} className="grid size-11 place-items-center rounded-lg hover:bg-surface-muted">
            <Icon name="arrow" />
          </button>
        </div>
      </div>

      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">{monthTitle(first)}: selecione um dia para ver os eventos</caption>
        <thead>
          <tr>
            {WEEK.map((d) => (
              <th key={d} scope="col" className="py-2 text-xs font-medium text-ink-muted uppercase">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: total / 7 }, (_, semana) => (
            <tr key={semana}>
              {celulas.slice(semana * 7, semana * 7 + 7).map((d) => {
                const iso = toIso(d)
                const doMes = d.getMonth() === first.getMonth()
                const evs = porDia.get(iso) ?? []
                const ehHoje = iso === hoje
                const sel = iso === selected
                return (
                  <td key={iso} className="border-t border-border p-0 align-top">
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(iso)
                        // dia cinza de outro mês: leva o calendário junto
                        if (!doMes) onMonthChange(startOfMonth(d))
                      }}
                      aria-pressed={sel}
                      aria-label={`${d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}${ehHoje ? ', hoje' : ''}${evs.length ? `, ${evs.length} ${evs.length === 1 ? 'evento' : 'eventos'}` : ''}`}
                      className={cn(
                        'flex min-h-14 w-full flex-col items-stretch gap-1 p-1.5 text-left sm:min-h-24',
                        sel ? 'bg-brand-50 ring-2 ring-brand-700 ring-inset' : 'hover:bg-surface-muted',
                        !doMes && 'text-ink-muted/60',
                      )}
                    >
                      <span className={cn('grid size-7 place-items-center self-start rounded-full text-sm tabular-nums', ehHoje && 'bg-brand-700 font-semibold text-white')}>
                        {d.getDate()}
                      </span>
                      {evs.length > 0 && (
                        <>
                          <span className="flex gap-1 sm:hidden" aria-hidden="true">
                            {evs.slice(0, 3).map((e) => <span key={e.id} className={cn('size-1.5 rounded-full', DOT[e.tone])} />)}
                          </span>
                          <span className="hidden flex-col gap-0.5 sm:flex" aria-hidden="true">
                            {evs.slice(0, 2).map((e) => (
                              <span key={e.id} className="flex items-center gap-1 truncate text-xs">
                                <span className={cn('size-1.5 shrink-0 rounded-full', DOT[e.tone])} />
                                <span className="truncate">{e.label}</span>
                              </span>
                            ))}
                            {evs.length > 2 && <span className="text-xs text-ink-muted">+{evs.length - 2}</span>}
                          </span>
                        </>
                      )}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
