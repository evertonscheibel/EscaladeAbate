/**
 * Script de Importação em Massa - Frizelo TI
 * 
 * Este script importa os dados processados da planilha de ativos
 * Pode ser executado via: node scripts/importar_dados.js
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar models (ajuste o caminho conforme sua estrutura)
import Asset from '../models/Asset.js';
import NetworkDevice from '../models/NetworkDevice.js';

// Configuração do MongoDB (ajuste conforme seu .env)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gestao_ti';

async function conectarBanco() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB');
    } catch (error) {
        console.error('❌ Erro ao conectar:', error);
        process.exit(1);
    }
}

async function importarAtivos() {
    console.log('\n📦 Importando Ativos...\n');
    
    const arquivoJson = path.join(__dirname, '../data/ativos_importacao.json');
    
    if (!fs.existsSync(arquivoJson)) {
        console.log('⚠️  Arquivo ativos_importacao.json não encontrado em /data');
        console.log('   Coloque o arquivo na pasta data/ e execute novamente');
        return { success: 0, errors: 0 };
    }
    
    const dados = JSON.parse(fs.readFileSync(arquivoJson, 'utf-8'));
    
    let success = 0;
    let errors = 0;
    
    for (const item of dados) {
        try {
            // Verificar se já existe pelo assetId
            const existe = await Asset.findOne({ assetId: item.assetId });
            
            if (existe) {
                console.log(`⏭️  Pulando ${item.assetId} - já existe`);
                continue;
            }
            
            // Mapear dados
            const novoAtivo = {
                assetId: item.assetId,
                description: item.description,
                type: item.type,
                brand: item.brand || undefined,
                model: item.model || undefined,
                serialNumber: item.serialNumber || undefined,
                location: item.location,
                department: item.department || item.location,
                status: item.status || 'ativo',
                ipAddress: item.ipAddress || undefined
            };
            
            await Asset.create(novoAtivo);
            console.log(`✅ Importado: ${item.assetId} - ${item.description}`);
            success++;
            
        } catch (error) {
            console.log(`❌ Erro em ${item.assetId}: ${error.message}`);
            errors++;
        }
    }
    
    return { success, errors };
}

async function importarDispositivosRede() {
    console.log('\n🌐 Importando Dispositivos de Rede...\n');
    
    const arquivoJson = path.join(__dirname, '../data/dispositivos_rede_importacao.json');
    
    if (!fs.existsSync(arquivoJson)) {
        console.log('⚠️  Arquivo dispositivos_rede_importacao.json não encontrado em /data');
        console.log('   Coloque o arquivo na pasta data/ e execute novamente');
        return { success: 0, errors: 0 };
    }
    
    const dados = JSON.parse(fs.readFileSync(arquivoJson, 'utf-8'));
    
    let success = 0;
    let errors = 0;
    
    for (const item of dados) {
        try {
            // Verificar se já existe pelo IP
            const existe = await NetworkDevice.findOne({ ipAddress: item.ipAddress });
            
            if (existe) {
                console.log(`⏭️  Pulando ${item.ipAddress} - já existe`);
                continue;
            }
            
            // Mapear dados
            const novoDispositivo = {
                name: item.name,
                type: item.type,
                ipAddress: item.ipAddress,
                brand: item.brand || undefined,
                model: item.model || undefined,
                serialNumber: item.serialNumber || undefined,
                location: item.location,
                status: item.status || 'online',
                managedBy: item.managedBy || 'manual'
            };
            
            // Adicionar totalPorts para switches
            if (item.type === 'switch') {
                // Tentar extrair número de portas do modelo
                const match = item.model?.match(/(\d+)/);
                if (match) {
                    novoDispositivo.totalPorts = parseInt(match[1]);
                }
            }
            
            await NetworkDevice.create(novoDispositivo);
            console.log(`✅ Importado: ${item.ipAddress} - ${item.name}`);
            success++;
            
        } catch (error) {
            console.log(`❌ Erro em ${item.ipAddress}: ${error.message}`);
            errors++;
        }
    }
    
    return { success, errors };
}

async function main() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   IMPORTAÇÃO DE DADOS - FRIZELO TI         ║');
    console.log('╚════════════════════════════════════════════╝');
    
    await conectarBanco();
    
    // Importar ativos
    const resultAtivos = await importarAtivos();
    
    // Importar dispositivos de rede
    const resultRede = await importarDispositivosRede();
    
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║             RESUMO DA IMPORTAÇÃO           ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║  Ativos importados:    ${String(resultAtivos.success).padStart(4)} ✅              ║`);
    console.log(`║  Ativos com erro:      ${String(resultAtivos.errors).padStart(4)} ❌              ║`);
    console.log(`║  Dispositivos rede:    ${String(resultRede.success).padStart(4)} ✅              ║`);
    console.log(`║  Dispositivos erro:    ${String(resultRede.errors).padStart(4)} ❌              ║`);
    console.log('╚════════════════════════════════════════════╝');
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado do MongoDB');
    process.exit(0);
}

main().catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
});
