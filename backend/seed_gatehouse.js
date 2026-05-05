import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Modelos
import Gatehouse from './src/models/Gatehouse.js';
import AccessType from './src/models/AccessType.js';
import AccessReason from './src/models/AccessReason.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const seedGatehouse = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gestao_ti');
        console.log('📦 Conectado ao MongoDB para seeding de Guaritas...');

        // 1. Guaritas
        const guaritasCount = await Gatehouse.countDocuments();
        if (guaritasCount === 0) {
            await Gatehouse.insertMany([
                { nome: 'Guarita Principal', localizacao: 'Portaria Sul' },
                { nome: 'Guarita Secundária', localizacao: 'Portaria Norte' }
            ]);
            console.log('✅ Guaritas pré-cadastradas');
        }

        // 2. Tipos de Acesso
        const typesCount = await AccessType.countDocuments();
        if (typesCount === 0) {
            const types = await AccessType.insertMany([
                { nome: 'Fornecedor', cor: '#3B82F6', icone: 'Truck', ordem: 1 },
                { nome: 'Cliente', cor: '#10B981', icone: 'Users', ordem: 2 },
                { nome: 'Prestador', cor: '#F59E0B', icone: 'Wrench', ordem: 3 },
                { nome: 'Frota Própria', cor: '#8B5CF6', icone: 'Car', ordem: 4 },
                { nome: 'Visitante', cor: '#EC4899', icone: 'UserCheck', ordem: 5 },
                { nome: 'Coleta', cor: '#14B8A6', icone: 'PackageCheck', ordem: 6 },
                { nome: 'Entrega', cor: '#EF4444', icone: 'PackagePlus', ordem: 7 }
            ]);
            console.log('✅ Tipos de acesso pré-cadastrados');

            // 3. Motivos (vinculados aos tipos recém-criados)
            const fornecedorType = types.find(t => t.nome === 'Fornecedor');
            const clienteType = types.find(t => t.nome === 'Cliente');
            const prestadorType = types.find(t => t.nome === 'Prestador');

            if (fornecedorType) {
                await AccessReason.insertMany([
                    { tipo_acesso_id: fornecedorType._id, nome: 'Descarga de matéria-prima', ordem: 1 },
                    { tipo_acesso_id: fornecedorType._id, nome: 'Descarga de embalagens', ordem: 2 },
                    { tipo_acesso_id: fornecedorType._id, nome: 'Descarga de insumos', ordem: 3 },
                    { tipo_acesso_id: fornecedorType._id, nome: 'Manutenção preventiva', ordem: 4 },
                    { tipo_acesso_id: fornecedorType._id, nome: 'Manutenção corretiva', ordem: 5 }
                ]);
            }

            if (clienteType) {
                await AccessReason.insertMany([
                    { tipo_acesso_id: clienteType._id, nome: 'Carregamento de produtos', ordem: 1 },
                    { tipo_acesso_id: clienteType._id, nome: 'Visita técnica', ordem: 2 },
                    { tipo_acesso_id: clienteType._id, nome: 'Auditoria', ordem: 3 },
                    { tipo_acesso_id: clienteType._id, nome: 'Reunião comercial', ordem: 4 }
                ]);
            }

            if (prestadorType) {
                await AccessReason.insertMany([
                    { tipo_acesso_id: prestadorType._id, nome: 'Limpeza', ordem: 1 },
                    { tipo_acesso_id: prestadorType._id, nome: 'Segurança', ordem: 2 },
                    { tipo_acesso_id: prestadorType._id, nome: 'Manutenção', ordem: 3 },
                    { tipo_acesso_id: prestadorType._id, nome: 'Transporte', ordem: 4 },
                    { tipo_acesso_id: prestadorType._id, nome: 'Consultoria', ordem: 5 }
                ]);
            }
            console.log('✅ Motivos de acesso pré-cadastrados');
        }

        console.log('🎉 Seeding concluído com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro no seeding:', error);
        process.exit(1);
    }
};

seedGatehouse();
