import { useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useCurrentUser, useAuth } from '../auth/useAuth'
import { Badge, Button, Icon } from '../design-system'
import { cn, initials } from '../lib/format'
import { NAV, ROLE_LABEL } from '../routes/navigation'
import { Brand } from './Brand'
import { SimulateStates } from './SimulateStates'

/** Layout único da área logada; a navegação muda conforme o perfil. */
export function AppShell({ children }: { children: ReactNode }) {
  const user = useCurrentUser()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // Menu móvel aberto somente na rota em que foi aberto: fecha sozinho ao navegar.
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = openAt === pathname

  const sair = () => {
    logout()
    navigate('/', { replace: true })
  }

  const nav = (
    <nav aria-label="Navegação principal" className="flex flex-col gap-1">
      {NAV[user.role].map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium',
              isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
            )
          }
        >
          <Icon name={item.icon} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-surface">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-white">
        Ir para o conteúdo
      </a>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-lg hover:bg-surface-muted lg:hidden"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            aria-controls="menu-lateral"
            onClick={() => setOpenAt(open ? null : pathname)}
          >
            <Icon name={open ? 'close' : 'menu'} />
          </button>
          <Brand to={`/${user.role}`} />
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{user.nome}</p>
            <Badge tone="brand">{ROLE_LABEL[user.role]}</Badge>
          </div>
          <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-brand-700 text-xs font-semibold text-white">
            {initials(user.nome)}
          </span>
          <Button variant="secondary" size="sm" onClick={sair} aria-label="Sair da conta">
            <Icon name="logout" size={16} />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[16rem_1fr]">
        <aside
          id="menu-lateral"
          className={cn(
            'fixed inset-x-0 top-16 bottom-0 z-20 flex-col justify-between overflow-y-auto border-r border-border bg-surface p-4 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:translate-x-0',
            open ? 'flex' : 'hidden lg:flex',
            'sm:right-auto sm:w-72 lg:w-auto',
          )}
        >
          {nav}
          <SimulateStates />
        </aside>

        <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
