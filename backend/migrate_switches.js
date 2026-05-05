import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Asset from './src/models/Asset.js';
import NetworkDevice from './src/models/NetworkDevice.js';

dotenv.config();

const migrateSwitches = async () => {
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

        console.log(`Iniciando migração de ${switches.length} switches...`);

        for (const asset of switches) {
            // Verificar se já existe um dispositivo de rede vinculado a este ativo
            const existing = await NetworkDevice.findOne({ asset: asset._id });
            if (existing) {
                console.log(`- [Ignorado] ${asset.assetId} já migrado.`);
                continue;
            }

            // Tentar extrair IP se o assetId for um IP
            let ip = asset.ipAddress;
            if (!ip && asset.assetId.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
                ip = asset.assetId;
            }
            if (!ip) ip = '0.0.0.0';

            const deviceData = {
                name: asset.description,
                hostname: asset.hostname || asset.assetId,
                type: 'switch',
                ipAddress: ip,
                macAddress: asset.macAddress || '',
                brand: asset.brand || '',
                model: asset.model || '',
                serialNumber: asset.serialNumber || '',
                location: asset.location || 'TI Central',
                purchaseDate: asset.purchaseDate,
                warrantyExpiration: asset.warrantyExpiration,
                asset: asset._id,
                status: 'online',
                totalPorts: 0 // Será preenchido manualmente depois
            };

            await NetworkDevice.create(deviceData);

            // Marcar o ativo original como dispositivo de rede
            asset.isNetworkDevice = true;
            await asset.save();

            console.log(`- [MIGRADOR] ${asset.assetId} -> ${deviceData.name} (${ip})`);
        }

        console.log('Migração concluída com sucesso');
        process.exit(0);
    } catch (error) {
        console.error('Erro na migração:', error);
        process.exit(1);
    }
};

migrateSwitches();
