import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '../lib/format'

const control =
  'w-full min-h-11 rounded-lg border border-border bg-surface px-3 text-sm placeholder:text-ink-muted/70 aria-[invalid=true]:border-danger'

interface FieldProps {
  label: string
  error?: string
  hint?: string
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode
}

/** Associa rótulo, dica e erro ao controle (a11y). */
export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId()
  const descId = error || hint ? `${id}-desc` : undefined
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children({ id, 'aria-describedby': descId, 'aria-invalid': error ? true : undefined })}
      {(error || hint) && (
        <p id={descId} className={cn('text-xs', error ? 'text-danger' : 'text-ink-muted')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, className)} {...rest} />
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'min-h-28 py-2', className)} {...rest} />
}

export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, className)} {...rest} />
}

export function Checkbox({ label, className, ...rest }: { label: ReactNode } & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return (
    <label className={cn('flex min-h-11 cursor-pointer items-center gap-3 text-sm', className)}>
      <input type="checkbox" className="size-5 accent-brand-700" {...rest} />
      {label}
    </label>
  )
}

interface RadioOption<V extends string> {
  value: V
  label: string
  hint?: string
}

interface RadioGroupProps<V extends string> {
  legend: string
  name: string
  value: V | ''
  onChange: (v: V) => void
  options: RadioOption<V>[]
  error?: string
}

/** Escolha única em cartões (alvos grandes, navegação por setas nativa). */
export function RadioGroup<V extends string>({ legend, name, value, onChange, options, error }: RadioGroupProps<V>) {
  return (
    <fieldset aria-invalid={error ? true : undefined}>
      <legend className="mb-1.5 text-sm font-medium">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              'flex min-h-14 cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm',
              value === o.value ? 'border-brand-700 bg-brand-50' : 'border-border hover:bg-surface-muted',
            )}
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="mt-0.5 size-5 accent-brand-700" />
            <span>
              <span className="block font-medium">{o.label}</span>
              {o.hint && <span className="block text-xs text-ink-muted">{o.hint}</span>}
            </span>
          </label>
        ))}
      </div>
      {error && <p role="alert" className="mt-1.5 text-xs text-danger">{error}</p>}
    </fieldset>
  )
}
