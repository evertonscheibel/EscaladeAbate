import AssetTimeline from '../models/AssetTimeline.js';
import Asset from '../models/Asset.js';

// @desc    Obter timeline de um ativo
// @route   GET /api/timeline/asset/:assetId
// @access  Private
export const getAssetTimeline = async (req, res, next) => {
    try {
        const { eventType, itilCategory, startDate, endDate } = req.query;

        let query = { asset: req.params.assetId };

        if (eventType) query.eventType = eventType;
        if (itilCategory) query.itilCategory = itilCategory;

        if (startDate || endDate) {
            query.eventDate = {};
            if (startDate) query.eventDate.$gte = new Date(startDate);
            if (endDate) query.eventDate.$lte = new Date(endDate);
        }

        const timeline = await AssetTimeline.find(query)
            .populate('user', 'name email')
            .populate('responsible.from', 'name')
            .populate('responsible.to', 'name')
            .populate('relatedMaintenance', 'title type status')
            .populate('relatedTicket', 'title status')
            .sort({ eventDate: -1 });

        res.json({
            success: true,
            count: timeline.length,
            data: timeline
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Criar evento na timeline
// @route   POST /api/timeline
// @access  Private
export const createTimelineEvent = async (req, res, next) => {
    try {
        const event = await AssetTimeline.create(req.body);

        const populatedEvent = await AssetTimeline.findById(event._id)
            .populate('user', 'name email')
            .populate('asset', 'assetId description');

        res.status(201).json({
            success: true,
            data: populatedEvent
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter estatísticas da timeline
// @route   GET /api/timeline/stats/:assetId
// @access  Private
export const getTimelineStats = async (req, res, next) => {
    try {
        const stats = await AssetTimeline.aggregate([
            { $match: { asset: req.params.assetId } },
            {
                $facet: {
                    byEventType: [
                        { $group: { _id: '$eventType', count: { $sum: 1 } } }
                    ],
                    byItilCategory: [
                        { $group: { _id: '$itilCategory', count: { $sum: 1 } } }
                    ],
                    byCobitProcess: [
                        { $group: { _id: '$cobitProcess', count: { $sum: 1 } } }
                    ],
                    totalCost: [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: '$cost' }
                            }
                        }
                    ],
                    recentEvents: [
                        { $sort: { eventDate: -1 } },
                        { $limit: 10 }
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

// @desc    Obter relatório de governança ITIL/COBIT
// @route   GET /api/timeline/reports/governance
// @access  Private
export const getGovernanceReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        let matchQuery = {};
        if (startDate || endDate) {
            matchQuery.eventDate = {};
            if (startDate) matchQuery.eventDate.$gte = new Date(startDate);
            if (endDate) matchQuery.eventDate.$lte = new Date(endDate);
        }

        const report = await AssetTimeline.aggregate([
            { $match: matchQuery },
            {
                $facet: {
                    itilCompliance: [
                        {
                            $group: {
                                _id: '$itilCategory',
                                count: { $sum: 1 },
                                totalCost: { $sum: '$cost' }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    cobitCompliance: [
                        {
                            $group: {
                                _id: '$cobitProcess',
                                count: { $sum: 1 },
                                totalCost: { $sum: '$cost' }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    impactAnalysis: [
                        {
                            $group: {
                                _id: '$impact',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    assetActivity: [
                        {
                            $group: {
                                _id: '$asset',
                                eventCount: { $sum: 1 },
                                totalCost: { $sum: '$cost' }
                            }
                        },
                        { $sort: { eventCount: -1 } },
                        { $limit: 20 },
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
                                    year: { $year: '$eventDate' },
                                    month: { $month: '$eventDate' },
                                    category: '$itilCategory'
                                },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { '_id.year': 1, '_id.month': 1 } }
                    ]
                }
            }
        ]);

        res.json({
            success: true,
            data: report[0]
        });
    } catch (error) {
        next(error);
    }
};
