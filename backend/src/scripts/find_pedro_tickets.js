
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Importar modelos (definindo inline para evitar problemas de importação cruzada se necessário, mas importando os arquivos se possível é melhor. 
// Vamos definir schemas simplificados aqui para garantir que funcione standalone)

const userSchema = new mongoose.Schema({
    name: String,
    email: String
});

const ticketSchema = new mongoose.Schema({
    title: String,
    description: String,
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    contactEmail: String,
    contactName: String,
    createdAt: Date
});

const User = mongoose.model('User', userSchema);
const Ticket = mongoose.model('Ticket', ticketSchema);

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // 1. Find the NEW user
        const newPedro = await User.findOne({ email: 'pc.ti@frizelo.com' });
        if (!newPedro) {
            console.log('User "pc.ti@frizelo.com" not found!');
            process.exit(1);
        }
        console.log(`Found NEW User: ${newPedro.name} (ID: ${newPedro._id})`);

        // 2. Find tickets with contactEmail matching
        const emailTickets = await Ticket.find({ contactEmail: 'pc.ti@frizelo.com' });
        console.log(`Tickets with contactEmail="pc.ti@frizelo.com": ${emailTickets.length}`);

        // 3. Find tickets with orphan requesters
        // Get all unique requester IDs
        const tickets = await Ticket.find({ requester: { $ne: null } }).select('requester title createdAt');
        const requesterIds = [...new Set(tickets.map(t => t.requester.toString()))];

        console.log(`Total unique requester IDs in tickets: ${requesterIds.length}`);

        // Check which ones exist
        const existingUsers = await User.find({ _id: { $in: requesterIds } }).select('_id');
        const existingUserIds = new Set(existingUsers.map(u => u._id.toString()));

        const orphanIds = requesterIds.filter(id => !existingUserIds.has(id));
        console.log(`Found ${orphanIds.length} Orphan Requester IDs:`, orphanIds);

        for (const orphanId of orphanIds) {
            const orphanTickets = tickets.filter(t => t.requester.toString() === orphanId);
            console.log(`\nOrphan ID ${orphanId} has ${orphanTickets.length} tickets:`);
            orphanTickets.slice(0, 5).forEach(t => {
                console.log(` - [${t.createdAt.toISOString().split('T')[0]}] ${t.title}`);
            });
            if (orphanTickets.length > 5) console.log(`   ... and ${orphanTickets.length - 5} more.`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Done.');
    }
}

run();
