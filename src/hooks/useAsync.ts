import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: T }

export interface AsyncResult<T> {
  state: AsyncState<T>
  reload: () => void
}

/**
 * Carrega dados assíncronos expondo estados de carregamento, erro e sucesso.
 * Recarrega quando `deps` ou o `?mock=` da URL mudam (simulação de estados).
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const [tick, setTick] = useState(0)
  const { search } = useLocation()
  const key = JSON.stringify([...deps, search])
  const lastKey = useRef(key)

  useEffect(() => {
    let active = true
    // Recarregar (mesma chave) mantém os dados na tela; mudar de contexto volta ao carregamento.
    const mesmaChave = lastKey.current === key
    lastKey.current = key
    setState((s) => (mesmaChave && s.status === 'success' ? s : { status: 'loading' }))
    // Promise.resolve().then(fn) converte erros síncronos (ex.: 403 da API simulada) em rejeição.
    Promise.resolve()
      .then(fn)
      .then((data) => active && setState({ status: 'success', data }))
      .catch((e: unknown) =>
        active && setState({ status: 'error', error: e instanceof Error ? e : new Error(String(e)) }),
      )
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, search, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  return { state, reload }
}
