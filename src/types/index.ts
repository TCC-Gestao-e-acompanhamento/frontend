export type Role = 'aluno' | 'orientador' | 'coordenacao'

export interface User {
  id: string
  nome: string
  email: string
  role: Role
  matricula?: string
  cursoId?: string
}

export type Fase = 'TCC1' | 'TCC2'
export type TccStatus = 'em_andamento' | 'atencao' | 'atrasado' | 'concluido'
export type AtividadeStatus = 'pendente' | 'em_andamento' | 'concluida' | 'atrasada'
export type DocumentoStatus = 'enviado' | 'em_analise' | 'correcao' | 'aprovado'
export type BancaSituacao = 'a_definir' | 'agendada' | 'realizada'
export type FeedbackTipo = 'comentario' | 'correcao'

/** Registro "cru", como viria do banco. */
export interface TccRecord {
  id: string
  titulo: string
  alunoId: string
  orientadorId: string
  semestre: string
  /** Índice da etapa atual no ciclo completo (0-7). */
  etapaIndex: number
}

export interface Etapa {
  nome: string
  fase: Fase
  situacao: 'concluida' | 'atual' | 'futura'
}

/** Visão calculada de um TCC (campos derivados pelo "backend"). */
export interface Tcc {
  id: string
  titulo: string
  semestre: string
  aluno: User
  orientador: User
  fase: Fase
  etapaAtual: string
  etapas: Etapa[]
  progresso: number
  status: TccStatus
  pendencias: number
}

export interface Atividade {
  id: string
  tccId: string
  titulo: string
  prazo: string
  status: AtividadeStatus
  tipo: 'entrega' | 'reuniao' | 'marco'
  alunoNome: string
}

export interface Documento {
  id: string
  tccId: string
  nome: string
  versao: number
  tipo: string
  enviadoEm: string
  status: DocumentoStatus
  alunoNome: string
}

export interface Feedback {
  id: string
  tccId: string
  documentoNome?: string
  autorNome: string
  data: string
  texto: string
  tipo: FeedbackTipo
  resolvido: boolean
  alunoNome: string
}

export interface MembroBanca {
  nome: string
  papel: string
  instituicao: string
}

export interface Banca {
  id: string
  tccId: string
  tccTitulo: string
  alunoNome: string
  situacao: BancaSituacao
  data?: string
  local?: string
  membros: MembroBanca[]
}

export interface PrazoInstitucional {
  id: string
  titulo: string
  data: string
  fase: Fase
}

export interface NovoDocumento {
  tccId: string
  nome: string
  tipo: string
  arquivo: string
}

export interface NovoFeedback {
  tccId: string
  texto: string
  tipo: FeedbackTipo
}

/* ---------- Módulo de busca e solicitação de orientação ---------- */

export interface Curso {
  id: string
  nome: string
}

export interface AreaOrientacao {
  id: string
  nome: string
}

/** Somente dados autorizados para divulgação pública (sem e-mail ou dados internos). */
export interface ProfessorPublico {
  id: string
  nome: string
  cursos: Curso[]
  areas: AreaOrientacao[]
  apresentacao?: string
  aceitandoSolicitacoes: boolean
}

export interface PerfilPublicoInput {
  apresentacao: string
  cursoIds: string[]
  /** Nomes; áreas novas são criadas no catálogo (não ficam fixas no código). */
  areas: string[]
  aceitandoSolicitacoes: boolean
}

export type SolicitacaoStatus = 'pendente' | 'aceita' | 'recusada' | 'cancelada'

export interface EventoSolicitacao {
  data: string
  descricao: string
}

export interface Solicitacao {
  id: string
  professorId: string
  professorNome: string
  alunoId: string
  alunoNome: string
  alunoCurso: string
  titulo: string
  area: string
  descricao: string
  mensagem?: string
  status: SolicitacaoStatus
  enviadaEm: string
  respondidaEm?: string
  resposta?: string
  historico: EventoSolicitacao[]
}

export interface NovaSolicitacao {
  professorId: string
  titulo: string
  area: string
  descricao: string
  mensagem?: string
}
