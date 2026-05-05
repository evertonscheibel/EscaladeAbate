import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Ticket from './src/models/Ticket.js';

dotenv.config();

console.log('Connecting to MongoDB...');

try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');

    // Mimic the controller logic
    const period = 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - period);

    console.log('Date Range:', startDate, endDate);

    const dateMatch = {
        createdAt: {
            $gte: startDate,
            $lte: endDate
        }
    };

    console.log('Running aggregation...');

    // Step 1: Match
    const step1 = await Ticket.aggregate([{ $match: dateMatch }]);
    console.log(`Step 1 (Match): ${step1.length} tickets found.`);

    // Step 2: Group
    const step2 = await Ticket.aggregate([
        { $match: dateMatch },
        {
            $group: {
                _id: "$assignedTo",
                count: { $sum: 1 }
            }
        }
    ]);
    console.log('Step 2 (Group results):', step2);

    // Step 3: Lookup
    const step3 = await Ticket.aggregate([
        { $match: dateMatch },
        {
            $group: {
                _id: "$assignedTo",
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "agentInfo"
            }
        }
    ]);
    console.log('Step 3 (Lookup results):');
    step3.forEach(s => {
        console.log(`ID: ${s._id}, Count: ${s.count}, AgentInfo Length: ${s.agentInfo.length}`);
        if (s.agentInfo.length > 0) console.log(`   Agent Name: ${s.agentInfo[0].name}`);
    });

    // Full Pipeline
    const stats = await Ticket.aggregate([
        { $match: dateMatch },
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
                },
                avgFirstResponseTime: {
                    $avg: {
                        $cond: [
                            { $and: [{ $ne: ["$firstResponseAt", null] }, { $ne: ["$createdAt", null] }] },
                            { $subtract: ["$firstResponseAt", "$createdAt"] },
                            null
                        ]
                    }
                },
                slaBreachedTickets: {
                    $sum: {
                        $cond: [
                            {
                                $or: [
                                    { $and: [{ $eq: ["$priority", "critica"] }, { $gt: [{ $subtract: [{ $ifNull: ["$resolvedAt", new Date()] }, "$createdAt"] }, 14400000] }] },
                                    { $and: [{ $eq: ["$priority", "alta"] }, { $gt: [{ $subtract: [{ $ifNull: ["$resolvedAt", new Date()] }, "$createdAt"] }, 28800000] }] },
                                    { $and: [{ $eq: ["$priority", "media"] }, { $gt: [{ $subtract: [{ $ifNull: ["$resolvedAt", new Date()] }, "$createdAt"] }, 86400000] }] },
                                    { $and: [{ $eq: ["$priority", "baixa"] }, { $gt: [{ $subtract: [{ $ifNull: ["$resolvedAt", new Date()] }, "$createdAt"] }, 172800000] }] }
                                ]
                            },
                            1,
                            0
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
                slaBreachedTickets: 1,
                avgResolutionTimeHours: { $cond: [{ $eq: ["$avgResolutionTime", null] }, 0, { $divide: ["$avgResolutionTime", 3600000] }] },
                avgFirstResponseTimeHours: { $cond: [{ $eq: ["$avgFirstResponseTime", null] }, 0, { $divide: ["$avgFirstResponseTime", 3600000] }] }
            }
        },
        { $match: { name: { $exists: true } } }
    ]);

    console.log('Final Result Count:', stats.length);
    console.log('Final Result Data:', stats);

    await mongoose.disconnect();
} catch (error) {
    console.error('Error:', error);
}
