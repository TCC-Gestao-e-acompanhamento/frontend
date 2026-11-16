# Protótipo — arquitetura da informação, decisões e hipóteses

> Todos os dados são fictícios (`src/mocks/data.ts`).

## Como rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build
```

Na tela `/entrar` escolha um perfil de demonstração. Em qualquer tela, o bloco
**"Protótipo · simular estado"** (menu lateral / rodapé público) alterna os
estados de carregamento, erro e vazio via `?mock=loading|error|empty`.

## Mapa de páginas

### Área pública (sem login)

| Rota                | Conteúdo                                                                      |
| ------------------- | ----------------------------------------------------------------------------- |
| `/`                 | Apresentação, indicadores agregados do semestre, próximas defesas, calendário |
| `/bancas`           | Bancas públicas (agendadas e realizadas)                                      |
| `/orientadores`     | Busca de orientadores (nome, curso, área, só quem recebe solicitações)        |
| `/orientadores/:id` | Perfil público do professor + botão "Solicitar orientação"                    |
| `/calendario`       | Prazos institucionais                                                         |
| `/entrar`           | Login (simulado) → redireciona para a visão do perfil                         |

### Aluno (`/aluno`)

Início (RF01, RF04) · Solicitações de orientação (formulário, lista, detalhe, cancelar) · Etapas do TCC (RF02) · Cronograma e atividades pendentes (RF03, RF04) ·
Documentos: enviar e consultar versões (RF05, RF06) · Feedbacks (RF07) · Banca (RF10)

### Orientador (`/orientador`)

Início (dashboard, com solicitações pendentes e aceitar/recusar) · Solicitações recebidas (pendentes e histórico) · Perfil público (áreas, cursos, disponibilidade, pré-visualização) · Orientandos (RF11, RF12, RF17) → detalhe do TCC com abas
Etapas / Cronograma / Documentos / Feedbacks + registro de feedback (RF14, RF15, RF16) ·
Cronogramas (RF13) · Entregas (RF14) · Bancas (RF20)

### Coordenação (`/coordenacao`)

Início (dashboard institucional) · TCCs com filtros (RF21, RF22, RF26) → detalhe somente leitura ·
Orientadores e orientandos (RF23) · Etapas e prazos (RF24) · Bancas (RF25)

**Fora desta primeira versão** (prioridade média ou dependem de decisão): notificações (RF09, RF19),
histórico de orientações/reuniões (RF08, RF18), relatórios e indicadores avançados (RF29, RF30),
resultados finais (RF28), documentos na coordenação (RF27).

## Módulo de busca e solicitação de orientação (seção 11)

Fluxo implementado: visitante busca em `/orientadores` → abre o perfil → "Solicitar orientação" →
`/aluno/solicitar/:professorId`. Sem login, `RequireRole` envia para `/entrar` guardando o destino
(`state.from`); após entrar como aluno, volta ao formulário **do mesmo professor** (o professor vai
na URL). Aluno envia (status _Pendente_) → professor aceita/recusa pelo dashboard, pela lista ou pelo
detalhe, com mensagem opcional (modal `<dialog>` nativo) → aluno vê status e resposta e pode
cancelar enquanto _Pendente_.

Regras na API simulada (devem existir no backend): só aluno envia; só o professor destinatário responde;
aluno só vê/cancela as próprias; professor só vê as recebidas; bloqueio de duplicata pendente para o
mesmo professor (409); disponibilidade do professor é checada no envio (409); só _Pendente_ muda de estado (409).
A área pública devolve apenas nome, cursos, áreas, apresentação e disponibilidade (sem e-mail, sem dados de alunos).
Áreas de orientação vêm de um catálogo editável (não fixo no código): o professor cria áreas novas no perfil.

Demonstração: o login tem só um cartão por perfil; a aplicação identifica pelos dados se o aluno já tem TCC/orientador
(sem TCC, o painel mostra a busca de orientador e as solicitações). O aluno de demonstração (com TCC) pode enviar
solicitações; o Prof. Carlos tem 2 solicitações pendentes e 1 aceita; a Profa. Helena aparece "sem vagas".
O caso "aluno sem TCC" usa o usuário `a8` dos mocks (não exposto no login).

**Fora do escopo:** notificações (hoje só contador no painel e status na lista), mensagens em tempo real,
recomendação automática de orientadores.

## Reuso entre perfis

Uma aplicação, um shell (`AppShell`), um Design System (`src/design-system`).
Páginas compartilhadas que mudam conforme `user.role`:

| Componente de página | Aluno              | Orientador                  | Coordenação               |
| -------------------- | ------------------ | --------------------------- | ------------------------- |
| `SchedulePage`       | próprio cronograma | cronogramas dos orientandos | —                         |
| `DocumentsPage`      | envia + consulta   | consulta entregas           | —                         |
| `TccListPage`        | —                  | orientandos                 | todos + coluna orientador |
| `TccDetailPage`      | —                  | + formulário de feedback    | somente leitura           |
| `BancasPage`         | a sua              | dos orientandos             | todas                     |

Componentes de domínio reutilizados: `StatusBadge`, `ActivityList`, `DocumentList`,
`FeedbackList`, `TccTable`, `BancaCard`, `DeadlineList`.

## Preparação para a API NestJS

- `src/services/api.ts` concentra **todas** as chamadas; cada função = endpoint futuro.
  Trocar por `fetch`/cliente HTTP não afeta as páginas.
- A API simulada **verifica permissão** (`403`) para imitar o backend. Esconder item no
  frontend não substitui validação no servidor.
- `src/types/index.ts` espelha o que o backend deve devolver; campos como `status`,
  `progresso` e `pendencias` são **derivados no "backend"**, não na tela.
- `useAsync` + `DataBoundary` padronizam carregamento / erro / vazio.
- Login simulado em `src/auth`; será substituído por autenticação real.

## Bibliotecas

Aprovadas: **Vite**, **React Router**. Nenhuma outra foi adicionada
(sem biblioteca de formulários, validação, estado global ou ícones — formulários
usam estado local e os ícones são SVG inline).
Candidatas a recomendar antes de adotar: validação/formulários (ex.: React Hook Form + Zod)
quando os formulários crescerem; cache de dados (ex.: TanStack Query) ao integrar a API.

## Hipóteses e decisões a confirmar

1. **Dados públicos**: a página pública mostra título, nome do aluno, composição e local das
   defesas. Confirmar com a coordenação/regulamento da UnB (e LGPD) o que pode ser divulgado,
   e se o nome do aluno deve aparecer.
2. **Etapas do TCC**: as 8 etapas (4 do TCC 1, 4 do TCC 2) são **genéricas**. Validar com o
   regulamento e os questionários.
3. **Situação do TCC** (Em andamento / Prazo próximo / Atrasado): regra provisória — atrasado se há
   atividade atrasada; prazo próximo se há pendência com prazo em ≤ 7 dias.
4. **Progresso**: calculado pela etapa atual (etapas concluídas / 8). Pode não refletir esforço real.
5. **Orientador** envia documentos? **Coordenação** envia documentos? (tabela de funcionalidades marca "a definir") — nesta versão, não.
6. **Coordenação**: ações administrativas (cadastrar TCC, alterar vínculos, aprovar bancas)
   **não** foram implementadas; as telas avisam que dependem de confirmação institucional.
7. **Cronograma × atividades pendentes** foram unidos numa só tela com filtro (padrão: pendentes).
   Validar se alunos preferem telas separadas.
8. **Correção resolvida**: o aluno pode marcar uma correção como resolvida (botão em Feedbacks). Falta definir se o orientador precisa confirmar.
9. **Calendário institucional** visível ao público — confirmar.
10. **Lista pública de professores**: quais professores aparecem (todos que optarem? só os cadastrados pela coordenação?) e
    se o nome do professor pode ser público. Os cursos do mock são ilustrativos.
11. **Aceite não vincula**: o aceite só registra o interesse. O processo de vinculação aluno–orientador–TCC (e quem o conclui)
    precisa ser confirmado com as regras da UnB. Não há criação automática de TCC.
12. **Múltiplas solicitações simultâneas**: hoje só se bloqueia duplicata pendente para o _mesmo_ professor; limite de
    solicitações abertas por aluno, vagas por professor e prazo de resposta estão em aberto.
13. **Recusa**: justificativa opcional (a spec diz "justificativa ou mensagem"). Validar se deve ser obrigatória.
14. **Campos do formulário** são a proposta inicial da seção 11.4; ajustar após validação.
15. **Notificações** (RF09/RF19 e itens 10 e 13 do fluxo 11.3) ainda não implementadas.

## Identidade visual

Fundo branco, azul UnB `#003366` (primária) e verde UnB `#006633` (apoio/sucesso). Tokens em
`src/index.css` (`@theme`). O logo em `public/logo-unb.svg` é uma **reprodução aproximada** do
símbolo: substituir pelo arquivo oficial e conferir as regras de uso da marca.

## Acessibilidade (já considerado)

Link "ir para o conteúdo", landmarks, `aria-current`, abas com setas, foco visível, rótulos
associados a campos e erros, estado nunca indicado só por cor, alvos de toque ≥ 44px.
Pendente: teste com leitor de tela e auditoria de contraste final.

## Revisão de fluxos e textos (impeccable `clarify` + auditoria)

Mudanças feitas a partir da revisão dos fluxos de visitante, aluno, orientador e coordenação:

- **Início público**: removido o rótulo acima do título e a imagem decorativa; o hero tem uma ação principal
  ("Encontrar orientador") e um bloco "Como pedir orientação" em 3 passos, que explica o fluxo antes do login.
- **Indicadores** agrupados numa moldura única (sem cartões iguais); removido indicador repetido.
- **Painel do aluno**: "Próximos prazos" e "Atividades pendentes" mostravam os mesmos itens; viraram "O que fazer agora".
- **Solicitar orientação**: se já existe solicitação pendente ao mesmo professor, a tela avisa e leva a ela,
  em vez de deixar preencher o formulário e falhar no envio.
- **Cancelar solicitação**: pede confirmação com consequência explícita; após cancelar ou recusar, oferece "Buscar outro orientador".
- **Responder solicitação** (orientador): confirmação visível após aceitar/recusar e a lista atualiza sem piscar o esqueleto.
- **Rótulos**: "Atenção" → "Prazo próximo" (dizia pouco); "Solicitações de orientação" → "Solicitações" no menu;
  "Orientadores" da coordenação → "Vínculos" (evita confusão com a busca pública); plurais corretos (sem "(s)").
- **Menu do aluno** ganhou "Buscar orientador"; toda área logada tem "Ir para o site público".
- **Título da aba** muda por página; menu lateral em camada neutra própria; seleção de texto, cursor e números
  tabulares temados; `prefers-reduced-motion` respeitado.

Ainda em aberto: notificações, contador de pendentes no menu do orientador.

## Segunda rodada: início e calendário

- **Início** deixou de ser todo branco e de mostrar tudo de uma vez: faixa azul UnB com uma ação principal e o passo a passo
  do pedido de orientação; um bloco "Próximas datas" (prazos e defesas juntos, 4 itens); faixa cinza com atalhos por
  área de interesse (`/orientadores?area=...`). As defesas completas ficam em `/bancas`.
- **Calendário acadêmico** (`/calendario`): próximo evento em destaque, filtros (Prazos TCC 1, Prazos TCC 2, Defesas),
  visão Mês (com painel do dia) ou Lista por mês, e exportação `.ics` para agenda pessoal. A categoria sempre aparece
  em texto, não só em cor.
- **Cronograma** (aluno e orientador): alternância Lista / Calendário, reaproveitando o componente `Calendar`
  do Design System.
- **Novo fluxo**: aluno marca uma correção como resolvida (`resolverFeedback` na API simulada).

## Inscrição no TCC (coordenação, aluno, orientador)

Substitui o Google Forms da coordenação. Campos do formulário original: nome, matrícula, orientador (nome + e-mail da UnB) e
TCC 1 ou 2.

- **Coordenação** (`/coordenacao/inscricoes`): define semestre, início e fim do período; vê os inscritos com filtro e
  busca, **edita (TCC e orientador) ou cancela qualquer inscrição, em qualquer data** (cancelar pede confirmação), contadores e exportação **CSV** (separador `;`, com proteção contra injeção de fórmula). O período vira eventos no
  calendário público e um aviso na página inicial.
- **Aluno** (`/aluno/inscricao`): nome e matrícula vêm da conta; escolhe TCC 1/2 e o orientador numa lista de professores
  cadastrados, ou informa nome + e-mail da UnB se o professor não estiver na lista. Se já tem orientação aceita numa
  solicitação, o professor vem sugerido. **Depois de enviada, o aluno não edita nem cancela**: só a coordenação
  (a tela do aluno avisa isso). Antes/depois do período, a tela explica em vez de mostrar o formulário. O painel do
  aluno mostra faixa de destaque.
- **Orientador** (`/orientador/inscricoes`): lista de quem o indicou no semestre, contador no menu e faixa no painel;
  "Estou ciente" registra a ciência (a coordenação vê "Ciente" / "Aguardando ciência"). Professor fora do sistema é
  avisado **por e-mail (simulado)**; o aviso real é do backend.
- Regras na API simulada (backend deve repetir): só aluno se inscreve; só dentro do período (409 antes/depois); uma inscrição
  ativa por aluno no semestre; **só a coordenação edita/cancela** (aluno recebe 403); orientador só vê as que o citam e não vê o e-mail digitado;
  só a coordenação define o período (datas válidas, fim ≥ início); trocar de orientador reinicia a ciência.
- Privacidade: a lista pública de professores continua sem e-mail; ao escolher da lista, o e-mail é preenchido pelo servidor.

Hipóteses a confirmar: (16) um período único por semestre vale para TCC 1 e TCC 2; (17) e-mail do orientador deve terminar em
`unb.br` (inclui subdomínios); (18) a inscrição não exige aprovação da coordenação nesta versão; (19) cancelar mantém o
registro (status cancelada) mas some das listas, e o aluno pode se inscrever de novo se o período estiver aberto; (20) estar "ciente" não é aceite institucional; (21) o aluno pode se
inscrever sem ter feito solicitação de orientação na plataforma.

## Registro de orientações e comentários em documentos

Responde à hipótese H4 (documentos, feedbacks e histórico das orientações reunidos no sistema).

- **Registro de orientações** (orientador): na aba "Orientações" do detalhe do TCC (`/orientador/orientandos/:id`), o
  orientador registra a reunião (data, presencial ou online, o que foi tratado, combinados e próximo encontro). Só reuniões já
  realizadas (data de hoje ou anterior); só o orientador do TCC registra (aluno e coordenação consultam).
- **Histórico** (`/aluno/historico` e a mesma aba para orientador e coordenação): linha do tempo única com reuniões, entregas,
  feedbacks e comentários em documentos, do mais recente ao mais antigo, agrupada por mês.
- **Documento com comentários** (`/aluno/documentos/:id` e `/orientador/documentos/:id`): o orientador seleciona um trecho
  (ou comenta o parágrafo inteiro) e escreve um comentário ou pede correção; o trecho fica destacado e numerado (a cor não é o
  único sinal). O aluno vê os destaques, responde e marca como resolvido; o orientador pode reabrir. A lista de documentos
  mostra quantos comentários há e quantos estão abertos.
- **Regras na API simulada** (o backend deve repetir): só o orientador do TCC comenta; um trecho não pode ter dois comentários
  sobrepostos (409); posições validadas contra o texto (422); só aluno e orientador respondem; só o aluno marca como resolvido e
  só o orientador reabre; coordenação não acessa o visualizador.

**Editar o documento no sistema?** O protótipo faz *revisão* (comentar trechos), não *edição*: o texto fica protegido e o
aluno envia uma nova versão. Edição colaborativa (estilo Google Docs) exige editor de texto rico e backend em tempo real, fora
do escopo atual. Exibir PDFs reais com marcações exigiria uma biblioteca de leitura de PDF (ex.: pdf.js), que precisa de
aprovação antes de entrar no projeto. Hoje o conteúdo exibido é um texto de exemplo.

Hipóteses a confirmar: (22) o orientador pode comentar qualquer versão enviada ou só a mais recente; (23) o registro de
reunião pode ser editado ou apagado depois; (24) o aluno pode pedir ao orientador para reabrir/ajustar um comentário; (25) a
coordenação precisa ver os comentários dos documentos.

### Situação das hipóteses H1–H4 (Lean UX)

| Hipótese | Situação no protótipo |
|---|---|
| H1: normas/procedimentos + lista de orientadores | Lista de orientadores completa. **Falta a página de normas e procedimentos do TCC** (depende do conteúdo oficial) |
| H2: solicitar e responder orientação | Completo |
| H3: etapas + cronograma + prazos | Completo (etapas genéricas, a validar) |
| H4: documentos + feedbacks + histórico | Completo, incluindo registro de orientações e comentários em trechos |

## Documentos em PDF com comentários

- **Envio de PDF**: o aluno envia um PDF real (até 20 MB; só `.pdf`) em Documentos. No protótipo o arquivo fica só na memória
  do navegador (some ao recarregar); no sistema final vai para o servidor.
- **Comentários no PDF** (`/aluno/documentos/:id`, `/orientador/documentos/:id`): o orientador seleciona um trecho de texto, ou
  segura **Alt** e arrasta para marcar uma área (figuras, gráficos ou PDF digitalizado), e escreve um comentário ou pede correção.
  O destaque ganha um número igual ao do painel lateral. O aluno vê os destaques, responde e marca como resolvido; o orientador
  reabre. O painel de comentários é o mesmo do documento em texto.
- **PDFs de exemplo**: `public/exemplos/` (gerados com LaTeX). Todos os documentos de exemplo abrem no mesmo visualizador de PDF,
  para aluno e orientador (monografias usam `monografia-exemplo.pdf`; os demais, `capitulo-exemplo.pdf`). Os comentários de
  exemplo já vêm posicionados no PDF. O visualizador em texto (`DocumentoAnotavel`) fica só como reserva para documento sem arquivo.
- **Biblioteca**: `pdfjs-dist` 4.10.38 (Apache-2.0), usado direto, com visualizador próprio (`src/components/pdf/`). A versão
  anterior usava `react-pdf-highlighter`, trocada porque os destaques não apareciam de forma confiável e porque ela cria uma raiz
  React por página, o que trava com PDFs longos. O worker do pdf.js é servido pelo próprio site (sem CDN) e o visualizador só é
  baixado quando um PDF é aberto. **Desvio do combinado**: a biblioteca aprovada era a `react-pdf-highlighter`; o `pdfjs-dist` é
  a base dela e já era dependência indireta. Se preferir voltar, é só pedir. O `npm audit` apontava falhas no `tar`, resolvidas
  com `overrides` no `package.json`. Antes de produção, reavaliar a versão do pdf.js, porque o sistema final vai abrir PDFs
  enviados por usuários.
- **PDFs longos (100 páginas ou mais)**: só as páginas perto da área visível são desenhadas (imagem e texto selecionável); as
  outras ficam como espaço vazio do tamanho certo e liberam memória ao sair de perto. Teste feito com um PDF de 100 páginas:
  ~2 páginas desenhadas por vez, salto para o meio do documento em ~0,4 s, cerca de 41 MB de memória do JavaScript.
- **Destaques**: os trechos comentados ficam coloridos (azul = comentário, laranja = correção, verde = resolvido) e ganham o
  número do comentário; clicar no número leva ao comentário no painel, e "Ver no documento" rola até o trecho. As posições são
  guardadas em pontos do PDF, junto do tamanho da página, então valem em qualquer zoom.
- **Marcar área**: segurar Alt e arrastar, para figuras e PDF digitalizado; guarda um recorte da área. (Não há botão na barra; no
  celular, sem tecla Alt, só a seleção de texto está disponível. Hipótese 35: a marcação de área precisa de um jeito próprio no toque.)
- **Barra do PDF**: Baixar e Tela cheia só com ícone, com dica ao passar o mouse e rótulo para leitor de tela.
- **Painel de comentários**: lista com rolagem própria. Botões com cor de fundo (azul = responder, verde = marcar como resolvido,
  cinza = ver no documento e reabrir, contorno com texto vermelho = apagar). Status **Aberto em verde**, Resolvido em cinza (o
  destaque de comentário resolvido no PDF também fica cinza). O orientador, autor do comentário, só vê "Responder" depois que o aluno responde. O cartão mostra o texto resumido; **clicar nele abre o comentário inteiro** (trecho, texto,
  respostas, ações). O orientador exclui os próprios comentários (lixeira, com confirmação; as respostas vão junto). Hipótese
  (34): só quem escreveu apaga, e o aluno não vê o histórico de comentários excluídos.
- **Limitação conhecida**: PDF com páginas de tamanhos diferentes usa o tamanho da página 1 para o ajuste de largura e para "Página X de N".
- **Limitações**: a seleção de trecho no PDF depende do mouse ou do toque (o texto de PDF não é navegável por teclado como o
  documento em texto); PDF só com imagem exige a marcação por área; comentários ficam presos à versão do arquivo.
- **Comentários mantidos**: o orientador comenta uma versão específica; a dúvida sobre comentar versões antigas continua (hipótese 22).

Hipóteses a confirmar: (26) tamanho máximo do PDF e formatos aceitos além de PDF; (27) o aluno pode substituir um PDF já enviado
ou só enviar nova versão; (28) o orientador precisa baixar o PDF com as marcações (hoje os comentários vivem só no sistema).

## Ajustes no perfil do aluno (16/11)

- **Menu**: removido "Buscar orientador" (a busca continua pública, e o aluno chega a ela pela tela Solicitações e pelo site público).
- **Inscrição**: as opções TCC 1 / TCC 2 ficaram só com o nome, sem a descrição.
- **Solicitar orientação**: novo campo obrigatório "Semestre pretendido" (semestre atual e os dois seguintes), mostrado também no
  detalhe e na lista de solicitações do aluno e do orientador.
- **Banca proposta pelo aluno** (`/aluno/banca`): o aluno informa membros (de 1 a 6, com papel e instituição) e, opcionalmente, data e
  local. A banca fica como **"Proposta do aluno"**: não é pública (só bancas agendadas ou realizadas aparecem no site e no calendário)
  e o aluno pode editar ou cancelar (com confirmação) enquanto for proposta. Depois de confirmada, só a coordenação altera.
  Orientador e coordenação já veem a proposta na lista de bancas. **Ainda não existe a ação da coordenação para confirmar a banca**,
  porque o procedimento institucional precisa ser confirmado.
- **PDF**: barra de controles com zoom − / + (e "Ajustar à largura"), **Baixar** e **Tela cheia**. A tela cheia inclui o painel de
  comentários, então dá para marcar e comentar sem sair dela (Esc ou o botão fecham). A seleção de texto no PDF deixou de pintar o
  texto por cima da página (a cor de seleção do tema afetava a camada invisível de texto do pdf.js).

Hipóteses a confirmar: (29) o aluno pode propor banca em TCC 1 ou só em TCC 2; (30) quantos membros e quais papéis a banca exige;
(31) quem confirma a banca (coordenação?) e o que muda no calendário público depois; (32) o orientador precisa aprovar a proposta antes
da coordenação; (33) o semestre pretendido deve acompanhar o período de inscrição (ex.: sugerir só o semestre do período aberto).

**Nota de uso**: os dados do protótipo ficam só na memória do navegador. Alterar o código com o site aberto (modo de desenvolvimento)
ou recarregar a página reinicia esses dados, e então um documento enviado antes pode "não ser encontrado" ao comentar.

## Documentos e feedbacks em um fluxo só (aluno)

- O item **Feedbacks** saiu do menu do aluno; `/aluno/feedbacks` redireciona para Documentos. Todo o retorno do orientador fica no documento:
  a lista de **Documentos** mostra, por versão, comentários abertos e correções pendentes; a **linha inteira** abre o documento.
- No documento: bloco **Retorno geral sobre esta versão** (correções e comentários sem trecho; o aluno marca a correção como resolvida
  ali) e, abaixo, o PDF com os comentários em trechos. O painel inicial do aluno aponta para Documentos.
- Estados abertos em verde (Aberto, Pendente) e concluídos em cinza (Resolvido, Resolvida), nas duas listas.
- O seletor "Protótipo · simular estado" está **comentado** em `AppShell.tsx` e `PublicLayout.tsx` (para prints); descomente as duas
  linhas e o `import` para voltar. Os estados continuam acessíveis por `?mock=loading|error|empty` na URL.

## Baixar o PDF com comentários

- O botão Baixar (só ícone, com dica) abre um modal: **com comentários** ou **sem comentários** (o original). Com comentários fica
  desabilitado quando não há nenhum.
- O PDF com comentários é gerado no navegador, sem alterar o original: trechos destacados (azul = comentário, laranja = correção,
  cinza = resolvido), número na margem esquerda, uma **nota do PDF** (anotação padrão) na margem direita com autor, texto e respostas,
  e uma **página final** listando tudo (útil para imprimir). Caracteres fora do alfabeto latino (emoji, por exemplo) viram "?".
- **Biblioteca** (aprovada pela autora em 16/11): `pdf-lib` 1.17.1 (MIT, JS puro), baixada só ao pedir "com comentários" (pacote próprio, ~420 KB). PDF protegido
  por senha ou danificado não recebe comentários: o modal avisa e oferece o original.
- Limitação: os destaques são desenhados no conteúdo da página (não são destaques editáveis do leitor de PDF). A posição respeita
  área visível (CropBox) e giro da página; em página girada o número na margem não é desenhado (a nota e o destaque ficam). Hipótese 36: o orientador precisa do PDF com marcações para entregar ao aluno fora do sistema.

## Status do documento e aprovação de versão

- **Três status**: *Pendente revisão* (estado inicial de toda versão enviada), *Correção solicitada* e *Aprovada*. Saíram "Enviado" e "Em análise".
- **Como muda** (hipótese 37, a confirmar com orientadores):
  - o aluno envia uma versão: **Pendente revisão**;
  - o orientador pede uma correção (comentário em trecho ou retorno geral do tipo "Solicitar correção"): **Correção solicitada**. Resolver as
    correções não muda o status; o aluno envia uma nova versão, que volta a ser Pendente revisão;
  - o orientador usa **Aprovar versão**: **Aprovada**. Só a versão mais recente do documento pode ser aprovada, a aprovação pede confirmação
    (com aviso se houver correções pendentes) e, neste protótipo, não é desfeita. Versão aprovada não recebe novo retorno geral;
    comentários em trechos continuam possíveis.
- **Retorno geral sobre esta versão**: um só por versão. O orientador cria uma vez e depois **edita** (texto e tipo); mudar o tipo recalcula se há
  correção pendente. Quem escreveu é o único que edita.
- A aprovação do documento não é aprovação institucional do TCC (etapas, banca e nota continuam fora do protótipo).

