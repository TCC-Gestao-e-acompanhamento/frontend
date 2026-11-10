import { eventDot } from '../design-system'
import { cn, daysUntil, formatDate, parseDate, relativeDays } from '../lib/format'
import { rotuloDoEvento, toneDoEvento } from '../lib/eventos'
import type { EventoCalendario } from '../types'

/** Linha de evento: bloco de data, título, detalhe e categoria (texto + cor). */
export function EventoItem({ evento: e, mostrarData = true }: { evento: EventoCalendario; mostrarData?: boolean }) {
  const d = parseDate(e.data)
  const passou = daysUntil(e.data) < 0
  return (
    <li className={cn('flex items-center gap-4 py-3 first:pt-0 last:pb-0', passou && 'opacity-60')}>
      {mostrarData && (
        <div className="w-14 shrink-0 rounded-lg bg-brand-50 py-1.5 text-center text-brand-700">
          <p className="text-lg leading-none font-semibold tabular-nums">{d.getDate()}</p>
          <p className="text-xs uppercase">{d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</p>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium">{e.titulo}</p>
        <p className="text-sm text-ink-muted">
          {mostrarData && <>{formatDate(e.data)} · </>}
          {passou ? 'encerrado' : relativeDays(e.data)}
          {e.detalhe && <> · {e.detalhe}</>}
        </p>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 text-sm text-ink-muted">
        <span aria-hidden="true" className={cn('size-2 rounded-full', eventDot(toneDoEvento(e)))} />
        {rotuloDoEvento(e)}
      </span>
    </li>
  )
}
