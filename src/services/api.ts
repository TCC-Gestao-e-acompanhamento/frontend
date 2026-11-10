/**
 * API SIMULADA. Cada função representa um endpoint futuro do backend NestJS.
 * As verificações de permissão aqui imitam o que o backend fará de verdade:
 * esconder um item na interface NÃO substitui a validação no servidor.
 *
 * Estados de tela simulados via query string: ?mock=loading | error | empty
 */
import {
  addDays,
  areas,
  atividades,
  bancas,
  cursos,
  documentos,
  feedbacks,
  perfisProfessores,
  prazosInstitucionais,
  solicitacoes,
  tccs,
  users,
  type PerfilProfessorRecord,
  type SolicitacaoRecord,
} from '../mocks/data'
import { daysUntil } from '../lib/format'
import type {
  AreaOrientacao,
  Atividade,
  Banca,
  Curso,
  Documento,
  Etapa,
  Feedback,
  NovaSolicitacao,
  NovoDocumento,
  NovoFeedback,
  PerfilPublicoInput,
  ProfessorPublico,
  Solicitacao,
  PrazoInstitucional,
  Tcc,
  TccRecord,
  TccStatus,
  User,
} from '../types'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const ETAPAS: Array<Pick<Etapa, 'nome' | 'fase'>> = [
  { nome: 'Definição do tema e do orientador', fase: 'TCC1' },
  { nome: 'Projeto de pesquisa', fase: 'TCC1' },
  { nome: 'Revisão bibliográfica', fase: 'TCC1' },
  { nome: 'Entrega do projeto final do TCC 1', fase: 'TCC1' },
  { nome: 'Desenvolvimento do trabalho', fase: 'TCC2' },
  { nome: 'Redação da monografia', fase: 'TCC2' },
  { nome: 'Entrega da versão para a banca', fase: 'TCC2' },
  { nome: 'Defesa e versão final', fase: 'TCC2' },
]

function mockMode(): string | null {
  return new URLSearchParams(window.location.search).get('mock')
}

function settle<T>(data: T, empty: T): Promise<T> {
  const mode = mockMode()
  if (mode === 'loading') return new Promise<T>(() => {})
  if (mode === 'error') {
    return new Promise<T>((_, reject) =>
      setTimeout(() => reject(new ApiError('O servidor não respondeu (erro simulado).', 500)), 400),
    )
  }
  return new Promise<T>((resolve) => setTimeout(() => resolve(mode === 'empty' ? empty : data), 350))
}

const userById = (id: string): User => {
  const u = users.find((x) => x.id === id)
  if (!u) throw new ApiError('Usuário não encontrado', 404)
  return u
}

function buildTcc(r: TccRecord): Tcc {
  const atvs = atividades.filter((a) => a.tccId === r.id)
  const etapas: Etapa[] = ETAPAS.map((e, i) => ({
    ...e,
    situacao: i < r.etapaIndex ? 'concluida' : i === r.etapaIndex ? 'atual' : 'futura',
  }))
  const pendencias = atvs.filter((a) => a.status === 'pendente' || a.status === 'atrasada').length
  let status: TccStatus = 'em_andamento'
  if (atvs.some((a) => a.status === 'atrasada')) status = 'atrasado'
  else if (atvs.some((a) => a.status === 'pendente' && daysUntil(a.prazo) <= 7)) status = 'atencao'
  return {
    id: r.id,
    titulo: r.titulo,
    semestre: r.semestre,
    aluno: userById(r.alunoId),
    orientador: userById(r.orientadorId),
    fase: ETAPAS[r.etapaIndex].fase,
    etapaAtual: ETAPAS[r.etapaIndex].nome,
    etapas,
    progresso: Math.round((r.etapaIndex / ETAPAS.length) * 100),
    status,
    pendencias,
  }
}

/** Registros de TCC que o usuário tem permissão de enxergar. */
function scope(user: User): TccRecord[] {
  if (user.role === 'aluno') return tccs.filter((t) => t.alunoId === user.id)
  if (user.role === 'orientador') return tccs.filter((t) => t.orientadorId === user.id)
  return tccs
}

function assertAccess(user: User, tccId: string): TccRecord {
  const rec = tccs.find((t) => t.id === tccId)
  if (!rec) throw new ApiError('TCC não encontrado', 404)
  if (!scope(user).includes(rec)) throw new ApiError('Você não tem permissão para acessar este TCC', 403)
  return rec
}

const aluno = (tccId: string) => userById(tccs.find((t) => t.id === tccId)!.alunoId).nome

/* ----------------------------- Públicos ----------------------------- */

export interface IndicadoresPublicos {
  semestre: string
  totalTccs: number
  tcc1: number
  tcc2: number
  defesasAgendadas: number
  defesasRealizadas: number
}

export function getIndicadoresPublicos(): Promise<IndicadoresPublicos> {
  const all = tccs.map(buildTcc)
  const data: IndicadoresPublicos = {
    semestre: '2026/2',
    totalTccs: all.length,
    tcc1: all.filter((t) => t.fase === 'TCC1').length,
    tcc2: all.filter((t) => t.fase === 'TCC2').length,
    defesasAgendadas: bancas.filter((b) => b.situacao === 'agendada').length,
    defesasRealizadas: bancas.filter((b) => b.situacao === 'realizada').length,
  }
  return settle(data, { ...data, totalTccs: 0, tcc1: 0, tcc2: 0, defesasAgendadas: 0, defesasRealizadas: 0 })
}

function toBanca(b: (typeof bancas)[number]): Banca {
  const rec = b.tccId ? tccs.find((t) => t.id === b.tccId) : undefined
  return {
    id: b.id,
    tccId: b.tccId ?? '',
    tccTitulo: rec?.titulo ?? b.tituloExterno ?? '',
    alunoNome: rec ? userById(rec.alunoId).nome : (b.alunoExterno ?? ''),
    situacao: b.situacao,
    data: b.data,
    local: b.local,
    membros: b.membros,
  }
}

/** Somente defesas com data definida (agendadas ou realizadas) são públicas. */
export function listBancasPublicas(): Promise<Banca[]> {
  const data = bancas
    .filter((b) => b.situacao !== 'a_definir')
    .map(toBanca)
    .sort((a, b) => (a.data ?? '').localeCompare(b.data ?? ''))
  return settle(data, [])
}

export function listPrazosInstitucionais(): Promise<PrazoInstitucional[]> {
  return settle(prazosInstitucionais, [])
}

/* ----------------------------- Autenticados ----------------------------- */

export function listTccs(user: User): Promise<Tcc[]> {
  return settle(scope(user).map(buildTcc), [])
}

export function getTcc(user: User, id: string): Promise<Tcc> {
  return settle(buildTcc(assertAccess(user, id)), buildTcc(assertAccess(user, id)))
}

export function listAtividades(user: User, tccId?: string): Promise<Atividade[]> {
  const ids = new Set(scope(user).map((t) => t.id))
  if (tccId) assertAccess(user, tccId)
  const data = atividades
    .filter((a) => ids.has(a.tccId) && (!tccId || a.tccId === tccId))
    .map((a) => ({ ...a, alunoNome: aluno(a.tccId) }))
    .sort((a, b) => a.prazo.localeCompare(b.prazo))
  return settle(data, [])
}

export function listDocumentos(user: User, tccId?: string): Promise<Documento[]> {
  const ids = new Set(scope(user).map((t) => t.id))
  if (tccId) assertAccess(user, tccId)
  const data = documentos
    .filter((d) => ids.has(d.tccId) && (!tccId || d.tccId === tccId))
    .map((d) => ({ ...d, alunoNome: aluno(d.tccId) }))
    .sort((a, b) => b.enviadoEm.localeCompare(a.enviadoEm))
  return settle(data, [])
}

export async function sendDocumento(user: User, input: NovoDocumento): Promise<Documento> {
  if (user.role !== 'aluno') throw new ApiError('Somente o aluno envia documentos nesta versão', 403)
  assertAccess(user, input.tccId)
  const versao = documentos.filter((d) => d.tccId === input.tccId && d.nome === input.nome).length + 1
  const rec = {
    id: `d${Date.now()}`,
    tccId: input.tccId,
    nome: input.nome,
    versao,
    tipo: input.tipo,
    enviadoEm: addDays(0),
    status: 'enviado' as const,
  }
  documentos.push(rec)
  await new Promise((r) => setTimeout(r, 500))
  return { ...rec, alunoNome: user.nome }
}

export function listFeedbacks(user: User, tccId?: string): Promise<Feedback[]> {
  const ids = new Set(scope(user).map((t) => t.id))
  if (tccId) assertAccess(user, tccId)
  const data = feedbacks
    .filter((f) => ids.has(f.tccId) && (!tccId || f.tccId === tccId))
    .map((f) => ({
      id: f.id,
      tccId: f.tccId,
      documentoNome: f.documentoId
        ? (() => {
            const d = documentos.find((x) => x.id === f.documentoId)
            return d ? `${d.nome} v${d.versao}` : undefined
          })()
        : undefined,
      autorNome: userById(f.autorId).nome,
      data: f.data,
      texto: f.texto,
      tipo: f.tipo,
      resolvido: f.resolvido,
      alunoNome: aluno(f.tccId),
    }))
    .sort((a, b) => b.data.localeCompare(a.data))
  return settle(data, [])
}

export async function addFeedback(user: User, input: NovoFeedback): Promise<void> {
  if (user.role !== 'orientador') throw new ApiError('Somente o orientador registra feedbacks', 403)
  assertAccess(user, input.tccId)
  feedbacks.push({
    id: `f${Date.now()}`,
    tccId: input.tccId,
    autorId: user.id,
    data: addDays(0),
    texto: input.texto,
    tipo: input.tipo,
    resolvido: input.tipo === 'comentario',
  })
  await new Promise((r) => setTimeout(r, 400))
}

export function listBancas(user: User): Promise<Banca[]> {
  const ids = new Set(scope(user).map((t) => t.id))
  const data = bancas
    .filter((b) => b.tccId && ids.has(b.tccId))
    .map(toBanca)
  return settle(data, [])
}

/* ------------------- Busca e solicitação de orientação ------------------- */

const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms))

function toProfessor(r: PerfilProfessorRecord): ProfessorPublico {
  return {
    id: r.id,
    nome: userById(r.id).nome,
    cursos: cursos.filter((c) => r.cursoIds.includes(c.id)),
    areas: areas.filter((a) => r.areaIds.includes(a.id)),
    apresentacao: r.apresentacao || undefined,
    aceitandoSolicitacoes: r.aceitandoSolicitacoes,
  }
}

export function listCursos(): Promise<Curso[]> {
  return settle([...cursos], [])
}

export function listAreas(): Promise<AreaOrientacao[]> {
  return settle([...areas], [])
}

/** Público: somente campos autorizados para divulgação (sem e-mail ou dados internos). */
export function listProfessoresPublicos(): Promise<ProfessorPublico[]> {
  const data = perfisProfessores.map(toProfessor).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  return settle(data, [])
}

export function getProfessorPublico(id: string): Promise<ProfessorPublico> {
  const rec = perfisProfessores.find((p) => p.id === id)
  if (!rec) return Promise.reject(new ApiError('Professor não encontrado', 404))
  return settle(toProfessor(rec), toProfessor(rec))
}

function perfilDoOrientador(user: User): PerfilProfessorRecord {
  if (user.role !== 'orientador') throw new ApiError('Apenas orientadores gerenciam o perfil público', 403)
  let rec = perfisProfessores.find((p) => p.id === user.id)
  if (!rec) {
    rec = { id: user.id, cursoIds: [], areaIds: [], aceitandoSolicitacoes: false }
    perfisProfessores.push(rec)
  }
  return rec
}

export function getMeuPerfil(user: User): Promise<ProfessorPublico> {
  return settle(toProfessor(perfilDoOrientador(user)), toProfessor(perfilDoOrientador(user)))
}

export async function saveMeuPerfil(user: User, input: PerfilPublicoInput): Promise<ProfessorPublico> {
  const rec = perfilDoOrientador(user)
  const areaIds = input.areas.map((nome) => {
    const n = nome.trim()
    const found = areas.find((a) => a.nome.toLowerCase() === n.toLowerCase())
    if (found) return found.id
    const nova = { id: `ar${Date.now()}${areas.length}`, nome: n }
    areas.push(nova)
    return nova.id
  })
  rec.apresentacao = input.apresentacao.trim() || undefined
  rec.cursoIds = [...input.cursoIds]
  rec.areaIds = [...new Set(areaIds)]
  rec.aceitandoSolicitacoes = input.aceitandoSolicitacoes
  await wait()
  return toProfessor(rec)
}

function toSolicitacao(r: SolicitacaoRecord): Solicitacao {
  const aluno = userById(r.alunoId)
  const historico = [{ data: r.enviadaEm, descricao: 'Solicitação enviada pelo aluno' }]
  if (r.respondidaEm) {
    const desc = { aceita: 'Aceita pelo professor', recusada: 'Recusada pelo professor', cancelada: 'Cancelada pelo aluno', pendente: '' }[r.status]
    historico.push({ data: r.respondidaEm, descricao: desc })
  }
  return {
    id: r.id,
    professorId: r.professorId,
    professorNome: userById(r.professorId).nome,
    alunoId: r.alunoId,
    alunoNome: aluno.nome,
    alunoCurso: cursos.find((c) => c.id === aluno.cursoId)?.nome ?? 'Curso não informado',
    titulo: r.titulo,
    area: r.area,
    descricao: r.descricao,
    mensagem: r.mensagem,
    status: r.status,
    enviadaEm: r.enviadaEm,
    respondidaEm: r.respondidaEm,
    resposta: r.resposta,
    historico,
  }
}

function assertSolicitacaoParty(user: User, id: string): SolicitacaoRecord {
  const rec = solicitacoes.find((s) => s.id === id)
  if (!rec) throw new ApiError('Solicitação não encontrada', 404)
  const ok =
    (user.role === 'aluno' && rec.alunoId === user.id) || (user.role === 'orientador' && rec.professorId === user.id)
  if (!ok) throw new ApiError('Você não tem permissão para acessar esta solicitação', 403)
  return rec
}

export function listSolicitacoes(user: User): Promise<Solicitacao[]> {
  if (user.role === 'coordenacao') return Promise.reject(new ApiError('Perfil sem acesso a solicitações', 403))
  const data = solicitacoes
    .filter((s) => (user.role === 'aluno' ? s.alunoId === user.id : s.professorId === user.id))
    .map(toSolicitacao)
    .sort((a, b) => b.enviadaEm.localeCompare(a.enviadaEm))
  return settle(data, [])
}

export function getSolicitacao(user: User, id: string): Promise<Solicitacao> {
  const rec = assertSolicitacaoParty(user, id)
  return settle(toSolicitacao(rec), toSolicitacao(rec))
}

export async function createSolicitacao(user: User, input: NovaSolicitacao): Promise<Solicitacao> {
  if (user.role !== 'aluno') throw new ApiError('Apenas alunos autenticados enviam solicitações', 403)
  const prof = perfisProfessores.find((p) => p.id === input.professorId)
  if (!prof) throw new ApiError('Professor não encontrado', 404)
  if (!prof.aceitandoSolicitacoes) throw new ApiError('Este professor não está recebendo novas solicitações no momento.', 409)
  if (solicitacoes.some((s) => s.alunoId === user.id && s.professorId === prof.id && s.status === 'pendente')) {
    throw new ApiError('Você já tem uma solicitação pendente para este professor.', 409)
  }
  const rec: SolicitacaoRecord = {
    id: `s${Date.now()}`,
    professorId: prof.id,
    alunoId: user.id,
    titulo: input.titulo.trim(),
    area: input.area,
    descricao: input.descricao.trim(),
    mensagem: input.mensagem?.trim() || undefined,
    status: 'pendente',
    enviadaEm: addDays(0),
  }
  solicitacoes.push(rec)
  await wait()
  return toSolicitacao(rec)
}

export async function cancelSolicitacao(user: User, id: string): Promise<void> {
  const rec = assertSolicitacaoParty(user, id)
  if (user.role !== 'aluno') throw new ApiError('Somente o aluno cancela a própria solicitação', 403)
  if (rec.status !== 'pendente') throw new ApiError('Apenas solicitações pendentes podem ser canceladas.', 409)
  rec.status = 'cancelada'
  rec.respondidaEm = addDays(0)
  await wait(300)
}

export async function responderSolicitacao(
  user: User,
  id: string,
  input: { decisao: 'aceita' | 'recusada'; texto?: string },
): Promise<void> {
  const rec = assertSolicitacaoParty(user, id)
  if (user.role !== 'orientador') throw new ApiError('Somente o professor destinatário responde', 403)
  if (rec.status !== 'pendente') throw new ApiError('Esta solicitação já foi respondida ou cancelada.', 409)
  rec.status = input.decisao
  rec.resposta = input.texto?.trim() || undefined
  rec.respondidaEm = addDays(0)
  await wait(300)
}
