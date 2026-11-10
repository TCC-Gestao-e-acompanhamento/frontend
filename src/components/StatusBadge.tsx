import { Badge, type Tone } from '../design-system'
import type { AtividadeStatus, BancaSituacao, DocumentoStatus, PeriodoSituacao, SolicitacaoStatus, TccStatus } from '../types'

const MAPS = {
  tcc: {
    em_andamento: ['brand', 'Em andamento'],
    atencao: ['warning', 'Prazo próximo'],
    atrasado: ['danger', 'Atrasado'],
    concluido: ['success', 'Concluído'],
  } satisfies Record<TccStatus, [Tone, string]>,
  atividade: {
    pendente: ['neutral', 'Pendente'],
    em_andamento: ['brand', 'Em andamento'],
    concluida: ['success', 'Concluída'],
    atrasada: ['danger', 'Atrasada'],
  } satisfies Record<AtividadeStatus, [Tone, string]>,
  documento: {
    enviado: ['neutral', 'Enviado'],
    em_analise: ['brand', 'Em análise'],
    correcao: ['warning', 'Correção solicitada'],
    aprovado: ['success', 'Aprovado'],
  } satisfies Record<DocumentoStatus, [Tone, string]>,
  solicitacao: {
    pendente: ['warning', 'Pendente'],
    aceita: ['success', 'Aceita'],
    recusada: ['danger', 'Recusada'],
    cancelada: ['neutral', 'Cancelada'],
  } satisfies Record<SolicitacaoStatus, [Tone, string]>,
  periodo: {
    antes: ['brand', 'Em breve'],
    aberto: ['success', 'Inscrições abertas'],
    encerrado: ['neutral', 'Inscrições encerradas'],
  } satisfies Record<PeriodoSituacao, [Tone, string]>,
  banca: {
    a_definir: ['neutral', 'A definir'],
    agendada: ['brand', 'Agendada'],
    realizada: ['success', 'Realizada'],
  } satisfies Record<BancaSituacao, [Tone, string]>,
}

type Props =
  | { kind: 'tcc'; value: TccStatus }
  | { kind: 'atividade'; value: AtividadeStatus }
  | { kind: 'documento'; value: DocumentoStatus }
  | { kind: 'banca'; value: BancaSituacao }
  | { kind: 'solicitacao'; value: SolicitacaoStatus }
  | { kind: 'periodo'; value: PeriodoSituacao }

export function StatusBadge(props: Props) {
  const [tone, label] = (MAPS[props.kind] as Record<string, [Tone, string]>)[props.value]
  return <Badge tone={tone}>{label}</Badge>
}
