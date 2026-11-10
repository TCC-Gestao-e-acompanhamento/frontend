import { BancaCard } from '../../components/BancaCard'
import { DataBoundary, PageHeader } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { listBancasPublicas } from '../../services/api'

export default function BancasPublicasPage() {
  const { state, reload } = useAsync(listBancasPublicas)
  return (
    <>
      <PageHeader
        title="Bancas públicas"
        description="Defesas de TCC abertas à comunidade. Somente bancas com data definida são divulgadas."
      />
      <DataBoundary
        state={state}
        reload={reload}
        isEmpty={(d) => d.length === 0}
        empty={{ title: 'Nenhuma defesa divulgada', description: 'Quando uma banca for agendada, ela aparecerá nesta página.' }}
      >
        {(d) => {
          const proximas = d.filter((b) => b.situacao === 'agendada')
          const realizadas = d.filter((b) => b.situacao === 'realizada')
          return (
            <div className="space-y-8">
              <section aria-labelledby="prox">
                <h2 id="prox" className="mb-3 text-lg font-semibold">Próximas defesas</h2>
                {proximas.length ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{proximas.map((b) => <BancaCard key={b.id} banca={b} />)}</div>
                ) : (
                  <p className="text-sm text-ink-muted">Nenhuma defesa agendada no momento.</p>
                )}
              </section>
              <section aria-labelledby="real">
                <h2 id="real" className="mb-3 text-lg font-semibold">Defesas realizadas</h2>
                {realizadas.length ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{realizadas.map((b) => <BancaCard key={b.id} banca={b} />)}</div>
                ) : (
                  <p className="text-sm text-ink-muted">Ainda não há defesas realizadas neste semestre.</p>
                )}
              </section>
            </div>
          )
        }}
      </DataBoundary>
    </>
  )
}
