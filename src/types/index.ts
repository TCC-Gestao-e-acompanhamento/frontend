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
export type BancaSituacao = 'a_definir' | 'proposta' | 'agendada' | 'realizada'
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
  /** Comentários feitos em trechos do documento. */
  anotacoes?: { total: number; abertas: number }
  /** Correções gerais pedidas pelo orientador sobre este documento. */
  correcoesPendentes?: number
  /** Endereço do PDF para visualização (quando o arquivo enviado é um PDF). */
  arquivoUrl?: string
}

export interface Feedback {
  id: string
  tccId: string
  documentoId?: string
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
  /** Endereço do PDF enviado (no protótipo, um endereço local do navegador). */
  arquivoUrl?: string
}

export interface NovoFeedback {
  tccId: string
  /** Quando o retorno é sobre uma versão de documento. */
  documentoId?: string
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
  /** Semestre em que o aluno pretende fazer o TCC com o professor. Ex.: 2027/1 */
  semestre: string
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
  semestre: string
  descricao: string
  mensagem?: string
}

export interface EventoCalendario {
  id: string
  data: string
  titulo: string
  tipo: 'prazo' | 'defesa' | 'inscricao'
  fase?: Fase
  detalhe?: string
}

/* ---------- Inscrição no TCC ---------- */

export type PeriodoSituacao = 'antes' | 'aberto' | 'encerrado'

export interface PeriodoInscricao {
  semestre: string
  inicio: string
  fim: string
  situacao: PeriodoSituacao
}

export interface PeriodoInput {
  semestre: string
  inicio: string
  fim: string
}

/** sistema: o orientador está cadastrado e vê o aviso na própria área. email: aviso por e-mail (simulado). */
export type AvisoOrientador = 'sistema' | 'email'

export interface Inscricao {
  id: string
  semestre: string
  alunoId: string
  alunoNome: string
  matricula: string
  curso: string
  fase: Fase
  orientadorId?: string
  orientadorNome: string
  /** Só visível para a coordenação e para o próprio aluno. */
  orientadorEmail?: string
  avisoOrientador: AvisoOrientador
  ciente: boolean
  cienteEm?: string
  criadaEm: string
  atualizadaEm?: string
}

export interface NovaInscricao {
  fase: Fase
  /** Professor cadastrado na plataforma. Sem isso, informe nome e e-mail. */
  orientadorId?: string
  orientadorNome?: string
  orientadorEmail?: string
}

/* ---------- Registro de orientações e anotações em documentos ---------- */

export type FormatoOrientacao = 'presencial' | 'online'

export interface Orientacao {
  id: string
  tccId: string
  data: string
  formato: FormatoOrientacao
  resumo: string
  combinados?: string
  proximoEncontro?: string
  orientadorNome: string
}

export interface NovaOrientacao {
  tccId: string
  data: string
  formato: FormatoOrientacao
  resumo: string
  combinados?: string
  proximoEncontro?: string
}

export type EventoTempoTipo = 'reuniao' | 'documento' | 'feedback' | 'comentario'

/** Linha do tempo do TCC: reuniões, entregas, feedbacks e comentários em documentos. */
export interface EventoTempo {
  id: string
  tccId: string
  data: string
  tipo: EventoTempoTipo
  titulo: string
  detalhe?: string
  /** Para abrir o documento relacionado. */
  documentoId?: string
}

export interface RespostaAnotacao {
  id: string
  autorNome: string
  autorRole: Role
  texto: string
  data: string
}

export interface Anotacao {
  id: string
  documentoId: string
  paragrafo: number
  inicio: number
  fim: number
  trecho: string
  autorNome: string
  autorRole: Role
  tipo: FeedbackTipo
  texto: string
  criadaEm: string
  resolvida: boolean
  respostas: RespostaAnotacao[]
  /** Posição do comentário num PDF (página e retângulos relativos ao tamanho da página). */
  posicaoPdf?: PosicaoPdf
  /** Recorte da área marcada, quando o comentário é sobre uma figura (imagem em data URL). */
  imagem?: string
}

export interface RetanguloPdf {
  x1: number
  y1: number
  x2: number
  y2: number
  width: number
  height: number
  pageNumber?: number
}

export interface PosicaoPdf {
  boundingRect: RetanguloPdf
  rects: RetanguloPdf[]
  pageNumber: number
  usePdfCoordinates?: boolean
}

export interface NovaAnotacaoPdf {
  documentoId: string
  tipo: FeedbackTipo
  texto: string
  posicao: PosicaoPdf
  trecho?: string
  imagem?: string
}

export interface NovaAnotacao {
  documentoId: string
  paragrafo: number
  inicio: number
  fim: number
  tipo: FeedbackTipo
  texto: string
}

export interface DocumentoConteudo {
  documento: Documento
  /** Texto do documento, por parágrafo (o protótipo não lê PDF de verdade). */
  paragrafos: string[]
}

export interface NovaBanca {
  tccId: string
  data?: string
  local?: string
  membros: MembroBanca[]
}
