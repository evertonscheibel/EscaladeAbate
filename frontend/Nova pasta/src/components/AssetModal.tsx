import React, { useState, useEffect } from 'react';
import { assetService } from '../services';
import api from '../services/api';
import { Monitor, Cpu, Database, Network, Building, User, Calendar, DollarSign, Tag, Save, Plus } from 'lucide-react';
import { StandardFormModal } from './StandardFormModal';
import './AssetModal.css';

interface AssetModalProps {
    asset: any | null;
    onClose: () => void;
    onSave: () => void;
}

export const AssetModal: React.FC<AssetModalProps> = ({ asset, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        assetId: '',
        description: '',
        type: 'notebook',
        brand: '',
        model: '',
        serialNumber: '',
        location: '',
        acquisitionDate: '',
        purchaseValue: 0,
        warrantyExpiration: '',
        assignedTo: '',
        department: '',
        ipAddress: '',
        macAddress: '',
        hostname: '',
        anydeskId: '',
        status: 'ativo',
        specs: {
            processor: '',
            ram: '',
            storage: '',
            videoOutputPc: '',
            videoOutputMonitor: '',
            accessories: ''
        },
        notes: '',
        isNetworkDevice: false
    });
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUsers();
        if (asset) {
            setFormData({
                assetId: asset.assetId || '',
                description: asset.description || '',
                type: asset.type || 'notebook',
                brand: asset.brand || '',
                model: asset.model || '',
                serialNumber: asset.serialNumber || '',
                location: asset.location || '',
                acquisitionDate: asset.acquisitionDate ? asset.acquisitionDate.split('T')[0] : '',
                purchaseValue: asset.purchaseValue || 0,
                warrantyExpiration: asset.warrantyExpiration ? asset.warrantyExpiration.split('T')[0] : '',
                assignedTo: asset.assignedTo?._id || asset.assignedTo || '',
                department: asset.department || '',
                ipAddress: asset.ipAddress || '',
                macAddress: asset.macAddress || '',
                hostname: asset.hostname || '',
                anydeskId: asset.anydeskId || '',
                status: asset.status || 'ativo',
                specs: {
                    processor: asset.specs?.processor || '',
                    ram: asset.specs?.ram || '',
                    storage: asset.specs?.storage || '',
                    videoOutputPc: asset.specs?.videoOutputPc || '',
                    videoOutputMonitor: asset.specs?.videoOutputMonitor || '',
                    accessories: asset.specs?.accessories || ''
                },
                notes: asset.notes || '',
                isNetworkDevice: asset.isNetworkDevice || false
            });
        }
    }, [asset]);

    const loadUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(Array.isArray(response.data) ? response.data : response.data.data || []);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (asset) {
                await assetService.update(asset._id, formData);
            } else {
                await assetService.create(formData);
            }
            onSave();
            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar ativo:', error);
            alert(error.response?.data?.message || 'Erro ao salvar ativo');
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
                form="asset-form"
                className="sfm-btn sfm-btn-primary"
                disabled={loading}
            >
                <Save size={18} />
                {loading ? 'Salvando...' : asset ? 'Atualizar Ativo' : 'Criar Ativo'}
            </button>
        </>
    );

    return (
        <StandardFormModal
            isOpen={true}
            onClose={onClose}
            title={asset ? 'Editar Ativo' : 'Novo Ativo'}
            icon={<Monitor size={22} />}
            size="lg"
            footer={footerContent}
        >
            <form id="asset-form" onSubmit={handleSubmit}>
                <div className="sfm-two-columns">
                    {/* Coluna 1: Identificação e Localização */}
                    <div className="sfm-column">
                        <div className="sfm-section-card">
                            <h3 className="sfm-section-title"><Tag size={18} /> Identificação Geral</h3>
                            <div className="sfm-form-grid">
                                <div className="sfm-form-group">
                                    <label>Patrimônio (Asset ID) *</label>
                                    <input
                                        type="text"
                                        value={formData.assetId}
                                        onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                                        required
                                        placeholder="Ex: TI-001"
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>Tipo *</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        required
                                    >
                                        <option value="notebook">Notebook</option>
                                        <option value="desktop">Desktop</option>
                                        <option value="monitor">Monitor</option>
                                        <option value="servidor">Servidor</option>
                                        <option value="impressora">Impressora</option>
                                        <option value="rede">Rede (Switch/Roteador)</option>
                                        <option value="periferico">Periférico</option>
                                        <option value="software">Software</option>
                                        <option value="outro">Outro</option>
                                    </select>
                                </div>
                                <div className="sfm-form-group sfm-full-width">
                                    <label>Descrição Curta *</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                        placeholder="Ex: Notebook Dell Latitude 5420"
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>Fabricante / Marca</label>
                                    <input
                                        type="text"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>Modelo</label>
                                    <input
                                        type="text"
                                        value={formData.model}
                                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>Nº de Série</label>
                                    <input
                                        type="text"
                                        value={formData.serialNumber}
                                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="ativo">Ativo</option>
                                        <option value="disponivel">Disponível / Estoque</option>
                                        <option value="em_manutencao">Em Manutenção</option>
                                        <option value="descartado">Descartado</option>
                                        <option value="perdido">Perdido / Roubado</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="sfm-section-card">
                            <h3 className="sfm-section-title"><Building size={18} /> Localização e Atribuição</h3>
                            <div className="sfm-form-grid">
                                <div className="sfm-form-group">
                                    <label>Unidade / Local</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>Departamento</label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    />
                                </div>
                                <div className="sfm-form-group sfm-full-width">
                                    <label><User size={14} /> Responsável / Atribuído a</label>
                                    <select
                                        value={formData.assignedTo}
                                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                    >
                                        <option value="">Não atribuído</option>
                                        {users.map(u => (
                                            <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="sfm-section-card">
                            <h3 className="sfm-section-title"><DollarSign size={18} /> Financeiro</h3>
                            <div className="sfm-form-grid">
                                <div className="sfm-form-group">
                                    <label>Data de Aquisição</label>
                                    <input
                                        type="date"
                                        value={formData.acquisitionDate}
                                        onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>Valor de Compra (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.purchaseValue}
                                        onChange={(e) => setFormData({ ...formData, purchaseValue: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>Expiração da Garantia</label>
                                    <input
                                        type="date"
                                        value={formData.warrantyExpiration}
                                        onChange={(e) => setFormData({ ...formData, warrantyExpiration: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coluna 2: Especificações e Rede */}
                    <div className="sfm-column">
                        <div className="sfm-section-card">
                            <h3 className="sfm-section-title"><Cpu size={18} /> Especificações Técnicas</h3>
                            <div className="sfm-form-grid">
                                <div className="sfm-form-group sfm-full-width">
                                    <label>Processador</label>
                                    <input
                                        type="text"
                                        value={formData.specs.processor}
                                        onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, processor: e.target.value } })}
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>Memória RAM</label>
                                    <input
                                        type="text"
                                        value={formData.specs.ram}
                                        onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, ram: e.target.value } })}
                                        placeholder="Ex: 16GB DDR4"
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>Armazenamento (HD/SSD)</label>
                                    <input
                                        type="text"
                                        value={formData.specs.storage}
                                        onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, storage: e.target.value } })}
                                        placeholder="Ex: SSD 512GB NVMe"
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>Saída de Vídeo (PC)</label>
                                    <input
                                        type="text"
                                        value={formData.specs.videoOutputPc}
                                        onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, videoOutputPc: e.target.value } })}
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>Acessórios Inclusos</label>
                                    <input
                                        type="text"
                                        value={formData.specs.accessories}
                                        onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, accessories: e.target.value } })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="sfm-section-card">
                            <h3 className="sfm-section-title"><Network size={18} /> Identificação de Rede</h3>
                            <div className="sfm-form-grid">
                                <div className="sfm-form-group">
                                    <label>Hostname</label>
                                    <input
                                        type="text"
                                        value={formData.hostname}
                                        onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>Endereço IP</label>
                                    <input
                                        type="text"
                                        value={formData.ipAddress}
                                        onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                                        placeholder="0.0.0.0"
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>MAC Address</label>
                                    <input
                                        type="text"
                                        value={formData.macAddress}
                                        onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                                        placeholder="00:00:00:00:00:00"
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>AnyDesk ID</label>
                                    <input
                                        type="text"
                                        value={formData.anydeskId}
                                        onChange={(e) => setFormData({ ...formData, anydeskId: e.target.value })}
                                    />
                                </div>
                                <div className="sfm-form-group sfm-full-width">
                                    <label className="sfm-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.isNetworkDevice}
                                            onChange={(e) => setFormData({ ...formData, isNetworkDevice: e.target.checked })}
                                        />
                                        Exibir no Dashboard de Infraestrutura
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="sfm-section-card">
                            <h3 className="sfm-section-title"><Database size={18} /> Observações</h3>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={4}
                                placeholder="Notas internas sobre conservação, upgrades ou histórico..."
                            />
                        </div>
                    </div>
                </div>
            </form>
        </StandardFormModal>
    );
};
