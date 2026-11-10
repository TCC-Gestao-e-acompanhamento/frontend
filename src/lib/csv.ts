/** CSV para planilhas em pt-BR (separador ";" e BOM para o Excel reconhecer acentos). */
function celula(v: string): string {
  let limpo = v.replace(/[\r\n]+/g, ' ')
  // Planilhas executam células que começam com = + - @ (injeção de fórmula): neutraliza com apóstrofo.
  if (/^[=+\-@\t]/.test(limpo)) limpo = `'${limpo}`
  return /[;"]/.test(limpo) ? `"${limpo.replace(/"/g, '""')}"` : limpo
}

export function buildCsv(linhas: string[][]): string {
  return '\uFEFF' + linhas.map((l) => l.map(celula).join(';')).join('\r\n') + '\r\n'
}

export function baixarCsv(nome: string, conteudo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
