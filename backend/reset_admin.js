import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function resetAdminPassword() {
    try {
        console.log('Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        const email = 'admin@gestao.com';
        const newPassword = 'admin123';

        // Gerar hash da senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const result = await usersCollection.updateOne(
            { email: email },
            { $set: { password: hashedPassword } }
        );

        if (result.matchedCount > 0) {
            console.log(`✅ Senha do usuário ${email} resetada para: ${newPassword}`);
        } else {
            console.log(`⚠️ Usuário ${email} não encontrado.`);
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

resetAdminPassword();
