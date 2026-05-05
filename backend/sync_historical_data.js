import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Define Schemas to match models
const SlaughterPreScheduleSchema = new mongoose.Schema({
    date: Date,
    startTime: String,
    rateHeadsPerHour: Number,
    status: String,
    lots: Array,
    breakfastTime: String,
    breakfastDuration: Number,
    lunchTime: String,
    lunchDuration: Number,
    createdBy: mongoose.Schema.Types.ObjectId
}, { strict: false });

const SlaughterScheduleSchema = new mongoose.Schema({
    slaughterDate: Date,
    startTime: String,
    rateHeadsPerHour: Number,
    status: String,
    totalBoi: Number,
    totalVaca: Number,
    totalNovilha: Number,
    totalBubalino: Number,
    totalTouro: Number,
    totalCattle: Number,
    breakfastTime: String,
    breakfastDuration: Number,
    lunchTime: String,
    lunchDuration: Number,
    createdBy: mongoose.Schema.Types.ObjectId,
    closedBy: mongoose.Schema.Types.ObjectId,
    closedAt: Date
}, { strict: false });

const SlaughterLotSchema = new mongoose.Schema({
    schedule: mongoose.Schema.Types.ObjectId,
    lotNumber: Number,
    rancherName: String,
    brokerNumber: String,
    boi: Number,
    vaca: Number,
    novilha: Number,
    bubalino: Number,
    touro: Number,
    total: Number,
    startTime: String,
    durationMinutes: Number,
    endTime: String,
    order: Number
}, { strict: false });

const SlaughterPreSchedule = mongoose.model('SlaughterPreSchedule', SlaughterPreScheduleSchema, 'slaughterpreschedules');
const SlaughterSchedule = mongoose.model('SlaughterSchedule', SlaughterScheduleSchema, 'slaughterschedules');
const SlaughterLot = mongoose.model('SlaughterLot', SlaughterLotSchema, 'slaughterlots');

function formatMinutes(mins) {
    const h = Math.floor(mins / 60) % 24;
    const m = Math.round(mins % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

async function syncToSlaughterSchedule(preSchedule) {
    const normalizedDate = new Date(preSchedule.date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    let schedule = await SlaughterSchedule.findOne({ slaughterDate: normalizedDate });

    if (!schedule) {
        schedule = new SlaughterSchedule({
            slaughterDate: normalizedDate,
            startTime: preSchedule.startTime || '07:00',
            rateHeadsPerHour: preSchedule.rateHeadsPerHour || 100,
            status: preSchedule.status === 'ENVIADA' ? 'CLOSED' : 'DRAFT',
            breakfastTime: preSchedule.breakfastTime,
            breakfastDuration: preSchedule.breakfastDuration,
            lunchTime: preSchedule.lunchTime,
            lunchDuration: preSchedule.lunchDuration,
            createdBy: preSchedule.createdBy
        });
    } else {
        // Only update if it's currently DRAFT in SlaughterSchedule or if it's already correlated
        schedule.startTime = preSchedule.startTime || '07:00';
        schedule.rateHeadsPerHour = preSchedule.rateHeadsPerHour || 100;
        schedule.status = preSchedule.status === 'ENVIADA' ? 'CLOSED' : 'DRAFT';
        schedule.breakfastTime = preSchedule.breakfastTime;
        schedule.breakfastDuration = preSchedule.breakfastDuration;
        schedule.lunchTime = preSchedule.lunchTime;
        schedule.lunchDuration = preSchedule.lunchDuration;
    }

    await schedule.save();

    // Sync lots
    await SlaughterLot.deleteMany({ schedule: schedule._id });

    const rate = schedule.rateHeadsPerHour || 100;
    const [startHours, startMins] = (schedule.startTime || '07:00').split(':').map(Number);
    let currentTotalMinutes = startHours * 60 + startMins;

    const breakfastStart = schedule.breakfastTime ? schedule.breakfastTime.split(':').map(Number) : [8, 0];
    const breakfastStartMins = breakfastStart[0] * 60 + breakfastStart[1];
    const breakfastDur = schedule.breakfastDuration || 15;

    const lunchStart = schedule.lunchTime ? schedule.lunchTime.split(':').map(Number) : [11, 0];
    const lunchStartMins = lunchStart[0] * 60 + lunchStart[1];
    const lunchDur = schedule.lunchDuration || 70;

    let appliedBreakfast = false;
    let appliedLunch = false;

    const newLots = (preSchedule.lots || []).map((lot, idx) => {
        if (!appliedBreakfast && currentTotalMinutes >= breakfastStartMins) {
            currentTotalMinutes += breakfastDur;
            appliedBreakfast = true;
        }
        if (!appliedLunch && currentTotalMinutes >= lunchStartMins) {
            currentTotalMinutes += lunchDur;
            appliedLunch = true;
        }

        const lotStartTime = formatMinutes(currentTotalMinutes);
        const durationMinutes = (lot.total / rate) * 60;
        currentTotalMinutes += durationMinutes;

        if (!appliedBreakfast && currentTotalMinutes > breakfastStartMins) {
            currentTotalMinutes += breakfastDur;
            appliedBreakfast = true;
        }
        if (!appliedLunch && currentTotalMinutes > lunchStartMins) {
            currentTotalMinutes += lunchDur;
            appliedLunch = true;
        }

        const lotEndTime = formatMinutes(currentTotalMinutes);

        return {
            schedule: schedule._id,
            lotNumber: idx + 1,
            rancherName: lot.producerName,
            brokerNumber: lot.brokerCode || '-',
            boi: lot.boi || 0,
            vaca: lot.vaca || 0,
            novilha: lot.novilha || 0,
            bubalino: lot.bubalino || 0,
            touro: lot.touro || 0,
            total: lot.total,
            startTime: lotStartTime,
            durationMinutes: Math.round(durationMinutes),
            endTime: lotEndTime,
            order: idx + 1
        };
    });

    if (newLots.length > 0) {
        await SlaughterLot.insertMany(newLots);
    }

    const totals = newLots.reduce((acc, lot) => ({
        boi: acc.boi + (lot.boi || 0),
        vaca: acc.vaca + (lot.vaca || 0),
        novilha: acc.novilha + (lot.novilha || 0),
        bubalino: acc.bubalino + (lot.bubalino || 0),
        touro: acc.touro + (lot.touro || 0),
        total: acc.total + (lot.total || 0)
    }), { boi: 0, vaca: 0, novilha: 0, bubalino: 0, touro: 0, total: 0 });

    schedule.totalBoi = totals.boi;
    schedule.totalVaca = totals.vaca;
    schedule.totalNovilha = totals.novilha;
    schedule.totalBubalino = totals.bubalino;
    schedule.totalTouro = totals.touro;
    schedule.totalCattle = totals.total;

    if (schedule.status === 'CLOSED') {
        schedule.closedBy = preSchedule.createdBy;
        schedule.closedAt = new Date();
    } else {
        schedule.closedBy = null;
        schedule.closedAt = null;
    }

    await schedule.save();
    console.log(`Synced: ${preSchedule.date.toISOString().split('T')[0]} - Status: ${schedule.status}`);
}

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const preSchedules = await SlaughterPreSchedule.find({
            status: { $in: ['ENVIADA', 'PUBLISHED'] }
        });

        console.log(`Found ${preSchedules.length} closed/published pre-schedules to sync.`);

        for (const ps of preSchedules) {
            await syncToSlaughterSchedule(ps);
        }

        console.log('Sync completed successfully.');

    } catch (err) {
        console.error('Error during sync:', err);
    } finally {
        await mongoose.connection.close();
    }
}

run();
