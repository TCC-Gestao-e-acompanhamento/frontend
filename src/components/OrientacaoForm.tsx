import { useState, type FormEvent } from 'react'
import { useCurrentUser } from '../auth/useAuth'
import { Button, Field, Input, RadioGroup, Textarea } from '../design-system'
import { toIso } from '../lib/format'
import { createOrientacao } from '../services/api'
import type { FormatoOrientacao } from '../types'

type Erros = Partial<Record<'data' | 'formato' | 'resumo', string>>

/** Orientador registra uma reunião ou orientação já realizada. */
export function OrientacaoForm({ tccId, onSaved }: { tccId: string; onSaved: () => void }) {
  const user = useCurrentUser()
  const [hoje] = useState(() => toIso(new Date()))
  const [data, setData] = useState(hoje)
  const [formato, setFormato] = useState<FormatoOrientacao | ''>('')
  const [resumo, setResumo] = useState('')
  const [combinados, setCombinados] = useState('')
  const [proximo, setProximo] = useState('')
  const [erros, setErros] = useState<Erros>({})
  const [erroEnvio, setErroEnvio] = useState<string>()
  const [salvando, setSalvando] = useState(false)
  const [ok, setOk] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const novos: Erros = {
      data: data ? undefined : 'Informe a data da reunião.',
      formato: formato ? undefined : 'Escolha presencial ou online.',
      resumo: resumo.trim().length >= 10 ? undefined : 'Descreva o que foi tratado (pelo menos 10 caracteres).',
    }
    setErros(novos)
    if (Object.values(novos).some(Boolean)) return
    setSalvando(true)
    setErroEnvio(undefined)
    try {
      await createOrientacao(user, { tccId, data, formato: formato as FormatoOrientacao, resumo, combinados, proximoEncontro: proximo || undefined })
      setResumo('')
      setCombinados('')
      setProximo('')
      setFormato('')
      setOk(true)
      onSaved()
    } catch (err) {
      setErroEnvio(err instanceof Error ? err.message : 'Não foi possível registrar a orientação.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mb-6 space-y-4 rounded-card border border-border p-5">
      <div>
        <h3 className="font-semibold">Registrar orientação</h3>
        <p className="text-sm text-ink-muted">Anote o que foi tratado e combinado. O aluno vê este registro no histórico dele.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Data da reunião" error={erros.data}>
          {(p) => <Input {...p} type="date" max={hoje} value={data} onChange={(e) => { setData(e.target.value); setOk(false) }} />}
        </Field>
        <RadioGroup<FormatoOrientacao>
          legend="Formato"
          name="formato"
          value={formato}
          onChange={(v) => { setFormato(v); setOk(false) }}
          error={erros.formato}
          options={[{ value: 'presencial', label: 'Presencial' }, { value: 'online', label: 'Online' }]}
        />
      </div>
      <Field label="O que foi tratado" error={erros.resumo}>
        {(p) => <Textarea {...p} value={resumo} onChange={(e) => { setResumo(e.target.value); setOk(false) }} placeholder="Ex.: revisão do capítulo de metodologia e dos critérios de seleção" />}
      </Field>
      <Field label="Combinados (opcional)" hint="Tarefas e prazos acordados para o próximo encontro.">
        {(p) => <Textarea {...p} value={combinados} onChange={(e) => setCombinados(e.target.value)} className="min-h-20" />}
      </Field>
      <div className="max-w-xs">
        <Field label="Próximo encontro (opcional)">
          {(p) => <Input {...p} type="date" min={data} value={proximo} onChange={(e) => setProximo(e.target.value)} />}
        </Field>
      </div>
      {erroEnvio && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{erroEnvio}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={salvando}>Registrar orientação</Button>
        {ok && <p role="status" className="text-sm text-success">Orientação registrada.</p>}
      </div>
    </form>
  )
}
