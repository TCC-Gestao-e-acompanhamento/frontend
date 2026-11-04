import { useId, type ReactNode } from 'react'
import { cn } from '../lib/format'

export interface TabItem<K extends string> {
  key: K
  label: string
  count?: number
}

interface TabsProps<K extends string> {
  items: TabItem<K>[]
  value: K
  onChange: (key: K) => void
  label: string
  children?: ReactNode
}

/** Abas (role=tablist) com navegação por setas. O painel é renderizado por quem usa. */
export function Tabs<K extends string>({ items, value, onChange, label, children }: TabsProps<K>) {
  const id = useId()
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length
    onChange(items[next].key)
    document.getElementById(`${id}-${items[next].key}`)?.focus()
  }
  return (
    <div>
      <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-border">
        {items.map((t, i) => {
          const active = t.key === value
          return (
            <button
              key={t.key}
              id={`${id}-${t.key}`}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls={`${id}-panel`}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(t.key)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                '-mb-px min-h-11 shrink-0 border-b-2 px-4 text-sm font-medium whitespace-nowrap',
                active ? 'border-brand-700 text-brand-700' : 'border-transparent text-ink-muted hover:text-ink',
              )}
            >
              {t.label}
              {t.count !== undefined && <span className="ml-1.5 text-xs text-ink-muted">({t.count})</span>}
            </button>
          )
        })}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${value}`} className="pt-5">
        {children}
      </div>
    </div>
  )
}
