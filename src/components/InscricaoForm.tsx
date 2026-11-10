import { useState, type FormEvent } from 'react'
import { Button, Field, Input, RadioGroup, Select } from '../design-system'
import { emailUnbValido } from '../lib/validators'
import type { Fase, Inscricao, NovaInscricao, ProfessorPublico } from '../types'

const OUTRO = 'outro'

interface Props {
  professores: ProfessorPublico[]
  alunoNome: string
  matricula: string
  /** Preenche o formulário para edição (coordenação). */
  inicial?: Inscricao
  /** Professor sugerido (ex.: orientação já aceita). */
  sugestaoProfessorId?: string
  submitLabel: string
  onSubmit: (dados: NovaInscricao) => Promise<void>
  onCancel?: () => void
}

type Erros = Partial<Record<'fase' | 'orientador' | 'nome' | 'email', string>>

/** Campos da inscrição: TCC 1/2 e orientador (da lista ou nome + e-mail da UnB). Usado por aluno e coordenação. */
export function InscricaoForm({ professores, alunoNome, matricula, inicial, sugestaoProfessorId, submitLabel, onSubmit, onCancel }: Props) {
  const noSistema = !!inicial?.orientadorId && professores.some((p) => p.id === inicial.orientadorId)
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
      await onSubmit({ fase: fase as Fase, ...(outro ? { orientadorNome: nome, orientadorEmail: email } : { orientadorId: professor }) })
    } catch (err) {
      setErroEnvio(err instanceof Error ? err.message : 'Não foi possível enviar a inscrição.')
      setEnviando(false)
    }
  }

  const sugerido = !inicial && sugestaoProfessorId && professor === sugestaoProfessorId

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome">{(p) => <Input {...p} value={alunoNome} readOnly className="bg-surface-muted" />}</Field>
        <Field label="Matrícula">{(p) => <Input {...p} value={matricula} readOnly className="bg-surface-muted" />}</Field>
      </div>

      <RadioGroup<Fase>
        legend="Em qual TCC está a inscrição?"
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
            <option value={OUTRO}>O orientador não está na lista</option>
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

      {erroEnvio && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{erroEnvio}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={enviando}>{submitLabel}</Button>
        {onCancel && <Button variant="secondary" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  )
}
