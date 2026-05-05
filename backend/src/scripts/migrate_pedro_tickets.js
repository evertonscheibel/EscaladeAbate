
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const OLD_ID = '694530cf8793d3eb8bc893ee';
const NEW_ID = '698b47454f152c13e509102c';

// Schemas simplificados
const ticketSchema = new mongoose.Schema({
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Ticket = mongoose.model('Ticket', ticketSchema);

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        console.log(`Migrating tickets from OLD_ID (${OLD_ID}) to NEW_ID (${NEW_ID})...`);

        // 1. Update Requester
        const updateRequesterResult = await Ticket.updateMany(
            { requester: OLD_ID },
            { $set: { requester: NEW_ID } }
        );
        console.log(`Updated Requester field: ${updateRequesterResult.modifiedCount} tickets.`);

        // 2. Update AssignedBy
        const updateAssignedByResult = await Ticket.updateMany(
            { assignedBy: OLD_ID },
            { $set: { assignedBy: NEW_ID } }
        );
        console.log(`Updated AssignedBy field: ${updateAssignedByResult.modifiedCount} tickets.`);

        // 3. Update AssignedTo (Array)
        // This is trickier. We need to find tickets where assignedTo contains OLD_ID, pull OLD_ID and push NEW_ID.
        // Or simpler: use positional operator if we just want to replace.
        // Actually, $set with array filters might be complex.
        // Let's find first.
        const ticketsAssigned = await Ticket.find({ assignedTo: OLD_ID });
        console.log(`Found ${ticketsAssigned.length} tickets assigned to OLD_ID.`);

        let assignedCount = 0;
        for (const ticket of ticketsAssigned) {
            // Replace OLD_ID with NEW_ID in the array
            const newAssignedTo = ticket.assignedTo.map(id => id.toString() === OLD_ID ? NEW_ID : id);
            // Remove duplicates just in case
            ticket.assignedTo = [...new Set(newAssignedTo)];
            await ticket.save();
            assignedCount++;
        }
        console.log(`Updated AssignedTo field: ${assignedCount} tickets.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Done.');
    }
}

run();
