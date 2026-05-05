# 📱 INTEGRAÇÃO WHATSAPP E TELEGRAM

## 🎯 Objetivo
Preparar o sistema para receber e enviar notificações via WhatsApp e Telegram.

---

## 📋 ARQUITETURA DA INTEGRAÇÃO

```
┌─────────────────┐
│   Sistema TI    │
│   (Backend)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│WhatsApp│ │Telegram│
│  Bot   │ │  Bot   │
└────────┘ └────────┘
```

---

## 🟢 INTEGRAÇÃO WHATSAPP

### Opção 1: WhatsApp Business API (Oficial - Pago)
- **Custo:** A partir de $0.005 por mensagem
- **Vantagens:** Oficial, estável, suporte
- **Desvantagens:** Requer aprovação, custo

### Opção 2: Baileys (Não Oficial - Gratuito) ⭐ RECOMENDADO

#### 1. Instalar Dependências
```bash
cd backend
npm install @whiskeysockets/baileys qrcode-terminal
```

#### 2. Criar Serviço WhatsApp

Arquivo: `backend/src/services/whatsappService.js`

```javascript
import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState 
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import Ticket from '../models/Ticket.js';

let sock = null;

export const initWhatsApp = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📱 Escaneie o QR Code com o WhatsApp:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('❌ Conexão fechada. Reconectando:', shouldReconnect);
      if (shouldReconnect) {
        initWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('✅ WhatsApp conectado!');
    }
  });

  // Receber mensagens
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || 
                 msg.message.extendedTextMessage?.text || '';

    console.log(`📩 Mensagem de ${from}: ${text}`);

    // Criar ticket automaticamente
    if (text.toLowerCase().startsWith('/ticket')) {
      await handleCreateTicket(from, text);
    }
  });
};

const handleCreateTicket = async (phone, message) => {
  try {
    // Extrair informações da mensagem
    const lines = message.split('\n');
    const title = lines[1] || 'Ticket via WhatsApp';
    const description = lines.slice(2).join('\n') || 'Sem descrição';

    // Criar ticket
    const ticket = await Ticket.create({
      title,
      description,
      category: 'outros',
      priority: 'media',
      status: 'aberto',
      // TODO: Vincular ao usuário pelo telefone
    });

    await sendWhatsAppMessage(phone, 
      `✅ Ticket #${ticket._id.toString().slice(-6)} criado com sucesso!\n\n` +
      `📋 Título: ${title}\n` +
      `📝 Descrição: ${description}\n\n` +
      `Você receberá atualizações sobre este ticket.`
    );
  } catch (error) {
    console.error('Erro ao criar ticket:', error);
    await sendWhatsAppMessage(phone, 
      '❌ Erro ao criar ticket. Tente novamente mais tarde.'
    );
  }
};

export const sendWhatsAppMessage = async (to, message) => {
  if (!sock) {
    console.error('WhatsApp não conectado');
    return false;
  }

  try {
    await sock.sendMessage(to, { text: message });
    console.log(`✅ Mensagem enviada para ${to}`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return false;
  }
};

export const sendTicketNotification = async (phone, ticket, message) => {
  const text = 
    `🎫 Atualização do Ticket #${ticket._id.toString().slice(-6)}\n\n` +
    `📋 ${ticket.title}\n` +
    `📊 Status: ${ticket.status}\n` +
    `⚡ Prioridade: ${ticket.priority}\n\n` +
    `💬 ${message}`;

  return await sendWhatsAppMessage(phone, text);
};
```

#### 3. Inicializar no Server

Arquivo: `backend/src/server.js`

```javascript
import { initWhatsApp } from './services/whatsappService.js';

// Após conectar ao MongoDB
connectDB().then(() => {
  console.log('✅ MongoDB conectado');
  
  // Iniciar WhatsApp
  initWhatsApp().catch(console.error);
});
```

#### 4. Usar nas Notificações

Arquivo: `backend/src/controllers/ticketController.js`

```javascript
import { sendTicketNotification } from '../services/whatsappService.js';

// Ao atualizar ticket
export const updateTicket = async (req, res, next) => {
  try {
    // ... código existente ...

    // Enviar notificação WhatsApp
    if (ticket.requester?.phone) {
      await sendTicketNotification(
        ticket.requester.phone,
        ticket,
        'Seu ticket foi atualizado!'
      );
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};
```

---

## 🔵 INTEGRAÇÃO TELEGRAM

### 1. Criar Bot no Telegram

1. Abra o Telegram
2. Procure por **@BotFather**
3. Envie `/newbot`
4. Escolha um nome e username
5. Copie o **TOKEN** fornecido

### 2. Instalar Dependências

```bash
cd backend
npm install node-telegram-bot-api
```

### 3. Criar Serviço Telegram

Arquivo: `backend/src/services/telegramService.js`

```javascript
import TelegramBot from 'node-telegram-bot-api';
import Ticket from '../models/Ticket.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

export const initTelegram = () => {
  if (!token) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN não configurado');
    return;
  }

  bot = new TelegramBot(token, { polling: true });

  console.log('✅ Telegram Bot iniciado!');

  // Comando /start
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 
      '👋 Bem-vindo ao Sistema de Gestão de TI!\n\n' +
      'Comandos disponíveis:\n' +
      '/ticket - Criar novo ticket\n' +
      '/status - Ver status dos seus tickets\n' +
      '/help - Ajuda'
    );
  });

  // Comando /ticket
  bot.onText(/\/ticket (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const text = match[1];

    try {
      const ticket = await Ticket.create({
        title: text,
        description: 'Criado via Telegram',
        category: 'outros',
        priority: 'media',
        status: 'aberto'
      });

      bot.sendMessage(chatId, 
        `✅ Ticket #${ticket._id.toString().slice(-6)} criado!\n\n` +
        `📋 ${ticket.title}\n` +
        `📊 Status: ${ticket.status}`
      );
    } catch (error) {
      bot.sendMessage(chatId, '❌ Erro ao criar ticket');
    }
  });

  // Comando /status
  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const tickets = await Ticket.find({ status: { $ne: 'fechado' } })
        .limit(5)
        .sort({ createdAt: -1 });

      if (tickets.length === 0) {
        bot.sendMessage(chatId, '📭 Nenhum ticket aberto');
        return;
      }

      let message = '📋 Tickets Abertos:\n\n';
      tickets.forEach(ticket => {
        message += `🎫 #${ticket._id.toString().slice(-6)} - ${ticket.title}\n`;
        message += `   Status: ${ticket.status} | Prioridade: ${ticket.priority}\n\n`;
      });

      bot.sendMessage(chatId, message);
    } catch (error) {
      bot.sendMessage(chatId, '❌ Erro ao buscar tickets');
    }
  });
};

export const sendTelegramMessage = async (chatId, message) => {
  if (!bot) {
    console.error('Telegram não inicializado');
    return false;
  }

  try {
    await bot.sendMessage(chatId, message);
    return true;
  } catch (error) {
    console.error('Erro ao enviar mensagem Telegram:', error);
    return false;
  }
};

export const sendTelegramTicketNotification = async (chatId, ticket, message) => {
  const text = 
    `🎫 Ticket #${ticket._id.toString().slice(-6)}\n\n` +
    `📋 ${ticket.title}\n` +
    `📊 Status: ${ticket.status}\n` +
    `⚡ Prioridade: ${ticket.priority}\n\n` +
    `💬 ${message}`;

  return await sendTelegramMessage(chatId, text);
};
```

### 4. Configurar .env

```env
# Telegram
TELEGRAM_BOT_TOKEN=seu_token_aqui
```

### 5. Inicializar no Server

```javascript
import { initTelegram } from './services/telegramService.js';

connectDB().then(() => {
  initWhatsApp().catch(console.error);
  initTelegram();
});
```

---

## 📊 MODELO DE USUÁRIO ATUALIZADO

Adicionar campos de telefone/chat:

```javascript
// backend/src/models/User.js

const userSchema = new mongoose.Schema({
  // ... campos existentes ...
  
  phone: {
    type: String,
    sparse: true // Permite null/undefined
  },
  whatsappPhone: {
    type: String,
    sparse: true
  },
  telegramChatId: {
    type: String,
    sparse: true
  },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false },
    telegram: { type: Boolean, default: false }
  }
});
```

---

## 🔔 SISTEMA DE NOTIFICAÇÕES UNIFICADO

Arquivo: `backend/src/services/notificationService.js`

```javascript
import { sendWhatsAppMessage } from './whatsappService.js';
import { sendTelegramMessage } from './telegramService.js';
import nodemailer from 'nodemailer';

export const sendNotification = async (user, title, message) => {
  const promises = [];

  // Email
  if (user.notificationPreferences?.email) {
    promises.push(sendEmail(user.email, title, message));
  }

  // WhatsApp
  if (user.notificationPreferences?.whatsapp && user.whatsappPhone) {
    promises.push(sendWhatsAppMessage(user.whatsappPhone, `${title}\n\n${message}`));
  }

  // Telegram
  if (user.notificationPreferences?.telegram && user.telegramChatId) {
    promises.push(sendTelegramMessage(user.telegramChatId, `${title}\n\n${message}`));
  }

  await Promise.allSettled(promises);
};

const sendEmail = async (to, subject, text) => {
  // Implementar com nodemailer
  console.log(`📧 Email para ${to}: ${subject}`);
};
```

---

## 🚀 COMO USAR

### WhatsApp:
1. Inicie o backend
2. Escaneie o QR Code com WhatsApp
3. Envie mensagem para o número conectado:
```
/ticket
Problema no computador
O computador não liga
```

### Telegram:
1. Procure seu bot no Telegram
2. Envie `/start`
3. Use os comandos:
```
/ticket Problema na impressora
/status
```

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Adicionar campos de telefone no modelo User
2. ✅ Criar página de configurações de notificações
3. ✅ Implementar webhook para receber mensagens
4. ✅ Adicionar botões interativos (Telegram)
5. ✅ Implementar autenticação por telefone
6. ✅ Dashboard de mensagens recebidas

---

**Pronto! Sistema preparado para WhatsApp e Telegram!** 📱🤖
