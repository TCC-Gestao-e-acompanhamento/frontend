import { cn } from '../lib/format'

export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-quiet' | 'success' | 'neutral' | 'inverse' | 'outline-inverse'
export type Size = 'md' | 'sm'

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60'
const variants: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800',
  secondary: 'border border-border bg-surface text-ink hover:bg-surface-muted',
  ghost: 'text-brand-700 hover:bg-brand-50',
  danger: 'bg-danger text-white hover:opacity-90',
  // Ação destrutiva sem alarde: texto vermelho sobre fundo claro (a confirmação é que usa o vermelho cheio).
  'danger-quiet': 'border border-border bg-surface text-danger hover:bg-danger/10',
  success: 'bg-accent-600 text-white hover:bg-accent-700',
  // Ação de apoio, sem destaque (ex.: "Ver no documento"): fundo cinza.
  neutral: 'bg-ink/10 text-ink hover:bg-ink/15',
  // Sobre fundo azul escuro (faixa de destaque).
  inverse: 'bg-white text-brand-700 hover:bg-brand-50',
  'outline-inverse': 'border border-white/50 text-white hover:bg-white/10',
}
const sizes: Record<Size, string> = { md: 'min-h-11 px-4 text-sm', sm: 'min-h-11 px-3 text-sm sm:min-h-9' }

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md') =>
  cn(base, variants[variant], sizes[size])

