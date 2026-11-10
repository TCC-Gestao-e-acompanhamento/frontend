# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Três perfis de uma mesma aplicação, mais visitantes sem login. Fatos vindos dos briefs do próprio projeto; o que for inferência está marcado como "a confirmar".

- **Aluno** (graduação, UnB): acompanha o próprio TCC 1 e TCC 2 — etapa atual, prazos, atividades pendentes, envio e consulta de documentos, feedbacks do orientador. Antes de ter orientador, procura um professor e envia uma proposta.
- **Orientador** (professor da UnB): acompanha vários orientandos ao mesmo tempo, vê entregas pendentes de análise, registra feedbacks, responde solicitações de orientação e mantém o próprio perfil público.
- **Coordenação**: visão institucional dos TCCs, prazos, bancas e vínculos orientador–aluno, dentro das atribuições previstas nas regulamentações da UnB (ações administrativas ainda não confirmadas).
- **Visitante**: consulta, sem autenticação, professores que orientam TCC (por curso e área), bancas públicas e calendário acadêmico.

A priorização entre perfis na primeira versão ainda não foi validada pelos questionários (a confirmar).

## Product Purpose

Centralizar a gestão e o acompanhamento do ciclo de vida do TCC na UnB — da busca por orientador até a defesa — num único sistema, em vez de informações espalhadas entre aluno, orientador e coordenação. Sucesso: o aluno sabe em que etapa está, o que precisa fazer e quando; o orientador identifica rápido o que pede atenção; a coordenação enxerga o conjunto sem planilhas paralelas; quem busca orientação encontra um professor adequado e envia uma proposta em poucos passos.

Projeto de TCC conduzido com Lean UX (levantamento, hipóteses, prototipação, validação com usuários) e desenvolvimento incremental. Esta base é um **protótipo navegável com dados fictícios**; o backend ainda não existe.

## Positioning

A confirmar. Hipótese de trabalho: ser o único lugar onde a **busca/solicitação de orientação** e o **acompanhamento do TCC** se encontram, com uma só aplicação e identidade para os três perfis, em contexto UnB.

## Operating Context

- Ciclo acadêmico com TCC 1 e TCC 2, prazos institucionais e bancas examinadoras. As etapas usadas no protótipo (4 em cada fase) são **genéricas**, não regulamento.
- Documentos (projeto, monografia, capítulos, relatórios) circulam em versões e passam por análise do orientador, com feedbacks e correções solicitadas.
- Defesas são públicas; a composição e a data da banca são informação de consulta.
- Levantamento de necessidades feito por questionários (Google Forms) com os usuários; resultados ainda não incorporados.
- Ferramentas do projeto: Figma (prototipação), Postman, VS Code, Docker.

## Capabilities and Constraints

- Stack definida: frontend React + TypeScript + Tailwind CSS (+ Vite e React Router, aprovados); backend Node.js + NestJS + Prisma; banco PostgreSQL. Novas bibliotecas exigem recomendação e aprovação prévia.
- Uma única aplicação com três visões e um Design System compartilhado; navegação, dashboards e funcionalidades variam por perfil. Nunca três aplicações.
- Controle de acesso por perfil: esconder no frontend **não** substitui validação no backend.
- Requisitos RF01–RF30 e o módulo de busca/solicitação de orientação são **candidatos**, não validados; prioridades são preliminares.
- Regras acadêmicas não confirmadas **não** devem ser implementadas nem tratadas como fato: etapas oficiais, vinculação orientador–aluno–TCC, aprovação de bancas, ações administrativas da coordenação, limite de solicitações simultâneas.
- O aceite do professor em uma solicitação **não** é matrícula nem designação institucional.
- Área pública expõe apenas dados autorizados (nome, cursos, áreas, apresentação, disponibilidade do professor); nunca e-mail nem dados de alunos.
- Em aberto: quais professores aparecem na lista pública, justificativa de recusa obrigatória ou não, notificações, marcar correção como resolvida, quem pode enviar documentos além do aluno.

Hipóteses e decisões pendentes estão em `docs/prototipo.md`.

## Brand Commitments

- Identidade da UnB: **fundo branco** com azul `#003366` e verde `#006633`; pedido explícito de um sistema "branco com as cores da UnB".
- Nome de trabalho: "Gestão de TCC — Universidade de Brasília" (a confirmar).
- Interface e textos em português do Brasil.
- Logo: o arquivo `public/logo-unb.svg` é uma **reprodução aproximada** a partir de uma imagem; deve ser substituído pelo arquivo oficial, respeitando as regras de uso da marca (a confirmar).

## Evidence on Hand

- Briefs de requisitos escritos pela autora (perfis, requisitos funcionais candidatos, MVP preliminar, módulo de orientação, restrições).
- Protótipo funcional em `src/` com dados **fictícios** (`src/mocks/data.ts`).
- **Ausentes — não inventar:** resultados dos questionários, regulamento da UnB, depoimentos, métricas de uso, lista real de professores/cursos, composição real de bancas, logo oficial.

## Product Principles

1. **Clareza do próximo passo**: cada tela diz onde a pessoa está, o que falta e qual é a ação seguinte.
2. **Uma aplicação, vários papéis**: reutilizar componentes e estruturas entre perfis; a diferença está nos dados e no menu, não em sistemas paralelos.
3. **Não afirmar o que a instituição não confirmou**: regras acadêmicas ficam como hipótese explícita, na interface e na documentação.
4. **Pronto para o backend**: permissões e regras de negócio pertencem ao servidor; o frontend as reflete, não as substitui.
5. **Do essencial primeiro**: priorizar os fluxos que resolvem as dores levantadas e manter tudo preparado para mudar após a validação.

## Accessibility & Inclusion

Considerar acessibilidade e responsividade desde o início (requisito do projeto): navegação por teclado, rótulos associados a campos, foco visível, contraste adequado, alvos de toque confortáveis e estado nunca indicado só por cor. Padrão formal (ex.: WCAG 2.1 AA) a confirmar.
