import { Icon, type IconName } from '../design-system'
import { cn, daysUntil, formatDate, relativeDays } from '../lib/format'
import type { Atividade } from '../types'
import { StatusBadge } from './StatusBadge'

const TIPO_ICON: Record<Atividade['tipo'], IconName> = { entrega: 'upload', reuniao: 'users', marco: 'flag' }
const TIPO_LABEL: Record<Atividade['tipo'], string> = { entrega: 'Entrega', reuniao: 'Reunião', marco: 'Marco' }

export function ActivityList({ items, showAluno = false }: { items: Atividade[]; showAluno?: boolean }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((a) => {
        const dias = daysUntil(a.prazo)
        const aberta = a.status !== 'concluida'
        return (
          <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
              <Icon name={TIPO_ICON[a.tipo]} size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{a.titulo}</p>
              <p className="text-sm text-ink-muted">
                {TIPO_LABEL[a.tipo]}
                {showAluno && <> · {a.alunoNome}</>} · {formatDate(a.prazo)}
                {aberta && (
                  <span className={cn(dias < 0 && 'font-medium text-danger')}> ({relativeDays(a.prazo)})</span>
                )}
              </p>
            </div>
            <StatusBadge kind="atividade" value={a.status} />
          </li>
        )
      })}
    </ul>
  )
}
