import { ButtonLink } from '../design-system'
import { daysUntil, formatDate, plural } from '../lib/format'
import type { Inscricao, PeriodoInscricao } from '../types'

/** Faixa de destaque do período de inscrição no painel do aluno. */
export function InscricaoBanner({ periodo, inscricao }: { periodo: PeriodoInscricao | null; inscricao: Inscricao | null }) {
  if (!periodo) return null

  if (inscricao) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border p-4">
        <p className="text-sm">
          <span className="font-medium">Inscrição enviada</span> para {inscricao.fase === 'TCC1' ? 'TCC 1' : 'TCC 2'} em {periodo.semestre}, com {inscricao.orientadorNome}.
        </p>
        <ButtonLink to="/aluno/inscricao" variant="ghost" size="sm">Ver inscrição</ButtonLink>
      </div>
    )
  }

  if (periodo.situacao === 'aberto') {
    const restam = daysUntil(periodo.fim)
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-brand-700 p-5 text-white">
        <div>
          <p className="font-semibold">Inscrições de TCC {periodo.semestre} abertas</p>
          <p className="text-sm text-white/85">
            Até {formatDate(periodo.fim)}{restam <= 3 ? ` (${restam === 0 ? 'último dia' : `faltam ${plural(restam, 'dia', 'dias')}`})` : ''}. Leva poucos minutos.
          </p>
        </div>
        <ButtonLink to="/aluno/inscricao" variant="inverse">Inscrever-se</ButtonLink>
      </div>
    )
  }

  return (
    <p className="rounded-card bg-surface-muted p-4 text-sm text-ink-muted">
      {periodo.situacao === 'antes'
        ? `As inscrições de TCC ${periodo.semestre} abrem em ${formatDate(periodo.inicio)}.`
        : `As inscrições de TCC ${periodo.semestre} foram encerradas em ${formatDate(periodo.fim)}.`}
    </p>
  )
}
