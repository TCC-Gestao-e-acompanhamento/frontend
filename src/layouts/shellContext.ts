import { createContext } from 'react'

export interface ShellContextValue {
  /** Reconta os itens novos do menu (ex.: depois de "Estou ciente"). */
  refreshContador: () => void
}

export const ShellContext = createContext<ShellContextValue>({ refreshContador: () => {} })
