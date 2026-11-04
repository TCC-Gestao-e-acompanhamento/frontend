import { useAuth } from '../auth/useAuth'
import { ButtonLink } from '../design-system'
import type { ProfessorPublico } from '../types'

/**
 * Leva ao formulário de solicitação. O professor vai na URL, então a escolha
 * sobrevive ao redirecionamento para o login (visitante não autenticado).
 */
export function SolicitarButton({ professor }: { professor: ProfessorPublico }) {
  const { user } = useAuth()

  if (!professor.aceitandoSolicitacoes) {
    return <p className="text-sm text-ink-muted">Este professor não está recebendo novas solicitações.</p>
  }
  if (user && user.role !== 'aluno') {
    return <p className="text-sm text-ink-muted">Solicitações de orientação são enviadas por alunos.</p>
  }
  return <ButtonLink to={`/aluno/solicitar/${professor.id}`}>Solicitar orientação</ButtonLink>
}
