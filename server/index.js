const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Em produção, restrinja para a URL do seu frontend
        methods: ["GET", "POST"]
    }
});

let clientWpp = null;
let qrCodeData = null;
let status = 'DISCONNECTED'; // DISCONNECTED, QRCODE, CONNECTED

const startWpp = async () => {
    try {
        wppconnect.create({
            session: 'frizelo-support',
            catchQR: (base64Qr, asciiQR) => {
                console.log('QR Code recebido');
                qrCodeData = base64Qr;
                status = 'QRCODE';
                io.emit('status', { status, qrCode: qrCodeData });
            },
            statusFind: (statusSession, session) => {
                console.log('Status Session: ', statusSession);
                if (statusSession === 'isLogged' || statusSession === 'inChat') {
                    status = 'CONNECTED';
                    qrCodeData = null;
                    io.emit('status', { status });
                }
            },
            headless: true, // Mude para false se quiser ver o navegador abrindo
            devtools: false,
            useChrome: true,
            debug: false,
            logQR: true,
            browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
        })
        .then((client) => {
            clientWpp = client;
            status = 'CONNECTED';
            io.emit('status', { status });
            console.log('WPPConnect iniciado com sucesso!');

            // Escutar mensagens
            client.onMessage((message) => {
                if (message.isGroupMsg) return; // Ignorar grupos por enquanto
                
                console.log('Mensagem recebida:', message.body);
                io.emit('message', {
                    id: message.id,
                    from: message.from,
                    body: message.body,
                    sender: message.sender,
                    timestamp: message.timestamp,
                    isMine: message.fromMe
                });
            });
        })
        .catch((error) => {
            console.log(error);
            status = 'ERROR';
            io.emit('status', { status, error: error.message });
        });
    } catch (e) {
        console.error("Erro ao iniciar WPPConnect:", e);
    }
};

// Iniciar WPPConnect
startWpp();

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('Novo cliente conectado:', socket.id);
    
    // Enviar status atual ao conectar
    socket.emit('status', { status, qrCode: qrCodeData });

    // Receber pedido de envio de mensagem do frontend
    socket.on('send_message', async (data) => {
        if (!clientWpp || status !== 'CONNECTED') {
            socket.emit('error', { message: 'WhatsApp não conectado' });
            return;
        }

        try {
            // data.to deve ser o número completo, ex: '5511999999999@c.us'
            const result = await clientWpp.sendText(data.to, data.message);
            socket.emit('message_sent', { success: true, result });
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            socket.emit('message_sent', { success: false, error: error.message });
        }
    });
    
    // Listar chats (opcional, para carregar histórico inicial)
    socket.on('get_chats', async () => {
        if (!clientWpp || status !== 'CONNECTED') return;
        try {
            const chats = await clientWpp.listChats();
            socket.emit('chats_list', chats);
        } catch (e) {
            console.error('Erro ao listar chats', e);
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
