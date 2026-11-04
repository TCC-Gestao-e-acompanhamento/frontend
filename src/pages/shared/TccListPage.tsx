import { useState } from 'react'
import { TccTable } from '../../components/TccTable'
import { useCurrentUser } from '../../auth/useAuth'
import { DataBoundary, Field, Icon, Input, PageHeader, SectionCard, Select } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { listTccs } from '../../services/api'
import type { Fase, TccStatus } from '../../types'

/** Lista de TCCs: orientador vê os orientados; coordenação vê todos (filtros incluídos). */
export default function TccListPage() {
  const user = useCurrentUser()
  const coord = user.role === 'coordenacao'
  const base = coord ? '/coordenacao/tccs' : '/orientador/orientandos'
  const { state, reload } = useAsync(() => listTccs(user), [user.id])
  const [busca, setBusca] = useState('')
  const [fase, setFase] = useState<'' | Fase>('')
  const [status, setStatus] = useState<'' | TccStatus>('')

  return (
    <>
      <PageHeader
        title={coord ? 'TCCs cadastrados' : 'Meus orientandos'}
        description={coord ? 'Todos os trabalhos do semestre, com etapa, orientador e situação.' : 'Situação e etapa atual de cada trabalho que você orienta.'}
      />
      <div className="space-y-4">
        <div className="grid gap-4 rounded-card border border-border p-4 sm:grid-cols-[2fr_1fr_1fr]">
          <Field label="Buscar por aluno, orientador ou título">
            {(p) => (
              <div className="relative">
                <Icon name="search" size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" />
                <Input {...p} type="search" value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
              </div>
            )}
          </Field>
          <Field label="Fase">
            {(p) => (
              <Select {...p} value={fase} onChange={(e) => setFase(e.target.value as '' | Fase)}>
                <option value="">Todas</option>
                <option value="TCC1">TCC 1</option>
                <option value="TCC2">TCC 2</option>
              </Select>
            )}
          </Field>
          <Field label="Situação">
            {(p) => (
              <Select {...p} value={status} onChange={(e) => setStatus(e.target.value as '' | TccStatus)}>
                <option value="">Todas</option>
                <option value="em_andamento">Em andamento</option>
                <option value="atencao">Atenção</option>
                <option value="atrasado">Atrasado</option>
              </Select>
            )}
          </Field>
        </div>

        <SectionCard title="Trabalhos">
          <DataBoundary
            state={state}
            reload={reload}
            isEmpty={(d) => d.length === 0}
            empty={{ title: 'Nenhum TCC encontrado', description: coord ? 'Nenhum trabalho cadastrado neste semestre.' : 'Você ainda não tem orientandos vinculados.' }}
          >
            {(d) => {
              const q = busca.trim().toLowerCase()
              const filtrados = d.filter(
                (t) =>
                  (!fase || t.fase === fase) &&
                  (!status || t.status === status) &&
                  (!q || `${t.aluno.nome} ${t.orientador.nome} ${t.titulo}`.toLowerCase().includes(q)),
              )
              return filtrados.length ? (
                <TccTable items={filtrados} basePath={base} showOrientador={coord} caption="Lista de TCCs" />
              ) : (
                <p className="py-4 text-center text-sm text-ink-muted" role="status">Nenhum resultado para os filtros aplicados.</p>
              )
            }}
          </DataBoundary>
        </SectionCard>
      </div>
    </>
  )
}
