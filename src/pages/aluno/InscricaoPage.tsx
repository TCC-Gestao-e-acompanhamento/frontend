import { useRef, useState, type FormEvent } from 'react'
import { useCurrentUser } from '../../auth/useAuth'
import { StatusBadge } from '../../components/StatusBadge'
import { Badge, Button, ButtonLink, DataBoundary, EmptyState, Field, Input, PageHeader, RadioGroup, SectionCard, Select } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { daysUntil, formatDate, formatDateLong, plural } from '../../lib/format'
import { emailUnbValido } from '../../lib/validators'
import {
  cancelInscricao,
  createInscricao,
  getMinhaInscricao,
  getPeriodoInscricao,
  listProfessoresPublicos,
  listSolicitacoes,
  updateInscricao,
} from '../../services/api'
import type { Fase, Inscricao, PeriodoInscricao, ProfessorPublico } from '../../types'

const OUTRO = 'outro'

interface FormProps {
  professores: ProfessorPublico[]
  inicial?: Inscricao
  sugestaoProfessorId?: string
  onSaved: (i: Inscricao) => void
  onCancel?: () => void
}

type Erros = Partial<Record<'fase' | 'orientador' | 'nome' | 'email', string>>

function InscricaoForm({ professores, inicial, sugestaoProfessorId, onSaved, onCancel }: FormProps) {
  const user = useCurrentUser()
  const noSistema = inicial?.orientadorId && professores.some((p) => p.id === inicial.orientadorId)
  const [fase, setFase] = useState<Fase | ''>(inicial?.fase ?? '')
  const [professor, setProfessor] = useState<string>(
    inicial ? (noSistema ? (inicial.orientadorId as string) : OUTRO) : (sugestaoProfessorId ?? ''),
  )
  const [nome, setNome] = useState(inicial && !noSistema ? inicial.orientadorNome : '')
  const [email, setEmail] = useState(inicial && !noSistema ? (inicial.orientadorEmail ?? '') : '')
  const [erros, setErros] = useState<Erros>({})
  const [erroEnvio, setErroEnvio] = useState<string>()
  const [enviando, setEnviando] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const outro = professor === OUTRO
    const novos: Erros = {
      fase: fase ? undefined : 'Escolha TCC 1 ou TCC 2.',
      orientador: professor ? undefined : 'Escolha o orientador ou informe os dados dele.',
      nome: outro && nome.trim().length < 3 ? 'Informe o nome do orientador.' : undefined,
      email: outro && !emailUnbValido(email) ? 'Use o e-mail institucional do orientador (termina em unb.br).' : undefined,
    }
    setErros(novos)
    if (Object.values(novos).some(Boolean)) return
    setEnviando(true)
    setErroEnvio(undefined)
    try {
      const dados = { fase: fase as Fase, ...(outro ? { orientadorNome: nome, orientadorEmail: email } : { orientadorId: professor }) }
      const salvo = inicial ? await updateInscricao(user, inicial.id, dados) : await createInscricao(user, dados)
      onSaved(salvo)
    } catch (err) {
      setErroEnvio(err instanceof Error ? err.message : 'Não foi possível enviar a inscrição.')
      setEnviando(false)
    }
  }

  const sugerido = !inicial && sugestaoProfessorId && professor === sugestaoProfessorId

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <SectionCard title={inicial ? 'Editar inscrição' : 'Seus dados de inscrição'} description="Preencha apenas o que a coordenação precisa.">
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome" hint="Da sua conta.">{(p) => <Input {...p} value={user.nome} readOnly className="bg-surface-muted" />}</Field>
            <Field label="Matrícula" hint="Da sua conta.">{(p) => <Input {...p} value={user.matricula ?? ''} readOnly className="bg-surface-muted" />}</Field>
          </div>

          <RadioGroup<Fase>
            legend="Em qual TCC você está se inscrevendo?"
            name="fase"
            value={fase}
            onChange={(v) => setFase(v)}
            error={erros.fase}
            options={[
              { value: 'TCC1', label: 'TCC 1', hint: 'Projeto e revisão bibliográfica' },
              { value: 'TCC2', label: 'TCC 2', hint: 'Desenvolvimento, monografia e defesa' },
            ]}
          />

          <Field label="Orientador" error={erros.orientador} hint={sugerido ? 'Sugerido: este professor aceitou sua solicitação de orientação.' : 'Escolha na lista. Se ele não aparecer, selecione a última opção.'}>
            {(p) => (
              <Select {...p} value={professor} onChange={(e) => setProfessor(e.target.value)}>
                <option value="">Selecione…</option>
                {professores.map((pr) => <option key={pr.id} value={pr.id}>{pr.nome}</option>)}
                <option value={OUTRO}>Meu orientador não está na lista</option>
              </Select>
            )}
          </Field>

          {professor === OUTRO && (
            <div className="grid gap-4 rounded-lg bg-surface-muted p-4 sm:grid-cols-2">
              <Field label="Nome do orientador" error={erros.nome}>{(p) => <Input {...p} value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="off" />}</Field>
              <Field label="E-mail da UnB do orientador" error={erros.email} hint="Ele será avisado neste endereço.">
                {(p) => <Input {...p} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@unb.br" autoComplete="off" />}
              </Field>
            </div>
          )}
        </div>
      </SectionCard>

      {erroEnvio && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{erroEnvio}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={enviando}>{inicial ? 'Salvar alterações' : 'Enviar inscrição'}</Button>
        {onCancel && <Button variant="secondary" onClick={onCancel}>Cancelar edição</Button>}
      </div>
    </form>
  )
}

function Resumo({ i, aberto, onEditar, onCancelada, recemEnviada }: { i: Inscricao; aberto: boolean; onEditar: () => void; onCancelada: () => void; recemEnviada: boolean }) {
  const user = useCurrentUser()
  const [confirmando, setConfirmando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [erro, setErro] = useState<string>()
  const botaoCancelar = useRef<HTMLButtonElement>(null)

  const cancelar = async () => {
    setCancelando(true)
    setErro(undefined)
    try {
      await cancelInscricao(user, i.id)
      onCancelada()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível cancelar.')
      setCancelando(false)
    }
  }

  return (
    <div className="space-y-5">
      {recemEnviada && (
        <p role="status" className="rounded-lg border border-success/30 bg-accent-50 p-3 text-sm text-success">
          Inscrição enviada. {i.avisoOrientador === 'sistema' ? `${i.orientadorNome} verá o aviso na área dele.` : `O aviso será enviado para ${i.orientadorEmail}.`}
        </p>
      )}
      <SectionCard title="Sua inscrição" description={`Semestre ${i.semestre}`} action={<Badge tone="success">Inscrição enviada</Badge>}>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-ink-muted">Nome</dt><dd className="font-medium">{i.alunoNome}</dd></div>
          <div><dt className="text-ink-muted">Matrícula</dt><dd className="font-medium">{i.matricula}</dd></div>
          <div><dt className="text-ink-muted">TCC</dt><dd className="font-medium">{i.fase === 'TCC1' ? 'TCC 1' : 'TCC 2'}</dd></div>
          <div><dt className="text-ink-muted">Enviada em</dt><dd className="font-medium">{formatDate(i.atualizadaEm ?? i.criadaEm)}</dd></div>
          <div><dt className="text-ink-muted">Orientador</dt><dd className="font-medium">{i.orientadorNome}</dd></div>
          <div><dt className="text-ink-muted">E-mail do orientador</dt><dd className="font-medium">{i.orientadorEmail}</dd></div>
        </dl>
      </SectionCard>

      <SectionCard title="Aviso ao orientador">
        <p className="text-sm">
          {i.avisoOrientador === 'sistema'
            ? `${i.orientadorNome} está cadastrado e vê a sua inscrição na própria área.`
            : `${i.orientadorNome} ainda não usa a plataforma. O aviso segue por e-mail para ${i.orientadorEmail} (simulado no protótipo).`}
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          {i.ciente ? `Ciente em ${formatDate(i.cienteEm as string)}.` : 'Aguardando a ciência do orientador.'}
        </p>
        <p className="mt-3 rounded-lg bg-surface-muted p-3 text-xs text-ink-muted">
          A inscrição informa quem vai orientar você no semestre. Ela não equivale à vinculação institucional, que segue os procedimentos da UnB (a confirmar).
        </p>
      </SectionCard>

      {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
      {aberto ? (
        confirmando ? (
          <div role="group" aria-label="Confirmar cancelamento" className="space-y-3 rounded-lg border border-border p-4">
            <p className="text-sm">Cancelar sua inscrição? Você poderá se inscrever de novo enquanto o período estiver aberto.</p>
            <div className="flex gap-3">
              <Button variant="danger" loading={cancelando} onClick={cancelar}>Sim, cancelar inscrição</Button>
              <Button
                variant="secondary"
                autoFocus
                onClick={() => {
                  setConfirmando(false)
                  requestAnimationFrame(() => botaoCancelar.current?.focus())
                }}
              >
                Manter inscrição
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button onClick={onEditar}>Editar inscrição</Button>
            <Button ref={botaoCancelar} variant="secondary" onClick={() => setConfirmando(true)}>Cancelar inscrição</Button>
          </div>
        )
      ) : (
        <p className="text-sm text-ink-muted">O período terminou, então a inscrição não pode mais ser alterada. Em caso de erro, procure a coordenação.</p>
      )}
    </div>
  )
}

function Periodo({ p }: { p: PeriodoInscricao }) {
  const dias = daysUntil(p.inicio)
  const restam = daysUntil(p.fim)
  return (
    <SectionCard title={`Inscrições do semestre ${p.semestre}`} action={<StatusBadge kind="periodo" value={p.situacao} />}>
      <p className="text-sm">
        De <span className="font-medium">{formatDateLong(p.inicio)}</span> a <span className="font-medium">{formatDateLong(p.fim)}</span>.
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        {p.situacao === 'antes' && `Abrem em ${plural(dias, 'dia', 'dias')}.`}
        {p.situacao === 'aberto' && (restam === 0 ? 'Último dia para se inscrever.' : `Terminam em ${plural(restam, 'dia', 'dias')}.`)}
        {p.situacao === 'encerrado' && 'O período terminou.'}
      </p>
    </SectionCard>
  )
}

export default function InscricaoPage() {
  const user = useCurrentUser()
  const { state, reload } = useAsync(async () => {
    const [periodo, minha, professores, solicitacoes] = await Promise.all([
      getPeriodoInscricao(),
      getMinhaInscricao(user),
      listProfessoresPublicos(),
      listSolicitacoes(user),
    ])
    const aceita = solicitacoes.find((s) => s.status === 'aceita')
    return { periodo, minha, professores, sugestaoProfessorId: aceita?.professorId }
  }, [user.id])
  const [editando, setEditando] = useState(false)
  const [recemEnviada, setRecemEnviada] = useState(false)
  // Resultado local da última ação: evita mostrar dados antigos enquanto a lista recarrega.
  const [local, setLocal] = useState<{ valor: Inscricao | null }>()

  return (
    <>
      <PageHeader title="Inscrição no TCC" description="Informe em qual TCC você vai se matricular e quem será seu orientador no semestre." />
      <DataBoundary
        state={state}
        reload={reload}
        isEmpty={(d) => !d.periodo}
        empty={{ title: 'Período de inscrição ainda não definido', description: 'A coordenação divulga as datas aqui e no calendário acadêmico.' }}
      >
        {({ periodo, minha: minhaServidor, professores, sugestaoProfessorId }) => {
          if (!periodo) return null
          const minha = local ? local.valor : minhaServidor
          const aberto = periodo.situacao === 'aberto'
          return (
            <div className="space-y-6">
              <Periodo p={periodo} />
              {minha && !editando ? (
                <Resumo
                  i={minha}
                  aberto={aberto}
                  recemEnviada={recemEnviada}
                  onEditar={() => { setEditando(true); setRecemEnviada(false) }}
                  onCancelada={() => { setRecemEnviada(false); setLocal({ valor: null }); reload() }}
                />
              ) : aberto ? (
                <InscricaoForm
                  professores={professores}
                  inicial={editando ? (minha ?? undefined) : undefined}
                  sugestaoProfessorId={sugestaoProfessorId}
                  onSaved={(salva) => { setLocal({ valor: salva }); setEditando(false); setRecemEnviada(true); reload() }}
                  onCancel={editando ? () => setEditando(false) : undefined}
                />
              ) : (
                <EmptyState
                  title={periodo.situacao === 'antes' ? 'As inscrições ainda não abriram' : 'As inscrições foram encerradas'}
                  description={periodo.situacao === 'antes' ? `Volte a partir de ${formatDate(periodo.inicio)}. Enquanto isso, você pode buscar um orientador.` : 'Se precisar se inscrever fora do prazo, procure a coordenação.'}
                  action={periodo.situacao === 'antes' ? <ButtonLink to="/orientadores" variant="secondary">Buscar orientador</ButtonLink> : undefined}
                />
              )}
            </div>
          )
        }}
      </DataBoundary>
    </>
  )
}
