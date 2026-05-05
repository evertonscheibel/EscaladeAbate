import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
// Importar os serviços que serão usados pelos workers (ex: emailService)
// import { sendEmail } from '../services/emailService.js';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URI || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

connection.on('error', (err) => {
    console.error('BullMQ Worker: Erro de conexão com Redis:', err.message);
});

// Worker para E-mails
const emailWorker = new Worker('emailQueue', async job => {
    console.log(`BullMQ: Processando e-mail job ${job.id}`);

    // Simulação ou chamada real
    // await sendEmail(job.data);

    return { success: true };
}, { connection });

// Worker para Relatórios
const reportWorker = new Worker('reportQueue', async job => {
    console.log(`BullMQ: Gerando relatório job ${job.id}`);

    // Lógica pesada aqui

    return { success: true };
}, { connection });

emailWorker.on('completed', job => {
    console.log(`BullMQ: Job ${job.id} (e-mail) concluído.`);
});

emailWorker.on('failed', (job, err) => {
    console.error(`BullMQ: Job ${job.id} (e-mail) falhou:`, err);
});

console.log('BullMQ Workers: Iniciados e aguardando tarefas...');

export { emailWorker, reportWorker };
