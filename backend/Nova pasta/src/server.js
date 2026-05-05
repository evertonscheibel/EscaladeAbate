import dotenv from 'dotenv';
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





// Cron jobs
import './utils/cronJobs.js';

// Configurar variáveis de ambiente
dotenv.config();

// Conectar ao banco de dados
connectDB();

const app = express();

// Middlewares de segurança
app.use(helmet());
app.use(cors({
    origin: true, // Permite qualquer origem (útil para desenvolvimento em rede local)
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite de 100 requisições por IP
    message: 'Muitas requisições deste IP, tente novamente mais tarde'
});

app.use('/api', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static('uploads'));

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
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Servidor rodando em http://${HOST}:${PORT}       ║
║   📊 Ambiente: ${process.env.NODE_ENV || 'development'}                      ║
║   🗄️  Banco de dados: MongoDB                         ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
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
