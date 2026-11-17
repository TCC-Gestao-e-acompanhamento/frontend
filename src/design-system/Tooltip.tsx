import type { ReactNode } from 'react'
import { cn } from '../lib/format'

interface TooltipProps {
  /** Texto da dica. O botão filho continua com o próprio aria-label: a dica é só visual. */
  texto: string
  /** Botões na ponta direita da tela alinham a dica pelo fim, para ela não sair da janela. */
  alinhar?: 'centro' | 'fim'
  children: ReactNode
}

/**
 * Dica que aparece ao passar o mouse ou ao focar com o teclado (o `title` nativo some em vários navegadores
 * embutidos e nunca aparece no teclado). Fica abaixo do botão.
 */
export function Tooltip({ texto, alinhar = 'centro', children }: TooltipProps) {
  return (
    <span className="group/dica relative inline-flex">
      {children}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute top-full z-40 mt-1.5 rounded-md bg-ink px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity delay-100 group-has-focus-visible/dica:opacity-100 group-hover/dica:opacity-100',
          alinhar === 'fim' ? 'right-0' : 'left-1/2 -translate-x-1/2',
        )}
      >
        {texto}
      </span>
    </span>
  )
}
