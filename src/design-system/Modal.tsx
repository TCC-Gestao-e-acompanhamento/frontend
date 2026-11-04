import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * Modal sobre <dialog> nativo: foco preso, Esc fecha e leitores de tela
 * reconhecem como diálogo modal. O conteúdo é montado só enquanto aberto.
 */
export function Modal({ open, title, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-card border border-border bg-surface p-0 text-ink backdrop:bg-ink/40"
    >
      {open && (
        <div className="p-6">
          <h2 id="modal-title" className="mb-4 text-lg font-semibold">
            {title}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  )
}
