# 📡 REFERÊNCIA RÁPIDA DA API

Base URL: `http://localhost:3000/api`

## 🔐 Autenticação

Todas as rotas (exceto login/register) requerem token JWT no header:
```
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## 🔑 Auth

### POST /auth/register
Registrar novo usuário
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123",
  "role": "cliente"
}
```

### POST /auth/login
Fazer login
```json
{
  "email": "admin@gestao.com",
  "password": "admin123"
}
```

### GET /auth/me
Obter dados do usuário logado

### PUT /auth/profile
Atualizar perfil
```json
{
  "name": "Novo Nome",
  "email": "novo@email.com"
}
```

### PUT /auth/password
Alterar senha
```json
{
  "currentPassword": "senha_atual",
  "newPassword": "nova_senha"
}
```

---

## 🎫 Tickets

### GET /tickets
Listar tickets
Query params: `?status=aberto&priority=alta&category=hardware`

### POST /tickets
Criar ticket
```json
{
  "title": "Computador não liga",
  "description": "Descrição do problema",
  "category": "hardware",
  "priority": "alta",
  "assetId": "ID_DO_ATIVO"
}
```

### GET /tickets/:id
Obter ticket por ID

### PUT /tickets/:id
Atualizar ticket
```json
{
  "status": "em_andamento",
  "assignedTo": "ID_DO_TECNICO",
  "priority": "critica"
}
```

### DELETE /tickets/:id
Deletar ticket (Admin apenas)

### POST /tickets/:id/comments
Adicionar comentário
```json
{
  "comment": "Problema resolvido!"
}
```

### GET /tickets/stats/summary
Obter estatísticas (Admin/Técnico)

---

## 💻 Ativos

### GET /assets
Listar ativos
Query params: `?status=ativo&responsible=ID_USUARIO`

### POST /assets
Criar ativo (Admin/Técnico)
```json
{
  "assetId": "NB-001",
  "description": "Notebook Dell",
  "location": "TI - Sala 101",
  "acquisitionDate": "2024-01-15",
  "status": "ativo",
  "responsible": "ID_USUARIO"
}
```

### GET /assets/:id
Obter ativo por ID

### PUT /assets/:id
Atualizar ativo (Admin/Técnico)

### DELETE /assets/:id
Deletar ativo (Admin)

---

## 📜 Certificados

### GET /certificates
Listar certificados
Query params: `?status=ativo&type=ssl`

### POST /certificates
Criar certificado (Admin/Técnico)
```json
{
  "name": "SSL - site.com",
  "type": "ssl",
  "issueDate": "2024-01-01",
  "expirationDate": "2025-01-01",
  "provider": "Let's Encrypt",
  "status": "ativo"
}
```

### GET /certificates/expiring/soon
Certificados expirando
Query params: `?days=30`

### POST /certificates/check-expiration
Verificar expirações e criar alertas (Admin/Técnico)

### GET /certificates/:id
Obter certificado por ID

### PUT /certificates/:id
Atualizar certificado (Admin/Técnico)

### DELETE /certificates/:id
Deletar certificado (Admin)

---

## 📚 Base de Conhecimento

### GET /kb
Listar artigos
Query params: `?category=Hardware&search=impressora`

### POST /kb
Criar artigo (Admin/Técnico)
```json
{
  "title": "Como resetar senha",
  "content": "Conteúdo do artigo...",
  "category": "Tutoriais",
  "tags": ["senha", "login", "acesso"],
  "published": true
}
```

### GET /kb/search/related
Buscar artigos relacionados
Query params: `?query=impressora`

### GET /kb/:id
Obter artigo por ID (incrementa visualizações)

### PUT /kb/:id
Atualizar artigo (Admin/Técnico)

### DELETE /kb/:id
Deletar artigo (Admin)

---

## 💰 Boletos

### GET /boletos
Listar boletos (Admin/Técnico)
Query params: `?status=pendente&month=11&year=2024`

### POST /boletos
Criar boleto (Admin/Técnico)
```json
{
  "description": "Licença Microsoft",
  "value": 1500.00,
  "provider": "Microsoft",
  "dueDate": "2024-12-31",
  "observation": "Pagamento automático"
}
```

### GET /boletos/pending/list
Listar boletos pendentes (Admin/Técnico)

### POST /boletos/check-due
Verificar boletos próximos do vencimento (Admin/Técnico)

### POST /boletos/update-overdue
Atualizar boletos atrasados (Admin/Técnico)

### GET /boletos/:id
Obter boleto por ID (Admin/Técnico)

### PUT /boletos/:id
Atualizar boleto (Admin/Técnico)
```json
{
  "status": "pago"
}
```

### DELETE /boletos/:id
Deletar boleto (Admin)

---

## 📊 Dashboard

### GET /dashboard/kpis
Obter KPIs principais
```json
{
  "tickets": { "total": 10, "byStatus": [...], "avgResolutionTimeHours": 24 },
  "assets": { "total": 5, "byStatus": [...] },
  "certificates": { "critical": 2 },
  "boletos": { "pending": 3, "overdue": 1 },
  "knowledgeBase": { "total": 10, "totalViews": 150 }
}
```

### GET /dashboard/recent-activity
Obter atividades recentes
Query params: `?limit=10`

---

## 🔔 Notificações

### GET /notifications
Listar notificações do usuário
Query params: `?isRead=false`

### PUT /notifications/:id/read
Marcar notificação como lida

### PUT /notifications/read-all
Marcar todas como lidas

### DELETE /notifications/:id
Deletar notificação

---

## 📋 Enums e Valores Permitidos

### Roles (Funções)
- `admin` - Administrador
- `tecnico` - Técnico
- `cliente` - Cliente

### Ticket Status
- `aberto` - Aberto
- `em_andamento` - Em Andamento
- `resolvido` - Resolvido
- `fechado` - Fechado

### Ticket Priority
- `baixa` - Baixa
- `media` - Média
- `alta` - Alta
- `critica` - Crítica

### Ticket Category
- `hardware` - Hardware
- `software` - Software
- `rede` - Rede
- `acesso` - Acesso
- `outros` - Outros

### Asset Status
- `ativo` - Ativo
- `manutencao` - Manutenção
- `inativo` - Inativo
- `descartado` - Descartado

### Certificate Type
- `ssl` - SSL
- `licenca_software` - Licença de Software
- `validacao_hardware` - Validação de Hardware

### Certificate Status
- `ativo` - Ativo
- `expirado` - Expirado
- `renovado` - Renovado

### Boleto Status
- `pendente` - Pendente
- `pago` - Pago
- `atrasado` - Atrasado

### Notification Type
- `certificado` - Certificado
- `boleto` - Boleto
- `ticket` - Ticket
- `sistema` - Sistema

### Notification Priority
- `baixa` - Baixa
- `media` - Média
- `alta` - Alta

---

## 🔒 Permissões por Role

### Admin
✅ Acesso total a todos os endpoints

### Técnico
✅ Tickets (CRUD completo)
✅ Ativos (CRUD completo)
✅ Certificados (CRUD completo)
✅ Base de Conhecimento (CRUD completo)
✅ Boletos (CRUD completo)
✅ Dashboard (visualização)
❌ Deletar recursos (apenas Admin)

### Cliente
✅ Tickets (criar e visualizar seus próprios)
✅ Base de Conhecimento (visualizar)
✅ Dashboard (visualização limitada)
❌ Ativos, Certificados, Boletos

---

## 🧪 Exemplo de Uso com cURL

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gestao.com","password":"admin123"}'

# Resposta: { "success": true, "data": { "token": "...", "user": {...} } }

# 2. Usar token nas requisições
TOKEN="seu_token_aqui"

# 3. Listar tickets
curl http://localhost:3000/api/tickets \
  -H "Authorization: Bearer $TOKEN"

# 4. Criar ticket
curl -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Problema de rede",
    "description": "Internet lenta",
    "category": "rede",
    "priority": "media"
  }'

# 5. Obter KPIs
curl http://localhost:3000/api/dashboard/kpis \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📝 Respostas da API

### Sucesso
```json
{
  "success": true,
  "data": { ... },
  "count": 10  // opcional, em listagens
}
```

### Erro
```json
{
  "success": false,
  "message": "Mensagem de erro"
}
```

### Códigos HTTP
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 🚀 Testando a API

### Ferramentas Recomendadas
- **Postman** - https://www.postman.com/
- **Insomnia** - https://insomnia.rest/
- **Thunder Client** (VS Code Extension)
- **cURL** (linha de comando)

### Health Check
```bash
curl http://localhost:3000/api/health
```

Resposta:
```json
{
  "success": true,
  "message": "API está funcionando!",
  "timestamp": "2025-11-28T..."
}
```

---

**📚 Documentação completa:** backend/README.md
