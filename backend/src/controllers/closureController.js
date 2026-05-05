import SlaughterClosure from '../models/SlaughterClosure.js';
import SlaughterSchedule from '../models/SlaughterSchedule.js';
import SlaughterLot from '../models/SlaughterLot.js';
import { generateClosurePDF } from '../utils/closurePdfGenerator.js';
import { generateSifXlsm } from '../services/sifExportService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// @desc    Buscar fechamento por data
// @route   GET /api/slaughter/closure/:date
// @access  Private (protect + checkModule)
export const getClosureByDate = async (req, res, next) => {
    try {
        const { date } = req.params;
        const [year, month, day] = date.split('-').map(Number);
        const normalizedDate = new Date(Date.UTC(year, month - 1, day));


        const closure = await SlaughterClosure.findOne({ date: normalizedDate })
            .populate('scheduleId', 'slaughterDate status totalCattle')
            .populate('closedBy', 'name')
            .populate('reopenLog.by', 'name');


        if (!closure) {
            return res.json({ success: true, data: null });
        }

        res.json({ success: true, data: closure });
    } catch (error) {
        next(error);
    }
};

// @desc    Criar fechamento a partir da escala de abate
// @route   POST /api/slaughter/closure/:date/from-pre
export const createClosureFromPre = async (req, res, next) => {

    try {
        const { date } = req.params;
        const [year, month, day] = date.split('-').map(Number);
        const normalizedDate = new Date(Date.UTC(year, month - 1, day));


        // Verificar se já existe fechamento para esta data
        const existing = await SlaughterClosure.findOne({ date: normalizedDate });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Já existe fechamento para esta data' });
        }

        // Buscar escala de abate fechada
        const schedule = await SlaughterSchedule.findOne({ slaughterDate: normalizedDate });

        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Escala de abate não encontrada para esta data' });
        }

        if (schedule.status !== 'CLOSED') {
            return res.status(400).json({ success: false, message: 'A escala de abate precisa estar FECHADA para iniciar o fechamento SIF' });
        }

        // Buscar lotes da escala
        const lots = await SlaughterLot.find({ schedule: schedule._id }).populate('rancher').sort('order');


        // Mapear lotes para linhas do fechamento
        const lines = lots.map((lot, index) => ({
            sequence: index + 1,
            preLotRefId: lot._id.toString(), // usando ID do lote como ref
            producerName: lot.rancherName,
            municipio: (lot.rancher?.address?.city || '').trim(),
            uf: (lot.rancher?.address?.state || '').trim().substring(0, 2).toUpperCase(),
            brokerCode: lot.brokerNumber,


            brokerName: lot.brokerNumber, // ou outro campo se houver
            boi: lot.boi,
            vaca: lot.vaca,
            novilha: lot.novilha,
            bubalino: lot.bubalino,
            touro: lot.touro,
            curral: '',
            cor: '',
            nf: '',
            gta: '',
            observations: ''
        }));

        // Buscar último fechamento para sugerir veterinário
        const lastClosure = await SlaughterClosure.findOne().sort({ date: -1 });
        const defaultVet = lastClosure?.header?.veterinarian || '';

        const closure = await SlaughterClosure.create({
            date: normalizedDate,
            scheduleId: schedule._id,
            status: 'DRAFT',
            header: {
                slaughterDate: normalizedDate,
                sifNumber: 'SIF XXXX', // configurável
                veterinarian: defaultVet
            },
            lines,
            createdBy: req.user.id
        });


        res.status(201).json({ success: true, data: closure });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar fechamento
// @route   PUT /api/slaughter/closure/:id
export const updateClosure = async (req, res, next) => {
    try {
        const closure = await SlaughterClosure.findById(req.params.id);
        if (!closure) return res.status(404).json({ success: false, message: 'Fechamento não encontrado' });
        if (closure.status === 'CLOSED') return res.status(400).json({ success: false, message: 'Fechamento já está fechado' });

        const allowedFields = ['header', 'lines', 'notes'];
        const updateData = {};
        allowedFields.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });

        const updated = await SlaughterClosure.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

// @desc    Reordenar linhas
// @route   POST /api/slaughter/closure/:id/reorder
export const reorderLines = async (req, res, next) => {
    try {
        const { order } = req.body; // Array de { preLotRefId, sequence }
        const closure = await SlaughterClosure.findById(req.params.id);

        if (!closure) return res.status(404).json({ success: false, message: 'Fechamento não encontrado' });
        if (closure.status === 'CLOSED') return res.status(400).json({ success: false, message: 'Fechamento já está fechado' });

        order.forEach(item => {
            const line = closure.lines.find(l => l.preLotRefId === item.preLotRefId);
            if (line) line.sequence = item.sequence;
        });

        // Garantir ordenação correta no array
        closure.lines.sort((a, b) => a.sequence - b.sequence);
        await closure.save();

        res.json({ success: true, data: closure });
    } catch (error) {
        next(error);
    }
};

// @desc    Fechar (status → CLOSED)
// @route   POST /api/slaughter/closure/:id/close
export const closeClosure = async (req, res, next) => {
    try {
        const closure = await SlaughterClosure.findById(req.params.id);
        if (!closure) return res.status(404).json({ success: false, message: 'Fechamento não encontrado' });
        if (closure.status === 'CLOSED') return res.status(400).json({ success: false, message: 'Já está fechado' });

        // Validar obrigatórios SIF
        const linesIncomplete = closure.lines.filter(l => !l.curral || !l.municipio || !l.uf);
        if (linesIncomplete.length > 0) {
            const details = linesIncomplete.map(l => {
                const missing = [];
                if (!l.curral) missing.push('Curral');
                if (!l.municipio) missing.push('Cidade');
                if (!l.uf) missing.push('UF');
                return `${l.producerName} (${missing.join(', ')})`;
            });

            return res.status(400).json({
                success: false,
                message: `Existem ${linesIncomplete.length} lote(s) com dados incompletos:`,
                errors: details
            });
        }

        closure.status = 'CLOSED';

        closure.closedBy = req.user.id;
        closure.closedAt = new Date();
        await closure.save();

        // Hook PCP (simplificado por enquanto)
        // ... integração com PcpDayPlan virá no controller do PCP ou aqui ...

        res.json({ success: true, data: closure, message: 'Fechamento SIF realizado com sucesso' });
    } catch (error) {
        next(error);
    }
};

// @desc    Reabrir fechamento (admin)
// @route   POST /api/slaughter/closure/:id/reopen
export const reopenClosure = async (req, res, next) => {
    try {
        const { reason } = req.body;
        if (!reason) return res.status(400).json({ success: false, message: 'Motivo obrigatório para reabertura' });

        const closure = await SlaughterClosure.findById(req.params.id);
        if (!closure) return res.status(404).json({ success: false, message: 'Fechamento não encontrado' });
        if (closure.status !== 'CLOSED') return res.status(400).json({ success: false, message: 'Somente fechamentos CLOSED podem ser reabertos' });

        closure.status = 'DRAFT';
        closure.reopenLog.push({ by: req.user.id, at: new Date(), reason });
        await closure.save();

        res.json({ success: true, data: closure, message: 'Fechamento reaberto' });
    } catch (error) {
        next(error);
    }
};

// @desc    Exportar fechamento PDF
// @route   GET /api/slaughter/closure/:id/pdf
export const exportClosurePdf = async (req, res, next) => {
    try {
        const closure = await SlaughterClosure.findById(req.params.id);
        if (!closure) return res.status(404).json({ success: false, message: 'Fechamento não encontrado' });

        const pdfUrl = await generateClosurePDF(closure);
        res.json({ success: true, pdfUrl });
    } catch (error) {
        next(error);
    }
};

// @desc    Exportar fechamento (XLSM/PDF)
// @route   GET /api/slaughter/closure/:id/export
export const exportClosure = async (req, res, next) => {
    try {
        const closure = await SlaughterClosure.findById(req.params.id);
        if (!closure) return res.status(404).json({ success: false, message: 'Fechamento não encontrado' });

        const timestamp = new Date().getTime();
        const outputDir = path.join(__dirname, '../../temp/exports');
        const fileName = `BOLETIM_SIF_${closure.date.toISOString().split('T')[0]}_${timestamp}.xlsm`;
        const outputPath = path.join(outputDir, fileName);

        await generateSifXlsm(closure, outputPath);

        // Enviar arquivo para o cliente
        res.download(outputPath, fileName, (err) => {
            if (err) {
                console.error('Download Error:', err);
            }
            // Opcional: deletar arquivo após download
            // fs.unlinkSync(outputPath);
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Sincroniza o fechamento SIF com a escala de abate
 *          Chamado automaticamente quando a escala é alterada
 */
export const syncClosureWithSchedule = async (scheduleId) => {
    try {
        const logPath = 'sif_sync.log';
        const fs = await import('fs');
        const now = new Date().toISOString();
        
        fs.appendFileSync(logPath, `[${now}] SYNC SIF: Iniciando para escala ${scheduleId}\n`);

        const closure = await SlaughterClosure.findOne({ scheduleId });
        
        if (!closure) {
            fs.appendFileSync(logPath, `[${now}] SYNC SIF: Nenhum fechamento encontrado.\n`);
            return;
        }

        if (closure.status === 'CLOSED') {
            fs.appendFileSync(logPath, `[${now}] SYNC SIF: Fechamento já encerrado. Ignorando.\n`);
            return;
        }

        const schedule = await SlaughterSchedule.findById(scheduleId).populate({
            path: 'lots',
            populate: { path: 'rancher' }
        });

        if (!schedule) {
            fs.appendFileSync(logPath, `[${now}] SYNC SIF: Escala não encontrada.\n`);
            return;
        }

        // Sincronizar data e cabeçalho se mudou
        let dateChanged = false;
        if (closure.date.toISOString().split('T')[0] !== schedule.slaughterDate.toISOString().split('T')[0]) {
            closure.date = schedule.slaughterDate;
            closure.header.slaughterDate = schedule.slaughterDate;
            dateChanged = true;
        }

        const lotCount = schedule.lots?.length || 0;
        fs.appendFileSync(logPath, `[${now}] SYNC SIF: Escala encontrada com ${lotCount} lotes.\n`);

        // Mapear linhas atuais para preservar dados manuais
        const existingLinesMap = new Map();
        closure.lines.forEach(line => {
            if (line.preLotRefId) {
                existingLinesMap.set(line.preLotRefId.toString(), line);
            }
        });

        fs.appendFileSync(logPath, `[${now}] SYNC SIF: Mapeadas ${existingLinesMap.size} linhas existentes para preservação.\n`);

        // Criar novas linhas baseadas nos lotes atuais
        const newLines = (schedule.lots || [])
            .map((lot, idx) => {
                const existing = existingLinesMap.get(lot._id.toString());
                
                // Se existe, preservamos o que foi digitado manualmente. 
                // Se não existe, pegamos o default do cadastro do pecuarista.
                const manualFields = {
                    municipio: existing ? (existing.municipio || '') : (lot.rancher?.address?.city || ''),
                    uf: existing ? (existing.uf || '') : (lot.rancher?.address?.state || '').substring(0, 2).toUpperCase(),
                    curral: existing ? (existing.curral || '') : '',
                    cor: existing ? (existing.cor || '') : '',
                    nf: existing ? (existing.nf || '') : '',
                    gta: existing ? (existing.gta || '') : '',
                    observations: existing ? (existing.observations || '') : ''
                };

                if (existing) {
                    fs.appendFileSync(logPath, `[${now}] SYNC SIF: Preservando dados para lote ${lot._id} (Produtor: ${lot.rancherName})\n`);
                } else {
                    fs.appendFileSync(logPath, `[${now}] SYNC SIF: Nova linha criada para lote ${lot._id}\n`);
                }

                return {
                    sequence: idx + 1,
                    preLotRefId: lot._id.toString(),
                    producerName: lot.rancherName,
                    brokerCode: lot.brokerNumber,
                    brokerName: lot.brokerNumber, // Sincronizando brokerName também
                    boi: lot.boi || 0,
                    vaca: lot.vaca || 0,
                    novilha: lot.novilha || 0,
                    bubalino: lot.bubalino || 0,
                    touro: lot.touro || 0,
                    total: lot.total,
                    ...manualFields
                };
            });

        closure.lines = newLines;
        await closure.save();

        const syncMsg = dateChanged ? ' (Data atualizada)' : '';
        fs.appendFileSync(logPath, `[${now}] SYNC SIF: Sincronização concluída.${syncMsg} Total de linhas: ${newLines.length}\n`);
    } catch (error) {
        const fs = await import('fs');
        fs.appendFileSync('sif_sync.log', `[${new Date().toISOString()}] SYNC SIF ERROR: ${error.message}\n${error.stack}\n`);
    }
};


