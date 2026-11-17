import { useState } from 'react'
import { Badge, Button, Field, Modal, Select, Textarea } from '../design-system'
import { cn, formatDate } from '../lib/format'
import type { Anotacao, FeedbackTipo } from '../types'

interface Props {
  /** Já na ordem em que aparecem no documento: a numeração segue esta ordem. */
  anotacoes: Anotacao[]
  papel: 'aluno' | 'orientador'
  /** Trecho ou área escolhida no documento, aguardando o texto do comentário. */
  pendente: { trecho: string; imagem?: string } | null
  /** Texto de ajuda quando nada está selecionado. */
  dicaSelecao: string
  aviso?: string
  ativa?: string
  /** A partir de qual largura o painel fica ao lado do documento (e acompanha a rolagem). */
  ladoAlado?: 'lg' | 'xl' | 'livre'
  onVerNoDocumento: (id: string) => void
  onCriar: (d: { tipo: FeedbackTipo; texto: string }) => Promise<void>
  onCancelarSelecao: () => void
  onResponder: (id: string, texto: string) => Promise<void>
  onResolver: (id: string, resolvida: boolean) => Promise<void>
  /** Quem pode apagar comentários (o orientador, os próprios). Sem esta função, o botão não aparece. */
  onExcluir?: (id: string) => Promise<void>
}

/** Painel lateral de comentários, igual para documento em texto e em PDF. */
export function PainelComentarios({ ladoAlado = 'lg', anotacoes, papel, pendente, dicaSelecao, aviso, ativa, onVerNoDocumento, onCriar, onCancelarSelecao, onResponder, onResolver, onExcluir }: Props) {
  const [tipo, setTipo] = useState<FeedbackTipo>('comentario')
  const [texto, setTexto] = useState('')
  const [respondendo, setRespondendo] = useState<string>()
  const [resposta, setResposta] = useState('')
  const [ocupado, setOcupado] = useState<string>()
  const [erro, setErro] = useState<string>()
  const [detalheId, setDetalheId] = useState<string>()
  const [excluindoId, setExcluindoId] = useState<string>()
  const orientador = papel === 'orientador'

  const executar = async (chave: string, fn: () => Promise<void>) => {
    setOcupado(chave)
    setErro(undefined)
    try {
      await fn()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível concluir a ação.')
    } finally {
      setOcupado(undefined)
    }
  }

  const mensagem = erro ?? aviso
  const indice = (id?: string) => anotacoes.findIndex((a) => a.id === id)
  const detalhe = anotacoes[indice(detalheId)]
  const excluindo = anotacoes[indice(excluindoId)]

  const abrirDetalhe = (id: string, responder = false) => {
    setErro(undefined)
    setDetalheId(id)
    setRespondendo(responder ? id : undefined)
    setResposta('')
  }
  const verNoDocumento = (id: string) => {
    setDetalheId(undefined)
    onVerNoDocumento(id)
  }

  /** Marcar como resolvido (aluno) ou reabrir (orientador): usado no cartão e no detalhe. */
  const botaoSituacao = (a: Anotacao) => {
    if (!a.resolvida && !orientador)
      return (
        <Button size="sm" variant="success" aria-label={`Marcar o comentário ${indice(a.id) + 1} como resolvido`} loading={ocupado === `ok-${a.id}`} onClick={() => executar(`ok-${a.id}`, () => onResolver(a.id, true))}>
          Marcar como resolvido
        </Button>
      )
    if (a.resolvida && orientador)
      return (
        <Button size="sm" variant="neutral" aria-label={`Reabrir o comentário ${indice(a.id) + 1}`} loading={ocupado === `ok-${a.id}`} onClick={() => executar(`ok-${a.id}`, () => onResolver(a.id, false))}>
          Reabrir
        </Button>
      )
    return null
  }
  const botaoApagar = (a: Anotacao, n: number) =>
    onExcluir && orientador ? (
      <Button
        size="sm"
        variant="danger-quiet"
        aria-label={`Apagar o comentário ${n}`}
        className="ml-auto"
        onClick={() => {
          setErro(undefined)
          setDetalheId(undefined)
          setExcluindoId(a.id)
        }}
      >
        Apagar
      </Button>
    ) : null
  /** O orientador escreveu o comentário: só faz sentido responder quando o aluno já respondeu. */
  const podeResponder = (a: Anotacao) => !orientador || a.respostas.some((r) => r.autorRole === 'aluno')

  const emblemas = (a: Anotacao, n: number) => (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="font-semibold text-brand-700">{n}</span>
      <Badge tone={a.tipo === 'correcao' ? 'warning' : 'neutral'}>{a.tipo === 'correcao' ? 'Correção' : 'Comentário'}</Badge>
      <Badge tone={a.resolvida ? 'neutral' : 'success'}>{a.resolvida ? 'Resolvido' : 'Aberto'}</Badge>
      {a.posicaoPdf && <span className="text-xs text-ink-muted">página {a.posicaoPdf.pageNumber}</span>}
    </div>
  )

  return (
    <aside aria-label="Comentários" className={cn('space-y-4', ladoAlado === 'xl' && 'xl:sticky xl:top-24 xl:self-start', ladoAlado === 'lg' && 'lg:sticky lg:top-24 lg:self-start')}>
      {!detalhe && !excluindo && mensagem && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{mensagem}</p>}

      {orientador && (
        <section aria-labelledby="novo-com" className="rounded-card border border-border p-4">
          <h2 id="novo-com" className="mb-2 text-base font-semibold">Novo comentário</h2>
          {pendente ? (
            <div className="space-y-3">
              {pendente.imagem && <img src={pendente.imagem} alt="Área marcada na página" className="max-h-40 rounded-lg border border-border" />}
              <blockquote className="rounded-lg bg-surface-muted p-3 text-sm text-ink-muted italic">“{pendente.trecho}”</blockquote>
              <Field label="Tipo">
                {(p) => (
                  <Select {...p} value={tipo} onChange={(e) => setTipo(e.target.value as FeedbackTipo)}>
                    <option value="comentario">Comentário</option>
                    <option value="correcao">Solicitar correção</option>
                  </Select>
                )}
              </Field>
              <Field label="Comentário">{(p) => <Textarea {...p} value={texto} onChange={(e) => setTexto(e.target.value)} className="min-h-24" />}</Field>
              <div className="flex gap-2">
                <Button
                  loading={ocupado === 'novo'}
                  onClick={() =>
                    executar('novo', async () => {
                      await onCriar({ tipo, texto })
                      setTexto('')
                      setTipo('comentario')
                    })
                  }
                >
                  Comentar
                </Button>
                <Button variant="neutral" onClick={onCancelarSelecao}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">{dicaSelecao}</p>
          )}
        </section>
      )}

      <section aria-labelledby="lista-com" className="rounded-card border border-border p-4">
        <h2 id="lista-com" className="mb-3 text-base font-semibold">
          Comentários <span className="font-normal text-ink-muted">({anotacoes.length})</span>
        </h2>
        {anotacoes.length === 0 ? (
          <p className="text-sm text-ink-muted">{orientador ? 'Nenhum comentário ainda.' : 'O orientador ainda não comentou este documento.'}</p>
        ) : (
          <ul aria-label="Lista de comentários" className="-mx-1 max-h-[min(34rem,60vh)] space-y-3 overflow-y-auto px-1 py-1 [scrollbar-gutter:stable]">
            {anotacoes.map((a, i) => (
              <li key={a.id} id={`com-${a.id}`} className={cn('rounded-lg border p-3 text-sm', ativa === a.id ? 'border-brand-700 bg-brand-50' : 'border-border')}>
                {/* o texto longo é cortado só aqui: tocar no cartão abre o comentário inteiro */}
                <button type="button" onClick={() => abrirDetalhe(a.id)} aria-label={`Abrir o comentário ${i + 1} por inteiro`} className="-m-1 block w-[calc(100%+0.5rem)] rounded-lg p-1 text-left hover:bg-surface-muted/70">
                  <span className="mb-1.5 block">{emblemas(a, i + 1)}</span>
                  {a.imagem ? <img src={a.imagem} alt="Área comentada na página" className="max-h-24 rounded border border-border" /> : a.trecho && <span className="line-clamp-2 block text-xs text-ink-muted italic">“{a.trecho}”</span>}
                  <span className="mt-1.5 line-clamp-3 block">{a.texto}</span>
                  <span className="mt-1 block text-xs text-ink-muted">
                    {a.autorNome} · {formatDate(a.criadaEm)}
                    {a.respostas.length > 0 && ` · ${a.respostas.length} ${a.respostas.length === 1 ? 'resposta' : 'respostas'}`}
                  </span>
                </button>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="neutral" aria-label={`Ver o comentário ${i + 1} no documento`} onClick={() => onVerNoDocumento(a.id)}>Ver no documento</Button>
                  {podeResponder(a) && <Button size="sm" variant="primary" aria-label={`Responder ao comentário ${i + 1}`} onClick={() => abrirDetalhe(a.id, true)}>Responder</Button>}
                  {botaoSituacao(a)}
                  {botaoApagar(a, i + 1)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal open={!!detalhe} title={detalhe ? `Comentário ${indice(detalhe.id) + 1}` : ''} onClose={() => { setDetalheId(undefined); setRespondendo(undefined) }}>
        {detalhe && (
          <div className="space-y-4 text-sm">
            {emblemas(detalhe, indice(detalhe.id) + 1)}
            {detalhe.imagem ? (
              <img src={detalhe.imagem} alt="Área comentada na página" className="max-h-72 max-w-full rounded-lg border border-border" />
            ) : (
              detalhe.trecho && <blockquote className="rounded-lg bg-surface-muted p-3 break-words text-ink-muted italic">“{detalhe.trecho}”</blockquote>
            )}
            <div>
              <p className="break-words whitespace-pre-wrap">{detalhe.texto}</p>
              <p className="mt-1 text-xs text-ink-muted">{detalhe.autorNome} · {formatDate(detalhe.criadaEm)}</p>
            </div>

            {detalhe.respostas.length > 0 && (
              <ul className="space-y-2 border-t border-border pt-3" aria-label="Respostas">
                {detalhe.respostas.map((r) => (
                  <li key={r.id} className="rounded-lg bg-surface-muted p-2.5">
                    <p className="break-words whitespace-pre-wrap">{r.texto}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{r.autorNome} · {formatDate(r.data)}</p>
                  </li>
                ))}
              </ul>
            )}

            {erro && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-danger">{erro}</p>}

            {respondendo === detalhe.id && (
              <div className="space-y-2">
                <Field label="Sua resposta">{(p) => <Textarea {...p} autoFocus value={resposta} onChange={(e) => setResposta(e.target.value)} className="min-h-20" />}</Field>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    loading={ocupado === `r-${detalhe.id}`}
                    onClick={() =>
                      executar(`r-${detalhe.id}`, async () => {
                        await onResponder(detalhe.id, resposta)
                        setResposta('')
                        setRespondendo(undefined)
                      })
                    }
                  >
                    Enviar resposta
                  </Button>
                  <Button size="sm" variant="neutral" onClick={() => setRespondendo(undefined)}>Cancelar</Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <Button size="sm" variant="neutral" onClick={() => verNoDocumento(detalhe.id)}>Ver no documento</Button>
              {podeResponder(detalhe) && respondendo !== detalhe.id && <Button size="sm" variant="primary" onClick={() => { setRespondendo(detalhe.id); setResposta('') }}>Responder</Button>}
              {botaoSituacao(detalhe)}
              {botaoApagar(detalhe, indice(detalhe.id) + 1)}
              <Button size="sm" variant="neutral" onClick={() => setDetalheId(undefined)}>Fechar</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!excluindo} title="Apagar comentário?" onClose={() => setExcluindoId(undefined)}>
        {excluindo && (
          <div className="space-y-4 text-sm">
            <p>
              O comentário {indice(excluindo.id) + 1}
              {excluindo.respostas.length > 0 ? ' e as respostas dele serão apagados' : ' será apagado'}. Não dá para desfazer.
            </p>
            {erro && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-danger">{erro}</p>}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger"
                loading={ocupado === `x-${excluindo.id}`}
                onClick={() =>
                  executar(`x-${excluindo.id}`, async () => {
                    await onExcluir?.(excluindo.id)
                    setExcluindoId(undefined)
                  })
                }
              >
                Apagar
              </Button>
              <Button variant="neutral" onClick={() => setExcluindoId(undefined)}>Cancelar</Button>
            </div>
          </div>
        )}
      </Modal>
    </aside>
  )
}
