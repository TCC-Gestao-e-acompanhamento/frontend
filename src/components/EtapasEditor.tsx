import { useState, type FormEvent } from 'react'
import { useCurrentUser } from '../auth/useAuth'
import { Button, Field, Input, Select } from '../design-system'
import { toIso } from '../lib/format'
import { defineEtapas } from '../services/api'
import type { Fase, Tcc } from '../types'

interface Linha {
  chave: string
  nome: string
  fase: Fase
  prazo: string
}

interface Props {
  tcc: Tcc
  onSaved: () => void
  onCancel: () => void
}

/** O orientador define as etapas do trabalho, a data de cada uma e em qual delas o aluno está. */
export function EtapasEditor({ tcc, onSaved, onCancel }: Props) {
  const user = useCurrentUser()
  const [hoje] = useState(() => toIso(new Date()))
  const nova = (e: { nome: string; fase: Fase; prazo?: string }): Linha => ({ chave: crypto.randomUUID(), nome: e.nome, fase: e.fase, prazo: e.prazo ?? '' })
  const [linhas, setLinhas] = useState<Linha[]>(() => tcc.etapas.map(nova))
  // chave vazia = todas as etapas concluídas (é como o trabalho começa quando já terminou tudo)
  const [atualChave, setAtualChave] = useState(() => {
    const i = tcc.etapas.findIndex((e) => e.situacao === 'atual')
    return i >= 0 ? linhas[i].chave : ''
  })
  const [erro, setErro] = useState<string>()
  const [salvando, setSalvando] = useState(false)

  const alterar = (chave: string, campo: 'nome' | 'fase' | 'prazo', valor: string) =>
    setLinhas((ls) => ls.map((l) => (l.chave === chave ? { ...l, [campo]: valor } : l)))
  const mover = (i: number, delta: -1 | 1) =>
    setLinhas((ls) => {
      const j = i + delta
      if (j < 0 || j >= ls.length) return ls
      const copia = [...ls]
      ;[copia[i], copia[j]] = [copia[j], copia[i]]
      return copia
    })
  const remover = (chave: string) => {
    if (linhas.length <= 1) return
    const resto = linhas.filter((l) => l.chave !== chave)
    setLinhas(resto)
    if (atualChave === chave) setAtualChave(resto[0].chave)
  }
  const adicionar = () => {
    const ultima = linhas[linhas.length - 1]
    const l = nova({ nome: '', fase: ultima?.fase ?? 'TCC1' })
    setLinhas((ls) => [...ls, l])
  }

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    if (linhas.some((l) => l.nome.trim().length < 3)) return setErro('Dê um nome de pelo menos 3 letras a cada etapa.')
    const nomes = linhas.map((l) => l.nome.trim().toLowerCase())
    const repetido = nomes.find((n, i) => nomes.indexOf(n) !== i)
    if (repetido) return setErro(`Duas etapas têm o mesmo nome ("${linhas[nomes.indexOf(repetido)].nome.trim()}"). Dê nomes diferentes.`)
    if (linhas.some((l, i) => l.fase === 'TCC1' && linhas.slice(0, i).some((o) => o.fase === 'TCC2'))) return setErro('As etapas do TCC 1 vêm antes das do TCC 2. Reordene a lista.')
    const datas = linhas.filter((l) => l.prazo).map((l) => l.prazo)
    if (datas.some((d, i) => i > 0 && d < datas[i - 1])) return setErro('As datas das etapas devem seguir a ordem da lista.')
    setSalvando(true)
    setErro(undefined)
    try {
      await defineEtapas(user, tcc.id, {
        etapas: linhas.map((l) => ({ nome: l.nome, fase: l.fase, ...(l.prazo ? { prazo: l.prazo } : {}) })),
        atual: atualChave === '' ? linhas.length : Math.max(0, linhas.findIndex((l) => l.chave === atualChave)),
      })
      onSaved()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar as etapas.')
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={salvar} noValidate className="space-y-4 rounded-lg bg-surface-muted p-4">
      <div>
        <h3 className="text-base font-semibold">Definir as etapas de {tcc.aluno.nome}</h3>
        <p className="mt-0.5 text-sm text-ink-muted">Nomeie as etapas, escolha em qual TCC entram e, se quiser, a data de cada uma. Marque a etapa em que o aluno está agora.</p>
      </div>

      <ol className="space-y-3">
        {linhas.map((l, i) => (
          <li key={l.chave} className="rounded-lg border border-border bg-surface p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_9rem_10rem]">
              <Field label={`Etapa ${i + 1}`}>
                {(p) => <Input {...p} value={l.nome} maxLength={80} placeholder="Ex.: Revisão bibliográfica" onChange={(e) => alterar(l.chave, 'nome', e.target.value)} />}
              </Field>
              <Field label="Entra no">
                {(p) => (
                  <Select {...p} value={l.fase} onChange={(e) => alterar(l.chave, 'fase', e.target.value)}>
                    <option value="TCC1">TCC 1</option>
                    <option value="TCC2">TCC 2</option>
                  </Select>
                )}
              </Field>
              <Field label="Data (opcional)">
                {(p) => <Input {...p} type="date" min={hoje} value={l.prazo} onChange={(e) => alterar(l.chave, 'prazo', e.target.value)} />}
              </Field>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="mr-auto inline-flex min-h-11 items-center gap-2 text-sm sm:min-h-9">
                <input type="radio" name="etapa-atual" className="size-4 accent-brand-700" checked={atualChave === l.chave} onChange={() => setAtualChave(l.chave)} />
                Etapa atual do aluno
              </label>
              <Button size="sm" variant="neutral" disabled={i === 0} aria-label={`Subir a etapa ${i + 1}`} onClick={() => mover(i, -1)}>Subir</Button>
              <Button size="sm" variant="neutral" disabled={i === linhas.length - 1} aria-label={`Descer a etapa ${i + 1}`} onClick={() => mover(i, 1)}>Descer</Button>
              <Button size="sm" variant="danger-quiet" disabled={linhas.length <= 1} aria-label={`Remover a etapa ${i + 1}`} onClick={() => remover(l.chave)}>Remover</Button>
            </div>
          </li>
        ))}
      </ol>

      <label className="inline-flex min-h-11 items-center gap-2 text-sm sm:min-h-9">
        <input type="radio" name="etapa-atual" className="size-4 accent-brand-700" checked={atualChave === ''} onChange={() => setAtualChave('')} />
        Todas as etapas concluídas
      </label>
      {linhas.length < 12 && <div><Button variant="secondary" onClick={adicionar}>Adicionar etapa</Button></div>}
      {erro && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{erro}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={salvando}>Salvar etapas</Button>
        <Button variant="neutral" disabled={salvando} onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}
