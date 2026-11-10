/** E-mail institucional da UnB: termina em @unb.br ou em um subdomínio (@x.unb.br). A confirmar com a coordenação. */
export function emailUnbValido(email: string): boolean {
  return /^[^\s@]+@([a-z0-9-]+\.)*unb\.br$/i.test(email.trim())
}
