import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkAttempts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'admin@gestao.com';
        const user = await User.findOne({ email }).select('+loginAttempts +lockUntil');
        
        if (user) {
            console.log('ATTEMPTS_VALUE:' + user.loginAttempts);
            console.log('LOCK_VALUE:' + (user.lockUntil ? user.lockUntil.toISOString() : 'NONE'));
        } else {
            console.log('NOT_FOUND');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error(error);
    }
}

checkAttempts();
