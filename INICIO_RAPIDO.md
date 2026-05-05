# ⚡ INÍCIO RÁPIDO - Sistema de Gestão de TI

## 🎯 3 Passos para Começar

### 1️⃣ Instalar Node.js
- Baixe: https://nodejs.org/
- Instale a versão LTS
- Reinicie o terminal

### 2️⃣ Executar Instalação
```powershell
.\install.ps1
```

### 3️⃣ Iniciar Sistema
```powershell
.\start.ps1
```

**Pronto! Acesse:** http://localhost:5173

---

## 🔑 Login

Use uma das credenciais:

```
Admin:    admin@gestao.com    / admin123
Técnico:  joao@gestao.com     / tecnico123
Cliente:  maria@cliente.com   / cliente123
```

---

## 🗄️ MongoDB

### Opção A: Local (Simples)
1. Instale: https://www.mongodb.com/try/download/community
2. Pronto! Já funciona

### Opção B: Cloud (Recomendado)
1. Crie conta: https://www.mongodb.com/cloud/atlas/register
2. Crie cluster gratuito
3. Copie connection string
4. Cole em `backend/.env`

---

## 🚀 Comandos Úteis

### Backend
```powershell
cd backend
npm run dev      # Iniciar servidor
npm run seed     # Popular banco
```

### Frontend
```powershell
cd frontend
npm run dev      # Iniciar aplicação
npm run build    # Build produção
```

---

## 📚 Documentação Completa

- **README.md** - Documentação principal
- **RESUMO.md** - Visão geral do projeto
- **INSTALACAO.md** - Guia detalhado

---

## ❓ Problemas?

### "npm não é reconhecido"
→ Instale Node.js e reinicie o terminal

### Erro de conexão MongoDB
→ Verifique se MongoDB está rodando

### Porta em uso
→ Mude em `backend/.env`: `PORT=3001`

---

## 🎉 Pronto!

Seu sistema está funcionando! 

**Explore os módulos:**
- 🎫 Tickets
- 💻 Ativos
- 📜 Certificados
- 📚 Base de Conhecimento
- 💰 Boletos
- 📊 Dashboard

**Boa gestão!** 🚀
