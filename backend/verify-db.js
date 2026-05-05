import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

console.log('Tentando conectar ao MongoDB...');
console.log('URI:', process.env.MONGODB_URI);

try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Banco de dados:', mongoose.connection.name);
    console.log('🖥️  Host:', mongoose.connection.host);
    await mongoose.disconnect();
    console.log('🔌 Desconectado com sucesso');
    process.exit(0);
} catch (error) {
    console.error('❌ Falha na conexão:', error.message);
    console.error('💡 Certifique-se de que o MongoDB está rodando localmente');
    process.exit(1);
}
