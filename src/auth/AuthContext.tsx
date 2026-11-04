import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { AuthContext } from './authContextValue'
import { users } from '../mocks/data'
import type { User } from '../types'

const KEY = 'tcc.proto.userId'

function readStored(): User | null {
  try {
    const id = sessionStorage.getItem(KEY)
    return users.find((u) => u.id === id) ?? null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStored)

  const login = useCallback((userId: string) => {
    const found = users.find((u) => u.id === userId) ?? null
    setUser(found)
    try {
      if (found) sessionStorage.setItem(KEY, found.id)
    } catch {
      /* armazenamento indisponível: segue só em memória */
    }
    return found
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      /* ignora */
    }
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
