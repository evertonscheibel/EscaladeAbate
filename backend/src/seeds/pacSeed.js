import mongoose from 'mongoose';
import PacProgram from '../models/PacProgram.js';
import User from '../models/User.js';
import connectDB from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const pacPrograms = [
    { codigo: 'BPF', nome: 'Boas Práticas de Fabricação', descricao: 'Programas de pré-requisitos essenciais' },
    { codigo: 'PPHO', nome: 'Procedimentos Padrão de Higiene Operacional', descricao: 'Higienização pré e operacional' },
    { codigo: 'APPCC', nome: 'Análise de Perigos e Pontos Críticos de Controle', descricao: 'Segurança do alimento' },
    { codigo: 'AGUA', nome: 'Controle da Qualidade da Água', descricao: 'Monitoramento de cloro e potabilidade' },
    { codigo: 'PRAGAS', nome: 'Controle Integrado de Pragas', descricao: 'Prevenção de vetores e pragas' },
    { codigo: 'CALIBR', nome: 'Calibração e Metrologia', descricao: 'Aferição de instrumentos' },
    { codigo: 'TEMP', nome: 'Controle de Temperaturas', descricao: 'Monitoramento de câmaras e túneis' },
    { codigo: 'RASTR', nome: 'Rastreabilidade e Recall', descricao: 'Identificação de origem e destino' },
    { codigo: 'BEA', nome: 'Bem-Estar Animal', descricao: 'Manejo humanitário' },
    { codigo: 'TRAT', nome: 'Treinamentos', descricao: 'Capacitação contínua da equipe' }
];

async function seedPAC() {
    try {
        await connectDB();

        // Buscar um usuário admin para ser o RT padrão inicial
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('❌ Erro: Nenhum usuário admin encontrado para associar aos programas.');
            process.exit(1);
        }

        console.log('🌱 Iniciando seed de programas PAC...');

        for (const prog of pacPrograms) {
            await PacProgram.findOneAndUpdate(
                { codigo: prog.codigo },
                {
                    ...prog,
                    responsavel_tecnico: admin._id,
                    ativo: true
                },
                { upsert: true, new: true }
            );
            console.log(`✅ Programa ${prog.codigo} inserido/atualizado.`);
        }

        console.log('✨ Seed de PAC concluído com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro no seed:', error);
        process.exit(1);
    }
}

seedPAC();
