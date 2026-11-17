import type { ReactNode } from 'react'
import { Card, Icon } from '../design-system'
import { formatDate, relativeDays } from '../lib/format'
import { linkWebSeguro } from '../lib/links'
import type { Banca } from '../types'
import { StatusBadge } from './StatusBadge'

export function BancaCard({ banca, acoes }: { banca: Banca; acoes?: ReactNode }) {
  const linkSala = linkWebSeguro(banca.link)
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{banca.tccTitulo}</h3>
          <p className="text-sm text-ink-muted">{banca.alunoNome}</p>
        </div>
        <StatusBadge kind="banca" value={banca.situacao} />
      </div>

      {banca.situacao === 'rejeitada' && (
        <p className="mt-3 rounded-lg bg-danger/10 p-3 text-sm text-danger">
          A coordenação rejeitou esta proposta.{banca.motivoRejeicao ? ` Motivo: ${banca.motivoRejeicao}` : ' Nenhum motivo foi informado.'} Ajuste e reenvie, ou remova a proposta.
        </p>
      )}

      {banca.data || banca.local || linkSala ? (
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {banca.data && (
            <div className="flex items-center gap-2">
              <Icon name="calendar" size={16} className="text-ink-muted" />
              <dt className="sr-only">Data</dt>
              <dd>
                {formatDate(banca.data)}
                {banca.situacao === 'agendada' && <span className="text-ink-muted"> ({relativeDays(banca.data)})</span>}
              </dd>
            </div>
          )}
          {banca.local && (
            <div className="flex items-center gap-2">
              <Icon name="pin" size={16} className="text-ink-muted" />
              <dt className="sr-only">Local</dt>
              <dd>{banca.local}</dd>
            </div>
          )}
          {linkSala && (
            <div className="flex items-center gap-2 sm:col-span-2">
              <Icon name="arrow" size={16} className="text-ink-muted" />
              <dt className="sr-only">Sala virtual</dt>
              <dd>
                <a href={linkSala} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline">
                  Entrar na sala virtual
                  <span className="sr-only"> (abre em uma nova aba)</span>
                </a>
              </dd>
            </div>
          )}
          {!banca.data && <p className="text-ink-muted sm:col-span-2">Data ainda não definida.</p>}
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

      {acoes && <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">{acoes}</div>}
    </Card>
  )
}
