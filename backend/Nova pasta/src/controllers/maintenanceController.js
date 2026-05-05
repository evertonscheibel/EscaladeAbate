import Maintenance from '../models/Maintenance.js';
import Asset from '../models/Asset.js';
import AssetTimeline from '../models/AssetTimeline.js';

// Helper para criar evento na timeline
const createTimelineEvent = async (maintenanceData, eventType = 'manutencao') => {
    try {
        const timeline = await AssetTimeline.create({
            asset: maintenanceData.asset,
            eventType,
            itilCategory: 'incident',
            cobitProcess: 'DSS02',
            eventDate: maintenanceData.startDate || new Date(),
            user: maintenanceData.responsible,
            title: `Manutenção ${maintenanceData.type}: ${maintenanceData.title}`,
            description: maintenanceData.description,
            relatedMaintenance: maintenanceData._id,
            relatedTicket: maintenanceData.relatedTicket,
            impact: maintenanceData.priority === 'critica' ? 'critico' : maintenanceData.priority === 'alta' ? 'alto' : 'medio',
            cost: maintenanceData.totalCost || 0,
            metadata: {
                maintenanceType: maintenanceData.type,
                status: maintenanceData.status,
                downtime: maintenanceData.downtime
            }
        });
        return timeline;
    } catch (error) {
        console.error('Erro ao criar evento na timeline:', error);
    }
};

// @desc    Listar todas as manutenções
// @route   GET /api/maintenances
// @access  Private
export const getMaintenances = async (req, res, next) => {
    try {
        const { status, type, assetId, startDate, endDate } = req.query;

        let query = {};
        if (status) query.status = status;
        if (type) query.type = type;
        if (assetId) query.asset = assetId;

        if (startDate || endDate) {
            query.startDate = {};
            if (startDate) query.startDate.$gte = new Date(startDate);
            if (endDate) query.startDate.$lte = new Date(endDate);
        }

        const maintenances = await Maintenance.find(query)
            .populate('asset', 'assetId description location')
            .populate('responsible', 'name email')
            .populate('technician', 'name email')
            .populate('relatedTicket', 'title status')
            .sort({ startDate: -1 });

        res.json({
            success: true,
            count: maintenances.length,
            data: maintenances
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter manutenção por ID
// @route   GET /api/maintenances/:id
// @access  Private
export const getMaintenance = async (req, res, next) => {
    try {
        const maintenance = await Maintenance.findById(req.params.id)
            .populate('asset', 'assetId description location status')
            .populate('responsible', 'name email')
            .populate('technician', 'name email')
            .populate('relatedTicket', 'title status priority');

        if (!maintenance) {
            return res.status(404).json({
                success: false,
                message: 'Manutenção não encontrada'
            });
        }

        res.json({
            success: true,
            data: maintenance
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Criar nova manutenção
// @route   POST /api/maintenances
// @access  Private
export const createMaintenance = async (req, res, next) => {
    try {
        const maintenance = await Maintenance.create(req.body);

        // Atualizar status do ativo se manutenção estiver em andamento
        if (maintenance.status === 'em_andamento') {
            await Asset.findByIdAndUpdate(maintenance.asset, {
                status: 'em_manutencao',
                lastMaintenanceDate: maintenance.startDate
            });
        }

        // Criar evento na timeline
        await createTimelineEvent(maintenance);

        const populatedMaintenance = await Maintenance.findById(maintenance._id)
            .populate('asset', 'assetId description location')
            .populate('responsible', 'name email')
            .populate('technician', 'name email');

        res.status(201).json({
            success: true,
            data: populatedMaintenance
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar manutenção
// @route   PUT /api/maintenances/:id
// @access  Private
export const updateMaintenance = async (req, res, next) => {
    try {
        const oldMaintenance = await Maintenance.findById(req.params.id);

        if (!oldMaintenance) {
            return res.status(404).json({
                success: false,
                message: 'Manutenção não encontrada'
            });
        }

        const maintenance = await Maintenance.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('asset', 'assetId description location')
            .populate('responsible', 'name email')
            .populate('technician', 'name email');

        // Se manutenção foi concluída, atualizar ativo
        if (maintenance.status === 'concluida' && oldMaintenance.status !== 'concluida') {
            await Asset.findByIdAndUpdate(maintenance.asset, {
                status: 'ativo',
                lastMaintenanceDate: maintenance.endDate || new Date(),
                nextMaintenanceDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 180 dias
            });

            // Criar evento de conclusão na timeline
            await AssetTimeline.create({
                asset: maintenance.asset,
                eventType: 'manutencao',
                itilCategory: 'incident',
                eventDate: maintenance.endDate || new Date(),
                user: maintenance.responsible,
                title: `Manutenção concluída: ${maintenance.title}`,
                description: `Manutenção ${maintenance.type} finalizada com sucesso`,
                relatedMaintenance: maintenance._id,
                cost: maintenance.totalCost
            });
        }

        res.json({
            success: true,
            data: maintenance
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Deletar manutenção
// @route   DELETE /api/maintenances/:id
// @access  Private
export const deleteMaintenance = async (req, res, next) => {
    try {
        const maintenance = await Maintenance.findById(req.params.id);

        if (!maintenance) {
            return res.status(404).json({
                success: false,
                message: 'Manutenção não encontrada'
            });
        }

        await maintenance.deleteOne();

        res.json({
            success: true,
            message: 'Manutenção deletada com sucesso'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Listar manutenções de um ativo
// @route   GET /api/maintenances/asset/:assetId
// @access  Private
export const getAssetMaintenances = async (req, res, next) => {
    try {
        const maintenances = await Maintenance.find({ asset: req.params.assetId })
            .populate('responsible', 'name email')
            .populate('technician', 'name email')
            .populate('relatedTicket', 'title status')
            .sort({ startDate: -1 });

        res.json({
            success: true,
            count: maintenances.length,
            data: maintenances
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter estatísticas de manutenções
// @route   GET /api/maintenances/stats/analytics
// @access  Private
export const getMaintenanceStats = async (req, res, next) => {
    try {
        const { startDate, endDate, assetId } = req.query;

        let matchQuery = {};
        if (startDate || endDate) {
            matchQuery.startDate = {};
            if (startDate) matchQuery.startDate.$gte = new Date(startDate);
            if (endDate) matchQuery.startDate.$lte = new Date(endDate);
        }
        if (assetId) matchQuery.asset = assetId;

        const stats = await Maintenance.aggregate([
            { $match: matchQuery },
            {
                $facet: {
                    byType: [
                        { $group: { _id: '$type', count: { $sum: 1 }, totalCost: { $sum: '$totalCost' } } }
                    ],
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    byPriority: [
                        { $group: { _id: '$priority', count: { $sum: 1 } } }
                    ],
                    totalCosts: [
                        {
                            $group: {
                                _id: null,
                                totalCost: { $sum: '$totalCost' },
                                totalLaborCost: { $sum: '$laborCost' },
                                avgCost: { $avg: '$totalCost' },
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    avgDowntime: [
                        {
                            $group: {
                                _id: null,
                                avgDowntime: { $avg: '$downtime' },
                                totalDowntime: { $sum: '$downtime' }
                            }
                        }
                    ],
                    topAssets: [
                        {
                            $group: {
                                _id: '$asset',
                                count: { $sum: 1 },
                                totalCost: { $sum: '$totalCost' }
                            }
                        },
                        { $sort: { count: -1 } },
                        { $limit: 10 },
                        {
                            $lookup: {
                                from: 'assets',
                                localField: '_id',
                                foreignField: '_id',
                                as: 'assetInfo'
                            }
                        },
                        { $unwind: '$assetInfo' }
                    ],
                    monthlyTrend: [
                        {
                            $group: {
                                _id: {
                                    year: { $year: '$startDate' },
                                    month: { $month: '$startDate' }
                                },
                                count: { $sum: 1 },
                                totalCost: { $sum: '$totalCost' }
                            }
                        },
                        { $sort: { '_id.year': 1, '_id.month': 1 } }
                    ]
                }
            }
        ]);

        res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter relatório analítico de manutenções
// @route   GET /api/maintenances/reports/analytics
// @access  Private
export const getMaintenanceReport = async (req, res, next) => {
    try {
        const { period = '30' } = req.query; // dias
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const report = await Maintenance.aggregate([
            {
                $match: {
                    startDate: { $gte: startDate }
                }
            },
            {
                $facet: {
                    summary: [
                        {
                            $group: {
                                _id: null,
                                totalMaintenances: { $sum: 1 },
                                totalCost: { $sum: '$totalCost' },
                                avgCost: { $avg: '$totalCost' },
                                totalDowntime: { $sum: '$downtime' },
                                avgDowntime: { $avg: '$downtime' }
                            }
                        }
                    ],
                    preventiveVsCorrective: [
                        {
                            $group: {
                                _id: '$type',
                                count: { $sum: 1 },
                                cost: { $sum: '$totalCost' }
                            }
                        }
                    ],
                    costByAssetType: [
                        {
                            $lookup: {
                                from: 'assets',
                                localField: 'asset',
                                foreignField: '_id',
                                as: 'assetInfo'
                            }
                        },
                        { $unwind: '$assetInfo' },
                        {
                            $group: {
                                _id: '$assetInfo.type',
                                count: { $sum: 1 },
                                totalCost: { $sum: '$totalCost' }
                            }
                        }
                    ],
                    topParts: [
                        { $unwind: '$parts' },
                        {
                            $group: {
                                _id: '$parts.name',
                                quantity: { $sum: '$parts.quantity' },
                                totalCost: { $sum: { $multiply: ['$parts.quantity', '$parts.unitCost'] } }
                            }
                        },
                        { $sort: { totalCost: -1 } },
                        { $limit: 10 }
                    ]
                }
            }
        ]);

        res.json({
            success: true,
            period: `${period} dias`,
            data: report[0]
        });
    } catch (error) {
        next(error);
    }
};
