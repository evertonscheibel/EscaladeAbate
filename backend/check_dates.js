import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const SlaughterPreScheduleSchema = new mongoose.Schema({}, { strict: false });
const SlaughterScheduleSchema = new mongoose.Schema({}, { strict: false });

const SlaughterPreSchedule = mongoose.model('SlaughterPreSchedule', SlaughterPreScheduleSchema, 'slaughterpreschedules');
const SlaughterSchedule = mongoose.model('SlaughterSchedule', SlaughterScheduleSchema, 'slaughterschedules');

async function checkDate(dateStr) {
    const date = new Date(dateStr);
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);

    console.log(`\n--- Checking date: ${dateStr} ---`);

    const preSchedules = await SlaughterPreSchedule.find({
        date: { $gte: start, $lte: end }
    });
    console.log(`PreSchedules found: ${preSchedules.length}`);
    preSchedules.forEach(s => {
        console.log(`  - ID: ${s._id}, Date: ${s.date.toISOString()}, Status: ${s.status}, Lots: ${s.lots ? s.lots.length : 0}`);
    });

    const schedules = await SlaughterSchedule.find({
        slaughterDate: { $gte: start, $lte: end }
    });
    console.log(`Schedules found: ${schedules.length}`);
    schedules.forEach(s => {
        console.log(`  - ID: ${s._id}, Date: ${s.slaughterDate.toISOString()}, Status: ${s.status}`);
    });
}

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        await checkDate('2026-02-17T00:00:00Z');
        await checkDate('2026-02-19T00:00:00Z');
        await checkDate('2026-02-20T00:00:00Z');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

run();
