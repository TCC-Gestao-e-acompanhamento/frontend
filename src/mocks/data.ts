import type {
  AtividadeStatus,
  DocumentoStatus,
  FeedbackTipo,
  BancaSituacao,
  MembroBanca,
  PosicaoPdf,
  TccRecord,
  User,
} from '../types'

/* Dados FICTÍCIOS apenas para o protótipo. Substituídos pela API NestJS depois. */

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Data relativa a hoje (yyyy-mm-dd), para o protótipo sempre parecer "atual". */
export function addDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return iso(d)
}

/** Endereço de um arquivo da pasta public, respeitando a base do site (ex.: /frontend/ no GitHub Pages). */
function publico(caminho: string): string {
  return `${import.meta.env.BASE_URL}${caminho}`
}

export const users: User[] = [
  { id: 'a1', nome: 'Marina Souza', email: 'marina.souza@aluno.unb.br', role: 'aluno', matricula: '190012345', cursoId: 'cc' },
  { id: 'a2', nome: 'Pedro Lima', email: 'pedro.lima@aluno.unb.br', role: 'aluno', matricula: '200023456', cursoId: 'cc' },
  { id: 'a3', nome: 'Beatriz Costa', email: 'beatriz.costa@aluno.unb.br', role: 'aluno', matricula: '200034567', cursoId: 'es' },
  { id: 'a4', nome: 'Lucas Ferreira', email: 'lucas.ferreira@aluno.unb.br', role: 'aluno', matricula: '190045678', cursoId: 'cc' },
  { id: 'a5', nome: 'Camila Rocha', email: 'camila.rocha@aluno.unb.br', role: 'aluno', matricula: '200056789', cursoId: 'si' },
  { id: 'a6', nome: 'Rafael Alves', email: 'rafael.alves@aluno.unb.br', role: 'aluno', matricula: '190067890', cursoId: 'ec' },
  { id: 'a7', nome: 'Julia Mendes', email: 'julia.mendes@aluno.unb.br', role: 'aluno', matricula: '210078901', cursoId: 'ec' },
  { id: 'a8', nome: 'Thiago Barros', email: 'thiago.barros@aluno.unb.br', role: 'aluno', matricula: '210089012', cursoId: 'cc' },
  { id: 'a9', nome: 'Larissa Duarte', email: 'larissa.duarte@aluno.unb.br', role: 'aluno', matricula: '210090123', cursoId: 'es' },
  { id: 'o1', nome: 'Prof. Dr. Carlos Andrade', email: 'carlos.andrade@unb.br', role: 'orientador' },
  { id: 'o2', nome: 'Profa. Dra. Helena Prado', email: 'helena.prado@unb.br', role: 'orientador' },
  { id: 'o3', nome: 'Prof. Dr. Marcelo Vieira', email: 'marcelo.vieira@unb.br', role: 'orientador' },
  { id: 'o4', nome: 'Profa. Dra. Patrícia Nunes', email: 'patricia.nunes@unb.br', role: 'orientador' },
  { id: 'o5', nome: 'Prof. Dr. Eduardo Campos', email: 'eduardo.campos@unb.br', role: 'orientador' },
  { id: 'c1', nome: 'Profa. Dra. Sofia Nogueira', email: 'sofia.nogueira@unb.br', role: 'coordenacao' },
]

export const tccs: TccRecord[] = [
  { id: 't1', titulo: 'Análise de acessibilidade em portais de serviços públicos', alunoId: 'a1', orientadorId: 'o1', semestre: '2026/2', etapaIndex: 5 },
  { id: 't2', titulo: 'Detecção de fraudes em transações com aprendizado de máquina', alunoId: 'a2', orientadorId: 'o1', semestre: '2026/2', etapaIndex: 2 },
  { id: 't3', titulo: 'Aplicativo de monitoramento de qualidade do ar', alunoId: 'a3', orientadorId: 'o1', semestre: '2026/2', etapaIndex: 1 },
  { id: 't4', titulo: 'Arquitetura de microsserviços para sistemas acadêmicos', alunoId: 'a4', orientadorId: 'o1', semestre: '2026/2', etapaIndex: 4 },
  { id: 't5', titulo: 'Gamificação no ensino de lógica de programação', alunoId: 'a5', orientadorId: 'o2', semestre: '2026/2', etapaIndex: 3 },
  { id: 't6', titulo: 'Segurança em APIs REST: um estudo comparativo', alunoId: 'a6', orientadorId: 'o2', semestre: '2026/2', etapaIndex: 6 },
  { id: 't7', titulo: 'Visualização de dados abertos do transporte público do DF', alunoId: 'a7', orientadorId: 'o2', semestre: '2026/2', etapaIndex: 0 },
]

export interface AtividadeRecord {
  id: string
  tccId: string
  titulo: string
  prazo: string
  status: AtividadeStatus
  tipo: 'entrega' | 'reuniao' | 'marco'
}

export const atividades: AtividadeRecord[] = [
  { id: 'at1', tccId: 't1', titulo: 'Entrega do capítulo 3 (metodologia)', prazo: addDays(-12), status: 'concluida', tipo: 'entrega' },
  { id: 'at2', tccId: 't1', titulo: 'Reunião de orientação', prazo: addDays(2), status: 'pendente', tipo: 'reuniao' },
  { id: 'at3', tccId: 't1', titulo: 'Entregar versão final da monografia', prazo: addDays(9), status: 'pendente', tipo: 'entrega' },
  { id: 'at4', tccId: 't1', titulo: 'Apresentação na banca examinadora', prazo: addDays(25), status: 'pendente', tipo: 'marco' },

  { id: 'at5', tccId: 't2', titulo: 'Entregar projeto de pesquisa', prazo: addDays(-20), status: 'concluida', tipo: 'entrega' },
  { id: 'at6', tccId: 't2', titulo: 'Entregar revisão bibliográfica', prazo: addDays(11), status: 'pendente', tipo: 'entrega' },
  { id: 'at7', tccId: 't2', titulo: 'Entregar projeto final do TCC 1', prazo: addDays(28), status: 'pendente', tipo: 'entrega' },

  { id: 'at8', tccId: 't3', titulo: 'Entregar projeto de pesquisa', prazo: addDays(-4), status: 'atrasada', tipo: 'entrega' },
  { id: 'at9', tccId: 't3', titulo: 'Reunião de alinhamento', prazo: addDays(12), status: 'pendente', tipo: 'reuniao' },

  { id: 'at10', tccId: 't4', titulo: 'Relatório parcial do desenvolvimento', prazo: addDays(-9), status: 'concluida', tipo: 'entrega' },
  { id: 'at11', tccId: 't4', titulo: 'Reunião de acompanhamento', prazo: addDays(14), status: 'pendente', tipo: 'reuniao' },
  { id: 'at12', tccId: 't4', titulo: 'Entregar capítulos de resultados', prazo: addDays(20), status: 'em_andamento', tipo: 'entrega' },

  { id: 'at13', tccId: 't5', titulo: 'Entregar projeto final do TCC 1', prazo: addDays(13), status: 'pendente', tipo: 'entrega' },
  { id: 'at14', tccId: 't5', titulo: 'Revisão bibliográfica', prazo: addDays(-15), status: 'concluida', tipo: 'entrega' },

  { id: 'at15', tccId: 't6', titulo: 'Enviar cópia aos membros da banca', prazo: addDays(1), status: 'pendente', tipo: 'entrega' },
  { id: 'at16', tccId: 't6', titulo: 'Entregar versão para a banca', prazo: addDays(3), status: 'pendente', tipo: 'entrega' },
  { id: 'at17', tccId: 't6', titulo: 'Defesa pública', prazo: addDays(40), status: 'pendente', tipo: 'marco' },

  { id: 'at18', tccId: 't7', titulo: 'Definir tema com o orientador', prazo: addDays(-8), status: 'atrasada', tipo: 'marco' },
  { id: 'at19', tccId: 't7', titulo: 'Primeira reunião de orientação', prazo: addDays(7), status: 'pendente', tipo: 'reuniao' },
]

export interface DocumentoRecord {
  id: string
  tccId: string
  nome: string
  versao: number
  tipo: string
  enviadoEm: string
  status: DocumentoStatus
  /** PDF de exemplo para visualização com comentários. */
  arquivoUrl?: string
}

export const documentos: DocumentoRecord[] = [
  { id: 'd1', tccId: 't1', nome: 'Monografia', versao: 1, tipo: 'Monografia', enviadoEm: addDays(-30), status: 'substituida', arquivoUrl: publico('exemplos/monografia-exemplo.pdf') },
  { id: 'd2', tccId: 't1', nome: 'Monografia', versao: 2, tipo: 'Monografia', enviadoEm: addDays(-15), status: 'substituida', arquivoUrl: publico('exemplos/monografia-exemplo.pdf') },
  { id: 'd3', tccId: 't1', nome: 'Monografia', versao: 3, tipo: 'Monografia', enviadoEm: addDays(-2), status: 'correcao', arquivoUrl: publico('exemplos/monografia-exemplo.pdf') },
  { id: 'd4', tccId: 't2', nome: 'Projeto de pesquisa', versao: 2, tipo: 'Projeto', enviadoEm: addDays(-22), status: 'aprovado', arquivoUrl: publico('exemplos/capitulo-exemplo.pdf') },
  { id: 'd5', tccId: 't2', nome: 'Revisão bibliográfica', versao: 1, tipo: 'Capítulo', enviadoEm: addDays(-1), status: 'pendente_revisao', arquivoUrl: publico('exemplos/capitulo-exemplo.pdf') },
  { id: 'd6', tccId: 't3', nome: 'Projeto de pesquisa', versao: 1, tipo: 'Projeto', enviadoEm: addDays(-10), status: 'correcao', arquivoUrl: publico('exemplos/capitulo-exemplo.pdf') },
  { id: 'd7', tccId: 't4', nome: 'Relatório parcial', versao: 1, tipo: 'Relatório', enviadoEm: addDays(-9), status: 'aprovado', arquivoUrl: publico('exemplos/capitulo-exemplo.pdf') },
  { id: 'd8', tccId: 't5', nome: 'Projeto do TCC 1', versao: 1, tipo: 'Projeto', enviadoEm: addDays(-3), status: 'pendente_revisao', arquivoUrl: publico('exemplos/capitulo-exemplo.pdf') },
  { id: 'd9', tccId: 't6', nome: 'Monografia', versao: 4, tipo: 'Monografia', enviadoEm: addDays(-1), status: 'pendente_revisao', arquivoUrl: publico('exemplos/monografia-exemplo.pdf') },
]

export interface FeedbackRecord {
  id: string
  tccId: string
  documentoId?: string
  autorId: string
  data: string
  texto: string
  tipo: FeedbackTipo
  resolvido: boolean
}

export const feedbacks: FeedbackRecord[] = [
  { id: 'f1', tccId: 't1', documentoId: 'd1', autorId: 'o1', data: addDays(-28), texto: 'Boa estrutura inicial. Detalhar melhor o referencial teórico sobre WCAG.', tipo: 'comentario', resolvido: true },
  { id: 'f2', tccId: 't1', documentoId: 'd2', autorId: 'o1', data: addDays(-13), texto: 'Reforçar a descrição da metodologia: critérios de seleção dos portais e instrumento de avaliação.', tipo: 'correcao', resolvido: false },
  { id: 'f3', tccId: 't2', documentoId: 'd4', autorId: 'o1', data: addDays(-20), texto: 'Projeto aprovado. Ampliar a lista de bases de dados na revisão.', tipo: 'comentario', resolvido: true },
  { id: 'f4', tccId: 't3', documentoId: 'd6', autorId: 'o1', data: addDays(-8), texto: 'Objetivos específicos muito amplos. Reescrever e alinhar com o cronograma.', tipo: 'correcao', resolvido: false },
  { id: 'f5', tccId: 't6', autorId: 'o2', data: addDays(-12), texto: 'Corrigir referências fora do padrão ABNT.', tipo: 'correcao', resolvido: true },
]

export interface BancaRecord {
  id: string
  tccId?: string
  /** Para defesas de semestres anteriores, que não têm TCC no mock. */
  tituloExterno?: string
  alunoExterno?: string
  situacao: BancaSituacao
  data?: string
  local?: string
  membros: MembroBanca[]
}

export const bancas: BancaRecord[] = [
  {
    id: 'b1',
    tccId: 't1',
    situacao: 'agendada',
    data: addDays(25),
    local: 'Auditório da Faculdade de Tecnologia, sala 12',
    membros: [
      { nome: 'Prof. Dr. Carlos Andrade', papel: 'Orientador (presidente)', instituicao: 'UnB' },
      { nome: 'Prof. Dr. Renato Teixeira', papel: 'Examinador', instituicao: 'UnB' },
      { nome: 'Profa. Dra. Ana Beltrão', papel: 'Examinadora', instituicao: 'UFG' },
    ],
  },
  { id: 'b2', tccId: 't4', situacao: 'a_definir', membros: [] },
  {
    id: 'b3',
    tccId: 't6',
    situacao: 'agendada',
    data: addDays(40),
    local: 'Sala virtual (link divulgado pela coordenação)',
    membros: [
      { nome: 'Profa. Dra. Helena Prado', papel: 'Orientadora (presidente)', instituicao: 'UnB' },
      { nome: 'Prof. Dr. Otávio Lemos', papel: 'Examinador', instituicao: 'UnB' },
      { nome: 'Profa. Dra. Mirela Tavares', papel: 'Examinadora', instituicao: 'UnB' },
    ],
  },
  {
    id: 'b4',
    tituloExterno: 'Sistema de recomendação de trilhas de estudo',
    alunoExterno: 'Gabriel Martins',
    situacao: 'realizada',
    data: addDays(-45),
    local: 'Auditório da Faculdade de Tecnologia, sala 12',
    membros: [
      { nome: 'Prof. Dr. Carlos Andrade', papel: 'Orientador (presidente)', instituicao: 'UnB' },
      { nome: 'Profa. Dra. Helena Prado', papel: 'Examinadora', instituicao: 'UnB' },
      { nome: 'Prof. Dr. Renato Teixeira', papel: 'Examinador', instituicao: 'UnB' },
    ],
  },
]

export const prazosInstitucionais = [
  { id: 'p1', titulo: 'Entrega do projeto de TCC 1', data: addDays(14), fase: 'TCC1' as const },
  { id: 'p2', titulo: 'Entrega da versão para a banca', data: addDays(30), fase: 'TCC2' as const },
  { id: 'p3', titulo: 'Início do período de defesas', data: addDays(45), fase: 'TCC2' as const },
  { id: 'p4', titulo: 'Fim do período de defesas', data: addDays(60), fase: 'TCC2' as const },
  { id: 'p5', titulo: 'Entrega da versão final corrigida', data: addDays(75), fase: 'TCC2' as const },
]

/* ---------- Orientação: catálogo, perfis públicos e solicitações (dados fictícios) ---------- */

export const cursos = [
  { id: 'cc', nome: 'Ciência da Computação' },
  { id: 'es', nome: 'Engenharia de Software' },
  { id: 'ec', nome: 'Engenharia de Computação' },
  { id: 'si', nome: 'Sistemas de Informação' },
]

/** Catálogo editável: novas áreas são acrescentadas pelos professores. */
export const areas = [
  { id: 'ar1', nome: 'Engenharia de Software' },
  { id: 'ar2', nome: 'Inteligência Artificial' },
  { id: 'ar3', nome: 'Ciência de Dados' },
  { id: 'ar4', nome: 'Sistemas Distribuídos' },
  { id: 'ar5', nome: 'Segurança da Informação' },
  { id: 'ar6', nome: 'Internet das Coisas' },
  { id: 'ar7', nome: 'Interação Humano-Computador' },
  { id: 'ar8', nome: 'Informática na Educação' },
]

export interface PerfilProfessorRecord {
  id: string
  cursoIds: string[]
  areaIds: string[]
  apresentacao?: string
  aceitandoSolicitacoes: boolean
}

export const perfisProfessores: PerfilProfessorRecord[] = [
  { id: 'o1', cursoIds: ['cc', 'es'], areaIds: ['ar1', 'ar4'], apresentacao: 'Professor do Departamento de Ciência da Computação. Interesse em arquitetura de software, microsserviços e qualidade de software.', aceitandoSolicitacoes: true },
  { id: 'o2', cursoIds: ['cc', 'si'], areaIds: ['ar5', 'ar8'], apresentacao: 'Pesquisa segurança de aplicações e tecnologias para o ensino de computação.', aceitandoSolicitacoes: false },
  { id: 'o3', cursoIds: ['cc', 'ec'], areaIds: ['ar2', 'ar3'], aceitandoSolicitacoes: true },
  { id: 'o4', cursoIds: ['es', 'si'], areaIds: ['ar3', 'ar7'], apresentacao: 'Trabalha com análise de dados e experiência do usuário em sistemas de informação.', aceitandoSolicitacoes: true },
  { id: 'o5', cursoIds: ['ec'], areaIds: ['ar6', 'ar4'], apresentacao: 'Sistemas embarcados, redes de sensores e Internet das Coisas.', aceitandoSolicitacoes: true },
]

export interface SolicitacaoRecord {
  id: string
  professorId: string
  alunoId: string
  titulo: string
  area: string
  semestre: string
  descricao: string
  mensagem?: string
  status: 'pendente' | 'aceita' | 'recusada' | 'cancelada'
  enviadaEm: string
  respondidaEm?: string
  resposta?: string
}

export const solicitacoes: SolicitacaoRecord[] = [
  { id: 's1', professorId: 'o3', alunoId: 'a1', titulo: 'Classificação de textos de ouvidoria com aprendizado de máquina', area: 'Inteligência Artificial', semestre: '2027/1', descricao: 'Pretendo comparar modelos de classificação para triagem automática de manifestações em canais de ouvidoria pública.', mensagem: 'Tenho disponibilidade para reuniões às terças.', status: 'pendente', enviadaEm: addDays(-2) },
  { id: 's2', professorId: 'o2', alunoId: 'a1', titulo: 'Análise de vulnerabilidades em portais públicos', area: 'Segurança da Informação', semestre: '2026/2', descricao: 'Avaliar vulnerabilidades comuns em portais de serviços públicos.', status: 'recusada', enviadaEm: addDays(-20), respondidaEm: addDays(-18), resposta: 'No momento não tenho vagas para o semestre. Recomendo procurar o Prof. Eduardo.' },
  { id: 's3', professorId: 'o1', alunoId: 'a8', titulo: 'Migração de monolito para microsserviços em sistema acadêmico', area: 'Engenharia de Software', semestre: '2027/1', descricao: 'Estudo de caso de decomposição de um sistema acadêmico legado em microsserviços, avaliando impactos em manutenção e desempenho.', mensagem: 'Já li seus artigos sobre arquitetura e gostaria de aprofundar.', status: 'pendente', enviadaEm: addDays(-1) },
  { id: 's4', professorId: 'o1', alunoId: 'a9', titulo: 'Testes automatizados em aplicações web', area: 'Engenharia de Software', semestre: '2027/1', descricao: 'Comparar estratégias de teste end-to-end e seu custo de manutenção em projetos pequenos.', status: 'pendente', enviadaEm: addDays(-4) },
  { id: 's5', professorId: 'o1', alunoId: 'a2', titulo: 'Detecção de fraudes em transações com aprendizado de máquina', area: 'Inteligência Artificial', semestre: '2026/2', descricao: 'Aplicar modelos de aprendizado supervisionado à detecção de fraudes em transações financeiras.', status: 'aceita', enviadaEm: addDays(-60), respondidaEm: addDays(-57), resposta: 'Aceito. Vamos alinhar o escopo na primeira reunião.' },
]

/* ---------- Inscrição no TCC (dados fictícios) ---------- */

/** Período definido pela coordenação para o semestre seguinte. Editável. */
export const periodoInscricao = { semestre: '2027/1', inicio: addDays(-3), fim: addDays(7) }

export interface InscricaoRecord {
  id: string
  semestre: string
  alunoId: string
  fase: 'TCC1' | 'TCC2'
  orientadorId?: string
  orientadorNome: string
  orientadorEmail: string
  status: 'ativa' | 'cancelada'
  criadaEm: string
  atualizadaEm?: string
  cienteEm?: string
}

export const inscricoes: InscricaoRecord[] = [
  { id: 'i1', semestre: '2027/1', alunoId: 'a2', fase: 'TCC2', orientadorId: 'o1', orientadorNome: 'Prof. Dr. Carlos Andrade', orientadorEmail: 'carlos.andrade@unb.br', status: 'ativa', criadaEm: addDays(-2), cienteEm: addDays(-1) },
  { id: 'i2', semestre: '2027/1', alunoId: 'a3', fase: 'TCC1', orientadorId: 'o1', orientadorNome: 'Prof. Dr. Carlos Andrade', orientadorEmail: 'carlos.andrade@unb.br', status: 'ativa', criadaEm: addDays(-2) },
  { id: 'i3', semestre: '2027/1', alunoId: 'a9', fase: 'TCC1', orientadorId: 'o1', orientadorNome: 'Prof. Dr. Carlos Andrade', orientadorEmail: 'carlos.andrade@unb.br', status: 'ativa', criadaEm: addDays(-1) },
  { id: 'i4', semestre: '2027/1', alunoId: 'a5', fase: 'TCC2', orientadorId: 'o2', orientadorNome: 'Profa. Dra. Helena Prado', orientadorEmail: 'helena.prado@unb.br', status: 'ativa', criadaEm: addDays(-3) },
  { id: 'i5', semestre: '2027/1', alunoId: 'a7', fase: 'TCC1', orientadorNome: 'Prof. Dr. Henrique Lacerda', orientadorEmail: 'henrique.lacerda@unb.br', status: 'ativa', criadaEm: addDays(-1) },
]

/* ---------- Registro de orientações e anotações (dados fictícios) ---------- */

export interface OrientacaoRecord {
  id: string
  tccId: string
  data: string
  formato: 'presencial' | 'online'
  resumo: string
  combinados?: string
  proximoEncontro?: string
}

export const orientacoes: OrientacaoRecord[] = [
  { id: 'or1', tccId: 't1', data: addDays(-40), formato: 'online', resumo: 'Definição do escopo: portais de serviços públicos mais acessados e critérios de seleção.', combinados: 'Aluna lista os portais candidatos e os critérios até a próxima reunião.', proximoEncontro: addDays(-21) },
  { id: 'or2', tccId: 't1', data: addDays(-21), formato: 'presencial', resumo: 'Revisão da metodologia. Discutimos ferramentas de avaliação automatizada e inspeção manual.', combinados: 'Detalhar o roteiro de inspeção e enviar a versão 2 da monografia.', proximoEncontro: addDays(-7) },
  { id: 'or3', tccId: 't1', data: addDays(-7), formato: 'online', resumo: 'Análise dos resultados preliminares e organização do capítulo de discussão.', combinados: 'Incluir razão de contraste adotada. Enviar versão 3 antes da banca.', proximoEncontro: addDays(2) },
  { id: 'or4', tccId: 't2', data: addDays(-30), formato: 'presencial', resumo: 'Escolha da base de dados e das métricas de avaliação dos modelos de detecção de fraude.' },
  { id: 'or5', tccId: 't2', data: addDays(-9), formato: 'online', resumo: 'Revisão bibliográfica: ampliar a lista de bases consultadas.', combinados: 'Entregar a revisão bibliográfica completa.', proximoEncontro: addDays(5) },
  { id: 'or6', tccId: 't3', data: addDays(-14), formato: 'online', resumo: 'Objetivos específicos muito amplos; reescrever alinhando ao cronograma.', combinados: 'Reescrever objetivos e reenviar o projeto.' },
  { id: 'or7', tccId: 't4', data: addDays(-12), formato: 'presencial', resumo: 'Arquitetura inicial dos microsserviços e plano de testes de desempenho.' },
  { id: 'or8', tccId: 't4', data: addDays(-3), formato: 'online', resumo: 'Acompanhamento do desenvolvimento; ajustar a camada de comunicação entre serviços.', proximoEncontro: addDays(14) },
  { id: 'or9', tccId: 't5', data: addDays(-10), formato: 'presencial', resumo: 'Mecânicas de gamificação e forma de avaliar o engajamento dos alunos.' },
  { id: 'or10', tccId: 't6', data: addDays(-18), formato: 'online', resumo: 'Plano de comparação de estratégias de segurança em APIs REST.' },
  { id: 'or11', tccId: 't6', data: addDays(-5), formato: 'presencial', resumo: 'Revisão da monografia antes de enviar aos membros da banca.', combinados: 'Corrigir referências e enviar cópia à banca.', proximoEncontro: addDays(1) },
]

const MONOGRAFIA = [
  'Este trabalho investiga o nível de acessibilidade de portais de serviços públicos brasileiros, com foco em usuários de leitores de tela e em pessoas com baixa visão.',
  'A metodologia combina avaliação automatizada com ferramentas de análise e inspeção manual por especialistas. Foram selecionados dez portais com maior volume de acessos em 2025.',
  'Os resultados indicam que a maior parte das falhas está relacionada a contraste insuficiente, ausência de texto alternativo e formulários sem rótulos associados.',
  'A literatura recente mostra que a adoção das diretrizes WCAG ainda é parcial no setor público, em especial em serviços digitais criados antes da obrigatoriedade legal.',
  'Como trabalho futuro, propõe-se ampliar a amostra de portais e incluir testes com usuários reais, de modo a validar os achados da avaliação técnica.',
  'Conclui-se que investimentos em capacitação das equipes e em processos de revisão contínua são mais efetivos do que correções pontuais.',
]

const GENERICO = [
  'Este documento apresenta o contexto do problema, a motivação do trabalho e os objetivos que orientam as próximas etapas do TCC.',
  'A proposta metodológica descreve as técnicas, as ferramentas e os critérios que serão usados para coletar e analisar os dados.',
  'O cronograma prevê entregas parciais, com revisão do orientador a cada etapa concluída.',
  'Por fim, são listadas as referências iniciais consultadas, que serão ampliadas ao longo do semestre.',
]

/** Texto fictício dos documentos (o protótipo não abre PDFs de verdade). */
export function conteudoDoDocumento(tipo: string): string[] {
  return tipo === 'Monografia' ? MONOGRAFIA : GENERICO
}

export interface AnotacaoRecord {
  id: string
  documentoId: string
  paragrafo: number
  inicio: number
  fim: number
  autorId: string
  tipo: 'comentario' | 'correcao'
  texto: string
  criadaEm: string
  resolvida: boolean
  respostas: { id: string; autorId: string; texto: string; data: string }[]
  /** Só para comentários em PDF. */
  posicaoPdf?: PosicaoPdf
  trecho?: string
  imagem?: string
}

export const anotacoes: AnotacaoRecord[] = [
  { id: 'an1', documentoId: 'd3', paragrafo: -1, inicio: 0, fim: 0, trecho: 'inspeção manual por especialistas', posicaoPdf: {"boundingRect": {"x1": 70.87, "y1": 405.1, "x2": 524.41, "y2": 435.88, "width": 595.28, "height": 841.89, "pageNumber": 1}, "rects": [{"x1": 481.1, "y1": 405.1, "x2": 524.41, "y2": 415.66, "width": 595.28, "height": 841.89, "pageNumber": 1}, {"x1": 70.87, "y1": 425.33, "x2": 200.08, "y2": 435.88, "width": 595.28, "height": 841.89, "pageNumber": 1}], "pageNumber": 1}, autorId: 'o1', tipo: 'correcao', texto: 'Detalhar quem são os especialistas e qual foi o roteiro da inspeção.', criadaEm: addDays(-1), resolvida: false, respostas: [] },
  { id: 'an2', documentoId: 'd3', paragrafo: -1, inicio: 0, fim: 0, trecho: 'contraste insuficiente', posicaoPdf: {"boundingRect": {"x1": 70.87, "y1": 526.31, "x2": 524.41, "y2": 557.09, "width": 595.28, "height": 841.89, "pageNumber": 1}, "rects": [{"x1": 441.96, "y1": 526.31, "x2": 524.41, "y2": 536.87, "width": 595.28, "height": 841.89, "pageNumber": 1}, {"x1": 70.87, "y1": 546.54, "x2": 103.71, "y2": 557.09, "width": 595.28, "height": 841.89, "pageNumber": 1}], "pageNumber": 1}, autorId: 'o1', tipo: 'comentario', texto: 'Cite a razão de contraste mínima adotada (WCAG AA, 4,5:1).', criadaEm: addDays(-1), resolvida: false, respostas: [] },
  { id: 'an3', documentoId: 'd3', paragrafo: -1, inicio: 0, fim: 0, trecho: 'validar os achados da avaliação técnica', posicaoPdf: {"boundingRect": {"x1": 159.06, "y1": 227.86, "x2": 361.44, "y2": 238.42, "width": 595.28, "height": 841.89, "pageNumber": 2}, "rects": [{"x1": 159.06, "y1": 227.86, "x2": 361.44, "y2": 238.42, "width": 595.28, "height": 841.89, "pageNumber": 2}], "pageNumber": 2}, autorId: 'o1', tipo: 'correcao', texto: 'Explique como esses testes seriam conduzidos.', criadaEm: addDays(-1), resolvida: true, respostas: [{ id: 'ar1', autorId: 'a1', texto: 'Incluí um parágrafo com o plano de testes na seção 4.', data: addDays(0) }] },
  { id: 'an4', documentoId: 'd2', paragrafo: -1, inicio: 0, fim: 0, trecho: 'baixa visão', posicaoPdf: {"boundingRect": {"x1": 373.33, "y1": 324.34, "x2": 433.89, "y2": 334.89, "width": 595.28, "height": 841.89, "pageNumber": 1}, "rects": [{"x1": 373.33, "y1": 324.34, "x2": 433.89, "y2": 334.89, "width": 595.28, "height": 841.89, "pageNumber": 1}], "pageNumber": 1}, autorId: 'o1', tipo: 'comentario', texto: 'Defina o público-alvo com mais precisão.', criadaEm: addDays(-13), resolvida: true, respostas: [] },
]
