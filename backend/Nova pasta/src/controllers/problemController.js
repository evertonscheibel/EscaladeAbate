import Problem from '../models/Problem.js';
import Ticket from '../models/Ticket.js';

// @desc    Listar todos os problemas
// @route   GET /api/problems
// @access  Private (Admin/Tecnico)
export const getProblems = async (req, res, next) => {
    try {
        const { status, priority, category } = req.query;

        let query = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (category) query.category = category;

        const problems = await Problem.find(query)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('relatedIncidents', 'title status priority')
            .populate('affectedAssets', 'assetId description')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: problems.length,
            data: problems
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter problema por ID
// @route   GET /api/problems/:id
// @access  Private (Admin/Tecnico)
export const getProblem = async (req, res, next) => {
    try {
        const problem = await Problem.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('relatedIncidents', 'title description status priority createdAt')
            .populate('affectedAssets', 'assetId description location')
            .populate('relatedChange', 'title status');

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problema não encontrado'
            });
        }

        res.json({
            success: true,
            data: problem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Criar novo problema
// @route   POST /api/problems
// @access  Private (Admin/Tecnico)
export const createProblem = async (req, res, next) => {
    try {
        const problemData = {
            ...req.body,
            createdBy: req.user._id
        };

        const problem = await Problem.create(problemData);

        const populatedProblem = await Problem.findById(problem._id)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('relatedIncidents', 'title status');

        res.status(201).json({
            success: true,
            data: populatedProblem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar problema
// @route   PUT /api/problems/:id
// @access  Private (Admin/Tecnico)
export const updateProblem = async (req, res, next) => {
    try {
        let problem = await Problem.findById(req.params.id);

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problema não encontrado'
            });
        }

        // Atualizar datas baseado no status
        if (req.body.status === 'resolvido' && problem.status !== 'resolvido') {
            req.body.resolvedAt = new Date();
        }
        if (req.body.status === 'fechado' && problem.status !== 'fechado') {
            req.body.closedAt = new Date();
        }

        problem = await Problem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('relatedIncidents', 'title status')
            .populate('affectedAssets', 'assetId description');

        res.json({
            success: true,
            data: problem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Deletar problema
// @route   DELETE /api/problems/:id
// @access  Private (Admin)
export const deleteProblem = async (req, res, next) => {
    try {
        const problem = await Problem.findById(req.params.id);

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problema não encontrado'
            });
        }

        await problem.deleteOne();

        res.json({
            success: true,
            message: 'Problema deletado com sucesso'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Vincular incidente ao problema
// @route   POST /api/problems/:id/incidents/:ticketId
// @access  Private (Admin/Tecnico)
export const linkIncident = async (req, res, next) => {
    try {
        const problem = await Problem.findById(req.params.id);
        const ticket = await Ticket.findById(req.params.ticketId);

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problema não encontrado'
            });
        }

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket não encontrado'
            });
        }

        // Verificar se já está vinculado
        if (problem.relatedIncidents.includes(req.params.ticketId)) {
            return res.status(400).json({
                success: false,
                message: 'Incidente já vinculado a este problema'
            });
        }

        problem.relatedIncidents.push(req.params.ticketId);
        await problem.save();

        const updatedProblem = await Problem.findById(problem._id)
            .populate('relatedIncidents', 'title status priority');

        res.json({
            success: true,
            data: updatedProblem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Desvincular incidente do problema
// @route   DELETE /api/problems/:id/incidents/:ticketId
// @access  Private (Admin/Tecnico)
export const unlinkIncident = async (req, res, next) => {
    try {
        const problem = await Problem.findById(req.params.id);

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problema não encontrado'
            });
        }

        problem.relatedIncidents = problem.relatedIncidents.filter(
            id => id.toString() !== req.params.ticketId
        );

        await problem.save();

        const updatedProblem = await Problem.findById(problem._id)
            .populate('relatedIncidents', 'title status priority');

        res.json({
            success: true,
            data: updatedProblem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Estatísticas de problemas
// @route   GET /api/problems/stats/analytics
// @access  Private (Admin/Tecnico)
export const getProblemStats = async (req, res, next) => {
    try {
        const stats = await Problem.aggregate([
            {
                $facet: {
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    byPriority: [
                        { $group: { _id: '$priority', count: { $sum: 1 } } }
                    ],
                    byCategory: [
                        { $group: { _id: '$category', count: { $sum: 1 } } }
                    ],
                    recurrent: [
                        {
                            $project: {
                                title: 1,
                                category: 1,
                                incidentCount: { $size: '$relatedIncidents' }
                            }
                        },
                        { $match: { incidentCount: { $gte: 3 } } },
                        { $sort: { incidentCount: -1 } },
                        { $limit: 10 }
                    ],
                    avgResolutionTime: [
                        {
                            $match: { resolvedAt: { $exists: true } }
                        },
                        {
                            $project: {
                                resolutionTime: {
                                    $subtract: ['$resolvedAt', '$identifiedAt']
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                avgTime: { $avg: '$resolutionTime' }
                            }
                        }
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
