import React, { useState, useEffect } from 'react';
import { Network, Activity, Server, MapPin, Cpu, Shield, Plus, Save, Trash2, Globe } from 'lucide-react';
import { StandardFormModal } from './StandardFormModal';
import api from '../services/api';

interface NetworkDeviceModalProps {
    device: any | null;
    onClose: () => void;
    onSave: () => void;
}

export const NetworkDeviceModal: React.FC<NetworkDeviceModalProps> = ({ device, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        hostname: '',
        type: 'switch',
        ipAddress: '',
        macAddress: '',
        subnet: '255.255.255.0',
        gateway: '',
        vlan: 1,
        brand: '',
        model: '',
        serialNumber: '',
        location: '',
        rack: '',
        rackPosition: '',
        totalPorts: 0,
        notes: '',
        status: 'online'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (device) {
            setFormData({
                name: device.name || '',
                hostname: device.hostname || '',
                type: device.type || 'switch',
                ipAddress: device.ipAddress || '',
                macAddress: device.macAddress || '',
                subnet: device.subnet || '255.255.255.0',
                gateway: device.gateway || '',
                vlan: device.vlan || 1,
                brand: device.brand || '',
                model: device.model || '',
                serialNumber: device.serialNumber || '',
                location: device.location || '',
                rack: device.rack || '',
                rackPosition: device.rackPosition || '',
                totalPorts: device.totalPorts || 0,
                notes: device.notes || '',
                status: device.status || 'online'
            });
        }
    }, [device]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (device) {
                await api.put(`/network-devices/${device._id}`, formData);
            } else {
                await api.post('/network-devices', formData);
            }
            onSave();
            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar dispositivo de rede:', error);
            alert(error.response?.data?.message || 'Erro ao salvar dispositivo');
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
                form="network-device-form"
                className="sfm-btn sfm-btn-primary"
                disabled={loading}
            >
                <Save size={18} />
                {loading ? 'Salvando...' : device ? 'Atualizar Dispositivo' : 'Criar Dispositivo'}
            </button>
        </>
    );

    return (
        <StandardFormModal
            isOpen={true}
            onClose={onClose}
            title={device ? 'Editar Dispositivo de Rede' : 'Novo Dispositivo de Rede'}
            icon={<Network size={22} />}
            size="lg"
            footer={footerContent}
        >
            <form id="network-device-form" onSubmit={handleSubmit}>
                <div className="sfm-two-columns">
                    {/* Coluna 1: Identificação e Rede */}
                    <div className="sfm-column">
                        <div className="sfm-section-card">
                            <h3 className="sfm-section-title"><Globe size={18} /> Identificação e Tipo</h3>
                            <div className="sfm-form-grid">
                                <div className="sfm-form-group sfm-full-width">
                                    <label>Nome do Dispositivo *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="Ex: Switch Central N3"
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>Tipo *</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        required
                                    >
                                        <option value="switch">Switch</option>
                                        <option value="router">Roteador</option>
                                        <option value="access_point">Access Point (WiFi)</option>
                                        <option value="firewall">Firewall</option>
                                        <option value="modem">Modem</option>
                                        <option value="server">Servidor (Core)</option>
                                        <option value="outro">Outro</option>
                                    </select>
                                </div>
                                <div className="sfm-form-group">
                                    <label>Endereço IP *</label>
                                    <input
                                        type="text"
                                        value={formData.ipAddress}
                                        onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                                        required
                                        placeholder="10.1.x.x"
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>Hostname</label>
                                    <input
                                        type="text"
                                        value={formData.hostname}
                                        onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                                        placeholder="sw-central"
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
                            </div>
                        </div>

                        <div className="sfm-section-card">
                            <h3 className="sfm-section-title"><Shield size={18} /> Configuração de Rede</h3>
                            <div className="sfm-form-grid">
                                <div className="sfm-form-group">
                                    <label>Máscara de Rede</label>
                                    <input
                                        type="text"
                                        value={formData.subnet}
                                        onChange={(e) => setFormData({ ...formData, subnet: e.target.value })}
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>Gateway</label>
                                    <input
                                        type="text"
                                        value={formData.gateway}
                                        onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>VLAN Gerência</label>
                                    <input
                                        type="number"
                                        value={formData.vlan}
                                        onChange={(e) => setFormData({ ...formData, vlan: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>Total de Portas</label>
                                    <input
                                        type="number"
                                        value={formData.totalPorts}
                                        onChange={(e) => setFormData({ ...formData, totalPorts: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coluna 2: Localização e Hardware */}
                    <div className="sfm-column">
                        <div className="sfm-section-card">
                            <h3 className="sfm-section-title"><MapPin size={18} /> Localização Física</h3>
                            <div className="sfm-form-grid">
                                <div className="sfm-form-group sfm-full-width">
                                    <label>Local / Unidade *</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        required
                                        placeholder="Ex: TI Central / Data Center"
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>Rack</label>
                                    <input
                                        type="text"
                                        value={formData.rack}
                                        onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                                        placeholder="Ex: Rack A"
                                    />
                                </div>
                                <div className="sfm-form-group">
                                    <label>Posição (U)</label>
                                    <input
                                        type="text"
                                        value={formData.rackPosition}
                                        onChange={(e) => setFormData({ ...formData, rackPosition: e.target.value })}
                                        placeholder="Ex: 24-25"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="sfm-section-card">
                            <h3 className="sfm-section-title"><Cpu size={18} /> Detalhes do Hardware</h3>
                            <div className="sfm-form-grid">
                                <div className="sfm-form-group">
                                    <label>Fabricante</label>
                                    <input
                                        type="text"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        placeholder="Ex: Cisco, Aruba, TP-Link"
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
                                <div className="sfm-form-group sfm-full-width">
                                    <label>Número de Série</label>
                                    <input
                                        type="text"
                                        value={formData.serialNumber}
                                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="sfm-section-card">
                            <h3 className="sfm-section-title"><Activity size={18} /> Notas e Status</h3>
                            <div className="sfm-form-grid">
                                <div className="sfm-form-group sfm-full-width">
                                    <label>Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="online">Online</option>
                                        <option value="offline">Offline</option>
                                        <option value="warning">Atenção</option>
                                        <option value="maintenance">Manutenção</option>
                                    </select>
                                </div>
                                <div className="sfm-form-group sfm-full-width">
                                    <label>Notas Internas</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </StandardFormModal>
    );
};
