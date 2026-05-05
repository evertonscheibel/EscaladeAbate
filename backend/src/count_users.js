import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import connectDB from './config/database.js';

dotenv.config();

const countUsers = async () => {
    try {
        await connectDB();
        const count = await User.countDocuments();
        console.log(`TOTAL_USERS:${count}`);

        const techsCount = await User.countDocuments({
            role: { $in: ['tecnico', 'admin'] }
        });
        console.log(`TECHS_COUNT:${techsCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Erro ao contar usuários:', error);
        process.exit(1);
    }
};

countUsers();
