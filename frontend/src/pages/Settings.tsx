import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Key, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import './UserDetail.css'; // Reusing some premium styles

export const Settings: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'As novas senhas não coincidem.' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
            return;
        }

        try {
            setLoading(true);
            await authService.updatePassword({ currentPassword, newPassword });
            setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Erro ao alterar senha. Verifique sua senha atual.' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="header-info">
                    <div className="header-title-row">
                        <div className="header-icon">
                            <SettingsIcon size={28} />
                        </div>
                        <h1>Configurações da Conta</h1>
                    </div>
                    <p>Gerencie sua segurança e preferências de perfil</p>
                </div>
            </header>

            <div className="content-card" style={{ maxWidth: '800px' }}>
                <div className="detail-tabs" style={{ padding: '0 24px', background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
                    <button className="tab-btn active" style={{ borderBottom: '2px solid var(--primary)', padding: '16px 20px', borderRadius: 0, background: 'none' }}>
                        <Lock size={18} /> Segurança
                    </button>
                </div>

                <div className="tab-content" style={{ padding: '32px' }}>
                    <div className="section-header" style={{ marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Key size={20} className="text-primary" />
                            Alterar Senha
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                            Recomendamos o uso de uma senha forte que você não use em outros lugares.
                        </p>
                    </div>

                    {message.text && (
                        <div className={`alert alert-${message.type}`} style={{ 
                            padding: '16px', 
                            borderRadius: '12px', 
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: message.type === 'success' ? '#10B981' : '#EF4444',
                            border: `1px solid ${message.type === 'success' ? '#10B98133' : '#EF444433'}`
                        }}>
                            {message.type === 'success' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
                            <span style={{ fontWeight: 600 }}>{message.text}</span>
                        </div>
                    )}

                    <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>Senha Atual</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                placeholder="Digite sua senha atual"
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>Nova Senha</label>
                                <input 
                                    type="password" 
                                    className="form-control" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="Mínimo 6 caracteres"
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>Confirmar Nova Senha</label>
                                <input 
                                    type="password" 
                                    className="form-control" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Repita a nova senha"
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                                type="submit" 
                                className="btn-primary" 
                                disabled={loading}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
                            >
                                <Save size={20} />
                                {loading ? 'Salvando...' : 'Alterar Senha'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
