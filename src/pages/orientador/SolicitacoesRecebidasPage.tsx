import { useState } from 'react'
import { ResponderModal } from '../../components/ResponderModal'
import { SolicitacaoRow } from '../../components/SolicitacaoRow'
import { useCurrentUser } from '../../auth/useAuth'
import { Button, DataBoundary, PageHeader, Tabs } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { listSolicitacoes } from '../../services/api'
import type { Solicitacao } from '../../types'

type Aba = 'pendentes' | 'historico'

export default function SolicitacoesRecebidasPage() {
  const user = useCurrentUser()
  const { state, reload } = useAsync(() => listSolicitacoes(user), [user.id])
  const [aviso, setAviso] = useState<string>()
  const [aba, setAba] = useState<Aba>('pendentes')
  const [alvo, setAlvo] = useState<{ s: Solicitacao; decisao: 'aceita' | 'recusada' } | null>(null)

  return (
    <>
      <PageHeader title="Solicitações de orientação" description="Alunos que pediram sua orientação. Aceite ou recuse, com uma mensagem opcional." />
      <DataBoundary
        state={state}
        reload={reload}
        isEmpty={(d) => d.length === 0}
        empty={{ title: 'Nenhuma solicitação recebida', description: 'Quando um aluno solicitar sua orientação, ela aparece aqui.' }}
      >
        {(d) => {
          const pendentes = d.filter((s) => s.status === 'pendente')
          const historico = d.filter((s) => s.status !== 'pendente')
          return (
            <>
              {aviso && <p role="status" className="mb-4 rounded-lg bg-accent-50 p-3 text-sm text-success">{aviso}</p>}
              <Tabs<Aba>
                label="Solicitações"
                value={aba}
                onChange={setAba}
                items={[
                  { key: 'pendentes', label: 'Pendentes', count: pendentes.length },
                  { key: 'historico', label: 'Histórico', count: historico.length },
                ]}
              >
                {(aba === 'pendentes' ? pendentes : historico).length === 0 ? (
                  <p className="text-sm text-ink-muted">{aba === 'pendentes' ? 'Nenhuma solicitação pendente.' : 'Ainda não há solicitações respondidas.'}</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {(aba === 'pendentes' ? pendentes : historico).map((s) => (
                      <SolicitacaoRow
                        key={s.id}
                        solicitacao={s}
                        perspective="orientador"
                        to={`/orientador/solicitacoes/${s.id}`}
                        actions={
                          s.status === 'pendente' && (
                            <>
                              <Button size="sm" onClick={() => setAlvo({ s, decisao: 'aceita' })}>Aceitar</Button>
                              <Button size="sm" variant="secondary" onClick={() => setAlvo({ s, decisao: 'recusada' })}>Recusar</Button>
                            </>
                          )
                        }
                      />
                    ))}
                  </ul>
                )}
              </Tabs>
              <ResponderModal solicitacao={alvo?.s ?? null} decisao={alvo?.decisao ?? 'aceita'} onClose={() => setAlvo(null)} onDone={(m) => { setAviso(m); reload() }} />
            </>
          )
        }}
      </DataBoundary>
    </>
  )
}
