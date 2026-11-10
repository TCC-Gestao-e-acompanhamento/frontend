import { StatusBadge } from '../../components/StatusBadge'
import { TccTable } from '../../components/TccTable'
import { DeadlineList } from '../../components/DeadlineList'
import { useCurrentUser } from '../../auth/useAuth'
import { ButtonLink, DataBoundary, PageHeader, ProgressBar, SectionCard, StatCard, StatGroup } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { formatDate, plural } from '../../lib/format'
import { getPeriodoInscricao, listBancas, listInscricoes, listPrazosInstitucionais, listTccs } from '../../services/api'

export default function CoordenacaoDashboard() {
  const user = useCurrentUser()
  const { state, reload } = useAsync(async () => {
    const [tccs, bancas, prazos, periodo, inscritos] = await Promise.all([
      listTccs(user),
      listBancas(user),
      listPrazosInstitucionais(),
      getPeriodoInscricao(),
      listInscricoes(user),
    ])
    return { tccs, bancas, prazos, periodo, inscritos }
  }, [user.id])

  return (
    <>
      <PageHeader title="Painel da coordenação" description="Visão institucional dos TCCs, prazos e bancas do semestre." />
      <DataBoundary
        state={state}
        reload={reload}
        isEmpty={(d) => d.tccs.length === 0}
        empty={{ title: 'Nenhum TCC cadastrado', description: 'Os trabalhos aparecem aqui após o cadastro no semestre.' }}
      >
        {({ tccs, bancas, prazos, periodo, inscritos }) => {
          const tcc1 = tccs.filter((t) => t.fase === 'TCC1').length
          const tcc2 = tccs.length - tcc1
          const pendentes = tccs.filter((t) => t.status !== 'em_andamento')
          const porOrientador = Object.values(
            tccs.reduce<Record<string, { nome: string; total: number }>>((acc, t) => {
              acc[t.orientador.id] ??= { nome: t.orientador.nome, total: 0 }
              acc[t.orientador.id].total++
              return acc
            }, {}),
          )
          return (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border p-4">
                <div className="flex flex-wrap items-center gap-3">
                  {periodo ? <StatusBadge kind="periodo" value={periodo.situacao} /> : null}
                  <p className="text-sm">
                    {periodo
                      ? `Semestre ${periodo.semestre}: ${plural(inscritos.length, 'inscrito', 'inscritos')} · inscrições de ${formatDate(periodo.inicio)} a ${formatDate(periodo.fim)}`
                      : 'Período de inscrições ainda não definido'}
                  </p>
                </div>
                <ButtonLink to="/coordenacao/inscricoes" variant="secondary" size="sm">Gerenciar inscrições</ButtonLink>
              </div>
              <StatGroup>
                <StatCard label="TCCs cadastrados" value={tccs.length} />
                <StatCard label="TCC 1 / TCC 2" value={`${tcc1} / ${tcc2}`} />
                <StatCard label="Bancas agendadas" value={bancas.filter((b) => b.situacao === 'agendada').length} hint={`${bancas.filter((b) => b.situacao === 'a_definir').length} a definir`} tone="success" />
                <StatCard label="Trabalhos com pendências" value={pendentes.length} tone={pendentes.length ? 'danger' : 'default'} hint="Prazo próximo ou atrasados" />
              </StatGroup>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard title="Distribuição entre TCC 1 e TCC 2">
                  <div className="space-y-4">
                    {[{ nome: 'TCC 1', n: tcc1 }, { nome: 'TCC 2', n: tcc2 }].map((f) => (
                      <div key={f.nome}>
                        <div className="mb-1 flex justify-between text-sm"><span>{f.nome}</span><span className="font-medium">{plural(f.n, 'trabalho', 'trabalhos')}</span></div>
                        <ProgressBar value={Math.round((f.n / tccs.length) * 100)} label={`Proporção em ${f.nome}`} />
                      </div>
                    ))}
                  </div>
                </SectionCard>
                <SectionCard title="Orientadores e orientandos" action={<ButtonLink to="/coordenacao/orientadores" variant="ghost" size="sm">Detalhes</ButtonLink>}>
                  <ul className="divide-y divide-border">
                    {porOrientador.map((o) => (
                      <li key={o.nome} className="flex justify-between py-2.5 first:pt-0 last:pb-0">
                        <span>{o.nome}</span>
                        <span className="text-sm text-ink-muted">{plural(o.total, 'orientando', 'orientandos')}</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              </div>

              <SectionCard title="Pendências" description="Trabalhos com prazo próximo ou atrasados" action={<ButtonLink to="/coordenacao/tccs" variant="ghost" size="sm">Todos os TCCs</ButtonLink>}>
                {pendentes.length ? <TccTable items={pendentes} basePath="/coordenacao/tccs" showOrientador caption="TCCs com pendências" /> : <p className="text-sm text-ink-muted">Nenhum trabalho com pendências.</p>}
              </SectionCard>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard title="Prazos institucionais" action={<ButtonLink to="/coordenacao/prazos" variant="ghost" size="sm">Ver tudo</ButtonLink>}>
                  <DeadlineList items={prazos.slice(0, 3)} />
                </SectionCard>
                <SectionCard title="Bancas" action={<ButtonLink to="/coordenacao/bancas" variant="ghost" size="sm">Ver bancas</ButtonLink>}>
                  <ul className="divide-y divide-border">
                    {bancas.map((b) => (
                      <li key={b.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                        <span className="min-w-0 truncate">{b.alunoNome}</span>
                        <StatusBadge kind="banca" value={b.situacao} />
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              </div>
            </div>
          )
        }}
      </DataBoundary>
    </>
  )
}
