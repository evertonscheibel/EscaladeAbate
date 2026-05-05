
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ticket from './src/models/Ticket.js';
import User from './src/models/User.js';

dotenv.config({ path: 'c:\\Projetos\\AntgravityProjeto\\backend\\.env' });

const checkDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/gestao_ti');
        console.log('Connected to DB');

        const count = await Ticket.countDocuments();
        console.log(`Total Tickets: ${count}`);

        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        const recentCount = await Ticket.countDocuments({ createdAt: { $gte: last7Days } });
        console.log(`Tickets in last 7 days: ${recentCount}`);

        const tickets = await Ticket.find().limit(5).populate('assignedTo');
        console.log('Sample Tickets assignedTo structure:');
        tickets.forEach(t => {
            console.log(`ID: ${t._id}, Status: ${t.status}, CreatedAt: ${t.createdAt}, AssignedTo:`, JSON.stringify(t.assignedTo));
        });

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

checkDB();
