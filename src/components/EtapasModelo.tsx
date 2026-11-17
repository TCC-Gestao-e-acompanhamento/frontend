import { DataBoundary } from '../design-system'
import { useAsync } from '../hooks/useAsync'
import { listEtapasPublicas } from '../services/api'
import type { EtapaDef, Fase } from '../types'

const FASES: Array<{ fase: Fase; titulo: string }> = [
  { fase: 'TCC1', titulo: 'TCC 1' },
  { fase: 'TCC2', titulo: 'TCC 2' },
]

/** Etapas do TCC abertas ao público (modelo genérico), numeradas do TCC 1 ao TCC 2. Carrega ao ser montada. */
export function EtapasModelo() {
  const { state, reload } = useAsync(listEtapasPublicas)
  return (
    <DataBoundary
      state={state}
      reload={reload}
      isEmpty={(d) => d.length === 0}
      empty={{ title: 'Etapas ainda não divulgadas', description: 'As etapas do TCC aparecem aqui quando forem publicadas.' }}
    >
      {(etapas) => (
        <div className="space-y-5">
          {FASES.map((f) => (
            <section key={f.fase} aria-labelledby={`fase-${f.fase}`}>
              <h3 id={`fase-${f.fase}`} className="mb-2 text-sm font-semibold text-ink-muted">{f.titulo}</h3>
              <ol className="divide-y divide-border rounded-lg border border-border px-4">
                {etapas
                  .filter((e: EtapaDef) => e.fase === f.fase)
                  .map((e) => (
                    <li key={e.nome} className="flex items-center gap-3 py-3">
                      {/* a numeração segue o TCC 1 e continua no TCC 2: é a posição da etapa na lista completa */}
                      <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-brand-700 text-xs font-semibold text-brand-700">{etapas.indexOf(e) + 1}</span>
                      <p className="text-sm font-medium">{e.nome}</p>
                    </li>
                  ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </DataBoundary>
  )
}
