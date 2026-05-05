import ImportJob from '../models/ImportJob.js';
import ImportRow from '../models/ImportRow.js';
import SlaughterPreSchedule from '../models/SlaughterPreSchedule.js';
import ExternalLot from '../models/ExternalLot.js';
import { v4 as uuidv4 } from 'uuid';

export const commitJob = async (jobId, userId) => {
    try {
        const job = await ImportJob.findById(jobId);
        const rows = await ImportRow.find({ jobId, status: 'VALID' });

        if (job.type === 'PRE_SCHEDULE_IMPORT') {
            const lots = rows.map(r => ({
                preLotRefId: uuidv4(),
                producerName: r.rawData.producer || r.rawData.PRODUTOR || 'Desconhecido',
                municipio: r.rawData.city || r.rawData.MUNICIPIO || '-',
                uf: r.rawData.uf || r.rawData.UF || '-',
                boi: Number(r.rawData.boi || r.rawData.BOI || 0),
                vaca: Number(r.rawData.vaca || r.rawData.VACA || 0),
                novilha: Number(r.rawData.novilha || r.rawData.NOVILHA || 0),
                bubalino: Number(r.rawData.bubalino || r.rawData.BUBALINO || 0),
                touro: Number(r.rawData.touro || r.rawData.TOURO || 0)
            }));

            await SlaughterPreSchedule.findOneAndUpdate(
                { date: job.targetDate },
                {
                    lots,
                    status: 'DRAFT',
                    updatedBy: userId
                },
                { upsert: true }
            );
        } else if (job.type === 'EXTERNAL_LOT_IMPORT') {
            const externalLots = rows.map(r => ({
                externalLotCode: r.rawData.code || r.rawData.CODIGO || uuidv4(),
                arrivalDate: job.targetDate || new Date(),
                supplierName: r.rawData.supplier || r.rawData.FORNECEDOR || 'Desconhecido',
                carcasses: Number(r.rawData.total || r.rawData.TOTAL || 0),
                createdBy: userId
            }));
            await ExternalLot.insertMany(externalLots);
        }

        job.status = 'COMMITTED';
        job.committedAt = new Date();
        job.committedBy = userId;
        await job.save();

    } catch (error) {
        console.error('Import Commit Error:', error);
        await ImportJob.findByIdAndUpdate(jobId, { status: 'FAILED' });
    }
};
