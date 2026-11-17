/** Espaço ou caractere de controle em qualquer posição (o parser de URL os removeria em silêncio). */
const temEspacoOuControle = (v: string) => Array.from(v).some((c) => c <= ' ' || c === '\u007f' || /\s/.test(c))

/**
 * Link de sala virtual: só http(s), sem espaços ou caracteres de controle e sem usuário/senha embutidos
 * (`https://sala.unb.br@outro.site` pareceria um endereço da UnB). Devolve o endereço normalizado ou `undefined`.
 */
export function linkWebSeguro(valor: string | undefined | null): string | undefined {
  const v = (valor ?? '').trim()
  if (!v || v.length > 300 || temEspacoOuControle(v) || !/^https?:\/\//i.test(v)) return undefined
  try {
    const u = new URL(v)
    if ((u.protocol !== 'https:' && u.protocol !== 'http:') || u.username || u.password || !u.hostname) return undefined
    return u.href
  } catch {
    return undefined
  }
}
