import { useState, type FormEvent } from 'react'
import { useCurrentUser } from '../auth/useAuth'
import { Button, Field, Select, Textarea } from '../design-system'
import { addFeedback } from '../services/api'
import type { FeedbackTipo } from '../types'

/** Registro de feedback pelo orientador: do TCC em geral ou, com `documentoId`, de uma versão de documento. */
export function FeedbackForm({ tccId, documentoId, onSaved }: { tccId: string; documentoId?: string; onSaved: () => void }) {
  const user = useCurrentUser()
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState<FeedbackTipo>('comentario')
  const [erro, setErro] = useState<string>()
  const [salvando, setSalvando] = useState(false)
  const [ok, setOk] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (texto.trim().length < 5) return setErro('Escreva ao menos 5 caracteres.')
    setErro(undefined)
    setSalvando(true)
    try {
      await addFeedback(user, { tccId, documentoId, texto: texto.trim(), tipo })
      setTexto('')
      setOk(true)
      onSaved()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mb-5 space-y-4 rounded-lg bg-surface-muted p-4">
      <Field label={documentoId ? "Novo retorno geral" : "Novo feedback"} error={erro}>
        {(p) => <Textarea {...p} value={texto} onChange={(e) => { setTexto(e.target.value); setOk(false) }} placeholder="Descreva o comentário ou a correção solicitada…" />}
      </Field>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <Field label="Tipo">
            {(p) => (
              <Select {...p} value={tipo} onChange={(e) => setTipo(e.target.value as FeedbackTipo)}>
                <option value="comentario">Comentário</option>
                <option value="correcao">Solicitar correção</option>
              </Select>
            )}
          </Field>
        </div>
        <Button type="submit" loading={salvando}>Registrar feedback</Button>
        {ok && <p role="status" className="pb-2.5 text-sm text-success">Feedback registrado.</p>}
      </div>
    </form>
  )
}
