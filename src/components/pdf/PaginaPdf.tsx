import { useEffect, useRef, useState, type RefObject } from 'react'
import { TextLayer, type PDFDocumentProxy, type RenderTask } from 'pdfjs-dist'
import { cn } from '../../lib/format'
import type { RetanguloPdf } from '../../types'

/** 1 ponto do PDF = 96/72 pixels de CSS. */
export const PX_POR_PONTO = 96 / 72

export interface DestaqueVisual {
  id: string
  numero: number
  pagina: number
  rects: RetanguloPdf[]
  tipo: 'comentario' | 'correcao'
  resolvida: boolean
}

export interface AreaTemporaria {
  pagina: number
  rect: RetanguloPdf
}

interface Props {
  doc: PDFDocumentProxy
  numero: number
  /** Escala do pdf.js: 1 = página em 96 dpi (A4 ≈ 794 px de largura). */
  escala: number
  /** Tamanho da página 1 em pontos, usado até esta página ser aberta. */
  base: { w: number; h: number }
  raiz: RefObject<HTMLElement | null>
  destaques: DestaqueVisual[]
  pendente: RetanguloPdf[] | null
  area: AreaTemporaria | null
  ativa?: string
  onClicarDestaque: (id: string) => void
}

const pct = (v: number) => `${(v * 100).toFixed(3)}%`

/**
 * Uma página do PDF. Só é desenhada (imagem + texto selecionável) enquanto está perto da área visível:
 * com 100 páginas, o resto fica como um espaço vazio do tamanho certo, sem custo de memória nem de processamento.
 */
export function PaginaPdf({ doc, numero, escala, base, raiz, destaques, pendente, area, ativa, onClicarDestaque }: Props) {
  const divRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textoRef = useRef<HTMLDivElement>(null)
  const [visivel, setVisivel] = useState(false)
  const desenhada = useRef(false)
  const [real, setReal] = useState<{ w: number; h: number } | null>(null)
  const tam = real ?? base
  const largura = tam.w * PX_POR_PONTO * escala
  const altura = tam.h * PX_POR_PONTO * escala

  useEffect(() => {
    const el = divRef.current
    if (!el || !raiz.current) return
    const obs = new IntersectionObserver(([e]) => setVisivel(e.isIntersecting), { root: raiz.current, rootMargin: '150% 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [raiz])

  useEffect(() => {
    const canvas = canvasRef.current
    const texto = textoRef.current
    if (!canvas || !texto) return
    if (!visivel) {
      // longe da tela: libera a memória da imagem e do texto (e as listas de operações que o pdf.js guarda da página)
      if (desenhada.current) void doc.getPage(numero).then((p) => p.cleanup()).catch(() => {})
      desenhada.current = false
      canvas.width = 0
      canvas.height = 0
      texto.replaceChildren()
      texto.removeAttribute('style')
      return
    }
    const ativo: { cancelado: boolean; tarefa?: RenderTask; camada?: TextLayer } = { cancelado: false }
    // pequena espera: cliques seguidos no zoom não redesenham a cada passo
    const espera = window.setTimeout(async () => {
      try {
        const pagina = await doc.getPage(numero)
        if (ativo.cancelado) return
        const viewport = pagina.getViewport({ scale: escala * PX_POR_PONTO })
        // nitidez em telas de alta densidade, sem passar de ~16 milhões de pixels (limite do Safari/iOS e da memória)
        const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(16_000_000 / (viewport.width * viewport.height)))
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        canvas.width = Math.max(1, Math.floor(viewport.width * dpr))
        canvas.height = Math.max(1, Math.floor(viewport.height * dpr))
        const semRotacao = pagina.getViewport({ scale: 1 })
        setReal((r) => (r && Math.abs(r.w - semRotacao.width) < 0.5 && Math.abs(r.h - semRotacao.height) < 0.5 ? r : { w: semRotacao.width, h: semRotacao.height }))
        ativo.tarefa = pagina.render({ canvasContext: ctx, viewport, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined })
        await ativo.tarefa.promise
        desenhada.current = true
        if (ativo.cancelado) return
        texto.replaceChildren()
        texto.style.setProperty('--scale-factor', String(viewport.scale))
        texto.style.setProperty('--user-unit', '1')
        ativo.camada = new TextLayer({ textContentSource: pagina.streamTextContent(), container: texto, viewport })
        await ativo.camada.render()
      } catch (e) {
        // cancelamentos fazem parte do fluxo (rolagem rápida, zoom); outros erros deixam a página em branco
        if (!(e instanceof Error) || (e.name !== 'RenderingCancelledException' && e.name !== 'AbortException')) console.warn(`Falha ao desenhar a página ${numero}`, e)
      }
    }, 120)
    return () => {
      ativo.cancelado = true
      window.clearTimeout(espera)
      ativo.tarefa?.cancel()
      ativo.camada?.cancel()
    }
  }, [visivel, escala, doc, numero])

  // retângulos guardados em pontos do PDF, junto do tamanho da página em que foram marcados: viram porcentagem da página
  const mostrar = (r: RetanguloPdf) => ({ left: pct(r.x1 / r.width), top: pct(r.y1 / r.height), width: pct((r.x2 - r.x1) / r.width), height: pct((r.y2 - r.y1) / r.height) })

  return (
    <div
      ref={divRef}
      data-pagina={numero}
      className="relative mx-auto mb-3 bg-white shadow-sm ring-1 ring-border"
      style={{ width: largura, height: altura }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />

      {/* destaques ficam entre a imagem e o texto: não atrapalham a seleção nem escondem o que está escrito */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {destaques.map((d) =>
          d.rects.map((r, i) => (
            <div
              key={`${d.id}-${i}`}
              className={cn(
                'absolute rounded-[2px] mix-blend-multiply',
                d.resolvida ? 'bg-ink/10' : d.tipo === 'correcao' ? 'bg-warning/30' : 'bg-brand-500/25',
                ativa === d.id && 'outline-2 outline-offset-1 outline-brand-700',
              )}
              style={mostrar(r)}
            />
          )),
        )}
        {pendente?.map((r, i) => <div key={`p-${i}`} className="absolute rounded-[2px] bg-brand-700/20 outline-1 outline-brand-700" style={mostrar(r)} />)}
        {area && <div className="absolute border-2 border-dashed border-brand-700 bg-brand-700/10" style={mostrar(area.rect)} />}
      </div>

      <div ref={textoRef} className="textLayer" />

      {/* o número do comentário fica acima de tudo, como botão */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {destaques.map((d) => (
          <button
            key={d.id}
            type="button"
            aria-label={`Comentário ${d.numero} na página ${numero}`}
            onClick={() => onClicarDestaque(d.id)}
            className={cn(
              'pointer-events-auto absolute left-1.5 grid size-6 before:absolute before:-inset-3 before:content-[""] -translate-y-1/2 place-items-center rounded-full border-2 border-white text-xs font-semibold text-white shadow',
              d.resolvida ? 'bg-ink-muted' : 'bg-brand-700',
              ativa === d.id && 'ring-2 ring-brand-700 ring-offset-1',
            )}
            // o número fica na margem da página, na altura do trecho: não cobre o texto
            style={{ top: pct((d.rects[0].y1 + d.rects[0].y2) / 2 / d.rects[0].height) }}
          >
            {d.numero}
          </button>
        ))}
      </div>
    </div>
  )
}
