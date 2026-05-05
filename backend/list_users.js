import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkUsers() {
    try {
        console.log('Conectando a:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado ao MongoDB');

        const db = mongoose.connection.db;
        const users = await db.collection('users').find({}).toArray();

        if (users.length === 0) {
            console.log('⚠️ Nenhum usuário encontrado no banco de dados.');
        } else {
            console.log(`✅ Encontrados ${users.length} usuários:`);
            users.forEach(user => {
                console.log(`- Nome: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
            });
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

checkUsers();
