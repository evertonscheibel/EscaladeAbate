// ========================================
// 1. Carregar variáveis de ambiente PRIMEIRO
// ========================================
import dotenv from 'dotenv';
dotenv.config();

// 2. Validar variáveis obrigatórias (falha rápida)
import { validateEnv } from './utils/envCheck.js';
validateEnv();

// ========================================
// 3. Imports do framework e dependências
// ========================================
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';

// Rotas
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import kbRoutes from './routes/kbRoutes.js';
import boletoRoutes from './routes/boletoRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import permissionProfileRoutes from './routes/permissionProfileRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import assetTimelineRoutes from './routes/assetTimelineRoutes.js';
import problemRoutes from './routes/problemRoutes.js';
import purchaseRequestRoutes from './routes/purchaseRequestRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import networkDeviceRoutes from './routes/networkDeviceRoutes.js';
import credentialRoutes from './routes/credentialRoutes.js';
import rancherRoutes from './routes/rancherRoutes.js';
import slaughterRoutes from './routes/slaughterRoutes.js';
import gatehouseRoutes from './routes/gatehouseRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import jobPositionRoutes from './routes/jobPositionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import closureRoutes from './routes/closureRoutes.js';
import deboningRoutes from './routes/deboningRoutes.js';
import deboningBrokerRoutes from './routes/deboningBrokerRoutes.js';
import deboningCutRoutes from './routes/deboningCutRoutes.js';
import pcpRoutes from './routes/pcpRoutes.js';
import importRoutes from './routes/importRoutes.js';
import preScheduleRoutes from './routes/preScheduleRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import pacRoutes from './routes/pacRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import pcpDowntimeRoutes from './routes/pcpDowntimeRoutes.js';
import coldRoomRoutes from './routes/coldRoomRoutes.js';

// Logger estruturado
import logger from './utils/logger.js';

// Cron jobs
import './utils/cronJobs.js';

// Conectar ao banco de dados
connectDB();

const app = express();

// Middlewares de segurança
app.use(helmet());

// CORS restritivo — apenas origens permitidas
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(o => o.trim());
app.use(cors({
    origin: (origin, callback) => {
        // Permitir requests sem origin ou origens permitidas
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
            callback(null, true);
        } else {
            console.warn(`CORS: Origem não permitida: ${origin}`);
            callback(null, false);
        }
    },
    credentials: true
}));


// Rate limiting configuration
const isInternalIP = (ip) => {
    return ip === '::1' || ip === '127.0.0.1' ||
        ip.startsWith('10.') ||
        ip.startsWith('192.168.') ||
        ip.startsWith('172.') ||
        ip.startsWith('::ffff:10.') ||
        ip.startsWith('::ffff:192.168.') ||
        ip.startsWith('::ffff:172.');
};

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 1000, // Alto limite para ambiente LAN
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isInternalIP(req.ip),
    message: { success: false, message: 'Muitas requisições. Tente novamente em 1 minuto.' }
});

const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 30, // Limite mais restritivo para login
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Muitas tentativas de login. Aguarde 1 minuto.' }
});

// Aplicar limitadores
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);

// Body parser - movido para depois do rate limit, mas necessário para as rotas funcionarem
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static('uploads'));
app.use('/api/uploads', express.static('uploads'));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/boletos', boletoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/permission-profiles', permissionProfileRoutes);
app.use('/api/maintenances', maintenanceRoutes);
app.use('/api/timeline', assetTimelineRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/purchase-requests', purchaseRequestRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/network-devices', networkDeviceRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/ranchers', rancherRoutes);
app.use('/api/slaughter', slaughterRoutes);
app.use('/api/gatehouse', gatehouseRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/job-positions', jobPositionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/slaughter-closure', closureRoutes);
app.use('/api/deboning', deboningRoutes);
app.use('/api/deboning-brokers', deboningBrokerRoutes);
app.use('/api/deboning-cuts', deboningCutRoutes);
app.use('/api/pcp', pcpRoutes);
app.use('/api/import', importRoutes);
app.use('/api/slaughter-pre', preScheduleRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/pac', pacRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/pcp-downtime', pcpDowntimeRoutes);
app.use('/api/cold-rooms', coldRoomRoutes);







// Rota de teste
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API está funcionando!',
        timestamp: new Date().toISOString()
    });
});

// Middleware de erro (deve ser o último)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
    logger.info(`Servidor rodando em http://${HOST}:${PORT}`);
    logger.info(`Modo: ${process.env.NODE_ENV || 'development'}`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
    console.error('❌ Erro não tratado:', err);
    process.exit(1);
});

// Configuração para servir Frontend em Produção
if (process.env.NODE_ENV === 'production') {
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Servir arquivos estáticos da pasta public (onde o build do frontend estará)
    app.use(express.static(path.join(__dirname, '../public')));

    // Qualquer rota que não seja API será redirecionada para o index.html (React Router)
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
    });
}
