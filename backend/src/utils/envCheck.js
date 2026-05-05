/**
 * Validação de variáveis de ambiente obrigatórias.
 */
export const validateEnv = () => {
    const required = [
        'JWT_SECRET',
        'MONGODB_URI',
        'CREDENTIAL_ENCRYPTION_KEY'
    ];

    const missing = required.filter(k => !process.env[k]);

    if (missing.length) {
        console.error('❌ Variáveis de ambiente obrigatórias ausentes:', missing.join(', '));
        console.error('   Verifique o arquivo .env na raiz do backend.');
        process.exit(1);
    }

    // Validar tamanho mínimo da chave de criptografia
    const encKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
    if (encKey && encKey.length < 32) {
        console.error('❌ CREDENTIAL_ENCRYPTION_KEY deve ter pelo menos 32 caracteres.');
        console.error(`   Tamanho atual: ${encKey.length}`);
        process.exit(1);
    }

    console.log('✅ Variáveis de ambiente validadas com sucesso.');
};
