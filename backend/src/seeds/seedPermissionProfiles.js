import PermissionProfile from '../models/PermissionProfile.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';

dotenv.config();

const defaultProfiles = [
    {
        name: 'Operador de Produção',
        description: 'Acesso operacional a Desossa e visualização de Abate',
        color: '#ff9800',
        icon: 'HardHat',
        defaultRole: 'cliente',
        modules: ['dashboard', 'desossa', 'escala-abate'],
        permissions: {
            'desossa': ['view', 'edit'],
            'escala-abate': ['view'],
            'dashboard': ['view']
        },
        isSystem: true
    },
    {
        name: 'Supervisor de Produção',
        description: 'Controle total de Desossa e Abate, inclui fechar e exportar',
        color: '#f44336',
        icon: 'ShieldCheck',
        defaultRole: 'tecnico',
        modules: ['dashboard', 'desossa', 'escala-abate', 'pcp'],
        permissions: {
            'desossa': ['view', 'create', 'edit', 'close', 'export'],
            'escala-abate': ['view', 'create', 'edit', 'close', 'export'],
            'pcp': ['view', 'create', 'edit', 'export'],
            'dashboard': ['view']
        },
        isSystem: true
    },
    {
        name: 'Administrativo',
        description: 'Tickets, documentos, candidatos e base de conhecimento',
        color: '#667eea',
        icon: 'Briefcase',
        defaultRole: 'cliente',
        modules: ['dashboard', 'tickets', 'documents', 'knowledge-base', 'candidates'],
        permissions: {
            'tickets': ['view', 'create', 'edit'],
            'documents': ['view', 'create', 'edit'],
            'knowledge-base': ['view'],
            'candidates': ['view', 'create'],
            'dashboard': ['view']
        },
        isSystem: true
    },
    {
        name: 'Segurança Patrimonial',
        description: 'Acesso total a Guaritas e visualização de NOC',
        color: '#4caf50',
        icon: 'Shield',
        defaultRole: 'guarita_operador',
        modules: ['dashboard', 'gatehouse', 'noc'],
        permissions: {
            'gatehouse': ['view', 'edit', 'close', 'export'],
            'noc': ['view'],
            'dashboard': ['view']
        },
        isSystem: true
    },
    {
        name: 'Coordenador TI',
        description: 'Acesso total a todos os módulos',
        color: '#9c27b0',
        icon: 'Crown',
        defaultRole: 'admin',
        modules: ['ALL'],
        permissions: {},  // admin bypassa tudo
        isSystem: true
    },
    {
        name: 'Auditor / Viewer',
        description: 'Somente visualização e exportação em todos os módulos',
        color: '#607d8b',
        icon: 'Eye',
        defaultRole: 'cliente',
        modules: ['dashboard', 'desossa', 'escala-abate', 'pcp', 'tickets',
            'documents', 'gatehouse', 'gestao-ativos', 'network', 'cofre', 'noc'],
        permissions: {
            'desossa': ['view', 'export'],
            'escala-abate': ['view', 'export'],
            'pcp': ['view', 'export'],
            'tickets': ['view', 'export'],
            'documents': ['view', 'export'],
            'gatehouse': ['view', 'export'],
            'gestao-ativos': ['view', 'export'],
            'network': ['view'],
            'cofre': ['view'],
            'noc': ['view'],
            'dashboard': ['view']
        },
        isSystem: true
    }
];

async function seedPermissionProfiles() {
    try {
        await connectDB();

        for (const profileData of defaultProfiles) {
            const exists = await PermissionProfile.findOne({ name: profileData.name });
            if (!exists) {
                // Converter permissions object para Map
                const profile = {
                    ...profileData,
                    permissions: new Map(Object.entries(profileData.permissions))
                };
                await PermissionProfile.create(profile);
                console.log(`[SEED] Perfil criado: ${profileData.name}`);
            } else {
                console.log(`[SEED] Perfil já existe: ${profileData.name}`);
            }
        }

        console.log('Seed de perfis concluído com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('Erro no seed de perfis:', error);
        process.exit(1);
    }
}

seedPermissionProfiles();
