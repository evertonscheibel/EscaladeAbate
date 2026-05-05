import React, { useState, useEffect } from 'react';
import { certificateService, assetService } from '../services';
import { FileText, Shield, Briefcase, Calendar, DollarSign, Package, Save } from 'lucide-react';
import { StandardFormModal } from './StandardFormModal';

interface DocumentModalProps {
    document: any | null;
    onClose: () => void;
    onSave: () => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({ document, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'contrato',
        documentNumber: '',
        barcode: '',
        provider: '',
        issueDate: '',
        expirationDate: '',
        deliverByDate: '',
        value: 0,
        billingCycle: 'anual',
        linkedAsset: '',
        status: 'ativo',
        notifyBeforeDays: 30,
        autoRenew: false,
        brand: '',
        model: '',
        serialNumber: '',
        notes: ''
    });
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadAssets();
        if (document) {
            setFormData({
                name: document.name || '',
                type: document.type || 'contrato',
                documentNumber: document.documentNumber || '',
                barcode: document.barcode || '',
                provider: document.provider || '',
                issueDate: document.issueDate ? document.issueDate.split('T')[0] : '',
                expirationDate: document.expirationDate ? document.expirationDate.split('T')[0] : '',
                deliverByDate: document.deliverByDate ? document.deliverByDate.split('T')[0] : '',
                value: document.value || 0,
                billingCycle: document.billingCycle || 'anual',
                linkedAsset: document.linkedAsset?._id || document.linkedAsset || '',
                status: document.status || 'ativo',
                notifyBeforeDays: document.notifyBeforeDays || 30,
                autoRenew: document.autoRenew || false,
                brand: document.brand || '',
                model: document.model || '',
                serialNumber: document.serialNumber || '',
                notes: document.notes || ''
            });
        }
    }, [document]);

    const loadAssets = async () => {
        try {
            const response = await assetService.getAll();
            setAssets(response.data || []);
        } catch (error) {
            console.error('Erro ao carregar ativos:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (document) {
                await certificateService.update(document._id, formData);
            } else {
                await certificateService.create(formData);
            }
            onSave();
            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            alert(error.response?.data?.message || 'Erro ao salvar documento');
        } finally {
            setLoading(false);
        }
    };

    const renderTypeSpecificFields = () => {
        switch (formData.type) {
            case 'contrato':
                return (
                    <div className="sfm-section-card">
                        <h3 className="sfm-section-title"><Briefcase size={18} /> Detalhes do Contrato</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Valor do Contrato</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #64748b)' }}>R$</span>
                                    <input
                                        type="number"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                                        style={{ paddingLeft: '35px' }}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Ciclo de Faturamento</label>
                                <select
                                    value={formData.billingCycle}
                                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                                >
                                    <option value="mensal">Mensal</option>
                                    <option value="trimestral">Trimestral</option>
                                    <option value="semestral">Semestral</option>
                                    <option value="anual">Anual</option>
                                    <option value="unico">Pagamento Único</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="sfm-checkbox-label" style={{ marginTop: '30px' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.autoRenew}
                                        onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
                                    />
                                    Renovação Automática
                                </label>
                            </div>
                        </div>
                    </div>
                );
            case 'garantia':
                return (
                    <div className="sfm-section-card">
                        <h3 className="sfm-section-title"><Shield size={18} /> Detalhes da Garantia</h3>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Vincular ao Ativo (Patrimônio)</label>
                                <select
                                    value={formData.linkedAsset}
                                    onChange={(e) => setFormData({ ...formData, linkedAsset: e.target.value })}
                                >
                                    <option value="">Nenhum</option>
                                    {assets.map(asset => (
                                        <option key={asset._id} value={asset._id}>
                                            {asset.isNetworkDevice ? '🌐 ' : '💻 '} [{asset.assetId}] {asset.description} - {asset.brand}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Marca</label>
                                <input
                                    type="text"
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    placeholder="Ex: Dell"
                                />
                            </div>
                            <div className="form-group">
                                <label>Nº de Série</label>
                                <input
                                    type="text"
                                    value={formData.serialNumber}
                                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'boleto':
                return (
                    <div className="sfm-section-card">
                        <h3 className="sfm-section-title"><DollarSign size={18} /> Detalhes do Boleto</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Valor (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Código de Barras</label>
                                <input
                                    type="text"
                                    value={formData.barcode}
                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Entregar p/ Financeiro até</label>
                                <input
                                    type="date"
                                    value={formData.deliverByDate}
                                    onChange={(e) => setFormData({ ...formData, deliverByDate: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Fornecedor</label>
                                <input
                                    type="text"
                                    value={formData.provider}
                                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="sfm-section-card">
                        <h3 className="sfm-section-title"><FileText size={18} /> Informações Adicionais</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Número/Serial da Licença</label>
                                <input
                                    type="text"
                                    value={formData.serialNumber}
                                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Fornecedor</label>
                                <input
                                    type="text"
                                    value={formData.provider}
                                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                );
        }
    };

    const footerContent = (
        <>
            <button type="button" className="sfm-btn sfm-btn-secondary" onClick={onClose}>
                Cancelar
            </button>
            <button
                type="submit"
                form="document-form"
                className="sfm-btn sfm-btn-primary"
                disabled={loading}
            >
                <Save size={18} />
                {loading ? 'Salvando...' : document ? 'Atualizar Documento' : 'Salvar Documento'}
            </button>
        </>
    );

    return (
        <StandardFormModal
            isOpen={true}
            onClose={onClose}
            title={document ? 'Editar Documento' : 'Novo Documento'}
            icon={<FileText size={22} />}
            size="md"
            footer={footerContent}
        >
            <form id="document-form" onSubmit={handleSubmit}>
                {/* Identificação Geral */}
                <div className="sfm-section-card">
                    <h3 className="sfm-section-title"><Package size={18} /> Identificação Geral</h3>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Título do Documento *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Ex: Licença Microsoft 365 / Contrato Limpeza"
                            />
                        </div>
                        <div className="form-group">
                            <label>Tipo de Documento *</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                required
                            >
                                <option value="contrato">Contrato</option>
                                <option value="boleto">Boleto (Financeiro)</option>
                                <option value="garantia">Garantia</option>
                                <option value="licenca_software">Licença de Software</option>
                                <option value="equipamentos_industriais">Certificado de Equipamento</option>
                                <option value="dominio">Domínio / DNS</option>
                                <option value="outro">Outro</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Nº do Documento</label>
                            <input
                                type="text"
                                value={formData.documentNumber}
                                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                                placeholder="Código ou Referência"
                            />
                        </div>
                    </div>
                </div>

                {/* Campos Dinâmicos */}
                {renderTypeSpecificFields()}

                {/* Vigência e Vencimento */}
                <div className="sfm-section-card">
                    <h3 className="sfm-section-title"><Calendar size={18} /> Vigência e Notificação</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Data de Início/Emissão</label>
                            <input
                                type="date"
                                value={formData.issueDate}
                                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Data de Vencimento</label>
                            <input
                                type="date"
                                value={formData.expirationDate}
                                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Avisar (dias antes)</label>
                            <input
                                type="number"
                                value={formData.notifyBeforeDays}
                                onChange={(e) => setFormData({ ...formData, notifyBeforeDays: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="ativo">Ativo</option>
                                <option value="expirado">Expirado</option>
                                <option value="cancelado">Cancelado</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Observações */}
                <div className="sfm-section-card">
                    <h3 className="sfm-section-title"><FileText size={18} /> Observações Adicionais</h3>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        placeholder="Detalhes, cláusulas importantes ou contatos do fornecedor..."
                    />
                </div>
            </form>
        </StandardFormModal>
    );
};
