import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Opções removidas pois são padrão no Mongoose 6+
        });

        console.log(`✅ MongoDB conectado: ${conn.connection.host}`);

        // Event listeners
        mongoose.connection.on('error', (err) => {
            console.error('❌ Erro no MongoDB:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB desconectado');
        });

        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('🔌 MongoDB desconectado devido ao término da aplicação');
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error.message);
        process.exit(1);
    }
};

export default connectDB;
