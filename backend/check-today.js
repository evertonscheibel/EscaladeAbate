import dotenv from 'dotenv';
import mongoose from 'mongoose';
import SlaughterPreSchedule from './src/models/SlaughterPreSchedule.js';

dotenv.config();

try {
    await mongoose.connect(process.env.MONGODB_URI);
    const date = new Date('2026-02-19');
    date.setUTCHours(0, 0, 0, 0);

    const schedule = await SlaughterPreSchedule.findOne({ date });
    if (schedule) {
        console.log('✅ Escala encontrada para 2026-02-19:');
        console.log(`   - Status: ${schedule.status}`);
        console.log(`   - Lotes: ${schedule.lots.length}`);
        console.log(`   - Total Cabeças: ${schedule.totalCattle}`);
        console.log(JSON.stringify(schedule.lots, null, 2));
    } else {
        console.log('❌ Escala NÃO encontrada para 2026-02-19');
    }
    await mongoose.disconnect();
} catch (err) {
    console.error(err);
}
