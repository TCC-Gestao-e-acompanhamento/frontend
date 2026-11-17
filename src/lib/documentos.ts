/** Tipos de documento que o aluno envia. O tipo é o "nome" do documento: as versões de um tipo formam uma sequência (1, 2, 3...). */
export const TIPOS_DOCUMENTO = ['Projeto', 'Monografia', 'Capítulo', 'Relatório'] as const
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number]

export const LIMITE_OBSERVACAO = 500

/** Tipo sugerido para a etapa do aluno: Projeto no TCC 1, Monografia no TCC 2. */
export const tipoSugerido = (fase: 'TCC1' | 'TCC2'): TipoDocumento => (fase === 'TCC1' ? 'Projeto' : 'Monografia')
