import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URI || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

connection.on('error', (err) => {
    console.error('BullMQ: Erro de conexão com Redis:', err.message);
});

// Filas
export const emailQueue = new Queue('emailQueue', { connection });
export const reportQueue = new Queue('reportQueue', { connection });

console.log('BullMQ: Filas inicializadas em ' + (process.env.REDIS_URI || 'localhost:6379'));

// Função para adicionar job na fila de e-mail
export const addEmailJob = async (data) => {
    return await emailQueue.add('sendEmail', data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
    });
};

// Função para adicionar job na fila de relatórios
export const addReportJob = async (data) => {
    return await reportQueue.add('generateReport', data, {
        attempts: 1,
        removeOnComplete: true,
    });
};
