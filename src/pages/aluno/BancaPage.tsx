import { useRef, useState } from 'react'
import { useCurrentUser } from '../../auth/useAuth'
import { BancaCard } from '../../components/BancaCard'
import { BancaForm } from '../../components/BancaForm'
import { Button, DataBoundary, EmptyState, PageHeader, SectionCard } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { cancelBanca, createBanca, getMinhaBanca, listTccs, updateBanca } from '../../services/api'

/** O aluno propõe a banca do próprio TCC; a proposta só vale depois da validação da coordenação. */
export default function BancaPage() {
  const user = useCurrentUser()
  const { state, reload } = useAsync(async () => {
    const [tccs, banca] = await Promise.all([listTccs(user), getMinhaBanca(user)])
    return { tcc: tccs[0], banca }
  }, [user.id])
  const [modo, setModo] = useState<'ver' | 'form'>('ver')
  const [confirmando, setConfirmando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [aviso, setAviso] = useState<string>()
  const [erro, setErro] = useState<string>()
  const botaoCancelar = useRef<HTMLButtonElement>(null)

  return (
    <>
      <PageHeader title="Minha banca" description="Proponha a composição da banca do seu TCC. A proposta só vale depois de validada pela coordenação." />
      <DataBoundary state={state} reload={reload}>
        {({ tcc, banca }) => {
          if (!tcc) {
            return <EmptyState title="Você ainda não tem um TCC vinculado" description="A banca é proposta depois que o TCC e o orientador estiverem vinculados." />
          }
          const semBanca = !banca || banca.situacao === 'a_definir'
          return (
            <div className="space-y-6">
              {aviso && <p role="status" className="rounded-lg border border-border bg-surface-muted p-3 text-sm">{aviso}</p>}

              {modo === 'form' ? (
                <SectionCard title={semBanca ? 'Propor banca' : 'Editar proposta'} description="Você pode ajustar a proposta até a coordenação validar.">
                  <BancaForm
                    orientadorNome={tcc.orientador.nome}
                    inicial={semBanca ? undefined : banca}
                    submitLabel={semBanca ? 'Enviar proposta' : 'Salvar alterações'}
                    onCancel={() => setModo('ver')}
                    onSubmit={async (dados) => {
                      if (semBanca) await createBanca(user, { tccId: tcc.id, ...dados })
                      else await updateBanca(user, banca.id, dados)
                      setModo('ver')
                      setAviso(semBanca ? 'Proposta enviada. A coordenação ainda precisa validar a banca.' : 'Proposta atualizada.')
                      reload()
                    }}
                  />
                </SectionCard>
              ) : semBanca ? (
                <EmptyState
                  title="Sua banca ainda não foi definida"
                  description="Informe os membros, e a data e o local se já souber. Você pode ajustar até a coordenação validar."
                  action={<Button onClick={() => { setAviso(undefined); setModo('form') }}>Propor banca</Button>}
                />
              ) : (
                <>
                  <BancaCard banca={banca} />
                  {banca.situacao === 'proposta' ? (
                    <div className="space-y-3">
                      <p className="rounded-lg bg-surface-muted p-3 text-sm text-ink-muted">
                        Esta é uma proposta sua. Ela ainda não é pública e depende da validação da coordenação. Até lá você pode editar ou remover; depois de validada, só a coordenação altera (procedimento a confirmar).
                      </p>
                      {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
                      {confirmando ? (
                        <div role="group" aria-label="Confirmar cancelamento" className="space-y-3 rounded-lg border border-border p-4">
                          <p className="text-sm">Remover a proposta de banca? Os dados informados serão apagados e você poderá propor de novo.</p>
                          <div className="flex gap-3">
                            <Button
                              variant="danger"
                              loading={cancelando}
                              onClick={async () => {
                                setCancelando(true)
                                setErro(undefined)
                                try {
                                  await cancelBanca(user, banca.id)
                                  setConfirmando(false)
                                  setAviso('Proposta removida.')
                                  reload()
                                } catch (e) {
                                  setErro(e instanceof Error ? e.message : 'Não foi possível remover.')
                                } finally {
                                  setCancelando(false)
                                }
                              }}
                            >
                              Sim, remover proposta
                            </Button>
                            <Button
                              variant="secondary"
                              autoFocus
                              onClick={() => {
                                setConfirmando(false)
                                requestAnimationFrame(() => botaoCancelar.current?.focus())
                              }}
                            >
                              Manter proposta
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          <Button onClick={() => { setAviso(undefined); setModo('form') }}>Editar proposta</Button>
                          <Button ref={botaoCancelar} variant="secondary" onClick={() => setConfirmando(true)}>Remover proposta</Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-ink-muted">Esta banca já foi validada pela coordenação. Só a coordenação pode alterá-la ou removê-la.</p>
                  )}
                </>
              )}
            </div>
          )
        }}
      </DataBoundary>
    </>
  )
}
