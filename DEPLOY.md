# Guia de Deploy - Sistema de Gestão de TI

Este guia descreve como preparar e rodar o sistema em um servidor de produção (Windows/Linux).

## Pré-requisitos
- Node.js (v18 ou superior) instalado no servidor.
- MongoDB instalado e rodando (ou string de conexão para MongoDB Atlas).

## Passo 1: Configuração do Ambiente
Configure as variáveis de ambiente no arquivo `backend/.env`. Você pode basear-se no `.env.example`.

Principais variáveis:
- `NODE_ENV=production`
- `MONGODB_URI`: Sua string de conexão do banco de dados.
- `JWT_SECRET`: Uma string longa e segura.
- `PORT`: Porta onde o servidor vai rodar (padrão 3000).

## Passo 2: Build (Preparação)
Antes de rodar no servidor, você precisa "compilar" o frontend e juntá-lo com o backend.

### No Windows (PowerShell):
Execute o script na raiz do projeto:
```powershell
.\build_prod.ps1
```

### Manualmente (Linux/Outros):
1.  Vá para `frontend` e rode: `npm install` e `npm run build`.
2.  Crie uma pasta `backend/public`.
3.  Copie todo o conteúdo de `frontend/dist` para `backend/public`.
4.  Vá para `backend` e rode: `npm install --omit=dev`.

## Passo 3: Rodar a Aplicação
Para iniciar o sistema em modo produção:

### No Windows (PowerShell):
```powershell
.\start_prod.ps1
```

### Manualmente (Linux/Outros):
Na pasta `backend`:
```bash
export NODE_ENV=production
node src/server.js
```

## Dicas de Servidor (PM2)
Para manter o servidor rodando permanentemente (reiniciar se cair), recomendamos usar o **PM2**:

1.  Instale o PM2: `npm install -g pm2`
2.  Inicie a aplicação:
    ```bash
    cd backend
    pm2 start src/server.js --name "gestao-ti"
    ```
