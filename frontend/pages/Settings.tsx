import React from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import '../pages/Tickets.css';

export const Settings: React.FC = () => {
    return (
        <div className="tickets-page">
            <div className="page-header">
                <div>
                    <h1>Configurações do Sistema</h1>
                    <p>Gerencie as configurações globais da plataforma</p>
                </div>
                <button className="btn-primary" disabled>
                    <Save size={20} />
                    Salvar Alterações
                </button>
            </div>

            <div style={{ background: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '40px 0' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b'
                    }}>
                        <SettingsIcon size={40} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ color: '#1e293b', marginBottom: '8px' }}>Módulo em Desenvolvimento</h2>
                        <p style={{ color: '#64748b', maxWidth: '400px' }}>
                            As configurações globais do sistema estão sendo migradas para esta nova área.
                            Por enquanto, utilize o módulo de Usuários para gerenciar permissões.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
