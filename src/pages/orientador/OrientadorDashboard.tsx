import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ActivityList } from '../../components/ActivityList'
import { DocumentList } from '../../components/DocumentList'
import { ResponderModal } from '../../components/ResponderModal'
import { SolicitacaoRow } from '../../components/SolicitacaoRow'
import { TccTable } from '../../components/TccTable'
import { useCurrentUser } from '../../auth/useAuth'
import { Button, ButtonLink, DataBoundary, PageHeader, SectionCard, StatCard, StatGroup } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { listAtividades, listDocumentos, listInscricoes, listSolicitacoes, listTccs } from '../../services/api'
import { plural } from '../../lib/format'
import type { Solicitacao } from '../../types'

export default function OrientadorDashboard() {
  const user = useCurrentUser()
  const [aviso, setAviso] = useState<string>()
  const [alvo, setAlvo] = useState<{ s: Solicitacao; decisao: 'aceita' | 'recusada' } | null>(null)
  const { state, reload } = useAsync(async () => {
    const [tccs, atividades, documentos, solicitacoes, inscricoes] = await Promise.all([
      listTccs(user),
      listAtividades(user),
      listDocumentos(user),
      listSolicitacoes(user),
      listInscricoes(user),
    ])
    return { tccs, atividades, documentos, solicitacoes, inscricoes }
  }, [user.id])

  return (
    <>
      <PageHeader title="Painel do orientador" description="Visão consolidada dos trabalhos que você orienta e do que precisa da sua atenção." />
      <DataBoundary
        state={state}
        reload={reload}
        isEmpty={(d) => d.tccs.length === 0 && d.solicitacoes.length === 0 && d.inscricoes.length === 0}
        empty={{ title: 'Nenhum orientando vinculado', description: 'Quando a coordenação vincular alunos a você, eles aparecem aqui.' }}
      >
        {({ tccs, atividades, documentos, solicitacoes, inscricoes }) => {
          const inscNovas = inscricoes.filter((i) => !i.ciente)
          const novas = solicitacoes.filter((s) => s.status === 'pendente')
          const analise = documentos.filter((d) => d.status === 'em_analise')
          const comPendencia = tccs.filter((t) => t.status !== 'em_andamento')
          const proximos = atividades.filter((a) => a.status !== 'concluida').slice(0, 4)
          return (
            <div className="space-y-6">
              {inscNovas.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-brand-50 p-4">
                  <p className="text-sm">
                    <span className="font-medium">{plural(inscNovas.length, 'aluno indicou', 'alunos indicaram')} você como orientador</span> no semestre {inscNovas[0].semestre}.
                  </p>
                  <ButtonLink to="/orientador/inscricoes" size="sm">Ver inscrições</ButtonLink>
                </div>
              )}
              <StatGroup>
                <StatCard label="Solicitações pendentes" value={novas.length} tone={novas.length ? 'warning' : 'default'} hint="Pedidos de orientação" />
                <StatCard label="Entregas para análise" value={analise.length} tone={analise.length ? 'warning' : 'default'} hint="Aguardam seu feedback" />
                <StatCard label="Trabalhos com pendências" value={comPendencia.length} tone={comPendencia.length ? 'danger' : 'default'} hint="Prazo próximo ou atrasados" />
                <StatCard label="Orientandos" value={tccs.length} />
              </StatGroup>

              <SectionCard
                title="Solicitações de orientação"
                description={novas.length ? `${plural(novas.length, 'aguarda', 'aguardam')} sua resposta` : undefined}
                action={<ButtonLink to="/orientador/solicitacoes" variant="ghost" size="sm">Ver todas</ButtonLink>}
              >
                {aviso && <p role="status" className="mb-3 rounded-lg bg-accent-50 p-3 text-sm text-success">{aviso}</p>}
                {novas.length === 0 ? (
                  <p className="text-sm text-ink-muted">Nenhuma solicitação pendente.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {novas.map((s) => (
                      <SolicitacaoRow
                        key={s.id}
                        solicitacao={s}
                        perspective="orientador"
                        to={`/orientador/solicitacoes/${s.id}`}
                        actions={
                          <>
                            <Button size="sm" onClick={() => { setAviso(undefined); setAlvo({ s, decisao: 'aceita' }) }}>Aceitar</Button>
                            <Button size="sm" variant="secondary" onClick={() => { setAviso(undefined); setAlvo({ s, decisao: 'recusada' }) }}>Recusar</Button>
                          </>
                        }
                      />
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard
                title="Situação dos trabalhos"
                action={<ButtonLink to="/orientador/orientandos" variant="ghost" size="sm">Ver todos</ButtonLink>}
              >
                {tccs.length ? <TccTable items={tccs} basePath="/orientador/orientandos" caption="Situação dos orientandos" /> : <p className="text-sm text-ink-muted">Nenhum orientando vinculado ainda.</p>}
              </SectionCard>

              <div className="grid gap-6 lg:grid-cols-2">
                <SectionCard title="Entregas pendentes de análise" action={<Link to="/orientador/entregas" className="text-sm font-medium text-brand-700 hover:underline">Ver entregas</Link>}>
                  {analise.length ? <DocumentList items={analise} showAluno /> : <p className="text-sm text-ink-muted">Nenhuma entrega aguardando análise.</p>}
                </SectionCard>
                <SectionCard title="Próximos prazos" action={<Link to="/orientador/cronogramas" className="text-sm font-medium text-brand-700 hover:underline">Cronogramas</Link>}>
                  {proximos.length ? <ActivityList items={proximos} showAluno /> : <p className="text-sm text-ink-muted">Sem prazos em aberto.</p>}
                </SectionCard>
              </div>
              <ResponderModal solicitacao={alvo?.s ?? null} decisao={alvo?.decisao ?? 'aceita'} onClose={() => setAlvo(null)} onDone={(m) => { setAviso(m); reload() }} />
            </div>
          )
        }}
      </DataBoundary>
    </>
  )
}
