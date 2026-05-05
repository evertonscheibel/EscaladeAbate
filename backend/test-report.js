import mongoose from 'mongoose';
import Ticket from './src/models/Ticket.js';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAgentReport() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Gestaoti');
        console.log('Filtro: Vazio (Todos os tickets)');

        const stats = await Ticket.aggregate([
            {
                $group: {
                    _id: "$assignedTo",
                    totalTickets: { $sum: 1 },
                    resolvedTickets: {
                        $sum: { $cond: [{ $in: ["$status", ["resolvido", "fechado"]] }, 1, 0] }
                    },
                    openTickets: {
                        $sum: { $cond: [{ $in: ["$status", ["aberto", "em_andamento", "pendente_cliente", "pendente_interno"]] }, 1, 0] }
                    },
                    avgResolutionTime: {
                        $avg: {
                            $cond: [
                                { $and: [{ $ne: ["$resolvedAt", null] }, { $ne: ["$createdAt", null] }] },
                                { $subtract: ["$resolvedAt", "$createdAt"] },
                                null
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "agentInfo"
                }
            },
            {
                $project: {
                    name: { $arrayElemAt: ["$agentInfo.name", 0] },
                    email: { $arrayElemAt: ["$agentInfo.email", 0] },
                    totalTickets: 1,
                    resolvedTickets: 1,
                    openTickets: 1,
                    avgResolutionTimeHours: { $divide: ["$avgResolutionTime", 3600000] }
                }
            },
            { $match: { name: { $exists: true } } }
        ]);

        console.log('Resultado do Relatório:', JSON.stringify(stats, null, 2));

        if (stats.length === 0) {
            console.log('AVISO: Relatório retornou vazio.');
            const totalTickets = await Ticket.countDocuments();
            const ticketsWithAssignee = await Ticket.countDocuments({ assignedTo: { $ne: null } });
            console.log('Total tickets:', totalTickets);
            console.log('Tickets com atendente:', ticketsWithAssignee);
        }

        process.exit(0);
    } catch (error) {
        console.error('Erro no teste:', error);
        process.exit(1);
    }
}

testAgentReport();
