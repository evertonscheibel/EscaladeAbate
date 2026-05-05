import dotenv from 'dotenv';
import mongoose from 'mongoose';
import SlaughterClosure from './src/models/SlaughterClosure.js';
import SlaughterPreSchedule from './src/models/SlaughterPreSchedule.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

function normalizeDate(date) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // 1. Normalizar datas de todos os Fechamentos
    const closures = await SlaughterClosure.find({});
    console.log(`🔍 Processando ${closures.length} fechamentos...`);
    for (const closure of closures) {
        const normalized = normalizeDate(closure.date);
        if (closure.date.getTime() !== normalized.getTime()) {
            console.log(`   - Normalizando data do fechamento: ${closure.date.toISOString()} -> ${normalized.toISOString()}`);
            await SlaughterClosure.updateOne({ _id: closure._id }, { date: normalized });
        }
    }

    // 2. Normalizar datas das Pré-Escalas e resolver duplicatas
    const preSchedules = await SlaughterPreSchedule.find({}).sort({ updatedAt: -1 });
    console.log(`🔍 Processando ${preSchedules.length} pré-escalas...`);

    const processedDates = new Set();
    for (const pre of preSchedules) {
        const normalized = normalizeDate(pre.date);
        const dateStr = normalized.toISOString();

        if (processedDates.has(dateStr)) {
            console.log(`   - Removendo pré-escala duplicada (já temos uma p/ este dia): ${pre.date.toISOString()} (ID: ${pre._id})`);
            await SlaughterPreSchedule.deleteOne({ _id: pre._id });
            continue;
        }

        if (pre.date.getTime() !== normalized.getTime()) {
            // Se normalizar esta data gerar um conflito com uma já existente na base (mas ainda não processada no loop)
            // temos que verificar se o destino já existe
            const conflict = await SlaughterPreSchedule.findOne({ date: normalized });
            if (conflict && conflict._id.toString() !== pre._id.toString()) {
                console.log(`   - Conflito detectado ao normalizar ${pre.date.toISOString()} -> ${normalized.toISOString()}. Removendo duplicata.`);
                // Se a duplicata tem lotes e a atual não, poderíamos migrar, mas para simplificar e restaurar do closure depois:
                await SlaughterPreSchedule.deleteOne({ _id: pre._id });
                continue;
            }

            console.log(`   - Normalizando data da pré-escala: ${pre.date.toISOString()} -> ${normalized.toISOString()}`);
            await SlaughterPreSchedule.updateOne({ _id: pre._id }, { date: normalized });
        }
        processedDates.add(dateStr);
    }

    // 3. Restaurar Pré-Escalas a partir de Fechamentos SIF onde não houver pré-escala/estiver vazia
    const finalPreSchedules = await SlaughterPreSchedule.find({});
    const preMap = new Map(finalPreSchedules.map(p => [normalizeDate(p.date).toISOString(), p]));

    const finalClosures = await SlaughterClosure.find({});

    for (const closure of finalClosures) {
        const dateStr = normalizeDate(closure.date).toISOString();
        const pre = preMap.get(dateStr);

        if (!pre || !pre.lots || pre.lots.length === 0) {
            console.log(`🚀 Restaurando pré-escala para data ${dateStr} a partir do Fechamento SIF...`);

            const lots = closure.lines.map(line => ({
                preLotRefId: line.preLotRefId || uuidv4(),
                producerName: line.producerName,
                municipio: line.municipio,
                uf: line.uf,
                brokerCode: line.brokerCode,
                brokerName: line.brokerName,
                boi: line.boi,
                vaca: line.vaca,
                novilha: line.novilha,
                bubalino: line.bubalino,
                touro: line.touro,
                total: line.total
            }));

            if (pre) {
                await SlaughterPreSchedule.updateOne({ _id: pre._id }, {
                    lots,
                    status: 'PUBLISHED', // Se tem fechamento, a escala deve estar publicada
                    updatedBy: closure.createdBy
                });
            } else {
                await SlaughterPreSchedule.create({
                    date: normalizeDate(closure.date),
                    lots,
                    status: 'PUBLISHED',
                    createdBy: closure.createdBy,
                    startTime: '07:00'
                });
            }
        }
    }

    console.log('✅ Restauração concluída com sucesso!');
    await mongoose.disconnect();
    process.exit(0);
} catch (error) {
    console.error('❌ Erro durante a restauração:', error);
    process.exit(1);
}
