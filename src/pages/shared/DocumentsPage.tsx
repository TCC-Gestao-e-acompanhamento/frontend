import { useState, type FormEvent } from 'react'
import { DocumentList } from '../../components/DocumentList'
import { useCurrentUser } from '../../auth/useAuth'
import { Button, DataBoundary, Field, Input, PageHeader, SectionCard, Select } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { listDocumentos, listTccs, sendDocumento } from '../../services/api'

const TIPOS = ['Monografia', 'Projeto', 'Capítulo', 'Relatório', 'Outro']
const LIMITE_MB = 20

function UploadForm({ onSent }: { onSent: () => void }) {
  const user = useCurrentUser()
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState(TIPOS[0])
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erros, setErros] = useState<{ nome?: string; arquivo?: string }>({})
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // currentTarget deixa de existir depois de um await: guarda o formulário antes
    const formulario = e.currentTarget
    const novos = {
      nome: nome.trim() ? undefined : 'Informe o nome do documento.',
      arquivo: !arquivo
        ? 'Selecione um arquivo.'
        : arquivo.type !== 'application/pdf' && !arquivo.name.toLowerCase().endsWith('.pdf')
          ? 'O arquivo precisa ser um PDF.'
          : arquivo.size > LIMITE_MB * 1024 * 1024
            ? `O PDF pode ter no máximo ${LIMITE_MB} MB.`
            : undefined,
    }
    setErros(novos)
    if (novos.nome || novos.arquivo || !arquivo) return
    setEnviando(true)
    setResultado(null)
    try {
      const [tcc] = await listTccs(user)
      // No protótipo o arquivo fica só no navegador; no sistema final ele vai para o servidor.
      const url = URL.createObjectURL(arquivo)
      let doc
      try {
        doc = await sendDocumento(user, { tccId: tcc.id, nome: nome.trim(), tipo, arquivo: arquivo.name, arquivoUrl: url })
      } catch (erro) {
        URL.revokeObjectURL(url) // o envio falhou: não deixa o arquivo preso na memória
        throw erro
      }
      setResultado({ ok: true, msg: `"${doc.nome}" enviado como versão ${doc.versao}. No protótipo, o arquivo fica só neste navegador até recarregar a página.` })
      setNome('')
      setArquivo(null)
      formulario.reset()
      onSent()
    } catch (err) {
      setResultado({ ok: false, msg: err instanceof Error ? err.message : 'Falha no envio.' })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <SectionCard title="Enviar documento" description="Para enviar uma nova versão, use o mesmo nome do documento anterior.">
      <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <Field label="Arquivo (PDF)" error={erros.arquivo} hint={`Até ${LIMITE_MB} MB. O orientador poderá comentar trechos do PDF.`}>
            {(p) => <Input {...p} type="file" accept=".pdf" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} className="py-2" />}
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
        description={isAluno ? 'Envie versões do seu trabalho. Abra um documento para ver o retorno do orientador: comentários no texto e correções pedidas.' : 'Documentos enviados pelos seus orientandos, do mais recente ao mais antigo.'}
      />
      {isAluno && <UploadForm onSent={reload} />}
      <SectionCard title={isAluno ? 'Versões enviadas' : 'Entregas recebidas'}>
        <DataBoundary
          state={state}
          reload={reload}
          isEmpty={(d) => d.length === 0}
          empty={{ title: isAluno ? 'Nenhum documento enviado' : 'Nenhuma entrega recebida', description: isAluno ? 'Use o formulário acima para enviar a primeira versão.' : undefined }}
        >
          {(d) => <DocumentList items={d} showAluno={!isAluno} hrefFor={(doc) => `/${user.role}/documentos/${doc.id}`} />}
        </DataBoundary>
      </SectionCard>
    </div>
  )
}
