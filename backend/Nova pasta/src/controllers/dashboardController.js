import Ticket from '../models/Ticket.js';
import Asset from '../models/Asset.js';
import Certificate from '../models/Certificate.js';
import Boleto from '../models/Boleto.js';
import KnowledgeBase from '../models/KnowledgeBase.js';
import Maintenance from '../models/Maintenance.js';
import AssetTimeline from '../models/AssetTimeline.js';
import PurchaseRequest from '../models/PurchaseRequest.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Budget from '../models/Budget.js';

// @desc    Obter KPIs do dashboard
// @route   GET /api/dashboard/kpis
// @access  Private
export const getDashboardKPIs = async (req, res, next) => {
    try {
        // Tickets
        const ticketStats = await Ticket.aggregate([
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    byPriority: [
                        { $group: { _id: '$priority', count: { $sum: 1 } } }
                    ],
                    avgResolutionTime: [
                        { $match: { resolvedAt: { $exists: true } } },
                        {
                            $project: {
                                resolutionTime: {
                                    $cond: [
                                        { $and: [{ $ne: ["$resolvedAt", null] }, { $ne: ["$createdAt", null] }] },
                                        { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 3600000] },
                                        0
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                avgHours: { $avg: '$resolutionTime' }
                            }
                        }
                    ],
                    avgFirstResponseTime: [
                        { $match: { firstResponseAt: { $exists: true } } },
                        {
                            $project: {
                                firstResponseTime: {
                                    $divide: [
                                        { $subtract: ['$firstResponseAt', '$createdAt'] },
                                        3600000
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                avgHours: { $avg: '$firstResponseTime' }
                            }
                        }
                    ]
                }
            }
        ]);

        // Ativos
        const assetStats = await Asset.aggregate([
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ]
                }
            }
        ]);

        // Certificados críticos (expirando em 30 dias)
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        const criticalCertificates = await Certificate.countDocuments({
            expirationDate: { $lte: futureDate, $gte: new Date() },
            status: 'ativo'
        });

        // Boletos pendentes
        const pendingBoletos = await Boleto.countDocuments({
            status: 'pendente'
        });

        const overdueBoletos = await Boleto.countDocuments({
            status: 'atrasado'
        });

        // Base de conhecimento
        const kbStats = await KnowledgeBase.aggregate([
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    totalViews: [
                        { $group: { _id: null, total: { $sum: '$views' } } }
                    ],
                    topArticles: [
                        { $sort: { views: -1 } },
                        { $limit: 5 },
                        { $project: { title: 1, views: 1, category: 1 } }
                    ]
                }
            }
        ]);

        // Compras
        const purchaseStats = await PurchaseRequest.aggregate([
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    pendingApproval: [
                        { $match: { status: 'aguardando_aprovacao' } },
                        { $count: 'count' }
                    ],
                    totalValue: [
                        { $group: { _id: null, total: { $sum: '$totalValue' } } }
                    ]
                }
            }
        ]);

        const orderStats = await PurchaseOrder.aggregate([
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    totalValue: [
                        { $group: { _id: null, total: { $sum: '$totalValue' } } }
                    ],
                    pending: [
                        { $match: { status: { $in: ['emitido', 'confirmado', 'em_transito'] } } },
                        { $count: 'count' }
                    ]
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                tickets: {
                    total: ticketStats[0].total[0]?.count || 0,
                    byStatus: ticketStats[0].byStatus,
                    byPriority: ticketStats[0].byPriority,
                    avgResolutionTimeHours: ticketStats[0].avgResolutionTime[0]?.avgHours || 0,
                    avgFirstResponseTimeHours: ticketStats[0].avgFirstResponseTime[0]?.avgHours || 0
                },
                assets: {
                    total: assetStats[0].total[0]?.count || 0,
                    byStatus: assetStats[0].byStatus
                },
                certificates: {
                    critical: criticalCertificates
                },
                boletos: {
                    pending: pendingBoletos,
                    overdue: overdueBoletos
                },
                knowledgeBase: {
                    total: kbStats[0].total[0]?.count || 0,
                    totalViews: kbStats[0].totalViews[0]?.total || 0,
                    topArticles: kbStats[0].topArticles
                },
                purchases: {
                    totalRequests: purchaseStats[0].total[0]?.count || 0,
                    byStatus: purchaseStats[0].byStatus,
                    pendingApproval: purchaseStats[0].pendingApproval[0]?.count || 0,
                    totalRequestValue: purchaseStats[0].totalValue[0]?.total || 0,
                    totalOrders: orderStats[0].total[0]?.count || 0,
                    totalOrderValue: orderStats[0].totalValue[0]?.total || 0,
                    pendingOrders: orderStats[0].pending[0]?.count || 0
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter atividades recentes
// @route   GET /api/dashboard/recent-activity
// @access  Private
export const getRecentActivity = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const recentTickets = await Ticket.find()
            .populate('requester', 'name')
            .populate('assignedTo', 'name')
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('title status priority createdAt');

        res.json({
            success: true,
            data: {
                tickets: recentTickets
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter dashboard operacional
// @route   GET /api/dashboard/operational
// @access  Private
export const getOperationalDashboard = async (req, res, next) => {
    try {
        // Ativos por status
        const assetsByStatus = await Asset.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Ativos por localização
        const assetsByLocation = await Asset.aggregate([
            { $group: { _id: '$location', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Ativos por tipo
        const assetsByType = await Asset.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        // Manutenções pendentes e em andamento
        const maintenanceStats = await Maintenance.aggregate([
            {
                $facet: {
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    pending: [
                        { $match: { status: { $in: ['agendada', 'em_andamento'] } } },
                        { $count: 'count' }
                    ],
                    thisMonth: [
                        {
                            $match: {
                                startDate: {
                                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                count: { $sum: 1 },
                                totalCost: { $sum: '$totalCost' }
                            }
                        }
                    ],
                    recentMaintenances: [
                        { $sort: { startDate: -1 } },
                        { $limit: 5 },
                        {
                            $lookup: {
                                from: 'assets',
                                localField: 'asset',
                                foreignField: '_id',
                                as: 'assetInfo'
                            }
                        },
                        { $unwind: '$assetInfo' }
                    ]
                }
            }
        ]);

        // Certificados próximos do vencimento (30 dias)
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const expiringCertificates = await Certificate.find({
            expirationDate: { $lte: futureDate, $gte: new Date() },
            status: 'ativo'
        }).sort({ expirationDate: 1 }).limit(10);

        // Garantias vencendo (90 dias)
        const warrantyDate = new Date();
        warrantyDate.setDate(warrantyDate.getDate() + 90);
        const expiringWarranties = await Asset.find({
            warrantyExpiration: { $lte: warrantyDate, $gte: new Date() }
        }).sort({ warrantyExpiration: 1 }).limit(10);

        // Manutenções atrasadas
        const overdueMaintenance = await Asset.find({
            nextMaintenanceDate: { $lt: new Date() },
            status: { $ne: 'em_manutencao' }
        }).limit(10);

        // Custos totais
        const totalCosts = await Maintenance.aggregate([
            {
                $group: {
                    _id: null,
                    totalMaintenanceCost: { $sum: '$totalCost' },
                    avgMaintenanceCost: { $avg: '$totalCost' }
                }
            }
        ]);

        const totalAssetValue = await Asset.aggregate([
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: '$purchaseValue' }
                }
            }
        ]);

        // Timeline recente (últimos 10 eventos)
        const recentTimeline = await AssetTimeline.find()
            .sort({ eventDate: -1 })
            .limit(10)
            .populate('asset', 'assetId description')
            .populate('user', 'name');

        res.json({
            success: true,
            data: {
                assets: {
                    byStatus: assetsByStatus,
                    byLocation: assetsByLocation,
                    byType: assetsByType,
                    total: await Asset.countDocuments()
                },
                maintenances: {
                    stats: maintenanceStats[0],
                    overdue: overdueMaintenance.length
                },
                alerts: {
                    expiringCertificates: expiringCertificates.length,
                    expiringWarranties: expiringWarranties.length,
                    overdueMaintenance: overdueMaintenance.length
                },
                costs: {
                    totalMaintenance: totalCosts[0]?.totalMaintenanceCost || 0,
                    avgMaintenance: totalCosts[0]?.avgMaintenanceCost || 0,
                    totalAssetValue: totalAssetValue[0]?.totalValue || 0
                },
                recentActivity: recentTimeline
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter alertas automáticos
// @route   GET /api/dashboard/alerts
// @access  Private
export const getAlerts = async (req, res, next) => {
    try {
        const alerts = [];

        // Certificados vencendo em 30 dias
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const expiringCerts = await Certificate.find({
            expirationDate: { $lte: futureDate, $gte: new Date() },
            status: 'ativo'
        }).populate('responsible', 'name email');

        expiringCerts.forEach(cert => {
            const daysUntilExpiry = Math.ceil((new Date(cert.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            alerts.push({
                type: 'certificate',
                severity: daysUntilExpiry <= 7 ? 'critica' : daysUntilExpiry <= 15 ? 'alta' : 'media',
                title: 'Certificado próximo do vencimento',
                description: `Certificado ${cert.name} vence em ${daysUntilExpiry} dias`,
                dueDate: cert.expirationDate,
                relatedItem: cert._id,
                responsible: cert.responsible
            });
        });

        // Garantias vencendo em 90 dias
        const warrantyDate = new Date();
        warrantyDate.setDate(warrantyDate.getDate() + 90);
        const expiringWarranties = await Asset.find({
            warrantyExpiration: { $lte: warrantyDate, $gte: new Date() }
        }).populate('responsible', 'name email');

        expiringWarranties.forEach(asset => {
            const daysUntilExpiry = Math.ceil((new Date(asset.warrantyExpiration).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            alerts.push({
                type: 'warranty',
                severity: daysUntilExpiry <= 30 ? 'alta' : 'media',
                title: 'Garantia próxima do vencimento',
                description: `Garantia do ativo ${asset.assetId} vence em ${daysUntilExpiry} dias`,
                dueDate: asset.warrantyExpiration,
                relatedItem: asset._id,
                responsible: asset.responsible
            });
        });

        // Manutenções atrasadas
        const overdueMaintenance = await Asset.find({
            nextMaintenanceDate: { $lt: new Date() },
            status: { $ne: 'em_manutencao' }
        }).populate('responsible', 'name email');

        overdueMaintenance.forEach(asset => {
            const daysOverdue = Math.ceil((new Date().getTime() - new Date(asset.nextMaintenanceDate).getTime()) / (1000 * 60 * 60 * 24));
            alerts.push({
                type: 'maintenance',
                severity: daysOverdue > 30 ? 'critica' : daysOverdue > 15 ? 'alta' : 'media',
                title: 'Manutenção atrasada',
                description: `Manutenção do ativo ${asset.assetId} está atrasada há ${daysOverdue} dias`,
                dueDate: asset.nextMaintenanceDate,
                relatedItem: asset._id,
                responsible: asset.responsible
            });
        });

        // Boletos vencidos ou próximos do vencimento
        const boletosOverdue = await Boleto.find({
            status: 'atrasado'
        });

        boletosOverdue.forEach(boleto => {
            alerts.push({
                type: 'boleto',
                severity: 'alta',
                title: 'Boleto em atraso',
                description: `Boleto ${boleto.description} está em atraso`,
                dueDate: boleto.dueDate,
                relatedItem: boleto._id
            });
        });

        // Ordenar por severidade e data
        const severityOrder = { critica: 0, alta: 1, media: 2, baixa: 3 };
        alerts.sort((a, b) => {
            if (severityOrder[a.severity] !== severityOrder[b.severity]) {
                return severityOrder[a.severity] - severityOrder[b.severity];
            }
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });

        res.json({
            success: true,
            count: alerts.length,
            data: alerts
        });
    } catch (error) {
        next(error);
    }
};
