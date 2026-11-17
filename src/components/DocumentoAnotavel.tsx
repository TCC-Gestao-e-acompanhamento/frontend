import { useMemo, useRef, useState } from 'react'
import { cn } from '../lib/format'
import type { Anotacao, FeedbackTipo } from '../types'
import { PainelComentarios } from './PainelComentarios'

interface Selecao {
  paragrafo: number
  inicio: number
  fim: number
}

interface Props {
  paragrafos: string[]
  anotacoes: Anotacao[]
  papel: 'aluno' | 'orientador'
  onCriar: (d: Selecao & { tipo: FeedbackTipo; texto: string }) => Promise<void>
  onResolver: (id: string, resolvida: boolean) => Promise<void>
  onExcluir: (id: string) => Promise<void>
}

interface Segmento {
  texto: string
  anotacao?: Anotacao
  numero?: number
  pendente?: boolean
}

/**
 * Posição (em caracteres do texto original) de um ponto do DOM dentro do parágrafo.
 * Os números dos comentários (<sup>) não fazem parte do texto e são descontados.
 */
function posicaoNoTexto(paragrafo: HTMLElement, no: Node, deslocamento: number): number {
  const faixa = document.createRange()
  faixa.selectNodeContents(paragrafo)
  faixa.setEnd(no, deslocamento)
  const trecho = faixa.cloneContents()
  trecho.querySelectorAll('sup').forEach((s) => s.remove())
  return (trecho.textContent ?? '').length
}

/** O fim da seleção caiu fora de qualquer parágrafo, mas ainda no bloco deste parágrafo ou no contêiner logo após ele? */
function fimNoBlocoSeguinte(ini: HTMLElement, range: Range): boolean {
  const grupo = ini.closest('.group')
  if (!grupo) return false
  const fim = range.endContainer
  if (grupo.contains(fim)) return true
  return fim === grupo.parentElement && range.endOffset <= Array.prototype.indexOf.call(grupo.parentElement.childNodes, grupo) + 2
}

/** Cliques e teclas em botões e marcações não são seleção de texto. */
function deBotao(alvo: EventTarget): boolean {
  return alvo instanceof Element && !!alvo.closest('button, [role="button"]')
}

function segmentar(texto: string, anots: Array<{ inicio: number; fim: number; a?: Anotacao; numero?: number; pendente?: boolean }>): Segmento[] {
  const ordenadas = [...anots].sort((x, y) => x.inicio - y.inicio)
  const out: Segmento[] = []
  let pos = 0
  for (const x of ordenadas) {
    if (x.inicio < pos) continue
    if (x.inicio > pos) out.push({ texto: texto.slice(pos, x.inicio) })
    out.push({ texto: texto.slice(x.inicio, x.fim), anotacao: x.a, numero: x.numero, pendente: x.pendente })
    pos = x.fim
  }
  if (pos < texto.length) out.push({ texto: texto.slice(pos) })
  return out
}

/**
 * Documento com comentários em trechos. O orientador seleciona um trecho (ou comenta o parágrafo inteiro);
 * o aluno vê os trechos destacados, responde e marca como resolvido.
 */
export function DocumentoAnotavel({ paragrafos, anotacoes, papel, onCriar, onResolver, onExcluir }: Props) {
  const ordenadas = useMemo(() => [...anotacoes].sort((a, b) => a.paragrafo - b.paragrafo || a.inicio - b.inicio), [anotacoes])
  const numeros = useMemo(() => new Map(ordenadas.map((a, i) => [a.id, i + 1])), [ordenadas])
  const [selecao, setSelecao] = useState<Selecao | null>(null)
  const [ativa, setAtiva] = useState<string>()
  const [aviso, setAviso] = useState<string>()
  const areaRef = useRef<HTMLDivElement>(null)
  const orientador = papel === 'orientador'

  const sobrepoe = (par: number, ini: number, fim: number) => anotacoes.some((a) => a.paragrafo === par && ini < a.fim && fim > a.inicio)

  const escolher = (par: number, ini: number, fim: number) => {
    if (sobrepoe(par, ini, fim)) {
      setAviso('Este trecho já tem um comentário. Escolha outro trecho ou responda ao comentário existente.')
      return
    }
    setAviso(undefined)
    setSelecao({ paragrafo: par, inicio: ini, fim })
  }

  const capturar = () => {
    if (!orientador) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    const paragrafoDe = (n: Node) => (n.nodeType === Node.TEXT_NODE ? n.parentElement : (n as Element))?.closest<HTMLElement>('[data-par]') ?? null
    const ini = paragrafoDe(range.startContainer)
    const fim = paragrafoDe(range.endContainer)
    if (!ini) {
      setAviso('Selecione um trecho dentro de um único parágrafo.')
      return
    }
    const par = Number(ini.dataset.par)
    const texto = paragrafos[par]
    let inicio = posicaoNoTexto(ini, range.startContainer, range.startOffset)
    let fimPos: number
    if (fim === ini) {
      fimPos = posicaoNoTexto(ini, range.endContainer, range.endOffset)
    } else if (fim ? posicaoNoTexto(fim, range.endContainer, range.endOffset) === 0 && fim.closest('.group') === ini.closest('.group')?.nextElementSibling : fimNoBlocoSeguinte(ini, range)) {
      // clique triplo: a seleção termina no começo do bloco imediatamente seguinte, ou seja, vale até o fim deste parágrafo
      fimPos = texto.length
    } else {
      setAviso('Selecione um trecho dentro de um único parágrafo.')
      return
    }
    // ignora espaços nas pontas da seleção
    while (inicio < fimPos && /\s/.test(texto[inicio])) inicio++
    while (fimPos > inicio && /\s/.test(texto[fimPos - 1])) fimPos--
    if (fimPos <= inicio) return
    escolher(par, inicio, fimPos)
  }

  const irPara = (id: string, alvo: 'texto' | 'comentario') => {
    setAtiva(id)
    document.getElementById(`${alvo === 'texto' ? 'anot' : 'com'}-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  const criarComentario = async (d: { tipo: FeedbackTipo; texto: string }) => {
    if (!selecao) return
    await onCriar({ ...selecao, ...d })
    setSelecao(null)
    window.getSelection()?.removeAllRanges()
  }

  const trechoSelecionado = selecao ? paragrafos[selecao.paragrafo].slice(selecao.inicio, selecao.fim) : ''

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <article
        ref={areaRef}
        aria-label="Texto do documento"
        onMouseUp={(e) => !deBotao(e.target) && setTimeout(capturar, 0)}
        onKeyUp={(e) => (e.key === 'Shift' || e.key.startsWith('Arrow')) && !deBotao(e.target) && setTimeout(capturar, 0)}
        onTouchEnd={(e) => !deBotao(e.target) && setTimeout(capturar, 300)}
        className="rounded-card border border-border p-5 sm:p-8"
      >
        <div className="mx-auto max-w-[68ch] space-y-3">
          {paragrafos.map((p, i) => {
            const doParagrafo = ordenadas.filter((a) => a.paragrafo === i).map((a) => ({ inicio: a.inicio, fim: a.fim, a, numero: numeros.get(a.id) }))
            const extra = selecao && selecao.paragrafo === i ? [{ inicio: selecao.inicio, fim: selecao.fim, pendente: true }] : []
            return (
              <div key={i} className="group">
                <p data-par={i} className="leading-8 text-pretty">
                  {segmentar(p, [...doParagrafo, ...extra]).map((s, k) =>
                    s.anotacao ? (
                      <mark
                        key={k}
                        id={`anot-${s.anotacao.id}`}
                        role="button"
                        tabIndex={0}
                        aria-describedby={`com-${s.anotacao.id}`}
                        onClick={() => irPara(s.anotacao!.id, 'comentario')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            irPara(s.anotacao!.id, 'comentario')
                          }
                        }}
                        className={cn(
                          'cursor-pointer rounded-sm px-0.5 text-ink',
                          s.anotacao.resolvida ? 'bg-surface-muted underline decoration-ink-muted decoration-dotted underline-offset-4' : s.anotacao.tipo === 'correcao' ? 'bg-warning/20' : 'bg-brand-100',
                          ativa === s.anotacao.id && 'ring-2 ring-brand-700',
                        )}
                      >
                        {s.texto}
                        <sup className="ml-0.5 text-[0.7em] font-semibold text-brand-700">{s.numero}</sup>
                      </mark>
                    ) : s.pendente ? (
                      <mark key={k} className="rounded-sm bg-brand-100 px-0.5 text-ink outline-2 outline-brand-700">
                        {s.texto}
                      </mark>
                    ) : (
                      <span key={k}>{s.texto}</span>
                    ),
                  )}
                </p>
                {orientador && (
                  <button
                    type="button"
                    onClick={() => escolher(i, 0, p.length)}
                    className="inline-flex min-h-11 items-center text-sm text-brand-700 hover:underline lg:min-h-7 lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100"
                  >
                    Comentar o parágrafo {i + 1}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </article>

      <PainelComentarios
        anotacoes={ordenadas}
        papel={papel}
        pendente={selecao ? { trecho: trechoSelecionado } : null}
        dicaSelecao="Selecione um trecho do texto, ou use “Comentar o parágrafo”, para deixar um comentário."
        aviso={aviso}
        ativa={ativa}
        onVerNoDocumento={(id) => irPara(id, 'texto')}
        onCriar={criarComentario}
        onCancelarSelecao={() => {
          setSelecao(null)
          window.getSelection()?.removeAllRanges()
        }}
        onResolver={onResolver}
        onExcluir={onExcluir}
      />
    </div>
  )
}
