import type { ReactNode } from 'react'
import type { AsyncState } from '../hooks/useAsync'
import { Button } from './Button'
import { Icon } from './Icon'

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3 py-2">
      <span className="sr-only">{label}</span>
      {[100, 83, 66].map((w) => (
        <div key={w} className="h-4 animate-pulse rounded bg-surface-muted" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-surface-muted text-ink-muted">
        <Icon name="list" />
      </span>
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 py-8 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-danger/10 text-danger">
        <Icon name="alert" />
      </span>
      <p className="font-medium">Algo deu errado</p>
      <p className="max-w-sm text-sm text-ink-muted">{message ?? 'Não foi possível carregar as informações.'}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}

interface BoundaryProps<T> {
  state: AsyncState<T>
  reload?: () => void
  isEmpty?: (data: T) => boolean
  empty?: { title: string; description?: string; action?: ReactNode }
  children: (data: T) => ReactNode
}

/** Padroniza carregamento / erro / vazio em todas as telas. */
export function DataBoundary<T>({ state, reload, isEmpty, empty, children }: BoundaryProps<T>) {
  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') return <ErrorState message={state.error.message} onRetry={reload} />
  if (isEmpty?.(state.data)) return <EmptyState title={empty?.title ?? 'Nada por aqui ainda'} description={empty?.description} action={empty?.action} />
  return <>{children(state.data)}</>
}
