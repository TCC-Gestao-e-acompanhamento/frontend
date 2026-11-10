import { useState } from 'react'
import { useCurrentUser } from '../../auth/useAuth'
import { InscricaoForm } from '../../components/InscricaoForm'
import { StatusBadge } from '../../components/StatusBadge'
import { Badge, ButtonLink, DataBoundary, EmptyState, PageHeader, SectionCard } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { daysUntil, formatDate, formatDateLong, plural } from '../../lib/format'
import { createInscricao, getMinhaInscricao, getPeriodoInscricao, listProfessoresPublicos, listSolicitacoes } from '../../services/api'
import type { Inscricao, PeriodoInscricao } from '../../types'

function Resumo({ i, recemEnviada }: { i: Inscricao; recemEnviada: boolean }) {
  return (
    <div className="space-y-5">
      {recemEnviada && (
        <p role="status" className="rounded-lg border border-success/30 bg-accent-50 p-3 text-sm text-success">
          Inscrição enviada. {i.avisoOrientador === 'sistema' ? `${i.orientadorNome} verá o aviso na área dele.` : `O aviso será enviado para ${i.orientadorEmail}.`}
        </p>
      )}
      <SectionCard title="Sua inscrição" description={`Semestre ${i.semestre}`} action={<Badge tone="success">Inscrição enviada</Badge>}>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-ink-muted">Nome</dt><dd className="font-medium">{i.alunoNome}</dd></div>
          <div><dt className="text-ink-muted">Matrícula</dt><dd className="font-medium">{i.matricula}</dd></div>
          <div><dt className="text-ink-muted">TCC</dt><dd className="font-medium">{i.fase === 'TCC1' ? 'TCC 1' : 'TCC 2'}</dd></div>
          <div><dt className="text-ink-muted">Enviada em</dt><dd className="font-medium">{formatDate(i.atualizadaEm ?? i.criadaEm)}</dd></div>
          <div><dt className="text-ink-muted">Orientador</dt><dd className="font-medium">{i.orientadorNome}</dd></div>
          <div><dt className="text-ink-muted">E-mail do orientador</dt><dd className="font-medium">{i.orientadorEmail}</dd></div>
        </dl>
      </SectionCard>

      <SectionCard title="Aviso ao orientador">
        <p className="text-sm">
          {i.avisoOrientador === 'sistema'
            ? `${i.orientadorNome} está cadastrado e vê a sua inscrição na própria área.`
            : `${i.orientadorNome} ainda não usa a plataforma. O aviso segue por e-mail para ${i.orientadorEmail} (simulado no protótipo).`}
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          {i.ciente ? `Ciente em ${formatDate(i.cienteEm as string)}.` : 'Aguardando a ciência do orientador.'}
        </p>
        <p className="mt-3 rounded-lg bg-surface-muted p-3 text-xs text-ink-muted">
          A inscrição informa quem vai orientar você no semestre. Ela não equivale à vinculação institucional, que segue os procedimentos da UnB (a confirmar).
        </p>
      </SectionCard>

      <p className="rounded-lg border border-border p-4 text-sm">
        <span className="font-medium">Precisa corrigir algo ou cancelar?</span> Só a coordenação altera ou cancela inscrições. Procure a coordenação do seu curso.
      </p>
    </div>
  )
}

function Periodo({ p }: { p: PeriodoInscricao }) {
  const dias = daysUntil(p.inicio)
  const restam = daysUntil(p.fim)
  return (
    <SectionCard title={`Inscrições do semestre ${p.semestre}`} action={<StatusBadge kind="periodo" value={p.situacao} />}>
      <p className="text-sm">
        De <span className="font-medium">{formatDateLong(p.inicio)}</span> a <span className="font-medium">{formatDateLong(p.fim)}</span>.
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        {p.situacao === 'antes' && `Abrem em ${plural(dias, 'dia', 'dias')}.`}
        {p.situacao === 'aberto' && (restam === 0 ? 'Último dia para se inscrever.' : `Terminam em ${plural(restam, 'dia', 'dias')}.`)}
        {p.situacao === 'encerrado' && 'O período terminou.'}
      </p>
    </SectionCard>
  )
}

export default function InscricaoPage() {
  const user = useCurrentUser()
  const { state, reload } = useAsync(async () => {
    const [periodo, minha, professores, solicitacoes] = await Promise.all([
      getPeriodoInscricao(),
      getMinhaInscricao(user),
      listProfessoresPublicos(),
      listSolicitacoes(user),
    ])
    const aceita = solicitacoes.find((s) => s.status === 'aceita')
    return { periodo, minha, professores, sugestaoProfessorId: aceita?.professorId }
  }, [user.id])
  const [recemEnviada, setRecemEnviada] = useState(false)
  // Ponte local entre o envio e o fim do reload: só vale enquanto os dados do servidor são os mesmos de antes do envio.
  const [local, setLocal] = useState<{ valor: Inscricao; base: unknown }>()

  return (
    <>
      <PageHeader title="Inscrição no TCC" description="Informe em qual TCC você vai se matricular e quem será seu orientador no semestre." />
      <DataBoundary
        state={state}
        reload={reload}
        isEmpty={(d) => !d.periodo}
        empty={{ title: 'Período de inscrição ainda não definido', description: 'A coordenação divulga as datas aqui e no calendário acadêmico.' }}
      >
        {({ periodo, minha: minhaServidor, professores, sugestaoProfessorId }) => {
          if (!periodo) return null
          const minha = minhaServidor ?? (local && state.status === 'success' && state.data === local.base ? local.valor : null)
          return (
            <div className="space-y-6">
              <Periodo p={periodo} />
              {minha ? (
                <Resumo i={minha} recemEnviada={recemEnviada} />
              ) : periodo.situacao === 'aberto' ? (
                <SectionCard title="Seus dados de inscrição" description="Depois de enviada, só a coordenação pode alterar a inscrição. Confira antes de enviar.">
                  <InscricaoForm
                    professores={professores}
                    alunoNome={user.nome}
                    matricula={user.matricula ?? ''}
                    sugestaoProfessorId={sugestaoProfessorId}
                    submitLabel="Enviar inscrição"
                    onSubmit={async (dados) => {
                      const salva = await createInscricao(user, dados)
                      setLocal({ valor: salva, base: state.status === 'success' ? state.data : null })
                      setRecemEnviada(true)
                      reload()
                    }}
                  />
                </SectionCard>
              ) : (
                <EmptyState
                  title={periodo.situacao === 'antes' ? 'As inscrições ainda não abriram' : 'As inscrições foram encerradas'}
                  description={periodo.situacao === 'antes' ? `Volte a partir de ${formatDate(periodo.inicio)}. Enquanto isso, você pode buscar um orientador.` : 'Se precisar se inscrever fora do prazo, procure a coordenação.'}
                  action={periodo.situacao === 'antes' ? <ButtonLink to="/orientadores" variant="secondary">Buscar orientador</ButtonLink> : undefined}
                />
              )}
            </div>
          )
        }}
      </DataBoundary>
    </>
  )
}
