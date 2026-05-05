import React, { useState, useEffect } from 'react';
import { certificateService, API_URL } from '../services';
import { Award, Save } from 'lucide-react';
import { StandardFormModal } from './StandardFormModal';

interface CertificateModalProps {
    certificate: any | null;
    onClose: () => void;
    onSave: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ certificate, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'equipamentos_industriais',
        provider: '',
        issueDate: '',
        expirationDate: '',
        status: 'ativo',
        notifyBeforeDays: 30,
        autoRenew: false,
        brand: '',
        model: '',
        serialNumber: '',
        notes: ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (certificate) {
            setFormData({
                name: certificate.name || '',
                type: certificate.type || 'equipamentos_industriais',
                provider: certificate.provider || '',
                issueDate: certificate.issueDate ? certificate.issueDate.split('T')[0] : '',
                expirationDate: certificate.expirationDate ? certificate.expirationDate.split('T')[0] : '',
                status: certificate.status || 'ativo',
                notifyBeforeDays: certificate.notifyBeforeDays || 30,
                autoRenew: certificate.autoRenew || false,
                brand: certificate.brand || '',
                model: certificate.model || '',
                serialNumber: certificate.serialNumber || '',
                notes: certificate.notes || ''
            });
            if (certificate.imageUrl) {
                setPreviewUrl(certificate.imageUrl);
            }
        }
    }, [certificate]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, value.toString());
            });

            if (imageFile) {
                data.append('image', imageFile);
            }

            if (certificate) {
                await certificateService.update(certificate._id, data);
            } else {
                await certificateService.create(data);
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Erro ao salvar certificado:', error);
            alert('Erro ao salvar certificado');
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
                form="certificate-form"
                className="sfm-btn sfm-btn-primary"
                disabled={loading}
            >
                <Save size={18} />
                {loading ? 'Salvando...' : certificate ? 'Atualizar' : 'Criar Certificado'}
            </button>
        </>
    );

    return (
        <StandardFormModal
            isOpen={true}
            onClose={onClose}
            title={certificate ? 'Editar Certificado' : 'Novo Certificado'}
            icon={<Award size={22} />}
            size="md"
            footer={footerContent}
        >
            <form id="certificate-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group full-width">
                        <label>Nome do Certificado *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="Ex: Compressor Industrial XYZ-2000"
                        />
                    </div>

                    <div className="form-group">
                        <label>Tipo *</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            required
                        >
                            <option value="equipamentos_industriais">Equipamentos Industriais</option>
                            <option value="licenca_software">Licença de Software</option>
                            <option value="dominio">Domínio</option>
                            <option value="contrato">Contrato de Suporte</option>
                            <option value="validacao_hardware">Validação de Hardware</option>
                            <option value="outro">Outro</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Fornecedor</label>
                        <input
                            type="text"
                            value={formData.provider}
                            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                            placeholder="Ex: GoDaddy, Microsoft"
                        />
                    </div>

                    <div className="form-group">
                        <label>Marca</label>
                        <input
                            type="text"
                            value={formData.brand}
                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            placeholder="Ex: Dell, WEG, HP"
                        />
                    </div>

                    <div className="form-group">
                        <label>Modelo</label>
                        <input
                            type="text"
                            value={formData.model}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            placeholder="Ex: Latitude 5420, M-100"
                        />
                    </div>

                    <div className="form-group">
                        <label>Número de Série</label>
                        <input
                            type="text"
                            value={formData.serialNumber}
                            onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                            placeholder="Ex: SN123456789"
                        />
                    </div>

                    <div className="form-group">
                        <label>Data de Emissão *</label>
                        <input
                            type="date"
                            value={formData.issueDate}
                            onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Data de Expiração *</label>
                        <input
                            type="date"
                            value={formData.expirationDate}
                            onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                            required
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
                            <option value="revogado">Revogado</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Notificar antes de (dias)</label>
                        <input
                            type="number"
                            value={formData.notifyBeforeDays}
                            onChange={(e) => setFormData({ ...formData, notifyBeforeDays: parseInt(e.target.value) })}
                            min="1"
                        />
                    </div>

                    <div className="form-group full-width">
                        <label>Imagem do Certificado / Equipamento</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ padding: '8px 0' }}
                        />
                        {previewUrl && (
                            <div className="image-preview" style={{ marginTop: '10px' }}>
                                <img
                                    src={previewUrl.startsWith('http') || previewUrl.startsWith('data:') ? previewUrl : `${API_URL.replace(/\/api$/, '')}${previewUrl}`}
                                    alt="Preview"
                                    style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border, #ddd)' }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="form-group full-width">
                        <label>Observações</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Detalhes adicionais..."
                            rows={3}
                        />
                    </div>

                    <div className="form-group full-width">
                        <label className="sfm-checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.autoRenew}
                                onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
                            />
                            Renovação Automática
                        </label>
                    </div>
                </div>
            </form>
        </StandardFormModal>
    );
};
