
import mongoose from 'mongoose';
import Ticket from './src/models/Ticket.js';

const createTicket = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/gestao_ti');

        // ID from previous log: FELIPE ALEXANDRE
        const userId = "6943d489cc8dc319cf0d7076";

        const ticket = await Ticket.create({
            title: "Ticket de Teste - Hoje",
            description: "Ticket criado para validar relatorio",
            priority: "alta",
            status: "resolvido",
            category: "hardware",
            requester: userId,
            assignedTo: [userId],
            resolvedAt: new Date(),
            createdAt: new Date()
        });

        console.log("Ticket created:", ticket._id);

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

createTicket();
