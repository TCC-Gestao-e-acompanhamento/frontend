import { useState, type FormEvent } from 'react'
import { DocumentList } from '../../components/DocumentList'
import { useCurrentUser } from '../../auth/useAuth'
import { Button, DataBoundary, Field, Input, PageHeader, SectionCard, Select } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { listDocumentos, listTccs, sendDocumento } from '../../services/api'

const TIPOS = ['Monografia', 'Projeto', 'Capítulo', 'Relatório', 'Outro']

function UploadForm({ onSent }: { onSent: () => void }) {
  const user = useCurrentUser()
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState(TIPOS[0])
  const [arquivo, setArquivo] = useState('')
  const [erros, setErros] = useState<{ nome?: string; arquivo?: string }>({})
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const novos = {
      nome: nome.trim() ? undefined : 'Informe o nome do documento.',
      arquivo: arquivo ? undefined : 'Selecione um arquivo.',
    }
    setErros(novos)
    if (novos.nome || novos.arquivo) return
    setEnviando(true)
    setResultado(null)
    try {
      const [tcc] = await listTccs(user)
      const doc = await sendDocumento(user, { tccId: tcc.id, nome: nome.trim(), tipo, arquivo })
      setResultado({ ok: true, msg: `"${doc.nome}" enviado como versão ${doc.versao}.` })
      setNome('')
      setArquivo('')
      e.currentTarget.reset()
      onSent()
    } catch (err) {
      setResultado({ ok: false, msg: err instanceof Error ? err.message : 'Falha no envio.' })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <SectionCard title="Enviar documento" description="Reenvie com o mesmo nome para criar uma nova versão.">
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome do documento" error={erros.nome}>
          {(p) => <Input {...p} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Monografia" />}
        </Field>
        <Field label="Tipo">
          {(p) => (
            <Select {...p} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => <option key={t}>{t}</option>)}
            </Select>
          )}
        </Field>
        <div className="sm:col-span-2">
          <Field label="Arquivo (PDF)" error={erros.arquivo}>
            {(p) => <Input {...p} type="file" accept=".pdf" onChange={(e) => setArquivo(e.target.files?.[0]?.name ?? '')} className="py-2" />}
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" loading={enviando}>Enviar documento</Button>
          {resultado && (
            <p role={resultado.ok ? 'status' : 'alert'} className={`text-sm ${resultado.ok ? 'text-success' : 'text-danger'}`}>
              {resultado.msg}
            </p>
          )}
        </div>
      </form>
    </SectionCard>
  )
}

/** Aluno: envia e consulta versões. Orientador: consulta entregas dos orientandos. */
export default function DocumentsPage() {
  const user = useCurrentUser()
  const isAluno = user.role === 'aluno'
  const { state, reload } = useAsync(() => listDocumentos(user), [user.id])

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAluno ? 'Documentos' : 'Entregas dos orientandos'}
        description={isAluno ? 'Envie versões do seu trabalho e acompanhe a análise.' : 'Documentos enviados pelos seus orientandos, do mais recente ao mais antigo.'}
      />
      {isAluno && <UploadForm onSent={reload} />}
      <SectionCard title={isAluno ? 'Versões enviadas' : 'Entregas recebidas'}>
        <DataBoundary
          state={state}
          reload={reload}
          isEmpty={(d) => d.length === 0}
          empty={{ title: isAluno ? 'Nenhum documento enviado' : 'Nenhuma entrega recebida', description: isAluno ? 'Use o formulário acima para enviar a primeira versão.' : undefined }}
        >
          {(d) => <DocumentList items={d} showAluno={!isAluno} />}
        </DataBoundary>
      </SectionCard>
    </div>
  )
}
