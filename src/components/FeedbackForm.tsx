import { useState, type FormEvent } from 'react'
import { useCurrentUser } from '../auth/useAuth'
import { Button, Field, Select, Textarea } from '../design-system'
import { addFeedback, updateFeedback } from '../services/api'
import type { Feedback, FeedbackTipo } from '../types'

interface Props {
  tccId: string
  /** Com `documentoId`, o retorno é sobre uma versão de documento (um só por versão). */
  documentoId?: string
  /** Quando informado, o formulário edita este feedback em vez de criar um novo. */
  editando?: Feedback
  onSaved: () => void
  onCancel?: () => void
}

/** Registro (ou edição) de feedback pelo orientador: do TCC em geral ou de uma versão de documento. */
export function FeedbackForm({ tccId, documentoId, editando, onSaved, onCancel }: Props) {
  const user = useCurrentUser()
  const [texto, setTexto] = useState(editando?.texto ?? '')
  const [tipo, setTipo] = useState<FeedbackTipo>(editando?.tipo ?? 'comentario')
  const [erro, setErro] = useState<string>()
  const [salvando, setSalvando] = useState(false)
  const [ok, setOk] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (texto.trim().length < 5) return setErro('Escreva ao menos 5 caracteres.')
    setErro(undefined)
    setSalvando(true)
    try {
      if (editando) await updateFeedback(user, editando.id, { texto: texto.trim(), tipo })
      else await addFeedback(user, { tccId, documentoId, texto: texto.trim(), tipo })
      if (!editando) setTexto('')
      setOk(true)
      onSaved()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const rotulo = documentoId ? 'Retorno geral sobre esta versão' : 'Novo feedback'
  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-lg bg-surface-muted p-4">
      <Field label={editando ? `Editar: ${rotulo.toLowerCase()}` : rotulo} error={erro}>
        {(p) => <Textarea {...p} autoFocus={!!editando} value={texto} onChange={(e) => { setTexto(e.target.value); setOk(false) }} placeholder="Descreva o comentário ou a correção solicitada…" />}
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
        <Button type="submit" loading={salvando}>{editando ? 'Salvar alterações' : documentoId ? 'Registrar retorno' : 'Registrar feedback'}</Button>
        {editando && onCancel && <Button variant="neutral" disabled={salvando} onClick={onCancel}>Cancelar</Button>}
        {ok && !editando && <p role="status" className="pb-2.5 text-sm text-success">Feedback registrado.</p>}
      </div>
    </form>
  )
}
