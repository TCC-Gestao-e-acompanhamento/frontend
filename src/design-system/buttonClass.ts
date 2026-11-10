import { cn } from '../lib/format'

export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse' | 'outline-inverse'
export type Size = 'md' | 'sm'

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60'
const variants: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800',
  secondary: 'border border-border bg-surface text-ink hover:bg-surface-muted',
  ghost: 'text-brand-700 hover:bg-brand-50',
  danger: 'bg-danger text-white hover:opacity-90',
  // Sobre fundo azul escuro (faixa de destaque).
  inverse: 'bg-white text-brand-700 hover:bg-brand-50',
  'outline-inverse': 'border border-white/50 text-white hover:bg-white/10',
}
const sizes: Record<Size, string> = { md: 'min-h-11 px-4 text-sm', sm: 'min-h-9 px-3 text-sm' }

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md') =>
  cn(base, variants[variant], sizes[size])

