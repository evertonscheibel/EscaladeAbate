# 🚀 GUIA DE INSTALAÇÃO - Sistema de Gestão de TI

## ⚠️ PRÉ-REQUISITOS

### 1. Instalar Node.js

**Baixe e instale o Node.js:**
- Acesse: https://nodejs.org/
- Baixe a versão LTS (recomendada)
- Execute o instalador
- Reinicie o terminal após a instalação

**Verificar instalação:**
```powershell
node --version
npm --version
```

### 2. Instalar MongoDB

**Opção A - MongoDB Local (Windows):**
1. Baixe: https://www.mongodb.com/try/download/community
2. Instale o MongoDB Community Server
3. Durante a instalação, marque "Install MongoDB as a Service"
4. Após instalação, o MongoDB já estará rodando

**Opção B - MongoDB Atlas (Cloud - GRATUITO - Recomendado):**
1. Crie conta em: https://www.mongodb.com/cloud/atlas/register
2. Crie um cluster gratuito (M0)
3. Configure usuário e senha
4. Adicione seu IP na whitelist (ou 0.0.0.0/0 para permitir todos)
5. Copie a connection string
6. Cole no arquivo `backend/.env` na variável `MONGODB_URI`

## 📦 INSTALAÇÃO DO BACKEND

```powershell
# Navegar até a pasta do backend
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente (já está configurado)
# Edite backend/.env se necessário

# Popular banco com dados de exemplo
npm run seed

# Iniciar servidor
npm run dev
```

O backend estará rodando em: **http://localhost:3000**

## 🎨 INSTALAÇÃO DO FRONTEND

```powershell
# Navegar até a pasta do frontend
cd frontend

# Instalar dependências
npm install

# Iniciar aplicação
npm run dev
```

O frontend estará rodando em: **http://localhost:5173**

## 🧪 TESTAR A API

Após iniciar o backend, teste se está funcionando:

```powershell
# No navegador ou Postman, acesse:
http://localhost:3000/api/health
```

Deve retornar:
```json
{
  "success": true,
  "message": "API está funcionando!",
  "timestamp": "2025-11-28T..."
}
```

## 👥 USUÁRIOS DE TESTE

Após rodar `npm run seed`, você terá:

- **Admin:** admin@gestao.com / admin123
- **Técnico:** joao@gestao.com / tecnico123
- **Cliente:** maria@cliente.com / cliente123

## 🔧 SOLUÇÃO DE PROBLEMAS

### Erro: "npm não é reconhecido"
- Instale o Node.js e reinicie o terminal

### Erro de conexão com MongoDB
- **Se usando local:** Verifique se o serviço MongoDB está rodando
- **Se usando Atlas:** Verifique a connection string no .env

### Porta 3000 já em uso
- Mude a porta no arquivo `backend/.env`:
  ```
  PORT=3001
  ```

## 📂 ESTRUTURA DO PROJETO

```
V0/
├── backend/          # API Node.js + Express + MongoDB
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── .env
│   └── package.json
│
├── frontend/         # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── App.tsx
│   └── package.json
│
└── database_instructions.md
```

## 🚀 PRÓXIMOS PASSOS

1. ✅ Instalar Node.js
2. ✅ Escolher MongoDB (Local ou Atlas)
3. ⏳ Instalar dependências do backend
4. ⏳ Rodar seed do banco
5. ⏳ Iniciar backend
6. ⏳ Instalar dependências do frontend
7. ⏳ Iniciar frontend
8. ⏳ Fazer login e testar o sistema!

---

**Dúvidas?** Verifique os arquivos README.md em cada pasta (backend/frontend)
