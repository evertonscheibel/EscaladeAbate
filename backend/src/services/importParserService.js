import fs from 'fs';
import csv from 'csv-parser';
import { parse as xlsxParse } from 'node-xlsx';
import ImportJob from '../models/ImportJob.js';
import ImportRow from '../models/ImportRow.js';

export const parseFile = async (jobId) => {
    try {
        const job = await ImportJob.findById(jobId);
        if (!job) return;

        await ImportJob.findByIdAndUpdate(jobId, { status: 'PARSING' });

        const rows = [];
        const ext = job.fileName.split('.').pop().toLowerCase();

        if (ext === 'csv') {
            await new Promise((resolve, reject) => {
                fs.createReadStream(job.filePath)
                    .pipe(csv())
                    .on('data', (data) => rows.push(data))
                    .on('end', resolve)
                    .on('error', reject);
            });
        } else if (ext === 'xlsx' || ext === 'xls') {
            const workSheetsFromFile = xlsxParse(job.filePath);
            const sheet = workSheetsFromFile[0].data;
            const headers = sheet[0];
            for (let i = 1; i < sheet.length; i++) {
                const row = {};
                headers.forEach((h, idx) => { row[h] = sheet[i][idx]; });
                rows.push(row);
            }
        }

        // Criar ImportRows
        const importRows = rows.map((r, index) => ({
            jobId,
            rowNumber: index + 1,
            rawData: r,
            status: 'VALID' // Simplificado por enquanto
        }));

        await ImportRow.insertMany(importRows);

        await ImportJob.findByIdAndUpdate(jobId, {
            status: 'VALIDATED',
            totalRows: rows.length,
            validRows: rows.length
        });

    } catch (error) {
        console.error('Import Parser Error:', error);
        await ImportJob.findByIdAndUpdate(jobId, { status: 'FAILED', errors: [{ message: error.message }] });
    }
};
