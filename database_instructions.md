# INSTRUÇÕES DE BANCO DE DADOS - SISTEMA DE GESTÃO DE TI

## 1. TECNOLOGIA RECOMENDADA
- **Backend**: Node.js + Express
- **Banco de Dados**: PostgreSQL ou MySQL
- **ORM**: Prisma ou Sequelize
- **Autenticação**: JWT (JSON Web Tokens)
- **Upload de Arquivos**: Multer + AWS S3 ou local storage

## 2. ESTRUTURA DO BANCO DE DADOS

### Tabela: users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'tecnico', 'cliente') DEFAULT 'cliente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: tickets
```sql
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    priority ENUM('baixa', 'media', 'alta', 'critica') DEFAULT 'media',
    status ENUM('aberto', 'em_andamento', 'resolvido', 'fechado') DEFAULT 'aberto',
    requester_id INT REFERENCES users(id),
    assigned_to INT REFERENCES users(id),
    asset_id INT REFERENCES assets(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_priority (priority)
);
```

### Tabela: ticket_comments
```sql
CREATE TABLE ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INT REFERENCES tickets(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: ticket_attachments
```sql
CREATE TABLE ticket_attachments (
    id SERIAL PRIMARY KEY,
    ticket_id INT REFERENCES tickets(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: assets
```sql
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    asset_id VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    acquisition_date DATE,
    status ENUM('ativo', 'manutencao', 'inativo', 'descartado') DEFAULT 'ativo',
    responsible_id INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: certificates
```sql
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('ssl', 'licenca_software', 'validacao_hardware') NOT NULL,
    issue_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    provider VARCHAR(255),
    file_path VARCHAR(500),
    status ENUM('ativo', 'expirado', 'renovado') DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_expiration (expiration_date)
);
```

### Tabela: knowledge_base
```sql
CREATE TABLE knowledge_base (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags VARCHAR(500),
    author_id INT REFERENCES users(id),
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category)
);
```

### Tabela: kb_attachments
```sql
CREATE TABLE kb_attachments (
    id SERIAL PRIMARY KEY,
    kb_id INT REFERENCES knowledge_base(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: boletos
```sql
CREATE TABLE boletos (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    deliver_by_date DATE NOT NULL,
    observation TEXT,
    status ENUM('pendente', 'pago', 'atrasado') DEFAULT 'pendente',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_due_date (due_date)
);
```

### Tabela: notifications
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    type ENUM('certificado', 'boleto', 'ticket') NOT NULL,
    message TEXT NOT NULL,
    reference_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 3. SCHEMA PRISMA (Alternativa ORM)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(CLIENTE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  ticketsCreated   Ticket[]       @relation("TicketRequester")
  ticketsAssigned  Ticket[]       @relation("TicketAssigned")
  comments         TicketComment[]
  assets           Asset[]
  kbArticles       KnowledgeBase[]
  notifications    Notification[]
}

enum Role {
  ADMIN
  TECNICO
  CLIENTE
}

model Ticket {
  id          Int            @id @default(autoincrement())
  title       String
  description String
  category    String?
  priority    Priority       @default(MEDIA)
  status      TicketStatus   @default(ABERTO)
  requesterId Int
  assignedId  Int?
  assetId     Int?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  resolvedAt  DateTime?
  
  requester   User           @relation("TicketRequester", fields: [requesterId], references: [id])
  assigned    User?          @relation("TicketAssigned", fields: [assignedId], references: [id])
  asset       Asset?         @relation(fields: [assetId], references: [id])
  comments    TicketComment[]
  attachments TicketAttachment[]
  
  @@index([status])
  @@index([priority])
}

enum Priority {
  BAIXA
  MEDIA
  ALTA
  CRITICA
}

enum TicketStatus {
  ABERTO
  EM_ANDAMENTO
  RESOLVIDO
  FECHADO
}

model TicketComment {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  userId    Int
  comment   String
  createdAt DateTime @default(now())
  
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])
}

model TicketAttachment {
  id         Int      @id @default(autoincrement())
  ticketId   Int
  fileName   String
  filePath   String
  fileSize   Int?
  uploadedAt DateTime @default(now())
  
  ticket     Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
}

model Asset {
  id              Int         @id @default(autoincrement())
  assetId         String      @unique
  description     String
  location        String?
  acquisitionDate DateTime?
  status          AssetStatus @default(ATIVO)
  responsibleId   Int?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  responsible     User?       @relation(fields: [responsibleId], references: [id])
  tickets         Ticket[]
}

enum AssetStatus {
  ATIVO
  MANUTENCAO
  INATIVO
  DESCARTADO
}

model Certificate {
  id             Int              @id @default(autoincrement())
  name           String
  type           CertificateType
  issueDate      DateTime
  expirationDate DateTime
  provider       String?
  filePath       String?
  status         CertStatus       @default(ATIVO)
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  
  @@index([expirationDate])
}

enum CertificateType {
  SSL
  LICENCA_SOFTWARE
  VALIDACAO_HARDWARE
}

enum CertStatus {
  ATIVO
  EXPIRADO
  RENOVADO
}

model KnowledgeBase {
  id          Int      @id @default(autoincrement())
  title       String
  content     String
  category    String?
  tags        String?
  authorId    Int
  views       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  author      User     @relation(fields: [authorId], references: [id])
  attachments KBAttachment[]
  
  @@index([category])
}

model KBAttachment {
  id         Int           @id @default(autoincrement())
  kbId       Int
  fileName   String
  filePath   String
  uploadedAt DateTime      @default(now())
  
  kb         KnowledgeBase @relation(fields: [kbId], references: [id], onDelete: Cascade)
}

model Boleto {
  id              Int           @id @default(autoincrement())
  description     String
  value           Decimal       @db.Decimal(10, 2)
  provider        String
  dueDate         DateTime
  deliverByDate   DateTime
  observation     String?
  status          BoletoStatus  @default(PENDENTE)
  paidAt          DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@index([dueDate])
}

enum BoletoStatus {
  PENDENTE
  PAGO
  ATRASADO
}

model Notification {
  id          Int              @id @default(autoincrement())
  userId      Int
  type        NotificationType
  message     String
  referenceId Int?
  isRead      Boolean          @default(false)
  createdAt   DateTime         @default(now())
  
  user        User             @relation(fields: [userId], references: [id])
}

enum NotificationType {
  CERTIFICADO
  BOLETO
  TICKET
}
```

## 4. ENDPOINTS DA API REST

### Autenticação
- `POST /api/auth/register` - Cadastro de usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuário logado

### Tickets
- `GET /api/tickets` - Listar tickets
- `POST /api/tickets` - Criar ticket
- `GET /api/tickets/:id` - Detalhes do ticket
- `PUT /api/tickets/:id` - Atualizar ticket
- `DELETE /api/tickets/:id` - Deletar ticket
- `POST /api/tickets/:id/comments` - Adicionar comentário
- `POST /api/tickets/:id/attachments` - Upload de anexo

### Ativos
- `GET /api/assets` - Listar ativos
- `POST /api/assets` - Criar ativo
- `GET /api/assets/:id` - Detalhes do ativo
- `PUT /api/assets/:id` - Atualizar ativo
- `DELETE /api/assets/:id` - Deletar ativo

### Certificados
- `GET /api/certificates` - Listar certificados
- `POST /api/certificates` - Criar certificado
- `GET /api/certificates/:id` - Detalhes
- `PUT /api/certificates/:id` - Atualizar
- `DELETE /api/certificates/:id` - Deletar
- `GET /api/certificates/expiring` - Certificados próximos do vencimento

### Base de Conhecimento
- `GET /api/kb` - Listar artigos
- `POST /api/kb` - Criar artigo
- `GET /api/kb/:id` - Detalhes do artigo
- `PUT /api/kb/:id` - Atualizar artigo
- `DELETE /api/kb/:id` - Deletar artigo
- `GET /api/kb/search?q=termo` - Buscar artigos

### Boletos
- `GET /api/boletos` - Listar boletos
- `POST /api/boletos` - Criar boleto
- `GET /api/boletos/:id` - Detalhes
- `PUT /api/boletos/:id` - Atualizar
- `DELETE /api/boletos/:id` - Deletar
- `GET /api/boletos/pending` - Boletos pendentes

### Relatórios
- `GET /api/reports/tickets?start=&end=` - Relatório de tickets
- `GET /api/reports/assets` - Relatório de ativos
- `GET /api/reports/certificates` - Relatório de certificados
- `GET /api/reports/boletos` - Relatório de boletos

### Dashboard
- `GET /api/dashboard/kpis` - KPIs principais

## 5. JOBS AUTOMÁTICOS (Cron Jobs)

```javascript
// Verificar certificados expirando (rodar diariamente)
cron.schedule('0 0 * * *', async () => {
  const certificates = await checkExpiringCertificates();
  // Enviar notificações e criar tickets
});

// Verificar boletos próximos do vencimento (rodar diariamente)
cron.schedule('0 8 * * *', async () => {
  const boletos = await checkPendingBoletos();
  // Enviar alertas
});

// Atualizar status de boletos atrasados (rodar diariamente)
cron.schedule('0 1 * * *', async () => {
  await updateOverdueBoletos();
});
```

## 6. VARIÁVEIS DE AMBIENTE (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/gestao_ti"
JWT_SECRET="seu_secret_super_seguro"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880
```

## 7. COMANDOS DE INICIALIZAÇÃO

```bash
# Instalar dependências
npm install express prisma @prisma/client bcrypt jsonwebtoken multer cors dotenv node-cron

# Inicializar Prisma
npx prisma init

# Criar migrations
npx prisma migrate dev --name init

# Gerar Prisma Client
npx prisma generate

# Rodar servidor
npm run dev
```

## 8. SEGURANÇA

- Senhas: bcrypt com salt rounds >= 10
- Autenticação: JWT com expiração
- Validação: express-validator em todas as rotas
- CORS: configurado para domínios específicos
- Rate limiting: express-rate-limit
- Sanitização: helmet.js

## 9. BACKUP E MANUTENÇÃO

```bash
# Backup diário do banco
pg_dump gestao_ti > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql gestao_ti < backup_20250128.sql
```

---

**Próximos Passos:**
1. Configurar ambiente Node.js + PostgreSQL
2. Implementar schema Prisma
3. Criar rotas da API
4. Integrar frontend existente com backend
5. Implementar autenticação JWT
6. Configurar jobs automáticos
7. Testes e deploy
