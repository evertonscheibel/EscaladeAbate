import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PcpMotivoParada from '../models/PcpMotivoParada.js';
import PcpParametroCusto from '../models/PcpParametroCusto.js';

dotenv.config();

const seedPcpMetadata = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB para seeding PCP...');

        // 1. Motivos de Parada
        const motivos = [
            { nome: 'Manutenção Preventiva', categoria: 'MANUTENCAO', improdutivo: true },
            { nome: 'Quebra de Equipamento', categoria: 'MANUTENCAO', improdutivo: true },
            { nome: 'Ajuste de Máquina / Setup', categoria: 'SETUP', improdutivo: false },
            { nome: 'Limpeza Operacional', categoria: 'LIMPEZA', improdutivo: true },
            { nome: 'Falta de Matéria-Prima', categoria: 'MP', improdutivo: true },
            { nome: 'Aguardando Logística', categoria: 'LOGISTICA', improdutivo: true },
            { nome: 'Troca de Equipe', categoria: 'PESSOAS', improdutivo: false },
            { nome: 'Inspeção de Qualidade', categoria: 'QUALIDADE', improdutivo: true },
            { nome: 'Reunião / DDS', categoria: 'PESSOAS', improdutivo: false }
        ];

        for (const m of motivos) {
            await PcpMotivoParada.updateOne({ nome: m.nome }, { $set: m }, { upsert: true });
        }
        console.log('Motivos de parada semeados.');

        // 2. Parâmetros de Custo (Vigência 2026)
        const custoPadrao = {
            vigenciaInicio: new Date('2026-01-01'),
            vigenciaFim: new Date('2026-12-31'),
            custoMaoDeObraHora: 450.00, // R$/h para a linha toda
            custoOverheadHora: 120.00,   // Energia, etc
            custoEmbalagemPorPeca: 0.85,
            custoInsumosPorKg: 0.15,
            custoParadaHora: 200.00,
            incluirTempoParadoNoCusto: true
        };

        await PcpParametroCusto.updateOne(
            { vigenciaInicio: custoPadrao.vigenciaInicio },
            { $set: custoPadrao },
            { upsert: true }
        );
        console.log('Parâmetros de custo semeados.');

        await mongoose.disconnect();
        console.log('Processo concluído.');
    } catch (error) {
        console.error('Erro no seed PCP:', error);
        process.exit(1);
    }
};

seedPcpMetadata();
