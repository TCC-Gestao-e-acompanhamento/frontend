import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type Ref } from 'react'
import * as pdfjs from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import 'pdfjs-dist/web/pdf_viewer.css'
import { ErrorState, LoadingState } from '../../design-system'
import type { PosicaoPdf, RetanguloPdf } from '../../types'
import { PaginaPdf, PX_POR_PONTO, type AreaTemporaria, type DestaqueVisual } from './PaginaPdf'

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

export interface SelecaoPdf {
  posicao: PosicaoPdf
  texto?: string
  imagem?: string
}

export interface ControlePdf {
  rolarPara: (pagina: number, y?: number) => void
}

export type ZoomPdf = 'largura' | number

interface Props {
  url: string
  zoom: ZoomPdf
  /** Quem pode marcar trechos (orientador). */
  podeMarcar: boolean
  destaques: DestaqueVisual[]
  /** Marcação provisória, enquanto o comentário é escrito. */
  pendente: PosicaoPdf | null
  ativa?: string
  alturaClasse: string
  controle?: Ref<ControlePdf>
  onEscala: (escala: number) => void
  onPaginas: (total: number) => void
  onPaginaAtual: (pagina: number) => void
  onSelecionar: (s: SelecaoPdf) => void
  onAviso: (msg: string | undefined) => void
  onClicarDestaque: (id: string) => void
}

const ESCALA_MIN = 0.25
const ESCALA_MAX = 4
const MARGEM = 40 // padding da área de rolagem + folga para a barra de rolagem vertical
const arredonda = (n: number) => Math.round(n * 100) / 100

/**
 * Visualizador de PDF sobre o pdf.js. Só as páginas perto da tela são desenhadas; as outras ocupam o espaço certo
 * sem custo, então PDFs de 100 páginas ou mais rolam com a mesma fluidez de um de 5.
 */
export function VisualizadorPdf({
  url,
  zoom,
  podeMarcar,
  destaques,
  pendente,
  ativa,
  alturaClasse,
  controle,
  onEscala,
  onPaginas,
  onPaginaAtual,
  onSelecionar,
  onAviso,
  onClicarDestaque,
}: Props) {
  const raizRef = useRef<HTMLDivElement>(null)
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [erro, setErro] = useState(false)
  const [base, setBase] = useState<{ w: number; h: number } | null>(null)
  const [largura, setLargura] = useState(0)
  const [area, setArea] = useState<AreaTemporaria | null>(null)
  const [sobre, setSobre] = useState<string>()
  // onde o botão do mouse desceu: soltar longe dali é arrasto (seleção), não clique
  const descida = useRef<{ x: number; y: number } | null>(null)
  const arrasto = useRef<{ pagina: number; el: HTMLElement; x0: number; y0: number } | null>(null)

  // abre o PDF; cada URL tem a sua carga e a anterior é descartada
  // (o componente é remontado a cada URL, com `key`, então começa sempre do zero)
  useEffect(() => {
    const estado = { cancelado: false }
    const tarefa = pdfjs.getDocument({ url })
    ;(async () => {
      try {
        const d = await tarefa.promise
        const p = await d.getPage(1)
        if (estado.cancelado) return
        const v = p.getViewport({ scale: 1 })
        setBase({ w: v.width, h: v.height })
        setDoc(d)
        onPaginas(d.numPages)
      } catch {
        // arquivo corrompido ou ilegível (a tarefa cancelada na saída também cai aqui)
        if (!estado.cancelado) setErro(true)
      }
    })()
    return () => {
      estado.cancelado = true
      void tarefa.destroy() // libera o documento e o worker
    }
    // onPaginas só informa o total: não deve reabrir o arquivo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  // largura disponível, para o "ajustar à largura" e para a escala acompanhar a janela
  useEffect(() => {
    const el = raizRef.current
    if (!el) return
    const medir = () => setLargura(el.clientWidth)
    medir()
    const obs = new ResizeObserver(medir)
    obs.observe(el)
    return () => obs.disconnect()
  }, [doc])

  const escala = (() => {
    if (!base) return 1
    if (zoom !== 'largura') return Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, zoom))
    const ajustada = (Math.max(largura, 160) - MARGEM) / (base.w * PX_POR_PONTO)
    return arredonda(Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, ajustada)))
  })()
  useEffect(() => onEscala(escala), [escala, onEscala])

  useImperativeHandle(
    controle,
    () => ({
      rolarPara: (pagina, y) => {
        const raiz = raizRef.current
        const el = raiz?.querySelector<HTMLElement>(`[data-pagina="${pagina}"]`)
        if (!raiz || !el) return
        const topo = el.offsetTop + (y ? Math.max(0, y * PX_POR_PONTO * escala - 80) : 0) - 12
        raiz.scrollTo({ top: topo, behavior: 'smooth' })
      },
    }),
    [escala],
  )

  // Ponto do documento que está no meio da tela (0 a 1): o zoom e a mudança de largura mantêm o leitor nele.
  const proporcao = useRef<number | null>(null)
  useLayoutEffect(() => {
    const raiz = raizRef.current
    if (!raiz || proporcao.current === null) return
    raiz.scrollTop = proporcao.current * raiz.scrollHeight - raiz.clientHeight / 2
  }, [escala])

  // página mais visível: mostrada na barra de ferramentas
  const aoRolar = useCallback(() => {
    const raiz = raizRef.current
    if (!raiz || !base) return
    proporcao.current = (raiz.scrollTop + raiz.clientHeight / 2) / raiz.scrollHeight
    const altura = base.h * PX_POR_PONTO * escala + 12
    onPaginaAtual(Math.max(1, Math.round((raiz.scrollTop + raiz.clientHeight / 3) / altura + 0.5)))
  }, [base, escala, onPaginaAtual])

  /* ---------- trecho de texto ---------- */

  const capturarTexto = () => {
    if (!podeMarcar) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    const paginaDe = (n: Node) => (n.nodeType === Node.TEXT_NODE ? n.parentElement : (n as Element))?.closest<HTMLElement>('[data-pagina]') ?? null
    const ini = paginaDe(range.startContainer)
    const fim = paginaDe(range.endContainer)
    if (!ini || !raizRef.current?.contains(ini)) return
    if (ini !== fim) {
      onAviso('Selecione um trecho dentro de uma única página.')
      return
    }
    const texto = sel.toString().replace(/\s+/g, ' ').trim()
    if (!texto) return
    const caixa = ini.getBoundingClientRect()
    const porPonto = PX_POR_PONTO * escala
    const larguraPt = caixa.width / porPonto
    const alturaPt = caixa.height / porPonto
    const lidos = Array.from(range.getClientRects()).filter((r) => r.width >= 1 && r.height >= 2 && r.height < caixa.height * 0.2)
    const rects: RetanguloPdf[] = []
    for (const r of lidos) {
      const novo = {
        x1: (r.left - caixa.left) / porPonto,
        y1: (r.top - caixa.top) / porPonto,
        x2: (r.right - caixa.left) / porPonto,
        y2: (r.bottom - caixa.top) / porPonto,
        width: larguraPt,
        height: alturaPt,
      }
      // descarta retângulos repetidos (o navegador devolve o da linha e o do trecho)
      if (!rects.some((o) => Math.abs(o.x1 - novo.x1) < 1 && Math.abs(o.x2 - novo.x2) < 1 && Math.abs(o.y1 - novo.y1) < 1 && Math.abs(o.y2 - novo.y2) < 1)) rects.push(novo)
    }
    if (rects.length === 0) return
    const pageNumber = Number(ini.dataset.pagina)
    const completos = rects.slice(0, 200).map((r) => ({ ...r, pageNumber }))
    onAviso(undefined)
    // solta a seleção do navegador: a marcação provisória a substitui e o formulário não reabre sozinho
    sel.removeAllRanges()
    onSelecionar({ posicao: { pageNumber, rects: completos, boundingRect: uniao(completos) }, texto })
  }

  /* ---------- área (figuras, PDF digitalizado) ---------- */

  const pontoNaPagina = (e: ReactPointerEvent, el: HTMLElement) => {
    const c = el.getBoundingClientRect()
    const porPonto = PX_POR_PONTO * escala
    return { x: Math.min(Math.max((e.clientX - c.left) / porPonto, 0), c.width / porPonto), y: Math.min(Math.max((e.clientY - c.top) / porPonto, 0), c.height / porPonto), w: c.width / porPonto, h: c.height / porPonto }
  }

  const aoPressionar = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!podeMarcar || e.button !== 0 || !e.altKey) return
    const el = (e.target as Element).closest<HTMLElement>('[data-pagina]')
    if (!el) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = pontoNaPagina(e, el)
    arrasto.current = { pagina: Number(el.dataset.pagina), el, x0: p.x, y0: p.y }
    setArea(null)
  }
  const aoMover = (e: ReactPointerEvent<HTMLDivElement>) => {
    const a = arrasto.current
    if (!a) return
    const p = pontoNaPagina(e, a.el)
    setArea({ pagina: a.pagina, rect: { x1: Math.min(a.x0, p.x), y1: Math.min(a.y0, p.y), x2: Math.max(a.x0, p.x), y2: Math.max(a.y0, p.y), width: p.w, height: p.h, pageNumber: a.pagina } })
  }
  const aoSoltar = (e: ReactPointerEvent<HTMLDivElement>) => {
    const a = arrasto.current
    arrasto.current = null
    if (!a) return
    const p = pontoNaPagina(e, a.el)
    setArea(null)
    const rect: RetanguloPdf = { x1: Math.min(a.x0, p.x), y1: Math.min(a.y0, p.y), x2: Math.max(a.x0, p.x), y2: Math.max(a.y0, p.y), width: p.w, height: p.h, pageNumber: a.pagina }
    // clique solto, sem arrastar, não é uma área
    if (rect.x2 - rect.x1 < 8 || rect.y2 - rect.y1 < 8) return
    onAviso(undefined)
    onSelecionar({ posicao: { pageNumber: a.pagina, rects: [rect], boundingRect: rect }, imagem: recortar(a.el, rect) })
  }

  /* ---------- clique no trecho destacado ---------- */

  /** Comentário cujo trecho está sob o ponteiro (qualquer parte do trecho, não só o número). */
  const destaqueEm = (alvo: EventTarget, clientX: number, clientY: number): string | undefined => {
    const pagina = (alvo as Element).closest?.<HTMLElement>('[data-pagina]')
    if (!pagina) return undefined
    const caixa = pagina.getBoundingClientRect()
    const porPonto = PX_POR_PONTO * escala
    const x = (clientX - caixa.left) / porPonto
    const y = (clientY - caixa.top) / porPonto
    const larguraPt = caixa.width / porPonto
    const alturaPt = caixa.height / porPonto
    return destaques.find(
      (d) =>
        d.pagina === Number(pagina.dataset.pagina) &&
        d.rects.some((r) => {
          const sx = larguraPt / (r.width || larguraPt)
          const sy = alturaPt / (r.height || alturaPt)
          return x >= r.x1 * sx && x <= r.x2 * sx && y >= r.y1 * sy && y <= r.y2 * sy
        }),
    )?.id
  }
  const aoPassar = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (arrasto.current) return
    const id = destaqueEm(e.target, e.clientX, e.clientY)
    setSobre((atual) => (atual === id ? atual : id))
  }
  const aoClicar = (e: ReactMouseEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('button')) return // o número do comentário trata o próprio clique
    if (descida.current && Math.hypot(e.clientX - descida.current.x, e.clientY - descida.current.y) > 4) return
    const sel = window.getSelection()
    if (sel && !sel.isCollapsed) return // arrastar para selecionar texto não é clique
    const id = destaqueEm(e.target, e.clientX, e.clientY)
    if (id) onClicarDestaque(id)
  }

  const porPagina = (n: number) => destaques.filter((d) => d.pagina === n)

  if (erro) return <div className="p-6"><ErrorState message="Não foi possível abrir este PDF." /></div>
  if (!doc || !base) return <div className="p-6"><LoadingState label="Abrindo o PDF…" /></div>

  const paginas = Array.from({ length: doc.numPages }, (_, i) => i + 1)
  return (
    <div
      ref={raizRef}
      role="region"
      aria-label="Documento em PDF"
      tabIndex={0}
      onScroll={aoRolar}
      onMouseUp={capturarTexto}
      onMouseDown={(e) => {
        descida.current = { x: e.clientX, y: e.clientY }
      }}
      onMouseMove={aoPassar}
      onMouseLeave={() => setSobre(undefined)}
      onClick={aoClicar}
      onTouchEnd={() => window.setTimeout(capturarTexto, 300)}
      onPointerDown={aoPressionar}
      onPointerMove={aoMover}
      onPointerUp={aoSoltar}
      onPointerCancel={() => {
        arrasto.current = null
        setArea(null)
      }}
      className={`${alturaClasse} relative overflow-auto bg-surface-muted p-3 ${sobre ? '[&_.textLayer_span]:cursor-pointer!' : ''}`}
    >
      <div style={{ width: base.w * PX_POR_PONTO * escala, minWidth: '100%' }} className="mx-auto">
        {paginas.map((n) => (
          <PaginaPdf
            key={n}
            doc={doc}
            numero={n}
            escala={escala}
            base={base}
            raiz={raizRef}
            destaques={porPagina(n)}
            pendente={pendente && pendente.pageNumber === n ? pendente.rects : null}
            area={area && area.pagina === n ? area : null}
            ativa={ativa}
            sobre={sobre}
            onClicarDestaque={onClicarDestaque}
          />
        ))}
      </div>
    </div>
  )
}

function uniao(rects: RetanguloPdf[]): RetanguloPdf {
  const r0 = rects[0]
  return {
    x1: Math.min(...rects.map((r) => r.x1)),
    y1: Math.min(...rects.map((r) => r.y1)),
    x2: Math.max(...rects.map((r) => r.x2)),
    y2: Math.max(...rects.map((r) => r.y2)),
    width: r0.width,
    height: r0.height,
    pageNumber: r0.pageNumber,
  }
}

/** Recorta da imagem da página (já desenhada) a área marcada, em JPEG reduzido para caber no limite da API. */
function recortar(pagina: HTMLElement, r: RetanguloPdf): string | undefined {
  const origem = pagina.querySelector('canvas')
  if (!origem || origem.width === 0) return undefined
  const fx = origem.width / r.width
  const fy = origem.height / r.height
  const sw = Math.max(1, Math.round((r.x2 - r.x1) * fx))
  const sh = Math.max(1, Math.round((r.y2 - r.y1) * fy))
  const reducao = Math.min(1, 560 / sw)
  const destino = document.createElement('canvas')
  destino.width = Math.max(1, Math.round(sw * reducao))
  destino.height = Math.max(1, Math.round(sh * reducao))
  const ctx = destino.getContext('2d')
  if (!ctx) return undefined
  ctx.drawImage(origem, Math.round(r.x1 * fx), Math.round(r.y1 * fy), sw, sh, 0, 0, destino.width, destino.height)
  return destino.toDataURL('image/jpeg', 0.8)
}
