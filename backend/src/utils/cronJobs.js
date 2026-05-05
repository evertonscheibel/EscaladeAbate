import cron from 'node-cron';
import {
    checkExpiringCertificatesJob,
    checkDueBoletosJob,
    updateOverdueBoletosJob
} from '../services/cronServices.js';

// Verificar certificados expirando (diariamente às 00:00)
cron.schedule('0 0 * * *', async () => {
    console.log('🔍 Verificando certificados expirando...');
    await checkExpiringCertificatesJob();
});

// Verificar boletos próximos do vencimento (diariamente às 08:00)
cron.schedule('0 8 * * *', async () => {
    console.log('🔍 Verificando boletos próximos do vencimento...');
    await checkDueBoletosJob();
});

// Atualizar status de boletos atrasados (diariamente às 01:00)
cron.schedule('0 1 * * *', async () => {
    console.log('🔍 Atualizando boletos atrasados...');
    await updateOverdueBoletosJob();
});

console.log('⏰ Cron jobs iniciados (chamada direta, sem axios)');

export default cron;
