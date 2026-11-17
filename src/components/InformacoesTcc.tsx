import { useRef, useState, type FormEvent } from 'react'
import { useCurrentUser } from '../auth/useAuth'
import { Button, Field, Input, SectionCard, Select, Textarea } from '../design-system'
import { useAsync } from '../hooks/useAsync'
import { listAreas, updateInformacoesTcc } from '../services/api'
import type { Tcc } from '../types'

interface Props {
  tcc: Tcc
  /** Aluno e orientador do TCC editam; a coordenação só consulta. */
  editavel: boolean
  /** Chamada depois de salvar, para a tela recarregar os dados. */
  onSaved?: () => void
}

/** Título, área e descrição (o tema) do trabalho. O semestre vem da inscrição e não se edita aqui. */
export function InformacoesTcc({ tcc, editavel, onSaved }: Props) {
  const user = useCurrentUser()
  const { state: areas } = useAsync(() => listAreas(), [])
  const [editando, setEditando] = useState(false)
  const [titulo, setTitulo] = useState(tcc.titulo)
  const [area, setArea] = useState(tcc.area ?? '')
  const [descricao, setDescricao] = useState(tcc.descricao ?? '')
  const [erros, setErros] = useState<{ titulo?: string; area?: string; descricao?: string }>({})
  const [erroEnvio, setErroEnvio] = useState<string>()
  const [salvando, setSalvando] = useState(false)
  const [aviso, setAviso] = useState<string>()
  // o que acabou de ser salvo aparece já, sem esperar a tela recarregar; quando a tela traz um `tcc` novo, ele passa a valer
  const [salvo, setSalvo] = useState<{ base: Tcc; dados: Tcc }>()
  const voltarFoco = useRef(false)
  const atual = salvo && salvo.base === tcc ? salvo.dados : tcc

  const abrir = () => {
    setTitulo(atual.titulo)
    setArea(atual.area ?? '')
    setDescricao(atual.descricao ?? '')
    setErros({})
    setErroEnvio(undefined)
    setAviso(undefined)
    setEditando(true)
  }

  const fechar = () => {
    voltarFoco.current = true
    setEditando(false)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const novos = {
      titulo: titulo.trim().length >= 5 ? undefined : 'Dê um título de pelo menos 5 letras.',
      area: area ? undefined : 'Escolha a área.',
      descricao: descricao.trim().length >= 20 ? undefined : 'Descreva o trabalho com pelo menos 20 caracteres.',
    }
    setErros(novos)
    if (novos.titulo || novos.area || novos.descricao) return
    setSalvando(true)
    setErroEnvio(undefined)
    try {
      const atualizado = await updateInformacoesTcc(user, tcc.id, { titulo: titulo.trim(), area, descricao: descricao.trim() })
      setSalvo({ base: tcc, dados: atualizado })
      setAviso('Informações do TCC atualizadas.')
      fechar()
      onSaved?.()
    } catch (err) {
      setErroEnvio(err instanceof Error ? err.message : 'Não foi possível salvar as informações.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <SectionCard
      title="Informações do TCC"
      description={editavel ? 'Aluno e orientador podem editar. Vale a versão mais recente.' : undefined}
      action={
        editavel && !editando ? (
          <Button
            variant="secondary"
            size="sm"
            ref={(el) => {
              if (el && voltarFoco.current) {
                voltarFoco.current = false
                el.focus()
              }
            }}
            onClick={abrir}
          >
            Editar informações
          </Button>
        ) : undefined
      }
    >
      {/* a região fica sempre montada: leitores de tela só anunciam o texto que entra numa região viva já existente */}
      <div role="status" aria-live="polite">
        {aviso && <p className="mb-4 rounded-lg bg-accent-50 p-3 text-sm text-success">{aviso}</p>}
      </div>
      {editando ? (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Título" error={erros.titulo}>
            {(p) => <Input {...p} autoFocus value={titulo} maxLength={200} onChange={(e) => setTitulo(e.target.value)} />}
          </Field>
          <Field label="Área" error={erros.area}>
            {(p) => (
              <Select {...p} value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">Selecione…</option>
                {areas.status === 'success' && areas.data.map((a) => <option key={a.id} value={a.nome}>{a.nome}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Descrição do trabalho" error={erros.descricao} hint="Qual é o tema, o problema e o que será investigado. Até 1000 caracteres.">
            {(p) => <Textarea {...p} value={descricao} maxLength={1000} onChange={(e) => setDescricao(e.target.value)} />}
          </Field>
          {erroEnvio && <p role="alert" className="text-sm text-danger">{erroEnvio}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={salvando}>Salvar alterações</Button>
            <Button variant="neutral" disabled={salvando} onClick={fechar}>Cancelar</Button>
          </div>
        </form>
      ) : (
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-ink-muted">Título</dt>
            <dd className="font-medium">{atual.titulo}</dd>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-ink-muted">Área</dt>
              <dd className="font-medium">{atual.area ?? 'Não informada'}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Semestre</dt>
              <dd className="font-medium">{atual.semestre}</dd>
            </div>
          </div>
          <div>
            <dt className="text-ink-muted">Descrição</dt>
            <dd className="max-w-prose">{atual.descricao ?? 'Ainda não informada.'}</dd>
          </div>
        </dl>
      )}
    </SectionCard>
  )
}
