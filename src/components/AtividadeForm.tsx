import { useState, type FormEvent } from 'react'
import { useCurrentUser } from '../auth/useAuth'
import { Button, Field, Input, Select } from '../design-system'
import { toIso } from '../lib/format'
import { createAtividade } from '../services/api'
import type { NovaAtividade, Tcc } from '../types'

interface Props {
  /** Trabalho fixo (aba do TCC). Sem ele, o formulário pede qual orientando, entre `orientandos`. */
  tccId?: string
  orientandos?: Tcc[]
  onSaved: () => void
  onCancel?: () => void
}

const TIPOS: Array<{ valor: NovaAtividade['tipo']; rotulo: string; exemplo: string }> = [
  { valor: 'reuniao', rotulo: 'Reunião de orientação', exemplo: 'Ex.: Reunião de orientação' },
  { valor: 'entrega', rotulo: 'Entrega', exemplo: 'Ex.: Entregar o capítulo 2' },
  { valor: 'marco', rotulo: 'Marco', exemplo: 'Ex.: Apresentação na banca' },
]

/** O orientador adiciona reunião, entrega ou marco ao cronograma de um orientando. */
export function AtividadeForm({ tccId, orientandos = [], onSaved, onCancel }: Props) {
  const user = useCurrentUser()
  const [hoje] = useState(() => toIso(new Date()))
  const [alvo, setAlvo] = useState(tccId ?? (orientandos.length === 1 ? orientandos[0].id : ''))
  const [tipo, setTipo] = useState<NovaAtividade['tipo']>('reuniao')
  const [titulo, setTitulo] = useState('')
  const [prazo, setPrazo] = useState('')
  const [erros, setErros] = useState<{ alvo?: string; titulo?: string; prazo?: string }>({})
  const [erroEnvio, setErroEnvio] = useState<string>()
  const [salvando, setSalvando] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const novos = {
      alvo: alvo ? undefined : 'Escolha o orientando.',
      titulo: titulo.trim().length >= 3 ? undefined : 'Dê um título de pelo menos 3 letras.',
      prazo: !prazo ? 'Informe a data.' : prazo < hoje ? 'A data não pode ser anterior a hoje.' : undefined,
    }
    setErros(novos)
    if (novos.alvo || novos.titulo || novos.prazo) return
    setSalvando(true)
    setErroEnvio(undefined)
    try {
      await createAtividade(user, { tccId: alvo, titulo: titulo.trim(), tipo, prazo })
      setTitulo('')
      setPrazo('')
      onSaved()
    } catch (err) {
      setErroEnvio(err instanceof Error ? err.message : 'Não foi possível adicionar a atividade.')
    } finally {
      setSalvando(false)
    }
  }

  const exemplo = TIPOS.find((t) => t.valor === tipo)?.exemplo
  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-lg bg-surface-muted p-4">
      <h3 className="text-base font-semibold">Nova atividade no cronograma</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!tccId && (
          <Field label="Orientando" error={erros.alvo}>
            {(p) => (
              <Select {...p} value={alvo} onChange={(e) => setAlvo(e.target.value)}>
                <option value="">Selecione…</option>
                {orientandos.map((t) => <option key={t.id} value={t.id}>{t.aluno.nome}</option>)}
              </Select>
            )}
          </Field>
        )}
        <Field label="Tipo">
          {(p) => (
            <Select {...p} value={tipo} onChange={(e) => setTipo(e.target.value as NovaAtividade['tipo'])}>
              {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Título" error={erros.titulo}>
          {(p) => <Input {...p} value={titulo} maxLength={120} placeholder={exemplo} onChange={(e) => setTitulo(e.target.value)} />}
        </Field>
        <Field label="Data" error={erros.prazo}>
          {(p) => <Input {...p} type="date" min={hoje} value={prazo} onChange={(e) => setPrazo(e.target.value)} />}
        </Field>
      </div>
      {erroEnvio && <p role="alert" className="text-sm text-danger">{erroEnvio}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={salvando}>Adicionar ao cronograma</Button>
        {onCancel && <Button variant="neutral" disabled={salvando} onClick={onCancel}>Fechar</Button>}
      </div>
    </form>
  )
}
