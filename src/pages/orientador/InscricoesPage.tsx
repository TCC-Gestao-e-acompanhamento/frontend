import { useContext, useState } from 'react'
import { useCurrentUser } from '../../auth/useAuth'
import { ShellContext } from '../../layouts/shellContext'
import { Badge, Button, DataBoundary, PageHeader, SectionCard } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { formatDate, plural } from '../../lib/format'
import { listInscricoes, marcarCiente } from '../../services/api'

export default function InscricoesRecebidasPage() {
  const user = useCurrentUser()
  const { refreshContador } = useContext(ShellContext)
  const { state, reload } = useAsync(() => listInscricoes(user), [user.id])
  const [salvando, setSalvando] = useState<string>()
  const [erro, setErro] = useState<string>()

  const ciente = async (id: string) => {
    setSalvando(id)
    setErro(undefined)
    try {
      await marcarCiente(user, id)
      reload()
      refreshContador()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível registrar a ciência.')
    } finally {
      setSalvando(undefined)
    }
  }

  return (
    <>
      <PageHeader
        title="Inscrições no TCC"
        description="Alunos que se inscreveram indicando você como orientador no semestre. Confirme a ciência para avisar que viu."
      />
      <DataBoundary
        state={state}
        reload={reload}
        isEmpty={(d) => d.length === 0}
        empty={{ title: 'Nenhum aluno indicou você ainda', description: 'Quando um aluno se inscrever citando você, ele aparece aqui.' }}
      >
        {(d) => {
          const novas = d.filter((i) => !i.ciente)
          return (
            <div className="space-y-6">
              <SectionCard
                title={d[0] ? `Semestre ${d[0].semestre}` : 'Inscrições'}
                description={novas.length ? `${plural(novas.length, 'inscrição aguarda', 'inscrições aguardam')} a sua ciência` : 'Todas as inscrições têm ciência registrada'}
              >
                {erro && <p role="alert" className="mb-3 text-sm text-danger">{erro}</p>}
                <ul className="divide-y divide-border">
                  {d.map((i) => (
                    <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{i.alunoNome}</p>
                        <p className="text-sm text-ink-muted">
                          Matrícula {i.matricula} · {i.curso} · {i.fase === 'TCC1' ? 'TCC 1' : 'TCC 2'} · inscrito em {formatDate(i.atualizadaEm ?? i.criadaEm)}
                        </p>
                      </div>
                      {i.ciente ? (
                        <Badge tone="success">Ciente em {formatDate(i.cienteEm as string)}</Badge>
                      ) : (
                        <Button size="sm" loading={salvando === i.id} onClick={() => ciente(i.id)}>Estou ciente</Button>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 rounded-lg bg-surface-muted p-3 text-xs text-ink-muted">
                  Estar ciente informa a coordenação que você viu a indicação. A vinculação institucional segue os procedimentos da UnB (a confirmar).
                </p>
              </SectionCard>
            </div>
          )
        }}
      </DataBoundary>
    </>
  )
}
