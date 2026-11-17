/** Id do aviso de sucesso das atividades; ele recebe o foco quando o controle que o gerou deixa de existir (ex.: formulário fechado). */
export const ID_AVISO_ATIVIDADE = 'aviso-atividade'

/** Cancela a chamada em andamento (timer e listeners); cada chamada de `focarAvisoAtividade` guarda a sua. */
let cancelarAtual: (() => void) | undefined

/**
 * Leva o foco ao aviso de sucesso. A espera curta deixa a tela desenhar o aviso e o `<dialog>` terminar de fechar: ao fechar,
 * o navegador devolve o foco ao botão que o abriu e tiraria o foco do aviso. Se a pessoa clicar ou digitar nesse intervalo,
 * o foco não é puxado de volta. Uma nova chamada cancela a anterior por completo.
 */
export function focarAvisoAtividade() {
  cancelarAtual?.()
  const eventos = ['pointerdown', 'keydown'] as const
  const cancelar = () => {
    clearTimeout(timer)
    for (const e of eventos) window.removeEventListener(e, cancelar, true)
    if (cancelarAtual === cancelar) cancelarAtual = undefined
  }
  const timer = setTimeout(() => {
    cancelar()
    document.getElementById(ID_AVISO_ATIVIDADE)?.focus()
  }, 120)
  for (const e of eventos) window.addEventListener(e, cancelar, true)
  cancelarAtual = cancelar
}
