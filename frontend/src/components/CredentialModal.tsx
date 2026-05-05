import React, { useState, useEffect } from 'react';
import { credentialService } from '../services';
import { Shield, Key, Globe, User, Lock, Tag, Plus, Trash2, Eye, EyeOff, RefreshCw, Save } from 'lucide-react';
import { StandardFormModal } from './StandardFormModal';
import './CredentialModal.css';

interface CredentialModalProps {
    credential: any | null;
    onClose: () => void;
    onSave: () => void;
}

export const CredentialModal: React.FC<CredentialModalProps> = ({ credential, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        category: 'servidor',
        host: '',
        port: '',
        username: '',
        password: '',
        url: '',
        notes: '',
        tags: '',
        extraFields: [] as { label: string, value: string, isSecret: boolean }[]
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (credential) {
            setFormData({
                title: credential.title || '',
                category: credential.category || 'servidor',
                host: credential.host || '',
                port: credential.port || '',
                username: credential.username || '',
                password: credential.password || '',
                url: credential.url || '',
                notes: credential.notes || '',
                tags: credential.tags ? credential.tags.join(', ') : '',
                extraFields: credential.extraFields || []
            });
        }
    }, [credential]);

    const generatePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let retVal = "";
        for (let i = 0, n = charset.length; i < 16; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        setFormData({ ...formData, password: retVal });
        setShowPassword(true);
    };

    const addExtraField = () => {
        setFormData({
            ...formData,
            extraFields: [...formData.extraFields, { label: '', value: '', isSecret: false }]
        });
    };

    const removeExtraField = (index: number) => {
        const newFields = [...formData.extraFields];
        newFields.splice(index, 1);
        setFormData({ ...formData, extraFields: newFields });
    };

    const updateExtraField = (index: number, field: string, value: any) => {
        const newFields = [...formData.extraFields];
        newFields[index] = { ...newFields[index], [field]: value };
        setFormData({ ...formData, extraFields: newFields });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSend = {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
            };

            if (credential) {
                await credentialService.update(credential._id, dataToSend);
            } else {
                await credentialService.create(dataToSend);
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Erro ao salvar credencial:', error);
            alert('Erro ao salvar credencial');
        } finally {
            setLoading(false);
        }
    };

    const footerContent = (
        <>
            <button type="button" className="sfm-btn sfm-btn-secondary" onClick={onClose}>
                Cancelar
            </button>
            <button
                type="submit"
                form="credential-form"
                className="sfm-btn sfm-btn-primary"
                disabled={loading}
            >
                <Save size={18} />
                {loading ? 'Salvando...' : credential ? 'Atualizar Credencial' : 'Salvar Credencial'}
            </button>
        </>
    );

    return (
        <StandardFormModal
            isOpen={true}
            onClose={onClose}
            title={credential ? 'Editar Credencial' : 'Nova Credencial'}
            icon={<Shield size={22} />}
            size="md"
            footer={footerContent}
        >
            <form id="credential-form" onSubmit={handleSubmit}>
                {/* Informações Básicas */}
                <div className="sfm-section-card">
                    <h3 className="sfm-section-title"><Shield size={18} /> Informações Básicas</h3>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Título / Nome *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="Ex: Servidor Produção DB"
                            />
                        </div>
                        <div className="form-group">
                            <label>Categoria</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="servidor">Servidor</option>
                                <option value="banco_dados">Banco de Dados</option>
                                <option value="aplicacao">Aplicação / Web</option>
                                <option value="rede">Equipamento de Rede</option>
                                <option value="servico_nuvem">Serviço de Nuvem</option>
                                <option value="outro">Outro</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tags (separadas por vírgula)</label>
                            <input
                                type="text"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                placeholder="produção, infra, sql"
                            />
                        </div>
                    </div>
                </div>

                {/* Acesso e Rede */}
                <div className="sfm-section-card">
                    <h3 className="sfm-section-title"><Globe size={18} /> Acesso e Rede</h3>
                    <div className="form-grid">
                        <div className="form-group" style={{ gridColumn: 'span 1.5' }}>
                            <label>Host / IP / URL</label>
                            <input
                                type="text"
                                value={formData.host}
                                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                                placeholder="10.0.0.1 ou db.empresa.com"
                            />
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 0.5' }}>
                            <label>Porta</label>
                            <input
                                type="text"
                                value={formData.port}
                                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                                placeholder="3306"
                            />
                        </div>
                        <div className="form-group full-width">
                            <label>URL de Acesso</label>
                            <input
                                type="url"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                placeholder="https://painel.empresa.com"
                            />
                        </div>
                    </div>
                </div>

                {/* Autenticação */}
                <div className="sfm-section-card">
                    <h3 className="sfm-section-title"><User size={18} /> Autenticação</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Usuário / Login</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Senha</label>
                            <div className="password-input">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    title={showPassword ? "Ocultar" : "Mostrar"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                <button
                                    type="button"
                                    className="generate-password"
                                    onClick={generatePassword}
                                    title="Gerar senha forte"
                                >
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Campos Extras */}
                <div className="sfm-section-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 className="sfm-section-title" style={{ marginBottom: 0 }}><Plus size={18} /> Campos Personalizados</h3>
                        <button type="button" className="btn-add-field" onClick={addExtraField}>
                            <Plus size={16} /> Adicionar Campo
                        </button>
                    </div>

                    {formData.extraFields.map((field, index) => (
                        <div key={index} className="extra-field-row">
                            <input
                                type="text"
                                placeholder="Rótulo (ex: Chave API)"
                                value={field.label}
                                onChange={(e) => updateExtraField(index, 'label', e.target.value)}
                                style={{ flex: '1' }}
                            />
                            <input
                                type={field.isSecret ? "password" : "text"}
                                placeholder="Valor"
                                value={field.value}
                                onChange={(e) => updateExtraField(index, 'value', e.target.value)}
                                style={{ flex: '2' }}
                            />
                            <label className="secret-check">
                                <input
                                    type="checkbox"
                                    checked={field.isSecret}
                                    onChange={(e) => updateExtraField(index, 'isSecret', e.target.checked)}
                                />
                                Secreto
                            </label>
                            <button type="button" className="btn-remove-field" onClick={() => removeExtraField(index)}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Notas */}
                <div className="sfm-section-card">
                    <h3 className="sfm-section-title"><Tag size={18} /> Notas e Observações</h3>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        placeholder="Informações adicionais relevantes..."
                    />
                </div>
            </form>
        </StandardFormModal>
    );
};
