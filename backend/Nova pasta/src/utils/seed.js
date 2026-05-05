import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import Asset from '../models/Asset.js';
import Certificate from '../models/Certificate.js';
import KnowledgeBase from '../models/KnowledgeBase.js';
import Boleto from '../models/Boleto.js';

dotenv.config();

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado ao MongoDB');

        // Limpar banco de dados
        await User.deleteMany();
        await Ticket.deleteMany();
        await Asset.deleteMany();
        await Certificate.deleteMany();
        await KnowledgeBase.deleteMany();
        await Boleto.deleteMany();
        console.log('🗑️  Banco de dados limpo');

        // Criar usuários
        const admin = await User.create({
            name: 'Administrador',
            email: 'admin@gestao.com',
            password: 'admin123',
            role: 'admin'
        });

        const tecnico = await User.create({
            name: 'João Silva',
            email: 'joao@gestao.com',
            password: 'tecnico123',
            role: 'tecnico'
        });

        const cliente = await User.create({
            name: 'Maria Santos',
            email: 'maria@cliente.com',
            password: 'cliente123',
            role: 'cliente'
        });

        console.log('👥 Usuários criados');

        // Criar ativos
        const assets = await Asset.create([
            {
                assetId: 'NB-001',
                description: 'Notebook Dell Latitude 5420',
                location: 'TI - Sala 101',
                acquisitionDate: new Date('2023-01-15'),
                status: 'ativo',
                responsible: tecnico._id
            },
            {
                assetId: 'SRV-001',
                description: 'Servidor Dell PowerEdge R740',
                location: 'Data Center',
                acquisitionDate: new Date('2022-06-10'),
                status: 'ativo',
                responsible: admin._id
            },
            {
                assetId: 'SW-001',
                description: 'Switch Cisco 48 portas',
                location: 'Data Center - Rack 3',
                acquisitionDate: new Date('2022-08-20'),
                status: 'ativo'
            }
        ]);

        console.log('💻 Ativos criados');

        // Criar tickets
        await Ticket.create([
            {
                title: 'Computador não liga',
                description: 'O computador da sala 205 não está ligando. Já tentei verificar os cabos.',
                category: 'hardware',
                priority: 'alta',
                status: 'aberto',
                requester: cliente._id,
                asset: assets[0]._id
            },
            {
                title: 'Problema de acesso ao sistema',
                description: 'Não consigo acessar o sistema de gestão. Aparece erro de autenticação.',
                category: 'acesso',
                priority: 'media',
                status: 'em_andamento',
                requester: cliente._id,
                assignedTo: tecnico._id
            },
            {
                title: 'Instalação de software',
                description: 'Preciso instalar o Adobe Acrobat Pro no meu computador.',
                category: 'software',
                priority: 'baixa',
                status: 'resolvido',
                requester: cliente._id,
                assignedTo: tecnico._id,
                resolvedAt: new Date()
            }
        ]);

        console.log('🎫 Tickets criados');

        // Criar certificados
        const futureDate30 = new Date();
        futureDate30.setDate(futureDate30.getDate() + 25);

        const futureDate90 = new Date();
        futureDate90.setDate(futureDate90.getDate() + 90);

        await Certificate.create([
            {
                name: 'SSL - gestao.com.br',
                type: 'ssl',
                issueDate: new Date('2024-01-01'),
                expirationDate: futureDate30,
                provider: 'Let\'s Encrypt',
                status: 'ativo'
            },
            {
                name: 'Microsoft Office 365',
                type: 'licenca_software',
                issueDate: new Date('2024-01-01'),
                expirationDate: futureDate90,
                provider: 'Microsoft',
                status: 'ativo'
            }
        ]);

        console.log('📜 Certificados criados');

        // Criar artigos da base de conhecimento
        await KnowledgeBase.create([
            {
                title: 'Como resetar senha do sistema',
                content: `# Resetar Senha do Sistema

## Passo 1
Acesse a página de login e clique em "Esqueci minha senha"

## Passo 2
Digite seu email cadastrado

## Passo 3
Verifique seu email e clique no link de recuperação

## Passo 4
Crie uma nova senha forte com pelo menos 8 caracteres`,
                category: 'Tutoriais',
                tags: ['senha', 'login', 'acesso'],
                author: admin._id,
                views: 45
            },
            {
                title: 'Configuração de impressora de rede',
                content: `# Configurar Impressora de Rede

## Requisitos
- IP da impressora
- Driver instalado

## Passos
1. Abra Painel de Controle
2. Vá em Dispositivos e Impressoras
3. Adicionar impressora
4. Selecionar impressora de rede
5. Digite o IP: 192.168.1.100
6. Instalar driver
7. Testar impressão`,
                category: 'Hardware',
                tags: ['impressora', 'rede', 'configuração'],
                author: tecnico._id,
                views: 32
            }
        ]);

        console.log('📚 Base de conhecimento criada');

        // Criar boletos
        const dueDate1 = new Date();
        dueDate1.setDate(dueDate1.getDate() + 10);

        const dueDate2 = new Date();
        dueDate2.setDate(dueDate2.getDate() + 20);

        await Boleto.create([
            {
                description: 'Licença Microsoft Azure',
                value: 1500.00,
                provider: 'Microsoft',
                dueDate: dueDate1,
                deliverByDate: new Date(dueDate1.getTime() - 7 * 24 * 60 * 60 * 1000),
                status: 'pendente'
            },
            {
                description: 'Hospedagem AWS',
                value: 850.50,
                provider: 'Amazon Web Services',
                dueDate: dueDate2,
                deliverByDate: new Date(dueDate2.getTime() - 7 * 24 * 60 * 60 * 1000),
                status: 'pendente',
                observation: 'Pagamento automático configurado'
            }
        ]);

        console.log('💰 Boletos criados');

        console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ✅ SEED CONCLUÍDO COM SUCESSO!                      ║
║                                                       ║
║   Usuários criados:                                   ║
║   - admin@gestao.com / admin123 (Admin)               ║
║   - joao@gestao.com / tecnico123 (Técnico)            ║
║   - maria@cliente.com / cliente123 (Cliente)          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro no seed:', error);
        process.exit(1);
    }
};

seedDatabase();
