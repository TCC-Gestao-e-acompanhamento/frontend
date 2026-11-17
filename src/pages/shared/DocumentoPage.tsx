import { lazy, Suspense, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCurrentUser } from "../../auth/useAuth";
import { DocumentoAnotavel } from "../../components/DocumentoAnotavel";
import { FeedbackForm } from "../../components/FeedbackForm";
import { FeedbackList } from "../../components/FeedbackList";
import { StatusBadge } from "../../components/StatusBadge";
import {
  Button,
  buttonClass,
  DataBoundary,
  EmptyState,
  LoadingState,
  Icon,
  Modal,
  PageHeader,
  SectionCard,
  Tooltip,
} from "../../design-system";
import { useAsync } from "../../hooks/useAsync";
import { cn, formatDate } from "../../lib/format";
import {
  aprovarDocumento,
  createAnotacao,
  createAnotacaoPdf,
  deleteAnotacao,
  deleteFeedback,
  getDocumentoConteudo,
  listAnotacoes,
  listFeedbacks,
  resolverFeedback,
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
  const navigate = useNavigate();
  // aviso de versão substituída: dispensado por documento (abrir outra versão mostra o aviso dela)
  const [avisoDispensadoId, setAvisoDispensadoId] = useState<string>();
  // trocar de documento zera o aviso: ao voltar para uma versão substituída ele aparece de novo
  const [idVisto, setIdVisto] = useState(id);
  if (idVisto !== id) {
    setIdVisto(id);
    setAvisoDispensadoId(undefined);
  }
  const [editandoId, setEditandoId] = useState<string>();
  const [apagandoId, setApagandoId] = useState<string>();
  const [apagandoEnvio, setApagandoEnvio] = useState(false);
  const [erroApagar, setErroApagar] = useState<string>();

  const apagarGeral = async () => {
    if (!apagandoId) return;
    setApagandoEnvio(true);
    setErroApagar(undefined);
    try {
      await deleteFeedback(user, apagandoId);
      setApagandoId(undefined);
      setEditandoId(undefined);
      reload();
    } catch (e) {
      setErroApagar(
        e instanceof Error ? e.message : "Não foi possível apagar o retorno.",
      );
    } finally {
      setApagandoEnvio(false);
    }
  };
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
          // versão aprovada ou substituída por outra mais nova não recebe mais retorno geral
          const versaoAberta = d.status === "pendente_revisao" || d.status === "correcao";
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
                  action={
                    papel === "orientador" &&
                    versaoAberta &&
                    gerais.length > 0 &&
                    !editandoId ? (
                      <div className="flex items-center gap-2">
                        <Tooltip texto="Editar o retorno geral">
                          <button
                            type="button"
                            onClick={() => setEditandoId(gerais[0].id)}
                            aria-label="Editar o retorno geral"
                            className={cn(buttonClass("neutral", "sm"), "min-w-11 px-0 sm:min-w-9")}
                          >
                            <Icon name="pencil" size={16} />
                          </button>
                        </Tooltip>
                        <Tooltip texto="Excluir o retorno geral" alinhar="fim">
                          <button
                            type="button"
                            onClick={() => {
                              setErroApagar(undefined);
                              setApagandoId(gerais[0].id);
                            }}
                            aria-label="Excluir o retorno geral"
                            className={cn(buttonClass("danger-quiet", "sm"), "min-w-11 px-0 sm:min-w-9")}
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </Tooltip>
                      </div>
                    ) : undefined
                  }
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
                    versaoAberta && (
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
                open={papel === "orientador" && d.status === "substituida" && !!d.versaoMaisRecente && avisoDispensadoId !== d.id}
                title="Há um arquivo mais recente"
                onClose={() => setAvisoDispensadoId(d.id)}
              >
                {d.versaoMaisRecente && (
                  <div className="space-y-4 text-sm">
                    <p>
                      Esta é a versão {d.versao} de {d.nome}, que foi{" "}
                      <strong>substituída</strong>. {d.alunoNome} enviou a{" "}
                      <strong>versão {d.versaoMaisRecente.versao}</strong> em{" "}
                      {formatDate(d.versaoMaisRecente.enviadoEm)}. Comentários e
                      retorno devem ir na versão mais recente.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => {
                          setAvisoDispensadoId(d.id);
                          navigate(`/orientador/documentos/${d.versaoMaisRecente?.id}`);
                        }}
                      >
                        Abrir a versão {d.versaoMaisRecente.versao}
                      </Button>
                      <Button
                        variant="neutral"
                        onClick={() => setAvisoDispensadoId(d.id)}
                      >
                        Continuar nesta versão
                      </Button>
                    </div>
                  </div>
                )}
              </Modal>
              <Modal
                open={!!apagandoId}
                title="Excluir o retorno geral?"
                bloqueado={apagandoEnvio}
                onClose={() => setApagandoId(undefined)}
              >
                <div className="space-y-4 text-sm">
                  <p>
                    O retorno geral desta versão será apagado e você poderá
                    escrever outro. Não dá para desfazer.
                  </p>
                  {erroApagar && (
                    <p
                      role="alert"
                      className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-danger"
                    >
                      {erroApagar}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="danger"
                      loading={apagandoEnvio}
                      onClick={apagarGeral}
                    >
                      Excluir
                    </Button>
                    <Button
                      variant="neutral"
                      disabled={apagandoEnvio}
                      onClick={() => setApagandoId(undefined)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Modal>
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
