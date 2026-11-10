import type { IconName } from '../design-system'
import type { Role } from '../types'

export interface NavItem {
  to: string
  label: string
  icon: IconName
  end?: boolean
}

export const ROLE_LABEL: Record<Role, string> = {
  aluno: 'Aluno',
  orientador: 'Orientador',
  coordenacao: 'Coordenação',
}

export const homePath = (role: Role): string => `/${role}`

/** Navegação por perfil. Mesma estrutura, itens diferentes. */
export const NAV: Record<Role, NavItem[]> = {
  aluno: [
    { to: '/aluno', label: 'Início', icon: 'home', end: true },
    { to: '/aluno/solicitacoes', label: 'Solicitações', icon: 'send' },
    { to: '/orientadores', label: 'Buscar orientador', icon: 'search' },
    { to: '/aluno/etapas', label: 'Etapas do TCC', icon: 'steps' },
    { to: '/aluno/cronograma', label: 'Cronograma', icon: 'calendar' },
    { to: '/aluno/documentos', label: 'Documentos', icon: 'file' },
    { to: '/aluno/feedbacks', label: 'Feedbacks', icon: 'message' },
    { to: '/aluno/banca', label: 'Banca', icon: 'users' },
  ],
  orientador: [
    { to: '/orientador', label: 'Início', icon: 'home', end: true },
    { to: '/orientador/orientandos', label: 'Orientandos', icon: 'users' },
    { to: '/orientador/solicitacoes', label: 'Solicitações', icon: 'send' },
    { to: '/orientador/cronogramas', label: 'Cronogramas', icon: 'calendar' },
    { to: '/orientador/entregas', label: 'Entregas', icon: 'file' },
    { to: '/orientador/bancas', label: 'Bancas', icon: 'flag' },
    { to: '/orientador/perfil', label: 'Perfil público', icon: 'pin' },
  ],
  coordenacao: [
    { to: '/coordenacao', label: 'Início', icon: 'home', end: true },
    { to: '/coordenacao/tccs', label: 'TCCs', icon: 'list' },
    { to: '/coordenacao/orientadores', label: 'Vínculos', icon: 'users' },
    { to: '/coordenacao/prazos', label: 'Etapas e prazos', icon: 'calendar' },
    { to: '/coordenacao/bancas', label: 'Bancas', icon: 'flag' },
  ],
}
