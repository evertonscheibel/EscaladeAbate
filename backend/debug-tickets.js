import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Ticket from './src/models/Ticket.js';
import User from './src/models/User.js';

dotenv.config();

console.log('Connecting to MongoDB...');

try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');

    const ticketCount = await Ticket.countDocuments();
    console.log(`Total Tickets: ${ticketCount}`);

    const lastTickets = await Ticket.find().sort({ createdAt: -1 }).limit(5).populate('assignedTo');
    console.log('Last 5 Tickets:');
    lastTickets.forEach(t => {
        console.log(`ID: ${t._id}, Status: ${t.status}, AssignedTo: ${t.assignedTo ? t.assignedTo.name : 'Unassigned'} (${t.assignedTo ? t.assignedTo._id : 'null'}), CreatedAt: ${t.createdAt}`);
    });

    const userCount = await User.countDocuments();
    console.log(`Total Users: ${userCount}`);

    // Check for tickets with assignedTo that isn't null but might be invalid
    const ticketsWithAssignment = await Ticket.find({ assignedTo: { $ne: null } }).limit(5);
    console.log(`Tickets with assignment (sample): ${ticketsWithAssignment.length}`);
    ticketsWithAssignment.forEach(t => {
        console.log(`Ticket ${t._id} assigned to ${t.assignedTo}`);
    });

    await mongoose.disconnect();
} catch (error) {
    console.error('Error:', error);
}
