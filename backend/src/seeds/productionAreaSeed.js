import mongoose from 'mongoose';
import ProductionArea from '../models/ProductionArea.js';
import User from '../models/User.js';
import connectDB from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const areas = [
    { codigo: 'CUR-01', nome: 'Curral de Recepção', setor: 'Abate', qr_code: 'AREA-CUR-01' },
    { codigo: 'ABA-01', nome: 'Abate / Sangria', setor: 'Abate', qr_code: 'AREA-ABA-01' },
    { codigo: 'EV-01', nome: 'Evisceração', setor: 'Abate', qr_code: 'AREA-EV-01' },
    { codigo: 'DES-01', nome: 'Desossa', setor: 'Processamento', qr_code: 'AREA-DES-01' },
    { codigo: 'EXP-01', nome: 'Expedição', setor: 'Expedição', qr_code: 'AREA-EXP-01' },
    { codigo: 'MAINT-01', nome: 'Manutenção / Caldeira', setor: 'Utilidades', qr_code: 'AREA-MAINT-01' },
    { codigo: 'LAB-01', nome: 'Laboratório', setor: 'Processamento', qr_code: 'AREA-LAB-01' }
];

const seedAreas = async () => {
    try {
        await connectDB();
        console.log('🌱 Semeando Áreas de Produção...');

        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('❌ Erro: Admin não encontrado.');
            process.exit(1);
        }

        for (const area of areas) {
            await ProductionArea.findOneAndUpdate(
                { codigo: area.codigo },
                {
                    ...area,
                    responsavel: admin._id,
                    ativo: true
                },
                { upsert: true, new: true }
            );
            console.log(`✅ Área ${area.codigo} - ${area.nome} ok.`);
        }

        console.log('✨ Seed de Áreas concluído!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro no seed de áreas:', err);
        process.exit(1);
    }
};

seedAreas();
