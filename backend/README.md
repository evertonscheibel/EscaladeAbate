# Backend - Sistema de Gestão de TI

Backend completo desenvolvido com Node.js, Express e MongoDB.

## 🚀 Tecnologias

- **Node.js** + **Express** - Framework web
- **MongoDB** + **Mongoose** - Banco de dados NoSQL
- **JWT** - Autenticação
- **Bcrypt** - Hash de senhas
- **Node-cron** - Tarefas agendadas
- **Helmet** - Segurança
- **Express Rate Limit** - Proteção contra DDoS

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Popular banco de dados com dados de exemplo
npm run seed

# Iniciar servidor em desenvolvimento
npm run dev

# Iniciar servidor em produção
npm start
```

## 🔧 Configuração

### MongoDB

Você pode usar MongoDB local ou MongoDB Atlas (cloud):

**Local:**
```
MONGODB_URI=mongodb://localhost:27017/gestao_ti
```

**MongoDB Atlas (cloud - gratuito):**
1. Crie uma conta em https://www.mongodb.com/cloud/atlas
2. Crie um cluster gratuito
3. Obtenha a connection string
4. Configure no .env:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gestao_ti
```

## 📚 Documentação da API

### Autenticação

- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário logado
- `PUT /api/auth/profile` - Atualizar perfil
- `PUT /api/auth/password` - Alterar senha

### Tickets

- `GET /api/tickets` - Listar tickets
- `POST /api/tickets` - Criar ticket
- `GET /api/tickets/:id` - Detalhes do ticket
- `PUT /api/tickets/:id` - Atualizar ticket
- `DELETE /api/tickets/:id` - Deletar ticket
- `POST /api/tickets/:id/comments` - Adicionar comentário
- `GET /api/tickets/stats/summary` - Estatísticas

### Ativos

- `GET /api/assets` - Listar ativos
- `POST /api/assets` - Criar ativo
- `GET /api/assets/:id` - Detalhes
- `PUT /api/assets/:id` - Atualizar
- `DELETE /api/assets/:id` - Deletar

### Certificados

- `GET /api/certificates` - Listar certificados
- `POST /api/certificates` - Criar certificado
- `GET /api/certificates/:id` - Detalhes
- `PUT /api/certificates/:id` - Atualizar
- `DELETE /api/certificates/:id` - Deletar
- `GET /api/certificates/expiring/soon` - Certificados expirando
- `POST /api/certificates/check-expiration` - Verificar expirações

### Base de Conhecimento

- `GET /api/kb` - Listar artigos
- `POST /api/kb` - Criar artigo
- `GET /api/kb/:id` - Detalhes
- `PUT /api/kb/:id` - Atualizar
- `DELETE /api/kb/:id` - Deletar
- `GET /api/kb/search/related?query=termo` - Buscar artigos

### Boletos

- `GET /api/boletos` - Listar boletos
- `POST /api/boletos` - Criar boleto
- `GET /api/boletos/:id` - Detalhes
- `PUT /api/boletos/:id` - Atualizar
- `DELETE /api/boletos/:id` - Deletar
- `GET /api/boletos/pending/list` - Boletos pendentes

### Dashboard

- `GET /api/dashboard/kpis` - KPIs principais
- `GET /api/dashboard/recent-activity` - Atividades recentes

### Notificações

- `GET /api/notifications` - Listar notificações
- `PUT /api/notifications/:id/read` - Marcar como lida
- `PUT /api/notifications/read-all` - Marcar todas como lidas
- `DELETE /api/notifications/:id` - Deletar

## 🔐 Autenticação

Todas as rotas (exceto register e login) requerem autenticação via JWT.

Envie o token no header:
```
Authorization: Bearer SEU_TOKEN_AQUI
```

## 👥 Roles (Permissões)

- **admin** - Acesso total
- **tecnico** - Pode gerenciar tickets, ativos, certificados, KB e boletos
- **cliente** - Pode criar e visualizar apenas seus próprios tickets

## ⏰ Tarefas Automáticas (Cron Jobs)

- **00:00** - Verificar certificados expirando
- **08:00** - Verificar boletos próximos do vencimento
- **01:00** - Atualizar status de boletos atrasados

## 📊 Usuários de Teste (após seed)

- **Admin:** admin@gestao.com / admin123
- **Técnico:** joao@gestao.com / tecnico123
- **Cliente:** maria@cliente.com / cliente123

## 🛡️ Segurança

- Senhas com hash bcrypt
- JWT para autenticação
- Rate limiting (100 req/15min por IP)
- Helmet para headers de segurança
- CORS configurado
- Validação de dados

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── ticketController.js
│   │   ├── assetController.js
│   │   ├── certificateController.js
│   │   ├── kbController.js
│   │   ├── boletoController.js
│   │   ├── dashboardController.js
│   │   └── notificationController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Ticket.js
│   │   ├── Asset.js
│   │   ├── Certificate.js
│   │   ├── KnowledgeBase.js
│   │   ├── Boleto.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── ticketRoutes.js
│   │   ├── assetRoutes.js
│   │   ├── certificateRoutes.js
│   │   ├── kbRoutes.js
│   │   ├── boletoRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── notificationRoutes.js
│   ├── utils/
│   │   ├── cronJobs.js
│   │   └── seed.js
│   └── server.js
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```
