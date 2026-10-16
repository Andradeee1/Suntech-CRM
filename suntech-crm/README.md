# SunTech CRM

Área interna da SunTech Solar para administradores e vendedores acompanharem os clientes. O sistema reúne o funil de atendimento (orçamentos, limpezas de placas e atendimentos), a ficha do cliente com tarefas e histórico, a carteira de clientes, a gestão de usuários e um dashboard.

> **Versão atual: front-end com dados fictícios.** Os dados ficam no navegador (localStorage). Na próxima etapa, só o arquivo `src/services/api.ts` será trocado pelo Supabase. As telas continuam iguais.

## Como rodar

Pré-requisito: [Node.js](https://nodejs.org) 20 ou superior.

```bash
npm install
npm run dev        # abre em http://localhost:5173
npm test           # testes das regras de negócio
npm run build      # gera a versão de produção em dist/
```

### Contas de demonstração (senha `suntech123`)

| Usuário | E-mail | Perfil |
|---|---|---|
| Roberto Lima | admin@suntech.com.br | Administrador |
| Marina Costa | marina@suntech.com.br | Vendedora |
| Carlos Souza | carlos@suntech.com.br | Vendedor |

Para voltar aos dados iniciais, use **Usuários → Restaurar dados de exemplo** (como administrador).

## O que cada perfil pode fazer

| Ação | Administrador | Vendedor |
|---|---|---|
| Ver negócios | Todos | Os seus e os leads sem vendedor |
| Mover, editar, agendar tarefas | Todos | Só os seus |
| Assumir lead sem vendedor | — (atribui pela ficha) | Sim |
| Trocar vendedor de um negócio | Sim | Não |
| Gerenciar usuários | Sim | Não |

## Funcionalidades

- **Funil (Kanban):** você arrasta os cards entre as etapas *Novo contato → Em atendimento → Agendado → Proposta enviada → Concluído*. Também dá para buscar, filtrar por tipo e por vendedor, alternar para a listagem e exportar CSV.
- **Bolinha de status do card:** verde quando há tarefa agendada, amarela quando há tarefa atrasada e vermelha quando não há tarefa.
- **Ficha do cliente:** mostra os dados e permite editá-los. Tem botões de WhatsApp e ligação, mudança de etapa, opção de marcar o negócio como perdido, tarefas (criar e concluir), registro de ligações e anotações e o histórico automático.
- **Captação de leads do site:** a função `registrarLeadDoSite` em `api.ts` é a que o formulário e o chatbot vão usar. O botão **Simular lead do site** demonstra o fluxo.
- **Dashboard:** mostra os indicadores, os leads por mês, a origem dos leads, o funil por etapa, as próximas tarefas e o desempenho por vendedor.

## Estrutura

```
src/
├── types.ts                 # Modelo de dados (vira as tabelas do banco)
├── services/api.ts          # ÚNICO ponto de acesso a dados (será trocado pelo Supabase)
├── data/seed.ts             # Dados fictícios de exemplo
├── lib/
│   ├── regras.ts            # Regras de negócio puras: permissões, status de tarefas, indicadores
│   ├── regras.test.ts       # Testes (Vitest)
│   ├── constantes.ts        # Etapas, tipos, origens e rótulos
│   ├── formatacao.ts        # Moeda, datas, WhatsApp
│   └── csv.ts               # Exportação
├── contexts/
│   ├── AuthContext.tsx      # Login e sessão
│   └── CrmContext.tsx       # Dados carregados e ações (mover, criar, concluir…)
├── hooks/useNegociosDetalhados.ts
├── components/              # Layout, KanbanBoard, FichaNegocio, NovoNegocioModal, gráficos…
└── pages/                   # Login, Funil, Clientes, Usuarios, Dashboard
```

## Tecnologias

React 19, TypeScript, Vite, Tailwind CSS 4 e React Router. As cores e o estilo seguem o site da SunTech (`#004C01` e `#FFB700`). O arrastar e soltar usa a API nativa do HTML5, e os gráficos são feitos em HTML/CSS, sem bibliotecas extras.

## Próximos passos

1. Criar as tabelas no Supabase a partir de `src/types.ts`, com as políticas de acesso (RLS) que reproduzem `src/lib/regras.ts`.
2. Reescrever `src/services/api.ts` usando o `supabase-js`.
3. Ajustar o `main.js` do site para chamar o cadastro de lead antes de abrir o WhatsApp.
4. Fase 2: importar a planilha de clientes atuais (botão *Importar*).
