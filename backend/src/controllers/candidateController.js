import Candidate from '../models/Candidate.js';
import User from '../models/User.js';

// Criar candidato (público - sem autenticação)
export const createCandidate = async (req, res) => {
    try {
        // Verificar se já existe candidato com o mesmo CPF
        const existingCandidate = await Candidate.findOne({ cpf: req.body.cpf });
        if (existingCandidate) {
            return res.status(400).json({
                message: 'Já existe uma candidatura com este CPF',
                protocol: existingCandidate.protocol
            });
        }

        const candidate = new Candidate({
            ...req.body,
            lgpdConsent: true,
            lgpdConsentDate: new Date()
        });

        await candidate.save();

        res.status(201).json({
            message: 'Candidatura enviada com sucesso!',
            protocol: candidate.protocol,
            id: candidate._id
        });
    } catch (error) {
        console.error('Erro ao criar candidato:', error);
        res.status(400).json({
            message: error.message || 'Erro ao enviar candidatura',
            errors: error.errors
        });
    }
};

// Listar todos os candidatos (com filtros)
export const getAllCandidates = async (req, res) => {
    try {
        const {
            status,
            desiredPosition,
            search,
            assignedTo,
            priority,
            startDate,
            endDate,
            page = 1,
            limit = 50
        } = req.query;

        const query = {};

        if (status) query.status = status;
        if (desiredPosition) query.desiredPosition = { $regex: desiredPosition, $options: 'i' };
        if (assignedTo) query.assignedTo = assignedTo;
        if (priority) query.priority = priority;

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { cpf: { $regex: search, $options: 'i' } },
                { protocol: { $regex: search, $options: 'i' } }
            ];
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [candidates, total] = await Promise.all([
            Candidate.find(query)
                .populate('assignedTo', 'firstName lastName')
                .populate('jobPosition', 'titulo_vaga setor id_externo')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Candidate.countDocuments(query)
        ]);

        res.json({
            data: candidates,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Erro ao buscar candidatos:', error);
        res.status(500).json({ message: 'Erro ao buscar candidatos' });
    }
};

// Buscar candidato por ID
export const getCandidateById = async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id)
            .populate('assignedTo', 'firstName lastName')
            .populate('jobPosition');

        if (!candidate) {
            return res.status(404).json({ message: 'Candidato não encontrado' });
        }

        res.json(candidate);
    } catch (error) {
        console.error('Erro ao buscar candidato:', error);
        res.status(500).json({ message: 'Erro ao buscar candidato' });
    }
};

// Atualizar candidato
export const updateCandidate = async (req, res) => {
    try {
        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('assignedTo', 'name email');

        if (!candidate) {
            return res.status(404).json({ message: 'Candidato não encontrado' });
        }

        res.json(candidate);
    } catch (error) {
        console.error('Erro ao atualizar candidato:', error);
        res.status(400).json({ message: error.message });
    }
};

// Atualizar status do candidato
export const updateCandidateStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!candidate) {
            return res.status(404).json({ message: 'Candidato não encontrado' });
        }

        res.json({ message: 'Status atualizado', candidate });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(400).json({ message: error.message });
    }
};

// Atribuir candidato a um responsável
export const assignCandidate = async (req, res) => {
    try {
        const { assignedTo } = req.body;

        // Verificar se o usuário existe
        if (assignedTo) {
            const user = await User.findById(assignedTo);
            if (!user) {
                return res.status(400).json({ message: 'Usuário responsável não encontrado' });
            }
        }

        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            { assignedTo: assignedTo || null },
            { new: true }
        ).populate('assignedTo', 'name email');

        if (!candidate) {
            return res.status(404).json({ message: 'Candidato não encontrado' });
        }

        res.json({ message: 'Responsável atribuído', candidate });
    } catch (error) {
        console.error('Erro ao atribuir responsável:', error);
        res.status(400).json({ message: error.message });
    }
};

// Adicionar nota ao candidato
export const addNote = async (req, res) => {
    try {
        const { content } = req.body;
        const author = req.user?.name || 'Sistema';

        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    notes: {
                        content,
                        author,
                        createdAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!candidate) {
            return res.status(404).json({ message: 'Candidato não encontrado' });
        }

        res.json({ message: 'Nota adicionada', candidate });
    } catch (error) {
        console.error('Erro ao adicionar nota:', error);
        res.status(400).json({ message: error.message });
    }
};

// Agendar entrevista
export const scheduleInterview = async (req, res) => {
    try {
        const { scheduledDate, type, interviewer, location, notes } = req.body;

        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    interviews: {
                        scheduledDate,
                        type: type || 'presencial',
                        interviewer,
                        location,
                        notes,
                        status: 'agendada',
                        createdAt: new Date()
                    }
                },
                status: 'aguardando_entrevista'
            },
            { new: true }
        );

        if (!candidate) {
            return res.status(404).json({ message: 'Candidato não encontrado' });
        }

        res.json({ message: 'Entrevista agendada', candidate });
    } catch (error) {
        console.error('Erro ao agendar entrevista:', error);
        res.status(400).json({ message: error.message });
    }
};

// Atualizar entrevista
export const updateInterview = async (req, res) => {
    try {
        const { interviewId } = req.params;
        const updateData = req.body;

        const candidate = await Candidate.findOneAndUpdate(
            {
                _id: req.params.id,
                'interviews._id': interviewId
            },
            {
                $set: {
                    'interviews.$': { ...updateData, _id: interviewId }
                }
            },
            { new: true }
        );

        if (!candidate) {
            return res.status(404).json({ message: 'Candidato ou entrevista não encontrado' });
        }

        // Se a entrevista foi realizada, atualizar status
        if (updateData.status === 'realizada') {
            candidate.status = 'entrevistado';
            await candidate.save();
        }

        res.json({ message: 'Entrevista atualizada', candidate });
    } catch (error) {
        console.error('Erro ao atualizar entrevista:', error);
        res.status(400).json({ message: error.message });
    }
};

// Adicionar documento
export const addDocument = async (req, res) => {
    try {
        const { name, type, url } = req.body;

        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    documents: {
                        name,
                        type,
                        url,
                        uploadedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!candidate) {
            return res.status(404).json({ message: 'Candidato não encontrado' });
        }

        res.json({ message: 'Documento adicionado', candidate });
    } catch (error) {
        console.error('Erro ao adicionar documento:', error);
        res.status(400).json({ message: error.message });
    }
};

// Dashboard de recrutamento
export const getRecruitmentDashboard = async (req, res) => {
    try {
        const [
            totalCandidates,
            statusCounts,
            recentCandidates,
            priorityCounts,
            thisMonthCount
        ] = await Promise.all([
            Candidate.countDocuments(),
            Candidate.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Candidate.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('fullName desiredPosition status createdAt protocol'),
            Candidate.aggregate([
                { $group: { _id: '$priority', count: { $sum: 1 } } }
            ]),
            Candidate.countDocuments({
                createdAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            })
        ]);

        // Converter para objeto mais fácil de usar
        const statusMap = {};
        statusCounts.forEach(s => { statusMap[s._id] = s.count; });

        const priorityMap = {};
        priorityCounts.forEach(p => { priorityMap[p._id] = p.count; });

        res.json({
            total: totalCandidates,
            thisMonth: thisMonthCount,
            byStatus: statusMap,
            byPriority: priorityMap,
            recent: recentCandidates,
            stats: {
                novos: statusMap['novo'] || 0,
                emAnalise: statusMap['em_analise'] || 0,
                preSelecionados: statusMap['pre_selecionado'] || 0,
                aguardandoEntrevista: statusMap['aguardando_entrevista'] || 0,
                entrevistados: statusMap['entrevistado'] || 0,
                aprovados: statusMap['aprovado'] || 0,
                reprovados: statusMap['reprovado'] || 0,
                contratados: statusMap['contratado'] || 0
            }
        });
    } catch (error) {
        console.error('Erro ao buscar dashboard:', error);
        res.status(500).json({ message: 'Erro ao buscar dashboard' });
    }
};

// Deletar candidato
export const deleteCandidate = async (req, res) => {
    try {
        const candidate = await Candidate.findByIdAndDelete(req.params.id);

        if (!candidate) {
            return res.status(404).json({ message: 'Candidato não encontrado' });
        }

        res.json({ message: 'Candidato removido com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar candidato:', error);
        res.status(500).json({ message: 'Erro ao remover candidato' });
    }
};

// LGPD Cleanup - remover dados antigos
export const lgpdCleanup = async (req, res) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 180); // 180 dias

        const result = await Candidate.updateMany(
            {
                createdAt: { $lt: cutoffDate },
                status: { $in: ['reprovado', 'desistente'] }
            },
            {
                $set: {
                    fullName: 'DADOS REMOVIDOS - LGPD',
                    cpf: 'XXX.XXX.XXX-XX',
                    email: 'removido@lgpd.com',
                    phone: 'REMOVIDO',
                    whatsapp: null,
                    address: {},
                    experiences: [],
                    observations: 'Dados anonimizados conforme LGPD'
                }
            }
        );

        res.json({
            message: 'Limpeza LGPD executada',
            modified: result.modifiedCount
        });
    } catch (error) {
        console.error('Erro na limpeza LGPD:', error);
        res.status(500).json({ message: 'Erro na limpeza LGPD' });
    }
};
