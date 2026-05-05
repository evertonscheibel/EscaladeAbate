# 🚀 Sistema Integrado de Gestão de TI

Sistema completo de gerenciamento de TI com backend Node.js + MongoDB e frontend React + TypeScript.

![Status](https://img.shields.io/badge/status-active-success.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![MongoDB](https://img.shields.io/badge/mongodb-6.0%2B-green.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.2.2-blue.svg)

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Uso](#uso)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [API](#api)
- [Contribuindo](#contribuindo)

## 🎯 Visão Geral

O **Sistema Integrado de Gestão de TI** é uma plataforma web completa que reúne em um único ecossistema todas as ferramentas necessárias para gerenciar a infraestrutura de TI de uma organização.

### Principais Módulos

1. **Gestão de Chamados (Tickets)** - Sistema completo de helpdesk
2. **Controle de Ativos** - Inventário de hardware e software
3. **Certificados e Licenças** - Gerenciamento com alertas automáticos
4. **Base de Conhecimento** - Wiki interna com busca avançada
5. **Controle Financeiro** - Gestão de boletos e pagamentos
6. **Dashboard de KPIs** - Indicadores em tempo real
7. **Sistema de Notificações** - Alertas automáticos
8. **Portal do Cliente** - Abertura de chamados sem login

## ✨ Funcionalidades

### 🎫 Gestão de Chamados
- Criação, classificação e priorização de tickets
- Sistema Kanban interativo
- Comentários e anexos
- Atribuição de responsáveis
- Histórico completo
- Integração com ativos

### 💻 Controle de Ativos
- Cadastro completo de ativos
- Localização e responsável
- Status e histórico
- Vinculação com tickets

### 📜 Certificados e Licenças
- Gerenciamento de SSL, licenças de software e validações
- **Alertas automáticos:** 30, 15 e 7 dias antes da expiração
- **Criação automática de tickets** para renovação
- Controle de fornecedores

### 📚 Base de Conhecimento
- Artigos organizados por categorias
- Sistema de tags
- Busca full-text
- Sugestão automática de artigos
- Controle de visualizações

### 💰 Módulo Financeiro
- Cadastro de boletos
- Cálculo automático de data de entrega (7 dias antes)
- Alertas visuais para vencimentos
- Relatórios em PDF e CSV

### 📊 Dashboard e Relatórios
- KPIs essenciais da operação
- Tempo médio de resolução
- Status de tickets, ativos e certificados
- Gráficos e estatísticas
- Exportação em CSV e PDF

### 🔐 Controle de Acesso
- **3 níveis de permissão:**
  - **Admin** - Acesso total
  - **Técnico** - Gerenciamento operacional
  - **Cliente** - Visualização de seus tickets
- Autenticação JWT
- Proteção de rotas

### ⏰ Automações
- Verificação diária de certificados expirando
- Alertas de boletos próximos do vencimento
- Atualização automática de status
- Criação automática de tickets

## 🛠️ Tecnologias

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação
- **Bcrypt** - Hash de senhas
- **Node-cron** - Tarefas agendadas
- **Helmet** - Segurança
- **Express Rate Limit** - Proteção DDoS

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **React Router** - Navegação
- **Axios** - Cliente HTTP
- **Context API** - Estado global

## 📦 Instalação

### Pré-requisitos

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **MongoDB** - Escolha uma opção:
   - **Local:** [Download MongoDB Community](https://www.mongodb.com/try/download/community)
   - **Cloud (Gratuito):** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)

### Instalação Rápida

```bash
# 1. Clone o repositório (ou use os arquivos existentes)
cd V0

# 2. Instalar dependências do backend
cd backend
npm install

# 3. Configurar variáveis de ambiente
# Edite backend/.env se necessário (já está configurado para MongoDB local)

# 4. Popular banco de dados com dados de exemplo
npm run seed

# 5. Iniciar backend
npm run dev
# Backend rodando em http://localhost:3000

# 7. Iniciar frontend
cd ../frontend
npm install

# 8. Iniciar frontend
npm run dev
# Frontend rodando em http://localhost
```

### Configuração do MongoDB

#### Opção A - MongoDB Local
```bash
# Windows: MongoDB já inicia como serviço após instalação
# Verifique se está rodando:
mongosh
```

#### Opção B - MongoDB Atlas (Cloud - Recomendado)
1. Crie conta em https://www.mongodb.com/cloud/atlas/register
2. Crie um cluster gratuito (M0)
3. Configure usuário e senha
4. Adicione seu IP na whitelist (ou 0.0.0.0/0)
5. Copie a connection string
6. Cole em `backend/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gestao_ti
```

## 🚀 Uso

### Acessar o Sistema

1. Abra o navegador em: **http://localhost**
2. Faça login com uma das credenciais de teste:

```
Admin:    admin@gestao.com    / admin123
Técnico:  joao@gestao.com     / tecnico123
Cliente:  maria@cliente.com   / cliente123
```

### Testar a API

```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gestao.com","password":"admin123"}'

# Listar tickets (com token)
curl http://localhost:3000/api/tickets \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 📁 Estrutura do Projeto

```
V0/
├── backend/                    # API Node.js + Express + MongoDB
│   ├── src/
│   │   ├── config/            # Configurações (database)
│   │   ├── controllers/       # Lógica de negócio
│   │   ├── middleware/        # Auth, errorHandler
│   │   ├── models/            # Schemas Mongoose
│   │   ├── routes/            # Rotas da API
│   │   ├── utils/             # Utilitários (cron, seed)
│   │   └── server.js          # Servidor principal
│   ├── .env                   # Variáveis de ambiente
│   ├── package.json
│   └── README.md
│
├── frontend/                   # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── context/           # Context API (Auth)
│   │   ├── pages/             # Páginas (Login, Dashboard)
│   │   ├── services/          # Serviços de API
│   │   ├── App.tsx            # Componente principal
│   │   └── main.tsx           # Entry point
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── README.md
│
├── database_instructions.md    # Documentação do banco
├── INSTALACAO.md              # Guia de instalação
└── README.md                  # Este arquivo
```

## 🔌 API

### Endpoints Principais

#### Autenticação
```
POST   /api/auth/register      # Registrar usuário
POST   /api/auth/login         # Login
GET    /api/auth/me            # Dados do usuário logado
PUT    /api/auth/profile       # Atualizar perfil
PUT    /api/auth/password      # Alterar senha
```

#### Tickets
```
GET    /api/tickets            # Listar tickets
POST   /api/tickets            # Criar ticket
GET    /api/tickets/:id        # Detalhes
PUT    /api/tickets/:id        # Atualizar
DELETE /api/tickets/:id        # Deletar
POST   /api/tickets/:id/comments  # Adicionar comentário
GET    /api/tickets/stats/summary # Estatísticas
```

#### Ativos
```
GET    /api/assets             # Listar ativos
POST   /api/assets             # Criar ativo
GET    /api/assets/:id         # Detalhes
PUT    /api/assets/:id         # Atualizar
DELETE /api/assets/:id         # Deletar
```

#### Certificados
```
GET    /api/certificates       # Listar certificados
POST   /api/certificates       # Criar certificado
GET    /api/certificates/expiring/soon  # Certificados expirando
POST   /api/certificates/check-expiration  # Verificar expirações
```

#### Base de Conhecimento
```
GET    /api/kb                 # Listar artigos
POST   /api/kb                 # Criar artigo
GET    /api/kb/:id             # Detalhes
GET    /api/kb/search/related?query=termo  # Buscar
```

#### Boletos
```
GET    /api/boletos            # Listar boletos
POST   /api/boletos            # Criar boleto
GET    /api/boletos/pending/list  # Boletos pendentes
```

#### Dashboard
```
GET    /api/dashboard/kpis     # KPIs principais
GET    /api/dashboard/recent-activity  # Atividades recentes
```

#### Notificações
```
GET    /api/notifications      # Listar notificações
PUT    /api/notifications/:id/read  # Marcar como lida
PUT    /api/notifications/read-all  # Marcar todas como lidas
```

### Autenticação nas Requisições

Todas as rotas (exceto register e login) requerem token JWT:

```bash
Authorization: Bearer SEU_TOKEN_AQUI
```

## 🔒 Segurança

- ✅ Senhas com hash bcrypt (10 rounds)
- ✅ Autenticação JWT com expiração
- ✅ Rate limiting (100 req/15min por IP)
- ✅ Helmet para headers de segurança
- ✅ CORS configurado
- ✅ Validação de dados
- ✅ Proteção contra SQL/NoSQL injection
- ✅ XSS protection

## ⏰ Tarefas Automáticas (Cron Jobs)

- **00:00** - Verificar certificados expirando (30, 15, 7 dias)
- **08:00** - Verificar boletos próximos do vencimento
- **01:00** - Atualizar status de boletos atrasados

## 📊 Dados de Exemplo

Após rodar `npm run seed` no backend, você terá:

- **3 usuários** (admin, técnico, cliente)
- **3 ativos** (notebooks, servidores, switches)
- **3 tickets** (diferentes status e prioridades)
- **2 certificados** (SSL e licença)
- **2 artigos** na base de conhecimento
- **2 boletos** pendentes

## 🐛 Solução de Problemas

### Erro: "npm não é reconhecido"
**Solução:** Instale o Node.js e reinicie o terminal

### Erro de conexão com MongoDB
**Solução:** 
- Se local: Verifique se o serviço MongoDB está rodando
- Se Atlas: Verifique a connection string no .env

### Porta 3000 já em uso
**Solução:** Mude a porta em `backend/.env`:
```env
PORT=3001
```

### Frontend não conecta com backend
**Solução:** Verifique se o backend está rodando em http://localhost:3000

## 📝 Próximas Implementações

- [ ] Páginas completas de gerenciamento no frontend
- [ ] Sistema de notificações em tempo real (WebSocket)
- [ ] Upload de arquivos
- [ ] Gráficos interativos
- [ ] Relatórios em PDF
- [ ] Integração com email
- [ ] Modo escuro
- [ ] PWA (Progressive Web App)
- [ ] Testes automatizados
- [ ] Docker e Docker Compose
- [ ] CI/CD

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 👥 Autores

Desenvolvido para gerenciamento interno de TI.

## 🙏 Agradecimentos

- Node.js Community
- React Team
- MongoDB Team
- Todos os contribuidores de código aberto

---

**⭐ Se este projeto foi útil, considere dar uma estrela!**

**📧 Dúvidas?** Consulte os arquivos README.md em cada pasta (backend/frontend) ou a documentação completa em `database_instructions.md`
