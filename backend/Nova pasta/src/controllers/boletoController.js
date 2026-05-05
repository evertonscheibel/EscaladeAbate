import Boleto from '../models/Boleto.js';
import Notification from '../models/Notification.js';

// @desc    Listar todos os boletos
// @route   GET /api/boletos
// @access  Private (Admin/Tecnico)
// @desc    Listar todos os boletos
// @route   GET /api/boletos
// @access  Private (Admin/Tecnico)
export const getBoletos = async (req, res, next) => {
    try {
        // Verificar e gerar boletos recorrentes
        const recurringBoletos = await Boleto.find({ isRecurring: true, parentBoleto: { $exists: false } });

        for (const rootBoleto of recurringBoletos) {
            // Encontrar o último boleto gerado (seja o root ou seus filhos)
            const lastBoleto = await Boleto.findOne({
                $or: [
                    { _id: rootBoleto._id },
                    { parentBoleto: rootBoleto._id }
                ]
            }).sort({ dueDate: -1 });

            if (lastBoleto) {
                const nextDueDate = new Date(lastBoleto.dueDate);
                nextDueDate.setMonth(nextDueDate.getMonth() + 1);

                // Gerar com 45 dias de antecedência
                const limitDate = new Date();
                limitDate.setDate(limitDate.getDate() + 45);

                if (nextDueDate <= limitDate) {
                    await Boleto.create({
                        description: rootBoleto.description,
                        value: rootBoleto.value,
                        provider: rootBoleto.provider,
                        dueDate: nextDueDate,
                        observation: rootBoleto.observation,
                        status: 'pendente',
                        isRecurring: true,
                        frequency: rootBoleto.frequency,
                        parentBoleto: rootBoleto._id
                    });
                }
            }
        }

        const { status, month, year } = req.query;

        let query = {};

        if (status) query.status = status;

        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            query.dueDate = { $gte: startDate, $lte: endDate };
        }

        const boletos = await Boleto.find(query).sort({ dueDate: 1 });

        res.json({
            success: true,
            count: boletos.length,
            data: boletos
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter boleto por ID
// @route   GET /api/boletos/:id
// @access  Private (Admin/Tecnico)
export const getBoleto = async (req, res, next) => {
    try {
        const boleto = await Boleto.findById(req.params.id);

        if (!boleto) {
            return res.status(404).json({
                success: false,
                message: 'Boleto não encontrado'
            });
        }

        res.json({
            success: true,
            data: boleto
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Criar novo boleto
// @route   POST /api/boletos
// @access  Private (Admin/Tecnico)
export const createBoleto = async (req, res, next) => {
    try {
        const boleto = await Boleto.create(req.body);

        res.status(201).json({
            success: true,
            data: boleto
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar boleto
// @route   PUT /api/boletos/:id
// @access  Private (Admin/Tecnico)
export const updateBoleto = async (req, res, next) => {
    try {
        // Se status mudou para pago, adicionar data
        if (req.body.status === 'pago') {
            req.body.paidAt = new Date();
        }

        const boleto = await Boleto.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!boleto) {
            return res.status(404).json({
                success: false,
                message: 'Boleto não encontrado'
            });
        }

        res.json({
            success: true,
            data: boleto
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Deletar boleto
// @route   DELETE /api/boletos/:id
// @access  Private (Admin)
export const deleteBoleto = async (req, res, next) => {
    try {
        const boleto = await Boleto.findById(req.params.id);

        if (!boleto) {
            return res.status(404).json({
                success: false,
                message: 'Boleto não encontrado'
            });
        }

        await boleto.deleteOne();

        res.json({
            success: true,
            message: 'Boleto deletado com sucesso'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter boletos pendentes
// @route   GET /api/boletos/pending/list
// @access  Private (Admin/Tecnico)
export const getPendingBoletos = async (req, res, next) => {
    try {
        const boletos = await Boleto.find({
            status: 'pendente',
            dueDate: { $gte: new Date() }
        }).sort({ dueDate: 1 });

        res.json({
            success: true,
            count: boletos.length,
            data: boletos
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verificar boletos próximos do vencimento
// @route   POST /api/boletos/check-due
// @access  Private (Admin/Tecnico) - Usado pelo cron job
export const checkDueBoletos = async (req, res, next) => {
    try {
        const now = new Date();
        const boletos = await Boleto.find({
            status: 'pendente',
            deliverByDate: { $lte: now },
            dueDate: { $gte: now }
        });

        const admins = await import('../models/User.js').then(m =>
            m.default.find({ role: { $in: ['admin', 'tecnico'] } })
        );

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

        res.json({
            success: true,
            message: 'Verificação concluída',
            data: {
                boletosChecked: boletos.length,
                notificationsCreated
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar status de boletos atrasados
// @route   POST /api/boletos/update-overdue
// @access  Private (Admin/Tecnico) - Usado pelo cron job
export const updateOverdueBoletos = async (req, res, next) => {
    try {
        const now = new Date();

        const result = await Boleto.updateMany(
            {
                status: 'pendente',
                dueDate: { $lt: now }
            },
            {
                $set: { status: 'atrasado' }
            }
        );

        res.json({
            success: true,
            message: 'Boletos atrasados atualizados',
            data: {
                updated: result.modifiedCount
            }
        });
    } catch (error) {
        next(error);
    }
};
