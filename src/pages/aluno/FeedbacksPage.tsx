import { useState } from 'react'
import { FeedbackList } from '../../components/FeedbackList'
import { useCurrentUser } from '../../auth/useAuth'
import { Button, DataBoundary, PageHeader, Tabs } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { listFeedbacks, resolverFeedback } from '../../services/api'

type Filtro = 'abertas' | 'todos'

export default function FeedbacksPage() {
  const user = useCurrentUser()
  const [filtro, setFiltro] = useState<Filtro>('abertas')
  const { state, reload } = useAsync(() => listFeedbacks(user), [user.id])
  const [resolvendo, setResolvendo] = useState<string>()
  const [aviso, setAviso] = useState<string>()

  const resolver = async (id: string) => {
    setResolvendo(id)
    setAviso(undefined)
    try {
      await resolverFeedback(user, id)
      setAviso('Correção marcada como resolvida. O orientador verá a atualização.')
      reload()
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não foi possível atualizar a correção.')
    } finally {
      setResolvendo(undefined)
    }
  }

  return (
    <>
      <PageHeader title="Feedbacks" description="Comentários e correções solicitadas pelo seu orientador." />
      <DataBoundary
        state={state}
        reload={reload}
        isEmpty={(d) => d.length === 0}
        empty={{ title: 'Nenhum feedback ainda', description: 'Quando seu orientador comentar uma entrega, aparecerá aqui.' }}
      >
        {(d) => {
          const abertas = d.filter((f) => f.tipo === 'correcao' && !f.resolvido)
          const lista = filtro === 'abertas' ? abertas : d
          return (
            <>
            {aviso && <p role="status" className="mb-4 rounded-lg border border-border bg-surface-muted p-3 text-sm">{aviso}</p>}
            <Tabs<Filtro>
              label="Filtrar feedbacks"
              value={filtro}
              onChange={setFiltro}
              items={[
                { key: 'abertas', label: 'Correções pendentes', count: abertas.length },
                { key: 'todos', label: 'Todos', count: d.length },
              ]}
            >
              {lista.length ? (
                <FeedbackList
                  items={lista}
                  acao={(f) =>
                    f.tipo === 'correcao' && !f.resolvido ? (
                      <Button size="sm" variant="secondary" loading={resolvendo === f.id} onClick={() => resolver(f.id)}>
                        Marcar como resolvida
                      </Button>
                    ) : null
                  }
                />
              ) : <p className="text-sm text-ink-muted">Nenhuma correção pendente.</p>}
            </Tabs>
            </>
          )
        }}
      </DataBoundary>
    </>
  )
}
