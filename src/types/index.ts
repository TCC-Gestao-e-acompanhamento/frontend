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
/**
 * Pendente de revisão (aguarda o orientador), correção solicitada ou aprovada. Cada versão enviada começa pendente.
 * Quando o aluno envia uma versão nova, a anterior que não foi aprovada fica "substituída".
 */
export type DocumentoStatus = 'pendente_revisao' | 'correcao' | 'aprovado' | 'substituida'
export type BancaSituacao = 'a_definir' | 'proposta' | 'agendada' | 'realizada'
export type FeedbackTipo = 'comentario' | 'correcao'

/** Registro "cru", como viria do banco. */
export interface TccRecord {
  id: string
  titulo: string
  alunoId: string
  orientadorId: string
  semestre: string
  /** Índice da etapa atual na lista de etapas do trabalho; igual ao total quando todas foram concluídas. */
  etapaIndex: number
  /** Etapas definidas pelo orientador para este trabalho; sem isso vale a lista padrão. */
  etapasDef?: EtapaDef[]
  /** Quem concluiu cada etapa e quando, pelo nome da etapa em minúsculas. */
  conclusoes?: Record<string, { em: string; porId: string }>
}

/** Etapa como o orientador a define: nome, em qual TCC entra e, se quiser, a data. */
export interface EtapaDef {
  nome: string
  fase: Fase
  prazo?: string
}

export interface DefinirEtapas {
  etapas: EtapaDef[]
  /** Índice da etapa em que o trabalho está agora. */
  atual: number
}

export interface NovaAtividade {
  tccId: string
  titulo: string
  tipo: 'entrega' | 'reuniao' | 'marco'
  prazo: string
}

export interface Etapa {
  nome: string
  fase: Fase
  prazo?: string
  concluidaEm?: string
  concluidaPor?: string
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
  /** Não existe versão mais nova do mesmo documento: só ela pode ser aprovada. */
  ultimaVersao?: boolean
  /** Versão mais nova do mesmo documento (só quando esta já não é a última). */
  versaoMaisRecente?: { id: string; versao: number; enviadoEm: string }
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

export interface NovoDocumento {
  tccId: string
  nome: string
  tipo: string
  arquivo: string
  /** Endereço do PDF enviado (no protótipo, um endereço local do navegador). */
  arquivoUrl?: string
}

export interface AtualizacaoFeedback {
  texto: string
  tipo: FeedbackTipo
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
  tipo: 'defesa' | 'inscricao'
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

/** Linha do histórico de inscrições: um período por semestre, com os números de inscritos. */
export interface PeriodoResumo extends PeriodoInscricao {
  /** É o período em vigor: o que está aberto ou, na falta dele, o próximo ou o mais recente. */
  ativo: boolean
  total: number
  tcc1: number
  tcc2: number
  aguardandoCiencia: number
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
