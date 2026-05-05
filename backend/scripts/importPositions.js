import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../src/config/database.js';
import JobPosition from '../src/models/JobPosition.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const importData = async () => {
    try {
        await connectDB();

        const filePath = path.join(__dirname, '../../ATS_Vagas_FSW_2026_payload.json');
        const rawData = fs.readFileSync(filePath, 'utf8');
        const positions = JSON.parse(rawData);

        console.log(`Iniciando importação de ${positions.length} vagas...`);

        for (const pos of positions) {
            await JobPosition.findOneAndUpdate(
                { id_externo: pos.id_externo },
                pos,
                { upsert: true, new: true }
            );
        }

        console.log('Importação concluída com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('Erro na importação:', error);
        process.exit(1);
    }
};

importData();
