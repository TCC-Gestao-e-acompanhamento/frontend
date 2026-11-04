import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { ButtonLink } from '../design-system'
import { cn } from '../lib/format'
import { homePath } from '../routes/navigation'
import { Brand } from './Brand'
import { SimulateStates } from './SimulateStates'

const links = [
  { to: '/', label: 'Início', end: true },
  { to: '/orientadores', label: 'Orientadores' },
  { to: '/bancas', label: 'Bancas públicas' },
  { to: '/calendario', label: 'Calendário' },
]

/** Layout da área pública: sem login, com dados institucionais abertos. */
export function PublicLayout() {
  const { user } = useAuth()
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-white">
        Ir para o conteúdo
      </a>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 lg:px-8">
          <Brand />
          <nav aria-label="Navegação pública" className="order-3 flex w-full gap-1 sm:order-none sm:w-auto">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn('flex min-h-11 items-center rounded-lg px-3 text-sm font-medium', isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:text-ink')
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          {user ? (
            <ButtonLink to={homePath(user.role)}>Minha área</ButtonLink>
          ) : (
            <ButtonLink to="/entrar">Entrar</ButtonLink>
          )}
        </div>
      </header>

      <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface-muted">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 text-xs text-ink-muted lg:px-8">
          <p>Protótipo acadêmico · dados fictícios · Universidade de Brasília</p>
          <div className="w-full max-w-xs">
            <SimulateStates />
          </div>
        </div>
      </footer>
    </div>
  )
}
