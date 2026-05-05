import Ticket from '../models/Ticket.js';
import mongoose from 'mongoose';

/**
 * @desc    Relatório de SLA por setor (Gestão TI)
 * @route   GET /api/reports/sla/sectors
 * @access  Private (Admin/Tecnico)
 */
export const getSLASectorReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        const report = await Ticket.aggregate([
            { $match: { ...dateFilter, status: { $in: ['resolvido', 'fechado'] } } },
            {
                $project: {
                    category: 1,
                    priority: 1,
                    resolutionTimeHours: {
                        $divide: [
                            { $subtract: ['$resolvedAt', '$createdAt'] },
                            3600000 // Converter ms para horas
                        ]
                    },
                    // SLAs teóricos: High = 4h, Medium = 24h, Low = 48h
                    isViolated: {
                        $cond: [
                            { $eq: ['$priority', 'high'] }, { $gt: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 4 * 3600000] },
                            {
                                $cond: [
                                    { $eq: ['$priority', 'medium'] }, { $gt: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 24 * 3600000] },
                                    { $gt: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 48 * 3600000] }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: '$category',
                    avgResolutionTime: { $avg: '$resolutionTimeHours' },
                    totalTickets: { $sum: 1 },
                    violations: { $sum: { $cond: ['$isViolated', 1, 0] } }
                }
            },
            {
                $project: {
                    category: '$_id',
                    avgResolutionTime: { $round: ['$avgResolutionTime', 2] },
                    totalTickets: 1,
                    violations: 1,
                    slaCompliance: {
                        $round: [
                            { $multiply: [{ $divide: [{ $subtract: ['$totalTickets', '$violations'] }, '$totalTickets'] }, 100] },
                            2
                        ]
                    }
                }
            },
            { $sort: { slaCompliance: 1 } }
        ]);

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Relatório de ROI por Ativo (Custo Manutenção vs Valor)
 * @route   GET /api/reports/roi/assets
 * @access  Private (Admin/Tecnico)
 */
export const getAssetROIReport = async (req, res, next) => {
    try {
        // Para o ROI precisamos agrupar manutenções por ativo
        // Este é um stub inicial, pois o modelo Maintenance precisa ter campo 'cost'
        const report = await mongoose.model('Maintenance').aggregate([
            {
                $group: {
                    _id: '$asset',
                    totalMaintenanceCost: { $sum: '$totalCost' },
                    maintenanceCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'assets',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'assetInfo'
                }
            },
            { $unwind: '$assetInfo' },
            {
                $project: {
                    assetId: '$assetInfo.assetId',
                    description: '$assetInfo.description',
                    purchaseValue: '$assetInfo.purchaseValue',
                    totalMaintenanceCost: 1,
                    maintenanceCount: 1,
                    roiRatio: {
                        $cond: [
                            { $gt: ['$assetInfo.purchaseValue', 0] },
                            { $divide: ['$totalMaintenanceCost', '$assetInfo.purchaseValue'] },
                            0
                        ]
                    }
                }
            },
            { $sort: { roiRatio: -1 } } // Ativos que dão mais prejuízo primeiro
        ]);

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};
