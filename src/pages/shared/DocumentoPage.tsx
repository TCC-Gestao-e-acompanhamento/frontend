import { lazy, Suspense, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCurrentUser } from "../../auth/useAuth";
import { DocumentoAnotavel } from "../../components/DocumentoAnotavel";
import { FeedbackForm } from "../../components/FeedbackForm";
import { FeedbackList } from "../../components/FeedbackList";
import { StatusBadge } from "../../components/StatusBadge";
import {
  Button,
  DataBoundary,
  EmptyState,
  LoadingState,
  Modal,
  PageHeader,
  SectionCard,
} from "../../design-system";
import { useAsync } from "../../hooks/useAsync";
import {
  aprovarDocumento,
  createAnotacao,
  createAnotacaoPdf,
  deleteAnotacao,
  getDocumentoConteudo,
  listAnotacoes,
  listFeedbacks,
  resolverFeedback,
  responderAnotacao,
  setAnotacaoResolvida,
} from "../../services/api";

// O visualizador de PDF é pesado: só é baixado quando um documento em PDF é aberto.
const DocumentoPdf = lazy(() => import("../../components/DocumentoPdf"));

/** Documento com comentários em trechos. Orientador comenta; aluno responde e marca como resolvido. */
export default function DocumentoPage() {
  const user = useCurrentUser();
  const { id = "" } = useParams();
  const papel = user.role === "orientador" ? "orientador" : "aluno";
  const voltar =
    papel === "orientador" ? "/orientador/entregas" : "/aluno/documentos";

  const { state, reload } = useAsync(async () => {
    const [conteudo, anotacoes, todos] = await Promise.all([
      getDocumentoConteudo(user, id),
      listAnotacoes(user, id),
      listFeedbacks(user),
    ]);
    // correções e comentários gerais do orientador sobre esta versão (os comentários em trechos vêm em `anotacoes`)
    return {
      conteudo,
      anotacoes,
      gerais: todos.filter((f) => f.documentoId === id),
    };
  }, [user.id, id]);
  const [resolvendo, setResolvendo] = useState<string>();
  const [erroGeral, setErroGeral] = useState<string>();
  const [editandoId, setEditandoId] = useState<string>();
  const [aprovando, setAprovando] = useState(false);
  const [aprovandoEnvio, setAprovandoEnvio] = useState(false);
  const [erroAprovar, setErroAprovar] = useState<string>();

  const aprovar = async () => {
    setAprovandoEnvio(true);
    setErroAprovar(undefined);
    try {
      await aprovarDocumento(user, id);
      setAprovando(false);
      reload();
    } catch (e) {
      setErroAprovar(
        e instanceof Error ? e.message : "Não foi possível aprovar a versão.",
      );
    } finally {
      setAprovandoEnvio(false);
    }
  };

  const resolverGeral = async (fid: string) => {
    setResolvendo(fid);
    setErroGeral(undefined);
    try {
      await resolverFeedback(user, fid);
      reload();
    } catch (e) {
      setErroGeral(
        e instanceof Error
          ? e.message
          : "Não foi possível atualizar a correção.",
      );
    } finally {
      setResolvendo(undefined);
    }
  };

  return (
    <>
      <Link
        to={voltar}
        className="mb-1 inline-flex min-h-11 items-center text-sm text-brand-700 hover:underline"
      >
        ← Voltar para {papel === "orientador" ? "as entregas" : "os documentos"}
      </Link>
      <DataBoundary state={state} reload={reload}>
        {({ conteudo, anotacoes, gerais }) => {
          const d = conteudo.documento;
          return (
            <div className="space-y-6">
              <PageHeader
                title={`${d.nome}, versão ${d.versao}`}
                description={`${papel === "orientador" ? `${d.alunoNome} · ` : ""}${d.tipo} · enviado em ${d.enviadoEm.split("-").reverse().join("/")}`}
                actions={
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge kind="documento" value={d.status} />
                    {papel === "orientador" &&
                      d.status !== "aprovado" &&
                      d.ultimaVersao && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => {
                            setErroAprovar(undefined);
                            setAprovando(true);
                          }}
                        >
                          Aprovar versão
                        </Button>
                      )}
                  </div>
                }
              />

              {(gerais.length > 0 || papel === "orientador") && (
                <SectionCard
                  title="Retorno geral sobre esta versão"
                  description="Correções e comentários do orientador que não estão ligados a um trecho."
                >
                  {erroGeral && (
                    <p
                      role="alert"
                      className="mb-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
                    >
                      {erroGeral}
                    </p>
                  )}
                  {/* um único retorno geral por versão: criado uma vez e depois editado */}
                  {papel === "orientador" &&
                    gerais.length === 0 &&
                    d.status !== "aprovado" && (
                    <FeedbackForm
                      tccId={d.tccId}
                      documentoId={d.id}
                      onSaved={reload}
                    />
                  )}
                  {gerais.find((f) => f.id === editandoId) ? (
                    <FeedbackForm
                      tccId={d.tccId}
                      documentoId={d.id}
                      editando={gerais.find((f) => f.id === editandoId)}
                      onSaved={() => {
                        setEditandoId(undefined);
                        reload();
                      }}
                      onCancel={() => setEditandoId(undefined)}
                    />
                  ) : (
                    <FeedbackList
                      items={gerais}
                      acao={(f) =>
                        papel === "aluno" &&
                        f.tipo === "correcao" &&
                        !f.resolvido ? (
                          <Button
                            size="sm"
                            variant="success"
                            loading={resolvendo === f.id}
                            onClick={() => resolverGeral(f.id)}
                          >
                            Marcar como resolvida
                          </Button>
                        ) : papel === "orientador" &&
                          d.status !== "aprovado" ? (
                          <Button
                            size="sm"
                            variant="neutral"
                            onClick={() => setEditandoId(f.id)}
                          >
                            Editar
                          </Button>
                        ) : null
                      }
                    />
                  )}
                </SectionCard>
              )}
              {d.arquivoUrl ? (
                <Suspense
                  fallback={
                    <LoadingState label="Carregando o visualizador de PDF…" />
                  }
                >
                  <DocumentoPdf
                    url={d.arquivoUrl}
                    nomeArquivo={`${d.nome}-v${d.versao}.pdf`}
                    anotacoes={anotacoes}
                    papel={papel}
                    onCriar={async (dados) => {
                      await createAnotacaoPdf(user, {
                        documentoId: id,
                        ...dados,
                      });
                      reload();
                    }}
                    onResponder={async (aid, texto) => {
                      await responderAnotacao(user, aid, texto);
                      reload();
                    }}
                    onResolver={async (aid, resolvida) => {
                      await setAnotacaoResolvida(user, aid, resolvida);
                      reload();
                    }}
                    onExcluir={async (aid) => {
                      await deleteAnotacao(user, aid);
                      reload();
                    }}
                  />
                </Suspense>
              ) : conteudo.paragrafos.length === 0 ? (
                <EmptyState
                  title="Sem texto para exibir"
                  description="Este arquivo não tem uma pré-visualização."
                />
              ) : (
                <DocumentoAnotavel
                  paragrafos={conteudo.paragrafos}
                  anotacoes={anotacoes}
                  papel={papel}
                  onCriar={async (dados) => {
                    await createAnotacao(user, { documentoId: id, ...dados });
                    reload();
                  }}
                  onResponder={async (aid, texto) => {
                    await responderAnotacao(user, aid, texto);
                    reload();
                  }}
                  onResolver={async (aid, resolvida) => {
                    await setAnotacaoResolvida(user, aid, resolvida);
                    reload();
                  }}
                  onExcluir={async (aid) => {
                    await deleteAnotacao(user, aid);
                    reload();
                  }}
                />
              )}
              <Modal
                open={aprovando}
                title={`Aprovar a versão ${d.versao}?`}
                bloqueado={aprovandoEnvio}
                onClose={() => setAprovando(false)}
              >
                <div className="space-y-4 text-sm">
                  <p>
                    {d.nome}, versão {d.versao}, ficará como <strong>Aprovada</strong>
                    {papel === "orientador" ? ` para ${d.alunoNome}` : ""}. Neste protótipo, a aprovação não pode ser desfeita.
                  </p>
                  {(d.correcoesPendentes ?? 0) > 0 && (
                    <p className="rounded-lg bg-warning/10 p-3 text-warning">
                      Ainda há{" "}
                      {d.correcoesPendentes === 1
                        ? "1 correção pendente"
                        : `${d.correcoesPendentes} correções pendentes`}{" "}
                      nesta versão.
                    </p>
                  )}
                  {erroAprovar && (
                    <p
                      role="alert"
                      className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-danger"
                    >
                      {erroAprovar}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="success"
                      loading={aprovandoEnvio}
                      onClick={aprovar}
                    >
                      Aprovar versão
                    </Button>
                    <Button
                      variant="neutral"
                      disabled={aprovandoEnvio}
                      onClick={() => setAprovando(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Modal>
            </div>
          );
        }}
      </DataBoundary>
    </>
  );
}
