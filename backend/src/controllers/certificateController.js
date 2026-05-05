import Certificate from '../models/Certificate.js';
import Notification from '../models/Notification.js';
import Ticket from '../models/Ticket.js';
import { sendDocumentExpirationAlert } from '../utils/emailService.js';

// @desc    Listar todos os certificados
// @route   GET /api/certificates
// @access  Private
export const getCertificates = async (req, res, next) => {
    try {
        const { status, type } = req.query;

        let query = {};
        if (status) query.status = status;
        if (type) query.type = type;

        const certificates = await Certificate.find(query)
            .populate('linkedAsset', 'assetId description brand model')
            .sort({ expirationDate: 1 });

        res.json({
            success: true,
            count: certificates.length,
            data: certificates
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter certificado por ID
// @route   GET /api/certificates/:id
// @access  Private
export const getCertificate = async (req, res, next) => {
    try {
        const certificate = await Certificate.findById(req.params.id)
            .populate('linkedAsset', 'assetId description brand model serialNumber status location');

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificado não encontrado'
            });
        }

        res.json({
            success: true,
            data: certificate
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Criar novo certificado
// @route   POST /api/certificates
// @access  Private (Admin/Tecnico)
export const createCertificate = async (req, res, next) => {
    try {
        const certificateData = { ...req.body };

        if (req.file) {
            certificateData.imageUrl = `/uploads/${req.file.filename}`;
        }

        const certificate = await Certificate.create(certificateData);

        res.status(201).json({
            success: true,
            data: certificate
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar certificado
// @route   PUT /api/certificates/:id
// @access  Private (Admin/Tecnico)
export const updateCertificate = async (req, res, next) => {
    try {
        const certificateData = { ...req.body };

        if (req.file) {
            certificateData.imageUrl = `/uploads/${req.file.filename}`;
        }

        const certificate = await Certificate.findByIdAndUpdate(
            req.params.id,
            certificateData,
            { new: true, runValidators: true }
        );

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificado não encontrado'
            });
        }

        res.json({
            success: true,
            data: certificate
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Deletar certificado
// @route   DELETE /api/certificates/:id
// @access  Private (Admin)
export const deleteCertificate = async (req, res, next) => {
    try {
        const certificate = await Certificate.findById(req.params.id);

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificado não encontrado'
            });
        }

        await certificate.deleteOne();

        res.json({
            success: true,
            message: 'Certificado deletado com sucesso'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter certificados próximos do vencimento
// @route   GET /api/certificates/expiring/soon
// @access  Private (Admin/Tecnico)
export const getExpiringCertificates = async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        const certificates = await Certificate.find({
            expirationDate: { $lte: futureDate, $gte: new Date() },
            status: 'ativo'
        }).sort({ expirationDate: 1 });

        res.json({
            success: true,
            count: certificates.length,
            data: certificates
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verificar certificados expirando e criar notificações/tickets
// @route   POST /api/certificates/check-expiration
// @access  Private (Admin/Tecnico) - Usado pelo cron job
export const checkExpiringCertificates = async (req, res, next) => {
    try {
        const now = new Date();
        const certificates = await Certificate.find({
            status: 'ativo',
            expirationDate: { $gte: now }
        });

        const results = {
            notifications: 0,
            tickets: 0
        };

        for (const cert of certificates) {
            const daysUntilExpiration = Math.ceil(
                (cert.expirationDate - now) / (1000 * 60 * 60 * 24)
            );

            // Verificar se precisa notificar (30, 15, 7 dias)
            if (daysUntilExpiration <= 30 && !cert.notificationsSent.days30) {
                await createNotificationAndTicket(cert, 30);
                cert.notificationsSent.days30 = true;
                await cert.save();
                results.notifications++;
                results.tickets++;
            } else if (daysUntilExpiration <= 15 && !cert.notificationsSent.days15) {
                await createNotificationAndTicket(cert, 15);
                cert.notificationsSent.days15 = true;
                await cert.save();
                results.notifications++;
            } else if (daysUntilExpiration <= 7 && !cert.notificationsSent.days7) {
                await createNotificationAndTicket(cert, 7);
                cert.notificationsSent.days7 = true;
                await cert.save();
                results.notifications++;
            }
        }

        res.json({
            success: true,
            message: 'Verificação concluída',
            data: results
        });
    } catch (error) {
        next(error);
    }
};

// Função auxiliar para criar notificação e ticket
async function createNotificationAndTicket(certificate, days) {
    const message = `Certificado "${certificate.name}" expira em ${days} dias (${certificate.expirationDate.toLocaleDateString()})`;

    // Criar notificação para admins
    const admins = await import('../models/User.js').then(m =>
        m.default.find({ role: { $in: ['admin', 'tecnico'] } })
    );

    for (const admin of admins) {
        await Notification.create({
            user: admin._id,
            type: 'certificado',
            message,
            referenceId: certificate._id,
            referenceModel: 'Certificate',
            priority: days <= 7 ? 'alta' : 'media'
        });
    }

    // Criar ticket apenas na primeira notificação (30 dias)
    if (days === 30) {
        await Ticket.create({
            title: `Renovação de Certificado: ${certificate.name}`,
            description: `O certificado ${certificate.type} "${certificate.name}" expira em ${certificate.expirationDate.toLocaleDateString()}. É necessário providenciar a renovação.`,
            category: 'outros',
            priority: 'alta',
            requester: admins[0]._id
        });
    }

    // Disparar e-mail para todos os admins
    const adminEmails = admins.map(a => a.email).filter(e => !!e);
    if (adminEmails.length > 0) {
        sendDocumentExpirationAlert(certificate, days, adminEmails)
            .catch(err => console.error('Erro ao enviar alerta de e-mail:', err));
    }
}
