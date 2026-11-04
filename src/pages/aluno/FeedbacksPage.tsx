import { useState } from 'react'
import { FeedbackList } from '../../components/FeedbackList'
import { useCurrentUser } from '../../auth/useAuth'
import { DataBoundary, PageHeader, Tabs } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { listFeedbacks } from '../../services/api'

type Filtro = 'abertas' | 'todos'

export default function FeedbacksPage() {
  const user = useCurrentUser()
  const [filtro, setFiltro] = useState<Filtro>('abertas')
  const { state, reload } = useAsync(() => listFeedbacks(user), [user.id])

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
            <Tabs
              label="Filtrar feedbacks"
              value={filtro}
              onChange={setFiltro}
              items={[
                { key: 'abertas', label: 'Correções pendentes', count: abertas.length },
                { key: 'todos', label: 'Todos', count: d.length },
              ]}
            >
              {lista.length ? <FeedbackList items={lista} /> : <p className="text-sm text-ink-muted">Nenhuma correção pendente. 🎉</p>}
            </Tabs>
          )
        }}
      </DataBoundary>
    </>
  )
}
