# 📘 Sistema Integrado de Gestão de TI - Documentação Completa

**Versão:** 2.0.0  
**Última Atualização:** 07/01/2026  
**Status:** Produção

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Tecnologias](#tecnologias)
3. [Funcionalidades](#funcionalidades)
4. [Instalação e Configuração](#instalação-e-configuração)
5. [Estrutura do Projeto](#estrutura-do-projeto)
6. [API Reference](#api-reference)
7. [Segurança](#segurança)
8. [Alterações Recentes](#alterações-recentes)

---

## 🎯 Visão Geral

Sistema completo de gerenciamento de TI que integra helpdesk, inventário de ativos, gestão financeira, base de conhecimento e muito mais em uma única plataforma web moderna e responsiva.

### Características Principais

- ✅ **Interface Moderna** - React 18 + TypeScript + Vite
- ✅ **API RESTful** - Node.js + Express + MongoDB
- ✅ **Autenticação JWT** - Sistema seguro de autenticação
- ✅ **RBAC** - Controle de acesso baseado em funções
- ✅ **Responsivo** - Funciona em desktop, tablet e mobile
- ✅ **Tempo Real** - Atualizações automáticas via HMR
- ✅ **Automações** - Cron jobs para tarefas agendadas

---

## 🛠️ Tecnologias

### Frontend
```
React 18.2.0          - Biblioteca UI
TypeScript 5.2.2      - Tipagem estática
Vite 5.0.8            - Build tool ultrarrápido
React Router 6.20.1   - Navegação SPA
Axios 1.6.2           - Cliente HTTP
Lucide React 0.294.0  - Ícones modernos
Recharts 2.10.3       - Gráficos e dashboards
Date-fns 3.0.6        - Manipulação de datas
```

### Backend
```
Node.js 18+           - Runtime JavaScript
Express 4.18.2        - Framework web
MongoDB 8.0.3         - Banco de dados NoSQL
Mongoose 8.0.3        - ODM para MongoDB
JWT 9.0.2             - Autenticação
Bcrypt 2.4.3          - Hash de senhas
Node-cron 3.0.3       - Tarefas agendadas
Helmet 7.1.0          - Segurança HTTP
Multer 1.4.5          - Upload de arquivos
XLSX 0.18.5           - Importação/Exportação Excel
```

---

## ✨ Funcionalidades

### 1. 🎫 Gestão de Tickets (ITSM)

**Funcionalidades Principais:**
- ✅ Abertura de tickets (interno e portal público)
- ✅ Workflow ITSM completo com estados
- ✅ Sistema de filas e atribuição automática
- ✅ Níveis de suporte (N1, N2, N3)
- ✅ Timeline de eventos
- ✅ Comentários e anexos
- ✅ Visualização em lista e Kanban
- ✅ Filtros avançados
- ❌ **Deleção de tickets desabilitada** (apenas visualização e edição)

**Estados do Ticket:**
- Novo → Atribuído → Aceito → Em Andamento → Pendente → Resolvido → Fechado

**Portal Público:**
- URL: `/ticket/new`
- Abertura sem necessidade de login
- Ideal para usuários externos

### 2. 💻 Gestão de Ativos (CMDB)

**Funcionalidades:**
- ✅ Cadastro completo de ativos (hardware/software)
- ✅ Controle de localização e responsável
- ✅ Histórico de movimentações (Timeline)
- ✅ Gestão de manutenções
- ✅ Importação/Exportação Excel
- ✅ Relatórios analíticos por setor
- ✅ Vinculação com tickets

**Campos Principais:**
- Patrimônio, tipo, marca, modelo, serial
- Localização (setor), responsável
- Status, valor patrimonial
- Data de aquisição, garantia

### 3. 💰 Gestão Financeira

**Módulos:**

#### Solicitações de Compra
- Workflow: Solicitação → Cotação → Pedido
- Aprovação de orçamento
- Controle de status

#### Fornecedores
- Cadastro completo (CNPJ, contatos)
- Histórico de compras

#### Orçamentos (Budget)
- Controle anual de budget
- Aprovado vs. Utilizado
- Alertas de limite

#### Boletos
- Cadastro e controle de pagamentos
- Alertas de vencimento
- Cálculo automático de data de entrega

### 4. 📚 Base de Conhecimento

**Recursos:**
- ✅ Artigos organizados por categorias
- ✅ Sistema de tags
- ✅ Busca full-text
- ✅ Sugestão automática de artigos relacionados
- ✅ Controle de visualizações
- ✅ Editor rico de conteúdo

### 5. 🔧 Gestão de Problemas

**Funcionalidades:**
- ✅ Registro de problemas recorrentes (ITIL)
- ✅ Análise de causa raiz
- ✅ Vinculação com tickets (incidentes)
- ✅ Workarounds e soluções permanentes
- ✅ Priorização e impacto

### 6. 📜 Certificados e Licenças

**Recursos:**
- ✅ Monitoramento de SSL, licenças, e-CNPJ
- ✅ Alertas automáticos (30, 15, 7 dias)
- ✅ Criação automática de tickets para renovação
- ✅ Controle de fornecedores

### 7. 👥 Gestão de Usuários

**Funcionalidades:**
- ✅ CRUD completo (apenas admin)
- ✅ Três níveis de acesso: Admin, Técnico, Cliente
- ✅ Ativação/desativação de contas
- ✅ Busca e filtros
- ✅ Registro público de novos usuários

### 8. 📊 Dashboard e Relatórios

**Dashboards Disponíveis:**
- Dashboard Principal (KPIs gerais)
- Dashboard de Agente (métricas individuais)
- Dashboard de Gerente (visão consolidada)

**Relatórios:**
- ✅ Relatório de desempenho de agentes (exportável Excel)
- ✅ Relatório analítico de ativos por setor
- ✅ Estatísticas de tickets
- ✅ Métricas de SLA

### 9. 🔔 Sistema de Notificações

**Tipos de Notificações:**
- Atualização de tickets
- Atribuição de tickets
- Certificados expirando
- Boletos próximos do vencimento
- Alertas do sistema

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18+ ([Download](https://nodejs.org/))
- MongoDB 6.0+ (Local ou Atlas)
- PowerShell (Windows) ou Bash (Linux/Mac)

### Instalação Rápida

```powershell
# 1. Instalar dependências do backend
cd backend
npm install

# 2. Configurar variáveis de ambiente
# Edite backend/.env conforme necessário

# 3. Popular banco de dados
npm run seed

# 4. Instalar dependências do frontend
cd ../frontend
npm install

# 5. Iniciar o sistema (na raiz do projeto)
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
PORT=3000
MONGODB_URI=mongodb://localhost:27017/Gestaoti
JWT_SECRET=seu_secret_aqui
JWT_EXPIRE=7d
NODE_ENV=development
HOST=0.0.0.0
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3000/api
```

### Acesso ao Sistema

**URLs:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- Portal Público: `http://localhost:5173/ticket/new`

**Credenciais Padrão:**
| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | admin@gestao.com | admin123 |
| Técnico | joao@gestao.com | tecnico123 |
| Cliente | maria@cliente.com | cliente123 |

---

## 📁 Estrutura do Projeto

```
AntgravityProjeto/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # Configuração MongoDB
│   │   ├── controllers/             # Lógica de negócio
│   │   │   ├── authController.js
│   │   │   ├── ticketController.js
│   │   │   ├── ticketWorkflowController.js
│   │   │   ├── assetController.js
│   │   │   ├── userController.js
│   │   │   └── ... (16 controllers)
│   │   ├── models/                  # Schemas Mongoose
│   │   │   ├── User.js
│   │   │   ├── Ticket.js
│   │   │   ├── TicketEvent.js
│   │   │   ├── Asset.js
│   │   │   └── ... (16 models)
│   │   ├── routes/                  # Rotas da API
│   │   │   ├── authRoutes.js
│   │   │   ├── ticketRoutes.js
│   │   │   └── ... (15 routes)
│   │   ├── middleware/
│   │   │   ├── auth.js              # Autenticação JWT
│   │   │   └── errorHandler.js
│   │   ├── utils/
│   │   │   ├── cronJobs.js          # Tarefas agendadas
│   │   │   └── seed.js              # Dados iniciais
│   │   └── server.js                # Entry point
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/              # Componentes reutilizáveis
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TicketModal.tsx
│   │   │   ├── TicketDetailsModal.tsx
│   │   │   ├── TicketTimeline.tsx
│   │   │   ├── AssignModal.tsx
│   │   │   └── ... (20+ componentes)
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # Contexto de autenticação
│   │   ├── pages/                   # Páginas da aplicação
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Tickets.tsx
│   │   │   ├── AgentDashboard.tsx
│   │   │   ├── ManagerMetrics.tsx
│   │   │   ├── Assets.tsx
│   │   │   ├── Users.tsx
│   │   │   └── ... (20+ páginas)
│   │   ├── services/                # Serviços de API
│   │   │   ├── api.ts
│   │   │   ├── ticketService.ts
│   │   │   ├── assetService.ts
│   │   │   └── ... (15+ services)
│   │   ├── App.tsx                  # Rotas principais
│   │   └── main.tsx                 # Entry point
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── start.ps1                        # Script de inicialização
├── DOCUMENTACAO_COMPLETA.md         # Este arquivo
└── README.md                        # Documentação principal
```

---

## 🔌 API Reference

### Autenticação
```
POST   /api/auth/register           # Registrar usuário
POST   /api/auth/login              # Login
GET    /api/auth/me                 # Usuário atual
PUT    /api/auth/profile            # Atualizar perfil
PUT    /api/auth/password           # Alterar senha
```

### Tickets
```
GET    /api/tickets                 # Listar tickets
POST   /api/tickets                 # Criar ticket
POST   /api/tickets/public          # Criar ticket público
GET    /api/tickets/:id             # Detalhes
PUT    /api/tickets/:id             # Atualizar
POST   /api/tickets/:id/comments    # Adicionar comentário
GET    /api/tickets/stats/summary   # Estatísticas

# Workflow ITSM
POST   /api/tickets/:id/assign      # Atribuir
POST   /api/tickets/:id/accept      # Aceitar
POST   /api/tickets/:id/start       # Iniciar
POST   /api/tickets/:id/pending     # Pendente
POST   /api/tickets/:id/resolve     # Resolver
POST   /api/tickets/:id/close       # Fechar
POST   /api/tickets/:id/reopen      # Reabrir
GET    /api/tickets/:id/events      # Timeline

# Filas e Métricas
POST   /api/tickets/queue/next      # Próximo da fila
GET    /api/tickets/metrics/agents  # Métricas de agentes
GET    /api/tickets/reports/agents  # Relatório de agentes
GET    /api/tickets/reports/agents/export  # Exportar Excel
```

### Ativos
```
GET    /api/assets                  # Listar ativos
POST   /api/assets                  # Criar ativo
GET    /api/assets/:id              # Detalhes
PUT    /api/assets/:id              # Atualizar
DELETE /api/assets/:id              # Deletar
POST   /api/assets/import           # Importar Excel
GET    /api/assets/export           # Exportar Excel
GET    /api/assets/reports/analytical  # Relatório analítico
```

### Usuários (Admin apenas)
```
GET    /api/users                   # Listar usuários
POST   /api/users                   # Criar usuário
GET    /api/users/:id               # Detalhes
PUT    /api/users/:id               # Atualizar
DELETE /api/users/:id               # Deletar
PATCH  /api/users/:id/toggle-active # Ativar/desativar
```

### Outros Endpoints
```
# Certificados
GET    /api/certificates
POST   /api/certificates
GET    /api/certificates/expiring/soon

# Base de Conhecimento
GET    /api/kb
POST   /api/kb
GET    /api/kb/search/related

# Problemas
GET    /api/problems
POST   /api/problems
POST   /api/problems/:id/incidents/:ticketId

# Boletos
GET    /api/boletos
POST   /api/boletos
GET    /api/boletos/pending/list

# Dashboard
GET    /api/dashboard/kpis
GET    /api/dashboard/recent-activity

# Notificações
GET    /api/notifications
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all
```

---

## 🔒 Segurança

### Implementações de Segurança

- ✅ **Senhas com hash bcrypt** (10 rounds)
- ✅ **Autenticação JWT** com expiração configurável
- ✅ **Rate limiting** (100 req/15min por IP)
- ✅ **Helmet** para headers de segurança
- ✅ **CORS** configurado
- ✅ **Validação de dados** com express-validator
- ✅ **Proteção contra NoSQL injection**
- ✅ **XSS protection**
- ✅ **RBAC** - Controle de acesso baseado em funções

### Níveis de Acesso

| Função | Permissões |
|--------|-----------|
| **Admin** | Acesso total ao sistema, gerenciamento de usuários |
| **Técnico** | Gerenciamento de tickets, ativos, KB, relatórios |
| **Cliente** | Visualização de seus próprios tickets |

---

## 📝 Alterações Recentes

### 07/01/2026 - v2.0.0

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

---

## ⏰ Automações (Cron Jobs)

O sistema executa automaticamente:

- **00:00** - Verificar certificados expirando (30, 15, 7 dias)
- **08:00** - Verificar boletos próximos do vencimento
- **01:00** - Atualizar status de boletos atrasados

---

## 📞 Suporte e Documentação Adicional

### Documentos Disponíveis

- `README.md` - Documentação principal
- `DOCUMENTACAO_COMPLETA.md` - Este documento
- `API_REFERENCE.md` - Referência completa da API
- `INSTALACAO.md` - Guia de instalação detalhado
- `REDE_LOCAL.md` - Configuração para rede local
- `REMOCAO_DELETE_TICKETS.md` - Detalhes da remoção de delete
- `STATUS_SISTEMA.md` - Status atual do sistema

### Scripts Úteis

```powershell
.\start.ps1              # Iniciar sistema
.\kill-port-3000.ps1     # Liberar porta 3000
.\verificar-banco.ps1    # Verificar conexão MongoDB
.\configurar-rede.ps1    # Configurar para rede local
```

---

**Desenvolvido com ❤️ para gerenciamento eficiente de TI**

**Versão:** 2.0.0 | **Data:** 07/01/2026
