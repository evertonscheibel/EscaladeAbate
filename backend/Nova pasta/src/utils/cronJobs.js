import cron from 'node-cron';
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Verificar certificados expirando (diariamente às 00:00)
cron.schedule('0 0 * * *', async () => {
    try {
        console.log('🔍 Verificando certificados expirando...');
        const response = await axios.post(`${API_URL}/certificates/check-expiration`);
        console.log('✅ Verificação de certificados concluída:', response.data);
    } catch (error) {
        console.error('❌ Erro ao verificar certificados:', error.message);
    }
});

// Verificar boletos próximos do vencimento (diariamente às 08:00)
cron.schedule('0 8 * * *', async () => {
    try {
        console.log('🔍 Verificando boletos próximos do vencimento...');
        const response = await axios.post(`${API_URL}/boletos/check-due`);
        console.log('✅ Verificação de boletos concluída:', response.data);
    } catch (error) {
        console.error('❌ Erro ao verificar boletos:', error.message);
    }
});

// Atualizar status de boletos atrasados (diariamente às 01:00)
cron.schedule('0 1 * * *', async () => {
    try {
        console.log('🔍 Atualizando boletos atrasados...');
        const response = await axios.post(`${API_URL}/boletos/update-overdue`);
        console.log('✅ Atualização de boletos concluída:', response.data);
    } catch (error) {
        console.error('❌ Erro ao atualizar boletos:', error.message);
    }
});

console.log('⏰ Cron jobs iniciados');

export default cron;
