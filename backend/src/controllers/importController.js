import ImportJob from '../models/ImportJob.js';
import ImportRow from '../models/ImportRow.js';
// import { parseFile } from '../services/importParserService.js';
// import { commitJob } from '../services/importCommitService.js';

// @desc    Upload e início do job de importação
// @route   POST /api/import/upload
export const uploadImport = async (req, res, next) => {
    try {
        const { type, targetDate } = req.body;
        if (!req.file) return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });

        const job = await ImportJob.create({
            type,
            targetDate: targetDate ? new Date(targetDate) : null,
            fileName: req.file.originalname,
            filePath: req.file.path,
            status: 'UPLOADED',
            createdBy: req.user.id
        });

        // Trigger parser (async)
        // parseFile(job._id); 

        res.status(201).json({ success: true, data: job });
    } catch (error) {
        next(error);
    }
};

// @desc    Status e preview do job
// @route   GET /api/import/jobs/:id
export const getJobStatus = async (req, res, next) => {
    try {
        const job = await ImportJob.findById(req.params.id);
        const rows = await ImportRow.find({ jobId: req.params.id }).limit(100);
        res.json({ success: true, data: { job, rows } });
    } catch (error) {
        next(error);
    }
};

// @desc    Confirmar e aplicar a importação
// @route   POST /api/import/jobs/:id/commit
export const commitImport = async (req, res, next) => {
    try {
        const job = await ImportJob.findById(req.params.id);
        if (job.status !== 'VALIDATED') {
            return res.status(400).json({ success: false, message: 'Job deve estar validado para ser aplicado' });
        }

        // commitJob(job._id, req.user.id);

        res.json({ success: true, message: 'Processamento iniciado' });
    } catch (error) {
        next(error);
    }
};
