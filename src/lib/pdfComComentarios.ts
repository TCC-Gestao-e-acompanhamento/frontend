import { BlendMode, PDFDocument, PDFHexString, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { Anotacao } from '../types'
import { formatDate } from './format'

const COR = {
  comentario: rgb(0.12, 0.35, 0.6),
  correcao: rgb(0.71, 0.33, 0.04),
  resolvida: rgb(0.33, 0.38, 0.44),
}
const corDe = (a: Anotacao) => (a.resolvida ? COR.resolvida : a.tipo === 'correcao' ? COR.correcao : COR.comentario)
const rotuloTipo = (a: Anotacao) => (a.tipo === 'correcao' ? 'Correção' : 'Comentário')

/** Quebra o texto em linhas que cabem em `largura`, medindo com a própria fonte. */
function quebrar(texto: string, fonte: PDFFont, tamanho: number, largura: number): string[] {
  const linhas: string[] = []
  for (const paragrafo of texto.split(/\r?\n/)) {
    let atual = ''
    for (const palavra of paragrafo.split(' ')) {
      let resto = palavra
      // palavra maior que a linha (endereço, sequência sem espaços): corta nos caracteres
      while (fonte.widthOfTextAtSize(resto, tamanho) > largura && resto.length > 1) {
        let n = resto.length - 1
        while (n > 1 && fonte.widthOfTextAtSize(resto.slice(0, n), tamanho) > largura) n--
        if (atual) {
          linhas.push(atual)
          atual = ''
        }
        linhas.push(resto.slice(0, n))
        resto = resto.slice(n)
      }
      const tentativa = atual ? `${atual} ${resto}` : resto
      if (atual && fonte.widthOfTextAtSize(tentativa, tamanho) > largura) {
        linhas.push(atual)
        atual = resto
      } else {
        atual = tentativa
      }
    }
    linhas.push(atual)
  }
  return linhas
}

/**
 * Gera uma cópia do PDF com os comentários:
 *  - cada trecho comentado fica destacado e ganha um número na margem esquerda;
 *  - cada comentário vira uma nota do próprio PDF (anotação "Text") na margem direita, com autor, texto e respostas;
 *  - uma página final lista todos os comentários e respostas, para quem imprime ou abre num leitor sem notas.
 * O arquivo original não é alterado.
 */
export async function gerarPdfComComentarios(url: string, anotacoes: Anotacao[]): Promise<Blob> {
  let resposta: Response
  try {
    resposta = await fetch(url)
  } catch {
    throw new Error('Não foi possível ler o arquivo original.')
  }
  if (!resposta.ok) throw new Error('Não foi possível ler o arquivo original.')
  let doc: PDFDocument
  try {
    doc = await PDFDocument.load(await resposta.arrayBuffer())
  } catch {
    throw new Error('Este PDF está protegido ou danificado e não pode receber os comentários. Baixe a versão sem comentários.')
  }
  const fonte = await doc.embedFont(StandardFonts.Helvetica)
  const negrito = await doc.embedFont(StandardFonts.HelveticaBold)
  const italico = await doc.embedFont(StandardFonts.HelveticaOblique)
  // as fontes padrão só têm os caracteres do alfabeto latino: o resto vira "?" em vez de quebrar a geração
  const suportados = new Set(fonte.getCharacterSet())
  const limpar = (t: string) => Array.from(t.replace(/\t/g, ' ')).map((c) => (c === '\n' || c === '\r' || suportados.has(c.codePointAt(0) ?? 0) ? c : '?')).join('')

  const paginas = doc.getPages()
  const numerados = anotacoes.map((a, i) => ({ a, n: i + 1 }))

  for (const { a, n } of numerados) {
    const p = a.posicaoPdf
    const pagina: PDFPage | undefined = p && paginas[p.pageNumber - 1]
    if (!p || !pagina || p.rects.length === 0) continue
    const cor = corDe(a)
    // O leitor (pdf.js) mede a página como o usuário a vê: área visível (CropBox), já girada, de cima para baixo.
    // Aqui os pontos voltam para o espaço da página do arquivo (origem embaixo à esquerda, sem giro).
    const vis = pagina.getCropBox()
    const rot = (((pagina.getRotation().angle % 360) + 360) % 360) as 0 | 90 | 180 | 270
    const largV = rot % 180 === 0 ? vis.width : vis.height
    const altV = rot % 180 === 0 ? vis.height : vis.width
    const paraArquivo = (xv: number, yv: number) => {
      if (rot === 90) return { x: vis.x + yv, y: vis.y + xv }
      if (rot === 180) return { x: vis.x + vis.width - xv, y: vis.y + yv }
      if (rot === 270) return { x: vis.x + vis.width - yv, y: vis.y + vis.height - xv }
      return { x: vis.x + xv, y: vis.y + vis.height - yv }
    }
    const caixa = (r: (typeof p.rects)[number]) => {
      const sx = largV / (r.width || largV)
      const sy = altV / (r.height || altV)
      const a1 = paraArquivo(r.x1 * sx, r.y1 * sy)
      const a2 = paraArquivo(r.x2 * sx, r.y2 * sy)
      return { x: Math.min(a1.x, a2.x), y: Math.min(a1.y, a2.y), width: Math.abs(a2.x - a1.x), height: Math.abs(a2.y - a1.y) }
    }
    for (const r of p.rects) {
      pagina.drawRectangle({
        ...caixa(r),
        color: cor,
        opacity: a.imagem ? 0.1 : 0.28,
        blendMode: BlendMode.Multiply,
        ...(a.imagem ? { borderColor: cor, borderWidth: 1.5, borderOpacity: 0.9 } : {}),
      })
    }
    // altura do trecho no espaço do leitor (de cima para baixo), limitada à página
    const meioV = Math.min(Math.max(((p.rects[0].y1 + p.rects[0].y2) / 2) * (altV / (p.rects[0].height || altV)), 14), altV - 14)
    const margemEsq = paraArquivo(14, meioV)
    const margemDir = paraArquivo(largV - 18, meioV)

    // O número na margem só entra em página sem giro: texto escrito numa página girada sairia de lado.
    if (rot === 0) {
      pagina.drawCircle({ x: margemEsq.x, y: margemEsq.y, size: 8.5, color: cor })
      const texto = String(n)
      pagina.drawText(texto, { x: margemEsq.x - negrito.widthOfTextAtSize(texto, 8) / 2, y: margemEsq.y - 2.8, size: 8, font: negrito, color: rgb(1, 1, 1) })
    }

    const respostas = a.respostas.map((r) => `\n- ${r.autorNome}: ${r.texto}`).join('')
    const conteudo = `${n}. ${rotuloTipo(a)} (${a.resolvida ? 'resolvido' : 'aberto'})${a.trecho ? `\nTrecho: ${a.trecho}` : ''}\n\n${a.texto}${respostas ? `\n\nRespostas:${respostas}` : ''}`
    const nota = doc.context.obj({
      Type: 'Annot',
      Subtype: 'Text',
      Rect: [margemDir.x - 10, margemDir.y - 10, margemDir.x + 10, margemDir.y + 10],
      Contents: PDFHexString.fromText(conteudo),
      T: PDFHexString.fromText(a.autorNome),
      Name: 'Comment',
      C: [cor.red, cor.green, cor.blue],
      F: 4, // imprime junto com a página
      Open: false,
    })
    pagina.node.addAnnot(doc.context.register(nota))
  }

  // página final com todos os comentários
  const LARG = 595.28
  const ALT = 841.89
  const MARGEM = 56
  const COL = LARG - MARGEM * 2
  let pg = doc.addPage([LARG, ALT])
  let y = ALT - MARGEM
  const linha = (t: string, f: PDFFont, tam: number, cor = rgb(0.09, 0.13, 0.18), recuo = 0, entre = 3) => {
    if (!t) return
    for (const l of quebrar(limpar(t), f, tam, COL - recuo)) {
      if (y < MARGEM + tam) {
        pg = doc.addPage([LARG, ALT])
        y = ALT - MARGEM
      }
      pg.drawText(l, { x: MARGEM + recuo, y: y - tam, size: tam, font: f, color: cor })
      y -= tam + entre
    }
  }
  linha('Comentários do documento', negrito, 16, rgb(0, 0.2, 0.4), 0, 6)
  linha(numerados.length === 0 ? 'Este documento ainda não tem comentários.' : `${numerados.length} ${numerados.length === 1 ? 'comentário' : 'comentários'}, na ordem em que aparecem no documento.`, fonte, 10, rgb(0.33, 0.38, 0.44), 0, 14)
  for (const { a, n } of numerados) {
    y -= 6
    linha(`${n}  ${rotuloTipo(a)} · ${a.resolvida ? 'Resolvido' : 'Aberto'}${a.posicaoPdf ? ` · página ${a.posicaoPdf.pageNumber}` : ''}`, negrito, 11, corDe(a))
    linha(a.imagem ? 'Área marcada na página.' : a.trecho ? `“${a.trecho}”` : '', italico, 10, rgb(0.33, 0.38, 0.44), 8)
    linha(a.texto, fonte, 11, undefined, 8)
    linha(`${a.autorNome} · ${formatDate(a.criadaEm)}`, fonte, 9, rgb(0.33, 0.38, 0.44), 8, 5)
    for (const r of a.respostas) {
      linha(r.texto, fonte, 10, undefined, 22)
      linha(`${r.autorNome} · ${formatDate(r.data)}`, fonte, 9, rgb(0.33, 0.38, 0.44), 22, 5)
    }
    y -= 8
  }
  const bytes = await doc.save()
  return new Blob([bytes as BlobPart], { type: 'application/pdf' })
}
