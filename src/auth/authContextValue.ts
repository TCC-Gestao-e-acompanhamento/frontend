import { createContext } from 'react'
import type { User } from '../types'

export interface AuthValue {
  user: User | null
  /** Login SIMULADO por id de usuário. Será trocado por autenticação real (API NestJS + JWT). */
  login: (userId: string) => User | null
  logout: () => void
}

export const AuthContext = createContext<AuthValue | null>(null)
