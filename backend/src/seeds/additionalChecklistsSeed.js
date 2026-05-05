import mongoose from 'mongoose';
import ChecklistModel from '../models/ChecklistModel.js';
import PacProgram from '../models/PacProgram.js';
import ProductionArea from '../models/ProductionArea.js';
import connectDB from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdditionalChecklists = async () => {
    try {
        await connectDB();

        // Programas
        const bea = await PacProgram.findOne({ codigo: 'BEA' });
        const pso = await PacProgram.findOne({ codigo: 'PSO' });

        // Áreas
        const areas = await ProductionArea.find();
        const curral = areas.find(a => a.nome.includes('Curral')) || areas[0];
        const abate = areas.find(a => a.nome.includes('Abate')) || areas[0];
        const desossa = areas.find(a => a.nome.includes('Desossa')) || areas[0];

        const models = [
            {
                codigo: 'BEA-001',
                titulo: 'BEA - Monitoramento de Bem-Estar Animal',
                descricao: 'Monitoramento de recepção, manejo e insensibilização (Baseado no DBEA018)',
                programa: bea?._id,
                area: curral?._id,
                frequencia: 'Por lote de recepção',
                itens: [
                    { ordem: 1, descricao: 'Quedas ou escorregões durante o desembarque', tipo_resposta: 'OK_NOK_NA', criticidade: 'Maior' },
                    { ordem: 2, descricao: 'Uso excessivo de ferrão elétrico (>25%)', tipo_resposta: 'OK_NOK_NA', criticidade: 'Crítico' },
                    { ordem: 3, descricao: 'Eficácia da insensibilização (tiro único)', tipo_resposta: 'OK_NOK_NA', criticidade: 'Crítico' },
                    { ordem: 4, descricao: 'Sinais de consciência pós-insensibilização', tipo_resposta: 'OK_NOK_NA', criticidade: 'Crítico' }
                ],
                versao: 1,
                status: 'Ativo'
            },
            {
                codigo: 'PSO-001',
                titulo: 'PSO - Procedimento Sanitário Operacional',
                descricao: 'Monitoramento da higiene durante a operação (Baseado no PAC 10)',
                programa: pso?._id,
                area: desossa?._id,
                frequencia: 'A cada 1 hora',
                itens: [
                    { ordem: 1, descricao: 'Higiene das mãos e braços dos operários', tipo_resposta: 'OK_NOK_NA', criticidade: 'Maior' },
                    { ordem: 2, descricao: 'Temperatura da água dos esterilizadores (>82°C)', tipo_resposta: 'Numérico', unidade_medida: '°C', limite_minimo: 82, criticidade: 'Crítico' },
                    { ordem: 3, descricao: 'Condensação sobre o produto exposto', tipo_resposta: 'OK_NOK_NA', criticidade: 'Crítico' },
                    { ordem: 4, descricao: 'Limpeza de resíduos em facas durante trocas', tipo_resposta: 'OK_NOK_NA', criticidade: 'Maior' }
                ],
                versao: 1,
                status: 'Ativo'
            }
        ];

        for (const model of models) {
            await ChecklistModel.findOneAndUpdate(
                { codigo: model.codigo },
                model,
                { upsert: true, new: true }
            );
        }

        console.log('🌱 Seed de BEA e PSO concluído!');
        process.exit(0);
    } catch (err) {
        console.error('Erro no seed:', err);
        process.exit(1);
    }
};

seedAdditionalChecklists();
