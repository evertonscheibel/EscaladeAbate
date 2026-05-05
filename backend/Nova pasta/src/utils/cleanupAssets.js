import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const clearDatabase = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gestao_ti';
        await mongoose.connect(mongoUri);
        console.log('✅ Conectado ao MongoDB');

        // Get access to collections directly via connection to avoid model issues if they aren't compiled
        const db = mongoose.connection.db;

        const collections = ['assets', 'assettimelines'];

        for (const collectionName of collections) {
            const collection = db.collection(collectionName);
            const result = await collection.deleteMany({});
            console.log(`🗑️ Deletados ${result.deletedCount} documentos da coleção "${collectionName}"`);
        }

        await mongoose.disconnect();
        console.log('✅ Desconectado do MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao limpar o banco de dados:', error);
        process.exit(1);
    }
};

clearDatabase();
