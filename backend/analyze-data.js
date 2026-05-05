import dotenv from 'dotenv';
import mongoose from 'mongoose';
import SlaughterClosure from './src/models/SlaughterClosure.js';
import SlaughterPreSchedule from './src/models/SlaughterPreSchedule.js';
import SlaughterLot from './src/models/SlaughterLot.js';

dotenv.config();

try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    const closureDates = await SlaughterClosure.find({}, 'date lines').lean();
    const preScheduleDates = await SlaughterPreSchedule.find({}, 'date lots').lean();
    const oldLots = await SlaughterLot.find({}).lean();

    console.log(`📊 Total de Fechamentos (Closures): ${closureDates.length}`);
    const closuresWithLots = closureDates.filter(c => c.lines && c.lines.length > 0);
    console.log(`📊 Closures com lotes: ${closuresWithLots.length}`);

    console.log(`📊 Total de Pré-Escalas (PreSchedules): ${preScheduleDates.length}`);
    const preWithLots = preScheduleDates.filter(p => p.lots && p.lots.length > 0);
    const preEmpty = preScheduleDates.filter(p => !p.lots || p.lots.length === 0);
    console.log(`📊 Total de Lotes Antigos (SlaughterLot): ${oldLots.length}`);

    console.log('\n📅 Detalhes dos Fechamentos (Closures):');
    closureDates.forEach(c => {
        console.log(`${c.date.toISOString()}: ${c.lines.length} lotes`);
    });

    console.log('\n📅 Detalhes das Pré-Escalas (PreSchedules):');
    preScheduleDates.forEach(p => {
        console.log(`${p.date.toISOString()}: ${p.lots ? p.lots.length : 0} lotes`);
    });

    const preDateStrings = new Set(preWithLots.map(p => p.date.toISOString()));
    const missingDates = [];

    for (const closure of closuresWithLots) {
        if (!preDateStrings.has(closure.date.toISOString())) {
            missingDates.push(closure.date.toISOString().split('T')[0]);
        }
    }

    console.log(`⚠️ Datas com Fechamento mas SEM Pré-Escala (${missingDates.length}):`);
    if (missingDates.length > 0) {
        console.log(missingDates.join(', '));
    }

    await mongoose.disconnect();
    process.exit(0);
} catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
}
