import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT === '465', // true para 465, false para outras portas
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Enviar e-mail genérico
 * @param {string} to - Destinatário
 * @param {string} subject - Assunto
 * @param {string} html - Conteúdo em HTML
 */
export const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html
        });
        console.log('E-mail enviado: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Template para Auto-Resposta de Chamado
 * @param {object} ticket - Dados do ticket
 */
export const sendTicketAutoReply = async (ticket) => {
    const subject = `[Chamado #${ticket.ticketNumber}] Recebemos sua solicitação: ${ticket.title}`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #2563eb;">Olá, ${ticket.contactName || 'Usuário'}!</h2>
            <p>Este é um e-mail automático para confirmar que recebemos seu chamado com sucesso.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p><strong>Nº do Chamado:</strong> #${ticket.ticketNumber}</p>
                <p><strong>Assunto:</strong> ${ticket.title}</p>
                <p><strong>Status:</strong> ${ticket.status}</p>
            </div>
            
            <p>Nossa equipe de TI já foi notificada e em breve entraremos em contato.</p>
            
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="font-size: 12px; color: #64748b; text-align: center;">Este é um e-mail do Sistema de Gestão de TI. Por favor, não responda diretamente a este e-mail.</p>
        </div>
    `;

    // Se for público, usa o email de contato, senão tenta o email do solicitante populado
    const to = ticket.contactEmail || (ticket.requester && ticket.requester.email);
    if (!to) return { success: false, error: 'E-mail do destinatário não encontrado' };

    return sendEmail(to, subject, html);
};

/**
 * Template para Alerta de Expiração de Documento
 * @param {object} doc - Dados do documento
 * @param {number} days - Dias restando
 * @param {string[]} adminEmails - Lista de e-mails dos admins
 */
export const sendDocumentExpirationAlert = async (doc, days, adminEmails) => {
    const subject = `⚠️ ALERTA: Documento "${doc.name}" expira em ${days} dias`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 8px;">
            <h2 style="color: #dc2626;">Alerta de Vencimento</h2>
            <p>O seguinte documento está próximo da data de expiração:</p>
            
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <p><strong>Documento:</strong> ${doc.name}</p>
                <p><strong>Tipo:</strong> ${doc.type}</p>
                <p><strong>Vencimento:</strong> ${new Date(doc.expirationDate).toLocaleDateString()}</p>
                <p style="color: #dc2626; font-weight: bold;">Faltam ${days} dias.</p>
            </div>
            
            <p>Por favor, acesse o sistema para providenciar a renovação ou atualização necessária.</p>
            
            <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL}/documents" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Acessar Gestão de Documentos</a>
            </div>
        </div>
    `;

    return sendEmail(adminEmails.join(','), subject, html);
};
