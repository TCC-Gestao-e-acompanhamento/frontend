import { useState, type FormEvent } from 'react'
import { Button, Field, Input, Select } from '../design-system'
import { toIso } from '../lib/format'
import { linkWebSeguro } from '../lib/links'
import type { MembroBanca } from '../types'

const PAPEIS = ['Orientador (presidente)', 'Orientadora (presidente)', 'Examinador', 'Examinadora', 'Suplente']

interface Linha extends MembroBanca {
  chave: string
}

interface Props {
  /** Nome do orientador, já sugerido como primeiro membro. */
  orientadorNome?: string
  inicial?: { data?: string; local?: string; link?: string; membros: MembroBanca[] }
  submitLabel: string
  onSubmit: (dados: { data?: string; local?: string; link?: string; membros: MembroBanca[] }) => Promise<void>
  onCancel?: () => void
}

/** Formulário da banca: data, local e membros (de 1 a 6). */
export function BancaForm({ orientadorNome, inicial, submitLabel, onSubmit, onCancel }: Props) {
  const nova = (m: MembroBanca): Linha => ({ ...m, chave: crypto.randomUUID() })
  const [hoje] = useState(() => toIso(new Date()))
  const [data, setData] = useState(inicial?.data ?? '')
  const [local, setLocal] = useState(inicial?.local ?? '')
  const [link, setLink] = useState(inicial?.link ?? '')
  const [membros, setMembros] = useState<Linha[]>(() =>
    inicial?.membros.length
      ? inicial.membros.map(nova)
      : [
          nova({ nome: orientadorNome ?? '', papel: 'Orientador (presidente)', instituicao: 'UnB' }),
          nova({ nome: '', papel: 'Examinador', instituicao: '' }),
          nova({ nome: '', papel: 'Examinador', instituicao: '' }),
        ],
  )
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroEnvio, setErroEnvio] = useState<string>()
  const [enviando, setEnviando] = useState(false)

  const alterar = (chave: string, campo: keyof MembroBanca, valor: string) =>
    setMembros((ms) => ms.map((m) => (m.chave === chave ? { ...m, [campo]: valor } : m)))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const novos: Record<string, string> = {}
    // só uma data nova precisa ser de hoje em diante (a proposta antiga mantém a que já tinha)
    if (data && data !== inicial?.data && data < hoje) novos.data = 'A data não pode ser anterior a hoje.'
    if (link.trim() && !linkWebSeguro(link)) novos.link = 'Informe um link começando com http:// ou https://.'
    membros.forEach((m) => {
      if (m.nome.trim().length < 3) novos[`nome-${m.chave}`] = 'Informe o nome.'
      if (m.instituicao.trim().length < 2) novos[`inst-${m.chave}`] = 'Informe a instituição.'
    })
    setErros(novos)
    if (Object.keys(novos).length) return
    setEnviando(true)
    setErroEnvio(undefined)
    try {
      await onSubmit({ data: data || undefined, local: local.trim() || undefined, link: linkWebSeguro(link), membros: membros.map(({ nome, papel, instituicao }) => ({ nome, papel, instituicao })) })
    } catch (err) {
      setErroEnvio(err instanceof Error ? err.message : 'Não foi possível salvar a banca.')
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Data prevista (opcional)" error={erros.data}>
          {(p) => <Input {...p} type="date" min={hoje} value={data} onChange={(e) => setData(e.target.value)} />}
        </Field>
        <Field label="Local (opcional)">{(p) => <Input {...p} value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex.: Auditório da Faculdade de Tecnologia, sala 12" maxLength={200} />}</Field>
        <div className="sm:col-span-2">
          <Field label="Link da sala virtual (opcional)" error={erros.link} hint="Se a defesa for online, informe o endereço da reunião. Ele aparece junto da banca.">
            {(p) => <Input {...p} type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" maxLength={300} autoComplete="off" />}
          </Field>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-medium">Membros da banca</legend>
        {membros.map((m, i) => (
          <div key={m.chave} className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Membro {i + 1}</p>
              {membros.length > 1 && (
                <Button size="sm" variant="ghost" aria-label={`Remover membro ${i + 1}`} onClick={() => setMembros((ms) => ms.filter((x) => x.chave !== m.chave))}>
                  Remover
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1.4fr_1.4fr]">
              <Field label="Nome" error={erros[`nome-${m.chave}`]}>{(p) => <Input {...p} value={m.nome} onChange={(e) => alterar(m.chave, 'nome', e.target.value)} autoComplete="off" />}</Field>
              <Field label="Papel">
                {(p) => (
                  <Select {...p} value={m.papel} onChange={(e) => alterar(m.chave, 'papel', e.target.value)}>
                    {PAPEIS.map((papel) => <option key={papel}>{papel}</option>)}
                  </Select>
                )}
              </Field>
              <Field label="Instituição" error={erros[`inst-${m.chave}`]}>{(p) => <Input {...p} value={m.instituicao} onChange={(e) => alterar(m.chave, 'instituicao', e.target.value)} autoComplete="off" />}</Field>
            </div>
          </div>
        ))}
        {membros.length < 6 && (
          <Button variant="secondary" onClick={() => setMembros((ms) => [...ms, nova({ nome: '', papel: 'Examinador', instituicao: '' })])}>
            Adicionar membro
          </Button>
        )}
      </fieldset>

      {erroEnvio && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{erroEnvio}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={enviando}>{submitLabel}</Button>
        {onCancel && <Button variant="secondary" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  )
}
