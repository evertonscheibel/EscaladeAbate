import React, { useState, useEffect } from 'react';
import { networkDeviceService } from '../services/networkDeviceService';
import { X, Save, Wifi, Monitor, Printer, Phone, Server, HelpCircle } from 'lucide-react';
import './SwitchPortsPanel.css';

interface PortConfig {
    portNumber: number;
    status: 'up' | 'down' | 'disabled';
    speed?: string;
    poe?: boolean;
    poeActive?: boolean;
    connectedDevice?: string;
    connectedDeviceIp?: string;
    connectedDeviceMac?: string;
    vlan?: number;
}

interface SwitchPortsPanelProps {
    device: any;
    onClose: () => void;
    onSave: () => void;
}

export const SwitchPortsPanel: React.FC<SwitchPortsPanelProps> = ({ device, onClose, onSave }) => {
    const [ports, setPorts] = useState<PortConfig[]>([]);
    const [selectedPort, setSelectedPort] = useState<PortConfig | null>(null);
    const [saving, setSaving] = useState(false);
    
    // Form state para a porta selecionada
    const [portForm, setPortForm] = useState({
        status: 'up' as 'up' | 'down' | 'disabled',
        speed: '1G',
        poe: false,
        connectedDevice: '',
        connectedDeviceIp: '',
        connectedDeviceMac: '',
        vlan: 1
    });

    useEffect(() => {
        // Inicializar portas baseado no totalPorts do device
        const totalPorts = device.totalPorts || 24;
        const existingPorts = device.ports || [];
        
        const initialPorts: PortConfig[] = [];
        for (let i = 1; i <= totalPorts; i++) {
            const existing = existingPorts.find((p: any) => p.portNumber === i);
            initialPorts.push({
                portNumber: i,
                status: existing?.status || 'down',
                speed: existing?.speed || '1G',
                poe: existing?.poe || false,
                poeActive: existing?.poeActive || false,
                connectedDevice: existing?.connectedDevice || '',
                connectedDeviceIp: existing?.connectedDeviceIp || '',
                connectedDeviceMac: existing?.connectedDeviceMac || '',
                vlan: existing?.vlan || 1
            });
        }
        setPorts(initialPorts);
    }, [device]);

    const handlePortClick = (port: PortConfig) => {
        setSelectedPort(port);
        setPortForm({
            status: port.status,
            speed: port.speed || '1G',
            poe: port.poe || false,
            connectedDevice: port.connectedDevice || '',
            connectedDeviceIp: port.connectedDeviceIp || '',
            connectedDeviceMac: port.connectedDeviceMac || '',
            vlan: port.vlan || 1
        });
    };

    const handleFormChange = (field: string, value: any) => {
        setPortForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSavePort = () => {
        if (!selectedPort) return;
        
        const updatedPorts = ports.map(p => {
            if (p.portNumber === selectedPort.portNumber) {
                return {
                    ...p,
                    status: portForm.status,
                    speed: portForm.speed,
                    poe: portForm.poe,
                    poeActive: portForm.poe && portForm.status === 'up',
                    connectedDevice: portForm.connectedDevice,
                    connectedDeviceIp: portForm.connectedDeviceIp,
                    connectedDeviceMac: portForm.connectedDeviceMac,
                    vlan: portForm.vlan
                };
            }
            return p;
        });
        
        setPorts(updatedPorts);
        setSelectedPort({
            ...selectedPort,
            ...portForm,
            poeActive: portForm.poe && portForm.status === 'up'
        });
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            await networkDeviceService.updatePorts(device._id, ports);
            onSave();
        } catch (error) {
            console.error('Erro ao salvar portas:', error);
            alert('Erro ao salvar configuração das portas');
        } finally {
            setSaving(false);
        }
    };

    // Organizar portas em pares (superior/inferior) como switch real
    const getPortPairs = () => {
        const pairs: { top: PortConfig | null; bottom: PortConfig | null }[] = [];
        for (let i = 0; i < ports.length; i += 2) {
            pairs.push({
                bottom: ports[i] || null,      // Porta ímpar (1, 3, 5...)
                top: ports[i + 1] || null      // Porta par (2, 4, 6...)
            });
        }
        return pairs;
    };

    const getDeviceIcon = (deviceName: string) => {
        const name = deviceName.toLowerCase();
        if (name.includes('ap') || name.includes('wifi') || name.includes('access')) return <Wifi size={12} />;
        if (name.includes('printer') || name.includes('impressora') || name.includes('zebra')) return <Printer size={12} />;
        if (name.includes('phone') || name.includes('telefone') || name.includes('voip')) return <Phone size={12} />;
        if (name.includes('server') || name.includes('servidor')) return <Server size={12} />;
        if (name.includes('pc') || name.includes('computer') || name.includes('desktop')) return <Monitor size={12} />;
        return <HelpCircle size={12} />;
    };

    const portPairs = getPortPairs();
    const activePortsCount = ports.filter(p => p.status === 'up').length;
    const poeActiveCount = ports.filter(p => p.poeActive).length;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="switch-panel-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="switch-panel-header">
                    <div className="header-info">
                        <div className="switch-icon">
                            <Server size={24} />
                        </div>
                        <div>
                            <h2>{device.name}</h2>
                            <p className="device-meta">
                                <span className="ip">{device.ipAddress}</span>
                                <span className="separator">•</span>
                                <span>{device.location}</span>
                                <span className="separator">•</span>
                                <span>{device.brand} {device.model}</span>
                            </p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="switch-panel-body">
                    {/* Painel Visual do Switch */}
                    <div className="visual-panel">
                        <div className="panel-header">
                            <h3>Painel de Portas</h3>
                            <div className="port-stats">
                                <span className="stat">
                                    <span className="stat-value">{activePortsCount}</span>
                                    <span className="stat-label">/{ports.length} ativas</span>
                                </span>
                                <span className="stat">
                                    <span className="stat-value poe">{poeActiveCount}</span>
                                    <span className="stat-label">PoE</span>
                                </span>
                            </div>
                        </div>

                        {/* Switch Faceplate */}
                        <div className="switch-faceplate">
                            {/* LEDs do painel */}
                            <div className="switch-leds">
                                <div className="led power on"></div>
                                <div className="led status on"></div>
                                <div className="led fault"></div>
                            </div>

                            {/* Portas */}
                            <div className="ports-container">
                                {portPairs.map((pair, index) => (
                                    <div key={index} className="port-pair">
                                        {/* Porta superior (par) */}
                                        {pair.top && (
                                            <div 
                                                className={`port ${pair.top.status} ${selectedPort?.portNumber === pair.top.portNumber ? 'selected' : ''}`}
                                                onClick={() => handlePortClick(pair.top!)}
                                            >
                                                <div className="port-leds">
                                                    <div className={`led link ${pair.top.status === 'up' ? 'on' : ''}`}></div>
                                                    {pair.top.poeActive && <div className="led poe on"></div>}
                                                </div>
                                                <div className="port-connector">
                                                    <div className="port-pins">
                                                        <div className="pin"></div>
                                                        <div className="pin"></div>
                                                        <div className="pin"></div>
                                                        <div className="pin"></div>
                                                    </div>
                                                </div>
                                                <div className="port-number">{pair.top.portNumber}</div>
                                                {pair.top.connectedDevice && (
                                                    <div className="port-device-indicator" title={pair.top.connectedDevice}>
                                                        {getDeviceIcon(pair.top.connectedDevice)}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Porta inferior (ímpar) */}
                                        {pair.bottom && (
                                            <div 
                                                className={`port ${pair.bottom.status} ${selectedPort?.portNumber === pair.bottom.portNumber ? 'selected' : ''}`}
                                                onClick={() => handlePortClick(pair.bottom!)}
                                            >
                                                <div className="port-leds">
                                                    <div className={`led link ${pair.bottom.status === 'up' ? 'on' : ''}`}></div>
                                                    {pair.bottom.poeActive && <div className="led poe on"></div>}
                                                </div>
                                                <div className="port-connector">
                                                    <div className="port-pins">
                                                        <div className="pin"></div>
                                                        <div className="pin"></div>
                                                        <div className="pin"></div>
                                                        <div className="pin"></div>
                                                    </div>
                                                </div>
                                                <div className="port-number">{pair.bottom.portNumber}</div>
                                                {pair.bottom.connectedDevice && (
                                                    <div className="port-device-indicator" title={pair.bottom.connectedDevice}>
                                                        {getDeviceIcon(pair.bottom.connectedDevice)}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Legenda */}
                        <div className="port-legend">
                            <div className="legend-item">
                                <div className="led link on"></div>
                                <span>Link Ativo</span>
                            </div>
                            <div className="legend-item">
                                <div className="led poe on"></div>
                                <span>PoE Ativo</span>
                            </div>
                            <div className="legend-item">
                                <div className="led link"></div>
                                <span>Desconectado</span>
                            </div>
                        </div>
                    </div>

                    {/* Painel de Configuração */}
                    <div className="config-panel">
                        {selectedPort ? (
                            <div className="port-config">
                                <div className="config-header">
                                    <h3>Porta {selectedPort.portNumber}</h3>
                                    <span className={`status-badge ${selectedPort.status}`}>
                                        {selectedPort.status === 'up' ? 'Ativa' : selectedPort.status === 'down' ? 'Inativa' : 'Desabilitada'}
                                    </span>
                                </div>

                                <div className="config-section">
                                    <h4>Configuração da Porta</h4>
                                    
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select 
                                            value={portForm.status} 
                                            onChange={e => handleFormChange('status', e.target.value)}
                                        >
                                            <option value="up">Ativa (Up)</option>
                                            <option value="down">Inativa (Down)</option>
                                            <option value="disabled">Desabilitada</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Velocidade</label>
                                        <select 
                                            value={portForm.speed} 
                                            onChange={e => handleFormChange('speed', e.target.value)}
                                        >
                                            <option value="100M">100 Mbps</option>
                                            <option value="1G">1 Gbps</option>
                                            <option value="10G">10 Gbps</option>
                                        </select>
                                    </div>

                                    <div className="form-group checkbox">
                                        <label>
                                            <input 
                                                type="checkbox" 
                                                checked={portForm.poe}
                                                onChange={e => handleFormChange('poe', e.target.checked)}
                                            />
                                            <span>PoE Habilitado</span>
                                        </label>
                                    </div>

                                    <div className="form-group">
                                        <label>VLAN</label>
                                        <input 
                                            type="number" 
                                            value={portForm.vlan}
                                            onChange={e => handleFormChange('vlan', parseInt(e.target.value) || 1)}
                                            min={1}
                                            max={4094}
                                        />
                                    </div>
                                </div>

                                <div className="config-section">
                                    <h4>Dispositivo Conectado</h4>
                                    
                                    <div className="form-group">
                                        <label>Nome / Descrição</label>
                                        <input 
                                            type="text" 
                                            value={portForm.connectedDevice}
                                            onChange={e => handleFormChange('connectedDevice', e.target.value)}
                                            placeholder="Ex: AP-Recepção, Impressora-RH"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Endereço IP</label>
                                        <input 
                                            type="text" 
                                            value={portForm.connectedDeviceIp}
                                            onChange={e => handleFormChange('connectedDeviceIp', e.target.value)}
                                            placeholder="Ex: 192.168.1.100"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Endereço MAC</label>
                                        <input 
                                            type="text" 
                                            value={portForm.connectedDeviceMac}
                                            onChange={e => handleFormChange('connectedDeviceMac', e.target.value)}
                                            placeholder="Ex: 00:1A:2B:3C:4D:5E"
                                        />
                                    </div>
                                </div>

                                <div className="config-actions">
                                    <button 
                                        className="btn-secondary"
                                        onClick={() => setSelectedPort(null)}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        className="btn-primary"
                                        onClick={handleSavePort}
                                    >
                                        Aplicar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="no-port-selected">
                                <div className="empty-icon">
                                    <Server size={48} />
                                </div>
                                <h3>Selecione uma porta</h3>
                                <p>Clique em uma porta no painel para ver e editar suas configurações.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="switch-panel-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        Fechar
                    </button>
                    <button className="btn-primary" onClick={handleSaveAll} disabled={saving}>
                        <Save size={18} />
                        {saving ? 'Salvando...' : 'Salvar Todas as Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SwitchPortsPanel;
