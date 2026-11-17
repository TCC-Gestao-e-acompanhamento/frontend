import { useState, type FormEvent } from 'react'
import { DocumentList } from '../../components/DocumentList'
import { useCurrentUser } from '../../auth/useAuth'
import { Button, DataBoundary, EmptyState, Field, Input, PageHeader, SectionCard, Select, Textarea } from '../../design-system'
import { useAsync } from '../../hooks/useAsync'
import { LIMITE_OBSERVACAO, TIPOS_DOCUMENTO, tipoSugerido } from '../../lib/documentos'
import { plural } from '../../lib/format'
import { listDocumentos, listTccs, sendDocumento } from '../../services/api'
import type { Documento, Tcc } from '../../types'

const LIMITE_MB = 20

/** Envio de uma nova versão: o tipo vem da etapa do aluno e o número da versão é automático. */
function UploadForm({ tcc, documentos, onSent }: { tcc: Tcc; documentos: Documento[]; onSent: () => void }) {
  const user = useCurrentUser()
  const [tipo, setTipo] = useState<string>(() => tipoSugerido(tcc.fase))
  const [observacao, setObservacao] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erroArquivo, setErroArquivo] = useState<string>()
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null)

  // a próxima versão e a que ela substitui (o histórico pode começar em outro número)
  const doTipo = documentos.filter((d) => d.tipo === tipo)
  const proxima = Math.max(0, ...doTipo.map((d) => d.versao)) + 1
  // o servidor substitui toda versão do tipo que não está aprovada nem já substituída
  const substituidas = doTipo.filter((d) => d.status !== 'aprovado' && d.status !== 'substituida').map((d) => d.versao).sort((a, b) => a - b)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // currentTarget deixa de existir depois de um await: guarda o formulário antes
    const formulario = e.currentTarget
    const erro = !arquivo
      ? 'Selecione um arquivo.'
      : arquivo.type !== 'application/pdf' && !arquivo.name.toLowerCase().endsWith('.pdf')
        ? 'O arquivo precisa ser um PDF.'
        : arquivo.size > LIMITE_MB * 1024 * 1024
          ? `O PDF pode ter no máximo ${LIMITE_MB} MB.`
          : undefined
    setErroArquivo(erro)
    if (erro || !arquivo) return
    setEnviando(true)
    setResultado(null)
    try {
      // No protótipo o arquivo fica só no navegador; no sistema final ele vai para o servidor.
      const url = URL.createObjectURL(arquivo)
      let doc
      try {
        doc = await sendDocumento(user, { tccId: tcc.id, tipo, observacao: observacao.trim() || undefined, arquivo: arquivo.name, arquivoUrl: url })
      } catch (erroEnvio) {
        URL.revokeObjectURL(url) // o envio falhou: não deixa o arquivo preso na memória
        throw erroEnvio
      }
      setResultado({ ok: true, msg: `${doc.nome}, versão ${doc.versao}, enviada. No protótipo, o arquivo fica só neste navegador até recarregar a página.` })
      setObservacao('')
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
    <SectionCard title="Enviar nova versão" description="Cada envio vira a próxima versão do documento e substitui a anterior. O orientador revisa sempre a mais recente.">
      <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Documento" hint={`Sugerido para o ${tcc.fase === 'TCC1' ? 'TCC 1' : 'TCC 2'}. Mude só se for enviar outro tipo.`}>
          {(p) => (
            <Select {...p} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS_DOCUMENTO.map((t) => <option key={t}>{t}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Arquivo (PDF)" error={erroArquivo} hint={`Até ${LIMITE_MB} MB. O orientador poderá comentar trechos do PDF.`}>
          {(p) => <Input {...p} type="file" accept=".pdf" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} className="py-2" />}
        </Field>
        <div className="sm:col-span-2">
          <Field label="O que mudou nesta versão (opcional)" hint={`Ajuda o orientador a revisar. Até ${LIMITE_OBSERVACAO} caracteres.`}>
            {(p) => <Textarea {...p} value={observacao} maxLength={LIMITE_OBSERVACAO} onChange={(e) => setObservacao(e.target.value)} className="min-h-20" placeholder="Ex.: Reescrevi a metodologia e incluí os critérios de seleção." />}
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" loading={enviando}>Enviar versão {proxima} de {tipo}</Button>
          {substituidas.length > 0 && (
            <p className="text-sm text-ink-muted">
              {substituidas.length === 1 ? `A versão ${substituidas[0]} passa a Substituída.` : `As versões ${substituidas.join(', ')} passam a Substituídas.`}
            </p>
          )}
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

/** Versões agrupadas por documento (e por aluno, para o orientador), do grupo mais recente ao mais antigo. */
function agrupar(docs: Documento[], porAluno: boolean) {
  const mapa = new Map<string, Documento[]>()
  for (const d of docs) {
    // por TCC + tipo: alunos com o mesmo nome não se misturam
    const chave = `${d.tccId}|${d.tipo}`
    mapa.set(chave, [...(mapa.get(chave) ?? []), d])
  }
  return [...mapa.entries()]
    .map(([chave, itens]) => {
      const ordenados = [...itens].sort((a, b) => b.versao - a.versao)
      return { chave, titulo: porAluno ? `${ordenados[0].tipo} · ${ordenados[0].alunoNome}` : ordenados[0].tipo, itens: ordenados }
    })
    .sort((a, b) => b.itens[0].enviadoEm.localeCompare(a.itens[0].enviadoEm))
}

/** Aluno: envia e consulta versões. Orientador: consulta entregas dos orientandos. */
export default function DocumentsPage() {
  const user = useCurrentUser()
  const isAluno = user.role === 'aluno'
  const { state, reload } = useAsync(async () => {
    const [documentos, tccs] = await Promise.all([listDocumentos(user), isAluno ? listTccs(user) : Promise.resolve([] as Tcc[])])
    return { documentos, tcc: tccs[0] }
  }, [user.id])

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAluno ? 'Documentos' : 'Entregas dos orientandos'}
        description={isAluno ? 'Envie as versões do seu trabalho. Abra uma versão para ver o retorno do orientador: comentários no texto e correções pedidas.' : 'Documentos enviados pelos seus orientandos, agrupados por documento e do mais recente ao mais antigo.'}
      />
      <DataBoundary
        state={state}
        reload={reload}
        isEmpty={(d) => !isAluno && d.documentos.length === 0}
        empty={{ title: 'Nenhuma entrega recebida' }}
      >
        {({ documentos, tcc }) => {
          const grupos = agrupar(documentos, !isAluno)
          return (
            <>
              {isAluno && (tcc ? <UploadForm tcc={tcc} documentos={documentos} onSent={reload} /> : <EmptyState title="Você ainda não tem um TCC vinculado" description="O envio de documentos libera quando o TCC e o orientador estiverem vinculados." />)}
              <SectionCard title={isAluno ? 'Versões enviadas' : 'Entregas recebidas'}>
                {grupos.length === 0 ? (
                  <p className="text-sm text-ink-muted">Nenhuma versão enviada ainda. Use o formulário acima para enviar a primeira.</p>
                ) : (
                  <div className="space-y-6">
                    {grupos.map((g) => (
                      <section key={g.chave} aria-label={g.titulo}>
                        <h3 className="mb-1 text-sm font-semibold text-ink-muted">
                          {g.titulo} <span className="font-normal">· {plural(g.itens.length, 'versão', 'versões')}</span>
                        </h3>
                        <DocumentList items={g.itens} hrefFor={(doc) => `/${user.role}/documentos/${doc.id}`} />
                      </section>
                    ))}
                  </div>
                )}
              </SectionCard>
            </>
          )
        }}
      </DataBoundary>
    </div>
  )
}
