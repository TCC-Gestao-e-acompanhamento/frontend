import { useContext } from 'react'
import { AuthContext, type AuthValue } from './authContextValue'

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}

/** Para telas dentro da área logada, onde o usuário sempre existe. */
export function useCurrentUser() {
  const { user } = useAuth()
  if (!user) throw new Error('Usuário não autenticado')
  return user
}
