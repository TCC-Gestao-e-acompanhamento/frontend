import type { IconName } from '../design-system'
import type { Role } from '../types'

export interface NavItem {
  to: string
  label: string
  icon: IconName
  end?: boolean
  /** Mostra, ao lado do rótulo, quantos itens aguardam o usuário (cada tipo tem a sua cor). */
  contador?: 'inscricoes' | 'solicitacoes'
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
    { to: '/aluno/inscricao', label: 'Inscrição no TCC', icon: 'file' },
    { to: '/aluno/solicitacoes', label: 'Solicitações', icon: 'send' },
    { to: '/aluno/etapas', label: 'Etapas do TCC', icon: 'steps' },
    { to: '/aluno/cronograma', label: 'Cronograma', icon: 'calendar' },
    { to: '/aluno/documentos', label: 'Documentos', icon: 'file' },
    { to: '/aluno/historico', label: 'Histórico', icon: 'clock' },
    { to: '/aluno/banca', label: 'Banca', icon: 'users' },
  ],
  orientador: [
    { to: '/orientador', label: 'Início', icon: 'home', end: true },
    { to: '/orientador/orientandos', label: 'Orientandos', icon: 'users' },
    { to: '/orientador/inscricoes', label: 'Inscrições', icon: 'list', contador: 'inscricoes' },
    { to: '/orientador/solicitacoes', label: 'Solicitações', icon: 'send', contador: 'solicitacoes' },
    { to: '/orientador/cronogramas', label: 'Cronogramas', icon: 'calendar' },
    { to: '/orientador/entregas', label: 'Entregas', icon: 'file' },
    { to: '/orientador/bancas', label: 'Bancas', icon: 'flag' },
    { to: '/orientador/perfil', label: 'Perfil público', icon: 'pin' },
  ],
  coordenacao: [
    { to: '/coordenacao', label: 'Início', icon: 'home', end: true },
    { to: '/coordenacao/tccs', label: 'TCCs', icon: 'list' },
    { to: '/coordenacao/inscricoes', label: 'Inscrições', icon: 'file' },
    { to: '/coordenacao/orientadores', label: 'Vínculos', icon: 'users' },
    { to: '/coordenacao/bancas', label: 'Bancas', icon: 'flag' },
  ],
}
