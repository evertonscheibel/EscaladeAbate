# Plano de Implementação - Módulo ITSM (Atendimento, Atribuição e Métricas)

## 1. Modelagem de Dados (Backend)

### 1.1. Novo Modelo: `TicketEvent`
Criar coleção para rastrear o ciclo de vida do chamado (Event Sourcing).
- **Campos:** `ticketId`, `type` (CREATED, ASSIGNED, etc.), `at` (data), `byUserId`, `data` (metadados flexíveis: fromStatus, toStatus, reason, etc.).

### 1.2. Atualização: `Ticket`
Adicionar campos para gestão de nível de serviço e atribuição.
- **Novos Campos:** 
  - `assignedTo` (User ID), `assignedBy` (User ID), `assignedAt` (Date)
  - `supportLevel` (Enum: N1, N2, N3)
  - `slaParams` (firstResponseSla, resolutionSla - opcional por enquanto)
  - Timestamps: `acceptedAt`, `firstResponseAt`, `resolvedAt`, `closedAt`
  - Status estendidos: `pendente_cliente`, `pendente_interno`

---

## 2. API & Backend (Node.js)

### 2.1. Rotas de Workflow (`/api/tickets/:id/*`)
Implementar endpoints para transições de estado:
- `POST /assign`: Gestor atribui (Gera evento ASSIGNED).
- `POST /accept`: Atendente assume chamado atribuído ou da fila (Gera ACCEPTED).
- `POST /start`: Inicia trabalho (Gera WORK_STARTED).
- `POST /pending`: Coloca em espera (Gera PENDING_CUSTOMER ou PENDING_INTERNAL).
- `POST /resolve`: Resolve e aguarda fechamento (Gera RESOLVED).
- `POST /close`: Finaliza confirmando solução (Gera CLOSED).
- `POST /reopen`: Reabre chamado fechado (Gera REOPENED).

### 2.2. Gestão de Filas (`/api/queue`)
- `GET /general`: Lista para gestores (filtros avançados).
- `GET /my-queue`: Lista para o atendente logado.
- `POST /next`: Pull (pegar próximo disponível conforme regras).

### 2.3. Métricas (`/api/metrics`)
- Agregações do MongoDB para calcular KPIs baseados nos `TicketEvents` e timestamps do `Ticket`.

---

## 3. Frontend (React)

### 3.1. Painel do Atendente (`/agent`)
- Visualização "Minha Fila".
- Botão de ação rápida "Pegar Próximo".
- Métricas pessoais rápidas (Resolvidos hoje, Pendentes).

### 3.2. Painel do Gestor (`/manager`)
- **Fila Geral:** Tabela avançada para monitorar backlog e atribuir chamados manualmente.
- **Métricas:** Dashboard com gráficos de produtividade, tempos de resposta e volume.

### 3.3. Atualização de Componentes
- **TicketDetails:** Inserir `TicketTimeline` e botões de ação condicionais (ex: só mostrar "Resolver" se estiver "Em Andamento").
- **TicketTimeline:** Componente visual para mostrar o histórico de eventos.

---

## 4. Scripts e Configuração

### 4.1. Seeds
- Criar usuários de teste com perfis: `gestor`, `atendente_n1`, `atendente_n2`.

### 4.2. Migração (Opcional)
- Script para ajustar tickets antigos para o novo modelo (se necessário).
