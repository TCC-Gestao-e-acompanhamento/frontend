import { Card, Icon } from '../design-system'
import { formatDate, relativeDays } from '../lib/format'
import type { Banca } from '../types'
import { StatusBadge } from './StatusBadge'

export function BancaCard({ banca }: { banca: Banca }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{banca.tccTitulo}</h3>
          <p className="text-sm text-ink-muted">{banca.alunoNome}</p>
        </div>
        <StatusBadge kind="banca" value={banca.situacao} />
      </div>

      {banca.data ? (
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Icon name="calendar" size={16} className="text-ink-muted" />
            <dt className="sr-only">Data</dt>
            <dd>
              {formatDate(banca.data)}
              {banca.situacao === 'agendada' && <span className="text-ink-muted"> ({relativeDays(banca.data)})</span>}
            </dd>
          </div>
          {banca.local && (
            <div className="flex items-center gap-2">
              <Icon name="pin" size={16} className="text-ink-muted" />
              <dt className="sr-only">Local</dt>
              <dd>{banca.local}</dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-ink-muted">{banca.membros.length ? 'Data ainda não definida.' : 'Data e composição ainda não definidas.'}</p>
      )}

      {banca.membros.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">Membros</p>
          <ul className="space-y-0.5 text-sm">
            {banca.membros.map((m) => (
              <li key={m.nome}>
                {m.nome} <span className="text-ink-muted">· {m.papel} · {m.instituicao}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
