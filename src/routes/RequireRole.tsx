import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { AppShell } from '../layouts/AppShell'
import type { Role } from '../types'
import { homePath } from './navigation'

/**
 * Protege o grupo de rotas de um perfil.
 * Atenção: isto é conveniência de UX. A autorização real acontece no backend.
 */
export function RequireRole({ role }: { role: Role }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  if (user.role !== role) return <Navigate to={homePath(user.role)} replace />
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
