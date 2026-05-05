import mongoose from 'mongoose';
import ChecklistModel from '../models/ChecklistModel.js';
import PacProgram from '../models/PacProgram.js';
import ProductionArea from '../models/ProductionArea.js';
import connectDB from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const seedChecklists = async () => {
    try {
        await connectDB();

        // Getting base programs and areas
        const ppho = await PacProgram.findOne({ codigo: 'PPHO' });
        const temp = await PacProgram.findOne({ codigo: 'TEMPERATURA' });
        const agua = await PacProgram.findOne({ codigo: 'AGUA' });
        const bea = await PacProgram.findOne({ codigo: 'BEA' });

        const areas = await ProductionArea.find();
        const abate = areas.find(a => a.nome.includes('Abate')) || areas[0];
        const desossa = areas.find(a => a.nome.includes('Desossa')) || areas[0];
        const recepcao = areas.find(a => a.nome.includes('Recepção')) || areas[0];

        const models = [
            {
                codigo: 'PPHO-PRE-01',
                titulo: 'PPHO Pré-Operacional (Higiene)',
                descricao: 'Verificação diária antes do início dos trabalhos',
                programa: ppho?._id,
                area: abate?._id,
                frequencia: 'Diária',
                itens: [
                    { ordem: 1, descricao: 'Higienização de facas e chairas', tipo_resposta: 'OK_NOK_NA', criticidade: 'Maior' },
                    { ordem: 2, descricao: 'Limpeza de esteiras e bancadas', tipo_resposta: 'OK_NOK_NA', criticidade: 'Crítico' },
                    { ordem: 3, descricao: 'Estruturação de pias e esterilizadores', tipo_resposta: 'OK_NOK_NA', criticidade: 'Menor' },
                    { ordem: 4, descricao: 'Ausência de resíduos orgânicos em equipamentos', tipo_resposta: 'OK_NOK_NA', criticidade: 'Crítico' }
                ],
                versao: 1,
                status: 'Ativo'
            },
            {
                codigo: 'TEMP-CAM-01',
                titulo: 'Monitoramento de Câmaras Frias',
                descricao: 'Controle sistemático de temperatura ambiente',
                programa: temp?._id,
                area: desossa?._id,
                frequencia: 'A cada 2 horas',
                itens: [
                    {
                        ordem: 1,
                        descricao: 'Temperatura Ambiente Câmara 01',
                        tipo_resposta: 'Numérico',
                        unidade_medida: '°C',
                        limite_minimo: -2,
                        limite_maximo: 4,
                        criticidade: 'Crítico'
                    },
                    {
                        ordem: 2,
                        descricao: 'Temperatura de Carcaça (Informativo)',
                        tipo_resposta: 'Numérico',
                        unidade_medida: '°C',
                        limite_maximo: 7,
                        criticidade: 'Maior'
                    }
                ],
                versao: 1,
                status: 'Ativo'
            },
            {
                codigo: 'AGUA-CL-01',
                titulo: 'Monitoramento de Cloro e pH',
                descricao: 'Verificação da potabilidade da água',
                programa: agua?._id,
                area: recepcao?._id,
                frequencia: '3x ao dia',
                itens: [
                    {
                        ordem: 1,
                        descricao: 'Cloro Residual Livre',
                        tipo_resposta: 'Numérico',
                        unidade_medida: 'ppm',
                        limite_minimo: 0.2,
                        limite_maximo: 2.0,
                        criticidade: 'Crítico'
                    },
                    {
                        ordem: 2,
                        descricao: 'pH da Água',
                        tipo_resposta: 'Numérico',
                        limite_minimo: 6.0,
                        limite_maximo: 9.0,
                        criticidade: 'Maior'
                    }
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

        console.log('🌱 Seed de Modelos de Checklist concluído!');
        process.exit(0);
    } catch (err) {
        console.error('Erro no seed:', err);
        process.exit(1);
    }
};

seedChecklists();
