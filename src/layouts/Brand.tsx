import { Link } from 'react-router-dom'

export function Brand({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex min-h-11 items-center gap-3 rounded-lg">
      <img src="/logo-unb.svg" alt="" width={44} height={22} className="h-[22px] w-11" />
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-brand-700">Gestão de TCC</span>
        <span className="block text-xs text-ink-muted">Universidade de Brasília</span>
      </span>
    </Link>
  )
}
