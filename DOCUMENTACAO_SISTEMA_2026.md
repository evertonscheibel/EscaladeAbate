# 📘 Sistema Integrado de Gestão de TI - Documentação Completa

**Versão:** 3.0.0  
**Última Atualização:** 12/01/2026  
**Status:** Produção  
**Ambiente:** http://10.1.1.120

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura Técnica](#arquitetura-técnica)
3. [Funcionalidades](#funcionalidades)
4. [Instalação e Configuração](#instalação-e-configuração)
5. [Estrutura do Projeto](#estrutura-do-projeto)
6. [API Reference](#api-reference)
7. [Controle de Acesso](#controle-de-acesso)
8. [Segurança](#segurança)
9. [Automações](#automações)
10. [Scripts Úteis](#scripts-úteis)

---

## 🎯 Visão Geral

Sistema completo de gerenciamento de TI que integra **ITSM (IT Service Management)**, inventário de ativos, gestão financeira, base de conhecimento e muito mais em uma única plataforma web moderna e responsiva.

### Características Principais

- ✅ **Interface Moderna** - React 18 + TypeScript com design responsivo
- ✅ **API RESTful** - Node.js + Express + MongoDB
- ✅ **Autenticação Segura** - JWT com expiração configurável
- ✅ **RBAC Completo** - Controle de acesso baseado em funções
- ✅ **ITSM Workflow** - Gestão completa de tickets com estados e filas
- ✅ **Portal Público** - Abertura de tickets sem autenticação
- ✅ **Automações** - Cron jobs para tarefas agendadas
- ✅ **Relatórios e Dashboards** - Métricas e análises em tempo real
- ✅ **Importação/Exportação** - Excel para ativos e relatórios

### Módulos do Sistema

| Módulo | Descrição | Usuários |
|--------|-----------|----------|
| **Dashboard** | Visão geral com KPIs e métricas | Todos |
| **Tickets (ITSM)** | Gestão completa de chamados | Todos |
| **Ativos (CMDB)** | Inventário de hardware/software | Admin, Técnico |
| **Certificados** | Monitoramento de SSL e licenças | Admin, Técnico |
| **Base de Conhecimento** | Artigos e documentação | Todos |
| **Boletos** | Controle de pagamentos | Admin, Técnico |
| **Compras** | Solicitações e orçamentos | Admin, Técnico |
| **Área do Atendente** | Métricas individuais | Admin, Técnico |
| **Relatórios** | Análises e exportações | Admin, Técnico |
| **Usuários** | Gerenciamento de usuários | Admin |
| **Métricas Gerenciais** | Dashboard executivo | Admin Master |

---

## 🏗️ Arquitetura Técnica

### Stack Tecnológico

#### Frontend
```
React 18.2.0              - Biblioteca UI
TypeScript 5.2.2          - Tipagem estática
Vite 5.0.8                - Build tool ultrarrápido
React Router 6.20.1       - Navegação SPA
Axios 1.6.2               - Cliente HTTP
Lucide React 0.294.0      - Ícones modernos
Recharts 2.10.3           - Gráficos e dashboards
Date-fns 3.0.6            - Manipulação de datas
React Dropzone 14.2.3     - Upload de arquivos
```

#### Backend
```
Node.js 18+               - Runtime JavaScript
Express 4.18.2            - Framework web
MongoDB 8.0.3             - Banco de dados NoSQL
Mongoose 8.0.3            - ODM para MongoDB
JWT 9.0.2                 - Autenticação
Bcrypt 2.4.3              - Hash de senhas
Node-cron 3.0.3           - Tarefas agendadas
Helmet 7.1.0              - Segurança HTTP
Express Rate Limit 7.1.5  - Proteção contra DDoS
Multer 1.4.5              - Upload de arquivos
XLSX 0.18.5               - Importação/Exportação Excel
Nodemailer 6.9.7          - Envio de e-mails
```

### Modelos de Dados (16 Models)

1. **User** - Usuários do sistema
2. **Ticket** - Chamados/tickets
3. **TicketEvent** - Timeline de eventos dos tickets
4. **Asset** - Ativos de TI
5. **AssetTimeline** - Histórico de movimentações de ativos
6. **Certificate** - Certificados e licenças
7. **KnowledgeBase** - Artigos da base de conhecimento
8. **Problem** - Problemas (ITIL)
9. **Notification** - Notificações do sistema
10. **Boleto** - Boletos e pagamentos
11. **Budget** - Orçamento anual
12. **Supplier** - Fornecedores
13. **PurchaseRequest** - Solicitações de compra
14. **Quote** - Cotações
15. **PurchaseOrder** - Pedidos de compra
16. **Maintenance** - Manutenções de ativos

### Rotas da API (17 Routes)

- `/api/auth` - Autenticação e perfil
- `/api/tickets` - Gestão de tickets
- `/api/assets` - Gestão de ativos
- `/api/certificates` - Certificados
- `/api/kb` - Base de conhecimento
- `/api/boletos` - Boletos
- `/api/dashboard` - Dashboard e KPIs
- `/api/notifications` - Notificações
- `/api/users` - Usuários
- `/api/maintenances` - Manutenções
- `/api/timeline` - Timeline de ativos
- `/api/problems` - Problemas
- `/api/purchase-requests` - Solicitações de compra
- `/api/suppliers` - Fornecedores
- `/api/quotes` - Cotações
- `/api/purchase-orders` - Pedidos de compra
- `/api/budgets` - Orçamentos

---

## ✨ Funcionalidades

### 1. 🎫 Gestão de Tickets (ITSM)

**Workflow Completo:**
```
Novo → Atribuído → Aceito → Em Andamento → Pendente → Resolvido → Fechado
```

**Funcionalidades Principais:**
- ✅ Abertura de tickets (interno e portal público)
- ✅ Sistema de filas com atribuição automática
- ✅ Níveis de suporte (N1, N2, N3)
- ✅ Prioridades (Baixa, Média, Alta, Crítica)
- ✅ Categorias personalizáveis
- ✅ Timeline completa de eventos
- ✅ Sistema de comentários
- ✅ Anexos de arquivos
- ✅ Visualização em lista e Kanban
- ✅ Filtros avançados (status, prioridade, atribuído)
- ✅ SLA tracking
- ❌ **Deleção desabilitada** (preservação de histórico)

**Portal Público:**
- **URL:** `http://10.1.1.120/ticket/new`
- Abertura sem necessidade de login
- Ideal para usuários externos/clientes
- Formulário simplificado

**Métricas de Tickets:**
- Tickets por status
- Tickets por prioridade
- Tempo médio de resolução
- Taxa de resolução no primeiro contato
- Tickets por agente
- Tickets por categoria

### 2. 💻 Gestão de Ativos (CMDB)

**Funcionalidades:**
- ✅ Cadastro completo de ativos (hardware/software)
- ✅ Controle de localização (setor) e responsável
- ✅ Histórico de movimentações (Timeline)
- ✅ Gestão de manutenções preventivas e corretivas
- ✅ Importação/Exportação Excel
- ✅ Relatórios analíticos por setor
- ✅ Vinculação com tickets
- ✅ Controle de garantia
- ✅ Valor patrimonial

**Campos Principais:**
- Patrimônio (identificador único)
- Tipo (Desktop, Notebook, Servidor, etc.)
- Marca e Modelo
- Número de série
- Localização (setor)
- Responsável
- Status (Ativo, Manutenção, Inativo)
- Valor patrimonial
- Data de aquisição
- Garantia (data de término)
- Observações

**Relatório Analítico:**
- Agrupamento por setor
- Total de ativos por localização
- Percentual do total
- Valor patrimonial total
- Valor médio por ativo
- Exportação para Excel

### 3. 💰 Gestão Financeira

#### Solicitações de Compra
- Workflow: Solicitação → Cotação → Pedido
- Aprovação de orçamento
- Controle de status
- Histórico completo

#### Fornecedores
- Cadastro completo (CNPJ, contatos)
- Endereço e informações fiscais
- Histórico de compras
- Avaliação de fornecedores

#### Orçamentos (Budget)
- Controle anual de budget
- Aprovado vs. Utilizado
- Alertas de limite
- Categorização de despesas

#### Boletos
- Cadastro de boletos
- Controle de vencimento
- Alertas automáticos
- Cálculo de data de entrega
- Status de pagamento

### 4. 📚 Base de Conhecimento

**Recursos:**
- ✅ Artigos organizados por categorias
- ✅ Sistema de tags
- ✅ Busca full-text
- ✅ Sugestão automática de artigos relacionados
- ✅ Controle de visualizações
- ✅ Editor rico de conteúdo
- ✅ Anexos e imagens
- ✅ Versionamento de artigos

**Categorias:**
- Tutoriais
- Procedimentos
- FAQs
- Troubleshooting
- Políticas

### 5. 🔧 Gestão de Problemas (ITIL)

**Funcionalidades:**
- ✅ Registro de problemas recorrentes
- ✅ Análise de causa raiz
- ✅ Vinculação com tickets (incidentes)
- ✅ Workarounds temporários
- ✅ Soluções permanentes
- ✅ Priorização e impacto
- ✅ Status do problema

**Estados:**
- Identificado
- Em Análise
- Workaround Disponível
- Resolvido
- Fechado

### 6. 📜 Certificados e Licenças

**Tipos Monitorados:**
- Certificados SSL
- Licenças de software
- Certificados e-CNPJ
- Certificados e-CPF
- Outros certificados digitais

**Recursos:**
- ✅ Monitoramento de expiração
- ✅ Alertas automáticos (30, 15, 7 dias)
- ✅ Criação automática de tickets para renovação
- ✅ Controle de fornecedores
- ✅ Histórico de renovações
- ✅ Dashboard de certificados expirando

### 7. 👥 Gestão de Usuários

**Funcionalidades:**
- ✅ CRUD completo (apenas admin)
- ✅ Três níveis de acesso: Admin, Técnico, Cliente
- ✅ Flag Master User (acesso a métricas gerenciais)
- ✅ Ativação/desativação de contas
- ✅ Busca e filtros
- ✅ Registro público de novos usuários
- ✅ Alteração de senha
- ✅ Perfil do usuário

**Campos:**
- Nome completo
- E-mail (login)
- Senha (hash bcrypt)
- Função (role)
- Status (ativo/inativo)
- Master User (boolean)
- Departamento
- Telefone

### 8. 📊 Dashboard e Relatórios

#### Dashboard Principal
- Total de tickets (abertos, em andamento, resolvidos)
- Total de ativos
- Certificados expirando
- Boletos pendentes
- Gráficos de tendências
- Atividades recentes

#### Área do Atendente (Agent Metrics)
- Tickets atribuídos
- Tickets resolvidos
- Tempo médio de resolução
- Taxa de resolução
- Performance individual
- Metas e objetivos

#### Métricas Gerenciais (Manager Metrics)
- **Acesso:** Apenas Admin Master
- Performance da equipe
- Tickets por agente
- Prioridades por agente
- Tempo médio de resposta
- SLA compliance
- Exportação para Excel

#### Relatórios Disponíveis
1. **Relatório de Desempenho de Agentes**
   - Tickets respondidos
   - Tempo médio
   - Taxa de resolução
   - Exportação Excel

2. **Relatório Analítico de Ativos**
   - Agrupamento por setor
   - Valor patrimonial
   - Distribuição percentual
   - Exportação Excel

3. **Estatísticas de Tickets**
   - Por status
   - Por prioridade
   - Por categoria
   - Por período

### 9. 🔔 Sistema de Notificações

**Tipos de Notificações:**
- Novo ticket atribuído
- Atualização em ticket
- Comentário em ticket
- Certificado expirando
- Boleto próximo do vencimento
- Manutenção agendada
- Problema identificado

**Funcionalidades:**
- ✅ Notificações em tempo real
- ✅ Marcação de lida/não lida
- ✅ Marcar todas como lidas
- ✅ Filtros por tipo
- ✅ Histórico de notificações

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** 6.0+ (Local ou Atlas)
- **PowerShell** (Windows) ou Bash (Linux/Mac)
- **Git** (opcional)

### Instalação Rápida

```powershell
# 1. Clonar ou baixar o projeto
cd c:\Projetos\AntgravityProjeto

# 2. Instalar dependências do backend
cd backend
npm install

# 3. Configurar variáveis de ambiente
# Edite backend/.env conforme necessário

# 4. Popular banco de dados com dados iniciais
npm run seed

# 5. Instalar dependências do frontend
cd ../frontend
npm install

# 6. Iniciar o sistema (na raiz do projeto)
cd ..
.\start.ps1
```

### Configuração do MongoDB

**Opção A - Local:**
```env
MONGODB_URI=mongodb://localhost:27017/Gestaoti
```

**Opção B - Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/Gestaoti
```

### Variáveis de Ambiente

**Backend (.env):**
```env
# Servidor
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Banco de Dados
MONGODB_URI=mongodb://localhost:27017/Gestaoti

# Autenticação
JWT_SECRET=seu_secret_super_seguro_aqui
JWT_EXPIRE=7d

# Frontend
FRONTEND_URL=http://10.1.1.120

# E-mail (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app
```

**Frontend (.env):**
```env
VITE_API_URL=http://10.1.1.120:3000/api
```

### Configuração de Rede Local

Para acessar o sistema na rede local:

1. Edite `frontend/vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 80,
  }
})
```

2. Execute como administrador (porta 80 requer privilégios)

### Acesso ao Sistema

**URLs:**
- **Frontend:** `http://10.1.1.120`
- **Backend API:** `http://10.1.1.120:3000`
- **Portal Público:** `http://10.1.1.120/ticket/new`
- **Health Check:** `http://10.1.1.120:3000/api/health`

**Credenciais Padrão:**

| Perfil | Email | Senha | Acesso |
|--------|-------|-------|--------|
| **Admin** | admin@gestao.com | admin123 | Total |
| **Técnico** | joao@gestao.com | tecnico123 | Operacional |
| **Cliente** | maria@cliente.com | cliente123 | Limitado |

> ⚠️ **IMPORTANTE:** Altere as senhas padrão em produção!

---

## 📁 Estrutura do Projeto

```
AntgravityProjeto/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js              # Configuração MongoDB
│   │   ├── controllers/                 # Lógica de negócio (16 controllers)
│   │   │   ├── authController.js
│   │   │   ├── ticketController.js
│   │   │   ├── ticketWorkflowController.js
│   │   │   ├── assetController.js
│   │   │   ├── userController.js
│   │   │   ├── certificateController.js
│   │   │   ├── kbController.js
│   │   │   ├── boletoController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── notificationController.js
│   │   │   ├── maintenanceController.js
│   │   │   ├── problemController.js
│   │   │   ├── purchaseRequestController.js
│   │   │   ├── supplierController.js
│   │   │   ├── quoteController.js
│   │   │   └── budgetController.js
│   │   ├── models/                      # Schemas Mongoose (16 models)
│   │   │   ├── User.js
│   │   │   ├── Ticket.js
│   │   │   ├── TicketEvent.js
│   │   │   ├── Asset.js
│   │   │   ├── AssetTimeline.js
│   │   │   ├── Certificate.js
│   │   │   ├── KnowledgeBase.js
│   │   │   ├── Problem.js
│   │   │   ├── Notification.js
│   │   │   ├── Boleto.js
│   │   │   ├── Budget.js
│   │   │   ├── Supplier.js
│   │   │   ├── PurchaseRequest.js
│   │   │   ├── Quote.js
│   │   │   ├── PurchaseOrder.js
│   │   │   └── Maintenance.js
│   │   ├── routes/                      # Rotas da API (17 routes)
│   │   │   ├── authRoutes.js
│   │   │   ├── ticketRoutes.js
│   │   │   ├── assetRoutes.js
│   │   │   ├── certificateRoutes.js
│   │   │   ├── kbRoutes.js
│   │   │   ├── boletoRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── notificationRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── maintenanceRoutes.js
│   │   │   ├── assetTimelineRoutes.js
│   │   │   ├── problemRoutes.js
│   │   │   ├── purchaseRequestRoutes.js
│   │   │   ├── supplierRoutes.js
│   │   │   ├── quoteRoutes.js
│   │   │   ├── purchaseOrderRoutes.js
│   │   │   └── budgetRoutes.js
│   │   ├── middleware/
│   │   │   ├── auth.js                  # Autenticação JWT
│   │   │   └── errorHandler.js          # Tratamento de erros
│   │   ├── utils/
│   │   │   ├── cronJobs.js              # Tarefas agendadas
│   │   │   └── seed.js                  # Dados iniciais
│   │   └── server.js                    # Entry point
│   ├── uploads/                         # Arquivos enviados
│   ├── .env                             # Variáveis de ambiente
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/                  # Componentes reutilizáveis
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── PrivateRoute.tsx
│   │   │   ├── TicketModal.tsx
│   │   │   ├── TicketDetailsModal.tsx
│   │   │   ├── TicketTimeline.tsx
│   │   │   ├── AssignModal.tsx
│   │   │   ├── AssetModal.tsx
│   │   │   ├── PurchaseRequestModal.tsx
│   │   │   └── ... (20+ componentes)
│   │   ├── context/
│   │   │   └── AuthContext.tsx          # Contexto de autenticação
│   │   ├── pages/                       # Páginas da aplicação (28 pages)
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DashboardNew.tsx
│   │   │   ├── Tickets.tsx
│   │   │   ├── PublicTicketForm.tsx
│   │   │   ├── AgentDashboard.tsx
│   │   │   ├── AgentMetrics.tsx
│   │   │   ├── ManagerMetrics.tsx
│   │   │   ├── ManagerQueue.tsx
│   │   │   ├── Assets.tsx
│   │   │   ├── Certificates.tsx
│   │   │   ├── KnowledgeBase.tsx
│   │   │   ├── Problems.tsx
│   │   │   ├── Boletos.tsx
│   │   │   ├── PurchaseRequests.tsx
│   │   │   ├── Reports.tsx
│   │   │   ├── Users.tsx
│   │   │   ├── Notifications.tsx
│   │   │   └── ...
│   │   ├── services/                    # Serviços de API
│   │   │   ├── api.ts                   # Configuração Axios
│   │   │   ├── authService.ts
│   │   │   ├── ticketService.ts
│   │   │   ├── assetService.ts
│   │   │   ├── userService.ts
│   │   │   └── ... (15+ services)
│   │   ├── App.tsx                      # Rotas principais
│   │   └── main.tsx                     # Entry point
│   ├── index.html
│   ├── vite.config.ts
│   ├── .env
│   └── package.json
│
├── start.ps1                            # Script de inicialização
├── stop.ps1                             # Script para parar
├── restart.ps1                          # Script de reinicialização
├── DOCUMENTACAO_SISTEMA_2026.md         # Este arquivo
└── README.md                            # Documentação principal
```

---

## 🔌 API Reference

### Autenticação
```
POST   /api/auth/register           # Registrar novo usuário
POST   /api/auth/login              # Login (retorna JWT)
GET    /api/auth/me                 # Dados do usuário atual
PUT    /api/auth/profile            # Atualizar perfil
PUT    /api/auth/password           # Alterar senha
```

### Tickets
```
# CRUD Básico
GET    /api/tickets                 # Listar tickets (com filtros)
POST   /api/tickets                 # Criar ticket (autenticado)
POST   /api/tickets/public          # Criar ticket público (sem auth)
GET    /api/tickets/:id             # Detalhes do ticket
PUT    /api/tickets/:id             # Atualizar ticket
POST   /api/tickets/:id/comments    # Adicionar comentário

# Workflow ITSM
POST   /api/tickets/:id/assign      # Atribuir ticket
POST   /api/tickets/:id/accept      # Aceitar ticket
POST   /api/tickets/:id/start       # Iniciar trabalho
POST   /api/tickets/:id/pending     # Marcar como pendente
POST   /api/tickets/:id/resolve     # Resolver ticket
POST   /api/tickets/:id/close       # Fechar ticket
POST   /api/tickets/:id/reopen      # Reabrir ticket
GET    /api/tickets/:id/events      # Timeline de eventos

# Filas e Métricas
POST   /api/tickets/queue/next      # Pegar próximo da fila
GET    /api/tickets/stats/summary   # Estatísticas gerais
GET    /api/tickets/metrics/agents  # Métricas por agente
GET    /api/tickets/reports/agents  # Relatório de agentes
GET    /api/tickets/reports/agents/export  # Exportar Excel
```

### Ativos
```
GET    /api/assets                  # Listar ativos
POST   /api/assets                  # Criar ativo
GET    /api/assets/:id              # Detalhes do ativo
PUT    /api/assets/:id              # Atualizar ativo
DELETE /api/assets/:id              # Deletar ativo
POST   /api/assets/import           # Importar Excel
GET    /api/assets/export           # Exportar Excel
GET    /api/assets/reports/analytical  # Relatório analítico por setor
```

### Usuários (Admin apenas)
```
GET    /api/users                   # Listar usuários
POST   /api/users                   # Criar usuário
GET    /api/users/:id               # Detalhes do usuário
PUT    /api/users/:id               # Atualizar usuário
DELETE /api/users/:id               # Deletar usuário
PATCH  /api/users/:id/toggle-active # Ativar/desativar usuário
```

### Certificados
```
GET    /api/certificates            # Listar certificados
POST   /api/certificates            # Criar certificado
GET    /api/certificates/:id        # Detalhes
PUT    /api/certificates/:id        # Atualizar
DELETE /api/certificates/:id        # Deletar
GET    /api/certificates/expiring/soon  # Certificados expirando
```

### Base de Conhecimento
```
GET    /api/kb                      # Listar artigos
POST   /api/kb                      # Criar artigo
GET    /api/kb/:id                  # Detalhes do artigo
PUT    /api/kb/:id                  # Atualizar artigo
DELETE /api/kb/:id                  # Deletar artigo
GET    /api/kb/search/related       # Buscar artigos relacionados
```

### Problemas
```
GET    /api/problems                # Listar problemas
POST   /api/problems                # Criar problema
GET    /api/problems/:id            # Detalhes
PUT    /api/problems/:id            # Atualizar
DELETE /api/problems/:id            # Deletar
POST   /api/problems/:id/incidents/:ticketId  # Vincular ticket
```

### Boletos
```
GET    /api/boletos                 # Listar boletos
POST   /api/boletos                 # Criar boleto
GET    /api/boletos/:id             # Detalhes
PUT    /api/boletos/:id             # Atualizar
DELETE /api/boletos/:id             # Deletar
GET    /api/boletos/pending/list    # Boletos pendentes
```

### Dashboard
```
GET    /api/dashboard/kpis          # KPIs principais
GET    /api/dashboard/recent-activity  # Atividades recentes
```

### Notificações
```
GET    /api/notifications           # Listar notificações
PUT    /api/notifications/:id/read  # Marcar como lida
PUT    /api/notifications/read-all  # Marcar todas como lidas
DELETE /api/notifications/:id       # Deletar notificação
```

### Compras
```
# Solicitações
GET    /api/purchase-requests       # Listar solicitações
POST   /api/purchase-requests       # Criar solicitação
PUT    /api/purchase-requests/:id   # Atualizar

# Fornecedores
GET    /api/suppliers               # Listar fornecedores
POST   /api/suppliers               # Criar fornecedor

# Cotações
GET    /api/quotes                  # Listar cotações
POST   /api/quotes                  # Criar cotação

# Pedidos
GET    /api/purchase-orders         # Listar pedidos
POST   /api/purchase-orders         # Criar pedido

# Orçamento
GET    /api/budgets                 # Listar orçamentos
POST   /api/budgets                 # Criar orçamento
```

---

## 🔐 Controle de Acesso

### Níveis de Acesso (Roles)

| Função | Descrição | Permissões |
|--------|-----------|------------|
| **Admin** | Administrador do sistema | Acesso total, gerenciamento de usuários |
| **Admin Master** | Administrador com acesso gerencial | Admin + Métricas Gerenciais |
| **Técnico** | Atendente/Técnico | Tickets, ativos, KB, relatórios |
| **Cliente** | Usuário final | Visualização de seus próprios tickets |

### Matriz de Permissões

| Módulo | Admin | Admin Master | Técnico | Cliente |
|--------|-------|--------------|---------|---------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Tickets | ✅ | ✅ | ✅ | ✅ (próprios) |
| Ativos | ✅ | ✅ | ✅ | ❌ |
| Certificados | ✅ | ✅ | ✅ | ❌ |
| Base de Conhecimento | ✅ | ✅ | ✅ | ✅ (leitura) |
| Boletos | ✅ | ✅ | ✅ | ❌ |
| Compras | ✅ | ✅ | ✅ | ❌ |
| Área do Atendente | ✅ | ✅ | ✅ | ❌ |
| Relatórios | ✅ | ✅ | ✅ | ❌ |
| Usuários | ✅ | ✅ | ❌ | ❌ |
| Métricas Gerenciais | ❌ | ✅ | ❌ | ❌ |

### Configuração de Master User

Para habilitar acesso às Métricas Gerenciais:

1. Acesse **Usuários** (como Admin)
2. Edite o usuário desejado
3. Marque a opção **"Master User"**
4. Salve as alterações

O usuário terá acesso ao menu **"Métricas Gerenciais"** na sidebar.

---

## 🔒 Segurança

### Implementações de Segurança

- ✅ **Senhas com hash bcrypt** (10 rounds)
- ✅ **Autenticação JWT** com expiração configurável (7 dias padrão)
- ✅ **Rate limiting** (100 req/15min por IP)
- ✅ **Helmet** para headers de segurança HTTP
- ✅ **CORS** configurado para permitir origens específicas
- ✅ **Validação de dados** com express-validator
- ✅ **Proteção contra NoSQL injection**
- ✅ **XSS protection**
- ✅ **RBAC** - Controle de acesso baseado em funções
- ✅ **HTTPS ready** (configuração para produção)

### Boas Práticas de Segurança

1. **Altere as senhas padrão** em produção
2. **Use HTTPS** em produção
3. **Configure JWT_SECRET** forte e único
4. **Mantenha as dependências atualizadas**
5. **Configure backup regular do MongoDB**
6. **Monitore logs de acesso**
7. **Implemente 2FA** (planejado para próxima versão)

---

## ⏰ Automações

### Cron Jobs Configurados

O sistema executa automaticamente as seguintes tarefas:

| Horário | Tarefa | Descrição |
|---------|--------|-----------|
| **00:00** | Verificar Certificados | Verifica certificados expirando em 30, 15 e 7 dias |
| **08:00** | Verificar Boletos | Alerta sobre boletos próximos do vencimento |
| **01:00** | Atualizar Status | Atualiza status de boletos atrasados |

### Configuração de Cron Jobs

Arquivo: `backend/src/utils/cronJobs.js`

```javascript
// Verificar certificados expirando (diariamente às 00:00)
cron.schedule('0 0 * * *', async () => {
  // Lógica de verificação
});

// Verificar boletos (diariamente às 08:00)
cron.schedule('0 8 * * *', async () => {
  // Lógica de verificação
});
```

---

## 🛠️ Scripts Úteis

### Scripts PowerShell

```powershell
# Iniciar o sistema
.\start.ps1

# Parar o sistema
.\stop.ps1

# Reiniciar o sistema
.\restart.ps1

# Verificar conexão com MongoDB
.\verificar-banco.ps1

# Configurar para rede local
.\configurar-rede.ps1

# Liberar porta 3000
.\kill-port-3000.ps1

# Build para produção
.\build_prod.ps1

# Iniciar em modo produção
.\start_prod.ps1
```

### Scripts NPM

**Backend:**
```bash
npm run dev      # Iniciar em modo desenvolvimento
npm start        # Iniciar em modo produção
npm run seed     # Popular banco com dados iniciais
```

**Frontend:**
```bash
npm run dev      # Iniciar servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
```

---

## 📝 Changelog

### Versão 3.0.0 - 12/01/2026

#### ✅ Atualizações
- Documentação completa atualizada
- Informações técnicas detalhadas
- Matriz de permissões documentada
- API Reference completa

### Versão 2.0.0 - 07/01/2026

#### ✅ Removida Funcionalidade de Deletar Tickets
- **Backend:** Rota DELETE removida de `/api/tickets/:id`
- **Frontend:** Botão e função de deletar removidos
- **Service:** Método `delete()` removido do ticketService
- **Motivo:** Preservação de histórico e auditoria

#### ✅ Script de Inicialização Corrigido
- **Problema:** Jobs do PowerShell causavam erros
- **Solução:** Substituído `Start-Job` por `Start-Process`
- **Benefício:** Janelas separadas para backend e frontend

### Funcionalidades ITSM Implementadas (Dezembro 2025)
- ✅ Workflow completo de tickets
- ✅ Sistema de filas
- ✅ Níveis de suporte (N1, N2, N3)
- ✅ Timeline de eventos
- ✅ Dashboard de agente
- ✅ Dashboard de gerente
- ✅ Relatórios de desempenho
- ✅ Master User role

---

## 📞 Suporte e Documentação Adicional

### Documentos Disponíveis

- `README.md` - Documentação principal
- `DOCUMENTACAO_SISTEMA_2026.md` - Este documento
- `DOCUMENTACAO_COMPLETA.md` - Versão anterior
- `API_REFERENCE.md` - Referência completa da API
- `INSTALACAO.md` - Guia de instalação detalhado
- `REDE_LOCAL.md` - Configuração para rede local
- `REMOCAO_DELETE_TICKETS.md` - Detalhes da remoção de delete
- `STATUS_SISTEMA.md` - Status atual do sistema

### Troubleshooting

**Problema:** Porta 3000 ou 80 já em uso
```powershell
# Verificar processos
netstat -ano | findstr ":3000"
netstat -ano | findstr ":80"

# Ou use o script
.\kill-port-3000.ps1
```

**Problema:** Erro de conexão com MongoDB
```powershell
# Verificar conexão
.\verificar-banco.ps1

# Verificar se MongoDB está rodando
mongod --version
```

**Problema:** Erro de permissão no PowerShell
```powershell
# Execute como administrador
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

---

## 🎯 Roadmap Futuro

### Planejado para Próximas Versões

- [ ] Autenticação 2FA
- [ ] Integração com WhatsApp/Telegram
- [ ] Chat em tempo real
- [ ] Mobile app (React Native)
- [ ] Relatórios customizáveis
- [ ] API pública com documentação Swagger
- [ ] Temas personalizáveis
- [ ] Multi-idioma (i18n)
- [ ] Backup automático
- [ ] Logs de auditoria avançados

---

**Desenvolvido com ❤️ para gerenciamento eficiente de TI**

**Versão:** 3.0.0  
**Data:** 12/01/2026  
**Ambiente:** http://10.1.1.120
