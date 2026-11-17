import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, buttonClass, Icon, Modal, Tooltip } from "../design-system";
import { cn } from "../lib/format";
import type { Anotacao, FeedbackTipo, PosicaoPdf } from "../types";
import { PainelComentarios } from "./PainelComentarios";
import type { DestaqueVisual } from "./pdf/PaginaPdf";
import {
  VisualizadorPdf,
  type ControlePdf,
  type SelecaoPdf,
  type ZoomPdf,
} from "./pdf/VisualizadorPdf";

interface Props {
  url: string;
  /** Nome sugerido para o arquivo baixado. */
  nomeArquivo: string;
  anotacoes: Anotacao[];
  papel: "aluno" | "orientador";
  onCriar: (d: {
    tipo: FeedbackTipo;
    texto: string;
    posicao: PosicaoPdf;
    trecho?: string;
    imagem?: string;
  }) => Promise<void>;
  onResolver: (id: string, resolvida: boolean) => Promise<void>;
  onExcluir: (id: string) => Promise<void>;
}

/**
 * PDF com destaques e comentários, sobre o pdf.js. O orientador seleciona um trecho de texto, ou segura Alt e arrasta
 * para marcar uma área (figuras e PDF digitalizado). Só as páginas perto da tela são desenhadas.
 */
export default function DocumentoPdf({
  url,
  nomeArquivo,
  anotacoes,
  papel,
  onCriar,
  onResolver,
  onExcluir,
}: Props) {
  const ordenadas = useMemo(
    () =>
      anotacoes
        .filter((a) => a.posicaoPdf)
        .sort(
          (a, b) =>
            (a.posicaoPdf?.pageNumber ?? 0) - (b.posicaoPdf?.pageNumber ?? 0) ||
            (a.posicaoPdf?.boundingRect.y1 ?? 0) -
              (b.posicaoPdf?.boundingRect.y1 ?? 0),
        ),
    [anotacoes],
  );
  const destaques: DestaqueVisual[] = useMemo(
    () =>
      ordenadas.map((a, i) => ({
        id: a.id,
        numero: i + 1,
        pagina: a.posicaoPdf?.pageNumber ?? 1,
        rects: a.posicaoPdf?.rects ?? [],
        tipo: a.tipo,
        resolvida: a.resolvida,
      })),
    [ordenadas],
  );
  const orientador = papel === "orientador";
  const [pendente, setPendente] = useState<SelecaoPdf | null>(null);
  const [ativa, setAtiva] = useState<string>();
  const [aviso, setAviso] = useState<string>();
  // clique no trecho destacado: o painel abre o comentário por inteiro
  const [abrir, setAbrir] = useState<{ id: string; k: number }>();
  const [zoom, setZoom] = useState<ZoomPdf>("largura");
  const [escala, setEscala] = useState(1);
  const [paginas, setPaginas] = useState(0);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [cheia, setCheia] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [erroBaixar, setErroBaixar] = useState<string>();
  const raizRef = useRef<HTMLDivElement>(null);
  const controle = useRef<ControlePdf>(null);
  const visualizadorRef = useRef<HTMLDivElement>(null);

  // parte do zoom pedido (e não da escala já desenhada): cliques seguidos somam sem esperar o redesenho
  const ajustarZoom = (passo: number) =>
    setZoom((z) =>
      Math.min(
        4,
        Math.max(
          0.25,
          Math.round(((z === "largura" ? escala : z) + passo) * 100) / 100,
        ),
      ),
    );

  // Tela cheia: usa a API do navegador quando existe e, de qualquer forma, cobre a página (funciona também no celular).
  // O contêiner inclui o painel de comentários, então dá para comentar de dentro da tela cheia.
  const alternarTelaCheia = () => {
    if (cheia) {
      setCheia(false);
      if (document.fullscreenElement) void document.exitFullscreen();
    } else {
      setCheia(true);
      void raizRef.current?.requestFullscreen?.().catch(() => {});
    }
  };
  useEffect(() => {
    const aoMudar = () => {
      if (!document.fullscreenElement) setCheia(false);
    };
    document.addEventListener("fullscreenchange", aoMudar);
    return () => document.removeEventListener("fullscreenchange", aoMudar);
  }, []);
  useEffect(() => {
    if (!cheia) return;
    // Esc com um comentário aberto fecha só o comentário
    const aoTeclar = (e: KeyboardEvent) =>
      e.key === "Escape" &&
      !e.defaultPrevented &&
      !document.querySelector("dialog[open]") &&
      setCheia(false);
    document.addEventListener("keydown", aoTeclar);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = "";
    };
  }, [cheia]);

  const limparSelecao = () => {
    window.getSelection()?.removeAllRanges();
    setPendente(null);
    setAviso(undefined);
  };

  const aoSelecionar = useCallback((s: SelecaoPdf) => {
    setAviso(undefined);
    setPendente(s);
  }, []);

  const verNoDocumento = (id: string) => {
    setAtiva(id);
    const a = ordenadas.find((x) => x.id === id);
    // painel empilhado abaixo do PDF (telas estreitas): traz o visualizador para a tela antes de rolar dentro dele
    visualizadorRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
    if (a?.posicaoPdf)
      controle.current?.rolarPara(
        a.posicaoPdf.pageNumber,
        a.posicaoPdf.boundingRect.y1,
      );
  };
  const salvar = (href: string, nome: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = nome;
    a.click();
  };
  const baixarOriginal = () => {
    salvar(url, nomeArquivo);
    setBaixando(false);
  };
  const baixarComComentarios = async () => {
    setGerando(true);
    setErroBaixar(undefined);
    try {
      // a biblioteca que escreve no PDF só é baixada neste momento
      const { gerarPdfComComentarios } =
        await import("../lib/pdfComComentarios");
      const blob = await gerarPdfComComentarios(url, ordenadas);
      const href = URL.createObjectURL(blob);
      salvar(href, nomeArquivo.replace(/\.pdf$/i, "") + "-com-comentarios.pdf");
      window.setTimeout(() => URL.revokeObjectURL(href), 10_000);
      setBaixando(false);
    } catch (e) {
      setErroBaixar(
        e instanceof Error
          ? e.message
          : "Não foi possível gerar o PDF com comentários.",
      );
    } finally {
      setGerando(false);
    }
  };
  const aoClicarDestaque = (id: string) => {
    setAtiva(id);
    setAbrir((anterior) => ({ id, k: (anterior?.k ?? 0) + 1 }));
  };

  return (
    <div
      ref={raizRef}
      className={cn(
        cheia && "fixed inset-0 z-50 overflow-y-auto bg-surface p-4",
      )}
    >
      <div
        className={cn(
          "grid grid-cols-1 gap-6",
          cheia
            ? "lg:grid-cols-[minmax(0,1fr)_22rem]"
            : "xl:grid-cols-[minmax(0,1fr)_22rem]",
        )}
      >
        <div className="min-w-0 space-y-3">
          <div
            role="toolbar"
            aria-label="Controles do PDF"
            className="flex flex-wrap items-center gap-2"
          >
            <Tooltip texto="Diminuir o zoom">
              <button
                type="button"
                onClick={() => ajustarZoom(-0.15)}
                aria-label="Diminuir o zoom"
                className={buttonClass("secondary", "sm")}
              >
                <Icon name="minus" size={16} />
              </button>
            </Tooltip>
            <span
              className="min-w-12 text-center text-sm tabular-nums"
              aria-live="polite"
            >
              {Math.round(escala * 100)}%
            </span>
            <Tooltip texto="Aumentar o zoom">
              <button
                type="button"
                onClick={() => ajustarZoom(0.15)}
                aria-label="Aumentar o zoom"
                className={buttonClass("secondary", "sm")}
              >
                <Icon name="plus" size={16} />
              </button>
            </Tooltip>
            <button
              type="button"
              onClick={() => setZoom("largura")}
              className={buttonClass("ghost", "sm")}
            >
              Ajustar à largura
            </button>
            {paginas > 0 && (
              <span className="text-sm text-ink-muted tabular-nums">
                Página {Math.min(paginaAtual, paginas)} de {paginas}
              </span>
            )}
            <span className="flex-1" />
            <Tooltip texto="Baixar o PDF">
              <button
                type="button"
                onClick={() => {
                  setErroBaixar(undefined);
                  setBaixando(true);
                }}
                aria-label="Baixar o PDF"
                className={cn(
                  buttonClass("secondary", "sm"),
                  "min-w-11 px-0 sm:min-w-9",
                )}
              >
                <Icon name="download" size={16} />
              </button>
            </Tooltip>
            <Tooltip
              texto={cheia ? "Sair da tela cheia" : "Tela cheia"}
              alinhar="fim"
            >
              <button
                type="button"
                onClick={alternarTelaCheia}
                aria-pressed={cheia}
                aria-label={cheia ? "Sair da tela cheia" : "Tela cheia"}
                className={cn(
                  buttonClass("secondary", "sm"),
                  "min-w-11 px-0 sm:min-w-9",
                )}
              >
                <Icon name={cheia ? "shrink" : "expand"} size={16} />
              </button>
            </Tooltip>
          </div>

          <div
            ref={visualizadorRef}
            className="overflow-hidden rounded-card border border-border bg-surface-muted"
          >
            <VisualizadorPdf
              key={url}
              url={url}
              zoom={zoom}
              podeMarcar={orientador}
              destaques={destaques}
              pendente={pendente?.posicao ?? null}
              ativa={ativa}
              alturaClasse={
                cheia ? "h-[calc(100vh-7rem)]" : "h-[70vh] min-h-[26rem]"
              }
              controle={controle}
              onEscala={setEscala}
              onPaginas={setPaginas}
              onPaginaAtual={setPaginaAtual}
              onSelecionar={aoSelecionar}
              onAviso={setAviso}
              onClicarDestaque={aoClicarDestaque}
            />
          </div>
        </div>

        <div
          className={cn(
            cheia && "lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto",
          )}
        >
          <PainelComentarios
            ladoAlado={cheia ? "livre" : "xl"}
            anotacoes={ordenadas}
            papel={papel}
            pendente={
              pendente
                ? {
                    trecho: pendente.texto ?? "Área marcada na página",
                    imagem: pendente.imagem,
                  }
                : null
            }
            dicaSelecao="Selecione um trecho do PDF para comentar. Para marcar uma figura ou uma área, segure Alt e arraste."
            aviso={aviso}
            ativa={ativa}
            abrir={abrir}
            onVerNoDocumento={verNoDocumento}
            onCriar={async ({ tipo, texto }) => {
              if (!pendente) return;
              await onCriar({
                tipo,
                texto,
                posicao: pendente.posicao,
                trecho: pendente.texto?.slice(0, 500),
                imagem: pendente.imagem,
              });
              limparSelecao();
            }}
            onCancelarSelecao={limparSelecao}
            onResolver={onResolver}
            onExcluir={onExcluir}
          />
        </div>
      </div>

      <Modal
        open={baixando}
        title="Baixar o PDF"
        bloqueado={gerando}
        onClose={() => setBaixando(false)}
      >
        <div className="space-y-4 text-sm">
          {erroBaixar && (
            <p
              role="alert"
              className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-danger"
            >
              {erroBaixar}
            </p>
          )}
          <div className="space-y-1.5">
            <Button
              className="w-full"
              loading={gerando}
              disabled={ordenadas.length === 0}
              onClick={baixarComComentarios}
            >
              Baixar com comentários
            </Button>
            <p className="text-ink-muted">
              {ordenadas.length === 0
                ? "Este documento ainda não tem comentários."
                : "Trechos destacados e numerados, uma nota do PDF em cada comentário e uma página final com todos os comentários e respostas."}
            </p>
          </div>
          <div className="space-y-1.5">
            <Button
              className="w-full"
              variant="neutral"
              disabled={gerando}
              onClick={baixarOriginal}
            >
              Baixar sem comentários
            </Button>
            <p className="text-ink-muted">
              O arquivo original, do jeito que foi enviado.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              disabled={gerando}
              onClick={() => setBaixando(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
