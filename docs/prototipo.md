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
