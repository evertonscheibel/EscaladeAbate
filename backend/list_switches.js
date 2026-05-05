import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Asset from './src/models/Asset.js';

dotenv.config();

const findSwitches = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB');

        const switches = await Asset.find({
            $or: [
                { description: { $regex: /switch/i } },
                { model: { $regex: /switch/i } },
                { brand: { $regex: /switch/i } },
                { type: 'rede' }
            ]
        });

        console.log(`Encontrados ${switches.length} ativos que podem ser switches:`);
        switches.forEach(s => {
            console.log(`- [${s.assetId}] ${s.description} | Marca: ${s.brand} | IP: ${s.ipAddress || 'N/A'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
};

findSwitches();
