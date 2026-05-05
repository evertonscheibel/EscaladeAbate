import GatehouseAccess from '../models/GatehouseAccess.js';
import Vehicle from '../models/Vehicle.js';
import AccessPerson from '../models/AccessPerson.js';
import Company from '../models/Company.js';
import AccessType from '../models/AccessType.js';
import AccessReason from '../models/AccessReason.js';

// @desc    Gerar próximo ticket automático: YYYY-MM-NNNNNN
async function generateNextTicket() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `${year}-${month}`;

    const lastAccess = await GatehouseAccess
        .findOne({ ticket: new RegExp(`^${prefix}`) })
        .sort({ ticket: -1 })
        .limit(1);

    let nextSeq = 1;
    if (lastAccess) {
        const lastSeq = parseInt(lastAccess.ticket.split('-')[2]);
        nextSeq = lastSeq + 1;
    }

    const sequence = String(nextSeq).padStart(6, '0');
    return `${prefix}-${sequence}`;
}

// @desc    Registrar ENTRADA
// @route   POST /api/gatehouse/access/entry
export const registerEntry = async (req, res, next) => {
    try {
        let {
            veiculo_id, veiculo_novo,
            pessoa_id, pessoa_nova,
            empresa_id,
            tipo_acesso_id, motivo_acesso_id,
            destino, observacao_entrada, guarita_id
        } = req.body;

        // 1. Cadastro Rápido de Veículo (se necessário)
        if (!veiculo_id && veiculo_novo) {
            const existingVehicle = await Vehicle.findOne({ placa: veiculo_novo.placa.toUpperCase() });
            if (existingVehicle) {
                veiculo_id = existingVehicle._id;
            } else {
                const vehicle = await Vehicle.create({
                    ...veiculo_novo,
                    createdBy: req.user._id
                });
                veiculo_id = vehicle._id;
            }
        }

        if (!veiculo_id) {
            return res.status(400).json({ success: false, message: 'Veículo é obrigatório' });
        }

        // 2. Validar Entrada Duplicada (RN-001)
        const openAccess = await GatehouseAccess.findOne({
            veiculo_id,
            status: 'NO_PATIO'
        });

        if (openAccess) {
            return res.status(400).json({
                success: false,
                code: 'ENTRADA_DUPLICADA',
                message: 'Veículo já possui entrada aberta no pátio',
                ticket: openAccess.ticket,
                dt_entrada: openAccess.dt_entrada
            });
        }

        // 3. Cadastro Rápido de Pessoa (se necessário)
        if (!pessoa_id && pessoa_nova) {
            const person = await AccessPerson.create({
                ...pessoa_nova,
                createdBy: req.user._id
            });
            pessoa_id = person._id;
        }

        // 4. Preenchimento Inteligente de Empresa (RN-006)
        if (!empresa_id) {
            const vehicle = await Vehicle.findById(veiculo_id);
            if (vehicle.empresa_id) {
                empresa_id = vehicle.empresa_id;
            } else if (pessoa_id) {
                const person = await AccessPerson.findById(pessoa_id);
                if (person.empresa_id) {
                    empresa_id = person.empresa_id;
                }
            }
        }

        // 5. Criar Acesso
        const ticket = await generateNextTicket();
        const access = await GatehouseAccess.create({
            ticket,
            guarita_id,
            veiculo_id,
            pessoa_id,
            empresa_id,
            tipo_acesso_id,
            motivo_acesso_id,
            destino,
            observacao_entrada,
            status: 'NO_PATIO',
            createdBy: req.user._id,
            device_info: {
                userAgent: req.headers['user-agent'],
                ip: req.ip
            }
        });

        const populated = await GatehouseAccess.findById(access._id)
            .populate('veiculo_id', 'placa tipo_veiculo')
            .populate('pessoa_id', 'nome')
            .populate('empresa_id', 'nome_fantasia')
            .populate('tipo_acesso_id', 'nome cor icone');

        res.status(201).json({
            success: true,
            data: populated
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Registrar SAÍDA
// @route   PUT /api/gatehouse/access/:id/exit
export const registerExit = async (req, res, next) => {
    try {
        const { observacao_saida, houve_ocorrencia, descricao_ocorrencia } = req.body;
        const access = await GatehouseAccess.findById(req.params.id);

        if (!access) {
            return res.status(404).json({ success: false, message: 'Registro de acesso não encontrado' });
        }

        if (access.status !== 'NO_PATIO') {
            return res.status(400).json({ success: false, message: 'Este acesso já foi finalizado ou cancelado' });
        }

        const now = new Date();
        const stayMinutes = Math.floor((now - access.dt_entrada) / (1000 * 60));

        access.dt_saida = now;
        access.permanencia_min = stayMinutes;
        access.status = 'FINALIZADO';
        access.observacao_saida = observacao_saida;
        access.houve_ocorrencia = houve_ocorrencia;
        access.descricao_ocorrencia = descricao_ocorrencia;
        access.closedAt = now;
        access.closedBy = req.user._id;

        await access.save();

        res.json({
            success: true,
            data: access
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obter veículos no pátio agora
// @route   GET /api/gatehouse/access/in-patio
export const getInPatio = async (req, res, next) => {
    try {
        const { guarita_id, tipo_acesso_id, search } = req.query;
        let query = { status: 'NO_PATIO' };

        if (guarita_id) query.guarita_id = guarita_id;
        if (tipo_acesso_id) query.tipo_acesso_id = tipo_acesso_id;

        let accesses = await GatehouseAccess.find(query)
            .populate('veiculo_id', 'placa tipo_veiculo marca_modelo')
            .populate('pessoa_id', 'nome')
            .populate('empresa_id', 'nome_fantasia')
            .populate('tipo_acesso_id', 'nome cor icone')
            .sort({ dt_entrada: 1 });

        if (search) {
            const searchLower = search.toLowerCase();
            accesses = accesses.filter(a =>
                a.veiculo_id?.placa.toLowerCase().includes(searchLower) ||
                a.pessoa_id?.nome.toLowerCase().includes(searchLower) ||
                a.empresa_id?.nome_fantasia.toLowerCase().includes(searchLower)
            );
        }

        res.json({
            success: true,
            count: accesses.length,
            data: accesses
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Histórico de acessos
// @route   GET /api/gatehouse/access/history
export const getHistory = async (req, res, next) => {
    try {
        const {
            data_inicio, data_fim,
            placa, ticket,
            empresa_id, tipo_acesso_id,
            status,
            page = 1, limit = 50
        } = req.query;

        let query = {};

        if (data_inicio && data_fim) {
            query.dt_entrada = {
                $gte: new Date(data_inicio),
                $lte: new Date(data_fim + 'T23:59:59')
            };
        }

        if (ticket) query.ticket = new RegExp(ticket, 'i');
        if (empresa_id) query.empresa_id = empresa_id;
        if (tipo_acesso_id) query.tipo_acesso_id = tipo_acesso_id;
        if (status) query.status = status;

        if (placa) {
            const vehicles = await Vehicle.find({ placa: new RegExp(placa, 'i') }).select('_id');
            query.veiculo_id = { $in: vehicles.map(v => v._id) };
        }

        const total = await GatehouseAccess.countDocuments(query);
        const accesses = await GatehouseAccess.find(query)
            .populate('veiculo_id', 'placa tipo_veiculo')
            .populate('pessoa_id', 'nome')
            .populate('empresa_id', 'nome_fantasia')
            .populate('tipo_acesso_id', 'nome cor icone')
            .sort({ dt_entrada: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            success: true,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            data: accesses
        });
    } catch (error) {
        next(error);
    }
};

// @desc    KPIs para Dashboard
// @route   GET /api/gatehouse/dashboard/kpis
export const getDashboardKPIs = async (req, res, next) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const entradasHoje = await GatehouseAccess.countDocuments({
            dt_entrada: { $gte: todayStart, $lte: todayEnd }
        });

        const saidasHoje = await GatehouseAccess.countDocuments({
            dt_saida: { $gte: todayStart, $lte: todayEnd }
        });

        const noPatioAgora = await GatehouseAccess.countDocuments({
            status: 'NO_PATIO'
        });

        // Permanência média hoje
        const finishedToday = await GatehouseAccess.find({
            dt_saida: { $gte: todayStart, $lte: todayEnd },
            permanencia_min: { $exists: true }
        });

        let avgStay = 0;
        if (finishedToday.length > 0) {
            const totalStay = finishedToday.reduce((acc, curr) => acc + curr.permanencia_min, 0);
            avgStay = Math.floor(totalStay / finishedToday.length);
        }

        res.json({
            success: true,
            data: {
                entradas_hoje: entradasHoje,
                saidas_hoje: saidasHoje,
                no_patio_agora: noPatioAgora,
                permanencia_media_min: avgStay
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Editar registro finalizado (RN-005)
// @route   PUT /api/gatehouse/access/:id/edit
export const editFinishedAccess = async (req, res, next) => {
    try {
        const { campo, valor, motivo_edicao } = req.body;
        const access = await GatehouseAccess.findById(req.params.id);

        if (!access) {
            return res.status(404).json({ success: false, message: 'Acesso não encontrado' });
        }

        if (access.status === 'FINALIZADO') {
            if (!['admin', 'guarita_supervisor', 'guarita_admin'].includes(req.user.role)) {
                return res.status(403).json({ success: false, message: 'Sem permissão para editar registro finalizado' });
            }

            if (!motivo_edicao) {
                return res.status(400).json({ success: false, message: 'Motivo da edição é obrigatório' });
            }

            const editLog = {
                editedBy: req.user._id,
                campo,
                valorAnterior: String(access[campo]),
                valorNovo: String(valor),
                motivo: motivo_edicao
            };

            access.editHistory.push(editLog);
            access[campo] = valor;
            access.updatedBy = req.user._id;

            await access.save();

            return res.json({
                success: true,
                message: 'Registro editado com sucesso',
                data: access
            });
        }

        // Se não estiver finalizado, permite edição normal
        access[campo] = valor;
        access.updatedBy = req.user._id;
        await access.save();

        res.json({
            success: true,
            data: access
        });

    } catch (error) {
        next(error);
    }
};
