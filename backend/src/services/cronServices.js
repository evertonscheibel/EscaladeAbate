/**
 * Serviços de Cron — lógica de negócio chamada diretamente pelo scheduler.
 * Substitui as chamadas HTTP via axios→localhost dos cron jobs antigos.
 */

import Certificate from '../models/Certificate.js';
import Notification from '../models/Notification.js';
import Ticket from '../models/Ticket.js';
import Boleto from '../models/Boleto.js';
import User from '../models/User.js';

/**
 * Verificar certificados expirando e criar notificações.
 * Chamado pelo cron job diário.
 */
export async function checkExpiringCertificatesJob() {
    try {
        const now = new Date();
        const certificates = await Certificate.find({
            status: 'ativo',
            expirationDate: { $gte: now }
        });

        let notificationsCreated = 0;

        for (const cert of certificates) {
            const daysUntilExpiration = Math.ceil(
                (cert.expirationDate - now) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilExpiration <= 30 && !cert.notificationsSent?.days30) {
                cert.notificationsSent = cert.notificationsSent || {};
                cert.notificationsSent.days30 = true;
                await cert.save();
                notificationsCreated++;
            } else if (daysUntilExpiration <= 15 && !cert.notificationsSent?.days15) {
                cert.notificationsSent = cert.notificationsSent || {};
                cert.notificationsSent.days15 = true;
                await cert.save();
                notificationsCreated++;
            } else if (daysUntilExpiration <= 7 && !cert.notificationsSent?.days7) {
                cert.notificationsSent = cert.notificationsSent || {};
                cert.notificationsSent.days7 = true;
                await cert.save();
                notificationsCreated++;
            }
        }

        console.log(`[CRON] Certificados verificados: ${certificates.length}, Notificações: ${notificationsCreated}`);
    } catch (error) {
        console.error('[CRON] Erro ao verificar certificados:', error.message);
    }
}

/**
 * Verificar boletos próximos do vencimento e criar notificações.
 */
export async function checkDueBoletosJob() {
    try {
        const now = new Date();
        const boletos = await Boleto.find({
            status: 'pendente',
            deliverByDate: { $lte: now },
            dueDate: { $gte: now }
        });

        const admins = await User.find({ role: { $in: ['admin', 'tecnico'] } });
        let notificationsCreated = 0;

        for (const boleto of boletos) {
            const message = `Boleto "${boleto.description}" deve ser entregue até ${boleto.deliverByDate.toLocaleDateString()}. Vencimento: ${boleto.dueDate.toLocaleDateString()}`;

            for (const admin of admins) {
                await Notification.create({
                    user: admin._id,
                    type: 'boleto',
                    message,
                    referenceId: boleto._id,
                    referenceModel: 'Boleto',
                    priority: 'alta'
                });
            }
            notificationsCreated++;
        }

        console.log(`[CRON] Boletos verificados: ${boletos.length}, Notificações: ${notificationsCreated}`);
    } catch (error) {
        console.error('[CRON] Erro ao verificar boletos:', error.message);
    }
}

/**
 * Atualizar status de boletos atrasados.
 */
export async function updateOverdueBoletosJob() {
    try {
        const now = new Date();
        const result = await Boleto.updateMany(
            { status: 'pendente', dueDate: { $lt: now } },
            { $set: { status: 'atrasado' } }
        );

        console.log(`[CRON] Boletos atualizados para atrasado: ${result.modifiedCount}`);
    } catch (error) {
        console.error('[CRON] Erro ao atualizar boletos atrasados:', error.message);
    }
}
