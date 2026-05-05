import React, { useEffect, useState } from 'react';
import { networkDeviceService } from '../services/networkDeviceService';
import { NetworkDeviceModal } from '../components/NetworkDeviceModal';
import {
    Wifi,
    Server,
    Router,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Plus,
    RefreshCw,
    Search,
    Cpu,
    HardDrive,
    Thermometer,
    Edit,
    Trash2,
    Network,
    Upload,
    Camera,
    Shield,
    Activity,
    MoreVertical,
    Zap
} from 'lucide-react';
import './NetworkDashboard.css';

interface DashboardData {
    summary: {
        total: number;
        online: number;
        offline: number;
        warning: number;
        uptime: string;
    };
    byType: Array<{ _id: string; count: number }>;
    byStatus: Array<{ _id: string; count: number }>;
    byLocation: Array<{ _id: string; count: number }>;
    offlineDevices: any[];
    devicesWithAlerts: any[];
    switches: any[];
    accessPoints: any[];
}

interface ActivityItem {
    id: string;
    type: 'high_cpu' | 'high_temp' | 'unreachable' | 'warning';
    message: string;
    device: string;
    time: string;
}

export const NetworkDashboard: React.FC = () => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
    const [importing, setImporting] = useState(false);
    const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [dashboardResponse, devicesResponse] = await Promise.all([
                networkDeviceService.getDashboard(),
                networkDeviceService.getAll()
            ]);
            setDashboardData(dashboardResponse.data);
            setDevices(devicesResponse.data);

            // Gerar activity feed baseado nos dados
            generateActivityFeed(dashboardResponse.data);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateActivityFeed = (data: DashboardData) => {
        const activities: ActivityItem[] = [];

        // Alertas de dispositivos com métricas altas
        data.devicesWithAlerts?.forEach((device: any) => {
            if (device.metrics?.cpuUsage >= 80) {
                activities.push({
                    id: `cpu-${device._id}`,
                    type: 'high_cpu',
                    message: `High CPU Usage: ${device.metrics.cpuUsage}%`,
                    device: device.name,
                    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                });
            }
            if (device.metrics?.temperature >= 60) {
                activities.push({
                    id: `temp-${device._id}`,
                    type: 'high_temp',
                    message: `High Temp: ${device.metrics.temperature}°C`,
                    device: device.name,
                    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                });
            }
        });

        // Dispositivos offline
        data.offlineDevices?.forEach((device: any) => {
            activities.push({
                id: `offline-${device._id}`,
                type: 'unreachable',
                message: 'Device is unreachable',
                device: device.name,
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            });
        });

        setActivityFeed(activities.slice(0, 5));
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleCreate = () => {
        setSelectedDevice(null);
        setShowModal(true);
    };

    const handleEdit = (device: any) => {
        setSelectedDevice(device);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este dispositivo?')) return;

        try {
            await networkDeviceService.delete(id);
            loadData();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('Erro ao excluir dispositivo');
        }
    };

    const handleSave = () => {
        setShowModal(false);
        loadData();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        try {
            const response = await networkDeviceService.importExcel(file);
            alert(`Importação concluída!\nSucesso: ${response.results.success}\nErros: ${response.results.errors}`);
            loadData();
        } catch (error) {
            console.error('Erro ao importar dispositivos:', error);
            alert('Erro ao importar dispositivos de rede. Verifique o arquivo Excel.');
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'switch': return <Server size={18} />;
            case 'access_point': return <Wifi size={18} />;
            case 'router': return <Router size={18} />;
            case 'firewall': return <Shield size={18} />;
            case 'server': return <Server size={18} />;
            case 'camera': return <Camera size={18} />;
            default: return <Network size={18} />;
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { color: string; text: string }> = {
            'online': { color: '#10b981', text: 'online' },
            'offline': { color: '#ef4444', text: 'offline' },
            'warning': { color: '#f59e0b', text: 'warning' },
            'maintenance': { color: '#6366f1', text: 'maintenance' }
        };
        const config = statusConfig[status] || { color: '#64748b', text: status };
        return (
            <span className="status-badge" style={{ '--status-color': config.color } as React.CSSProperties}>
                <span className="status-dot"></span>
                {config.text}
            </span>
        );
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'high_cpu': return <AlertTriangle size={16} className="activity-icon warning" />;
            case 'high_temp': return <Thermometer size={16} className="activity-icon warning" />;
            case 'unreachable': return <XCircle size={16} className="activity-icon critical" />;
            default: return <AlertTriangle size={16} className="activity-icon warning" />;
        }
    };

    const filteredDevices = devices.filter(device => {
        const matchesSearch =
            device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            device.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            device.hostname?.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesType = true;
        if (filterType === 'switches') matchesType = device.type === 'switch';
        else if (filterType === 'aps') matchesType = device.type === 'access_point';
        else if (filterType === 'servers') matchesType = device.type === 'server';
        else if (filterType === 'cameras') matchesType = device.type === 'camera';

        return matchesSearch && matchesType;
    });

    // Calcular health percentage
    const healthPercentage = dashboardData
        ? Math.round((dashboardData.summary.online / Math.max(dashboardData.summary.total, 1)) * 100)
        : 0;
    const issuesCount = (dashboardData?.summary.offline || 0) + (dashboardData?.summary.warning || 0);

    if (loading) {
        return (
            <div className="netguard-loading">
                <div className="spinner"></div>
                <p>Carregando infraestrutura de rede...</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="header-info">
                    <div className="header-title-row">
                        <div className="kpi-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Network size={22} />
                        </div>
                        <h1 style={{ marginLeft: '12px' }}>Gestão de Infraestrutura</h1>
                    </div>
                    <p>Monitoramento em tempo real de switches, APs e ativos críticos</p>
                </div>
                <div className="header-actions">
                    <button className="btn-refresh" onClick={handleRefresh} disabled={refreshing} style={{ border: '1px solid var(--border)', background: 'white', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                    />
                    <button className="btn-secondary" onClick={handleImportClick} disabled={importing}>
                        {importing ? <div className="spinner-small" style={{ width: '18px', height: '18px', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div> : <Upload size={18} />}
                        Importar
                    </button>
                    <button className="btn-primary" onClick={handleCreate}>
                        <Plus size={20} /> Adicionar Ativo
                    </button>
                </div>
            </header>

            {dashboardData && (
                <div className="reports-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                    <div className="analysis-card">
                        <div className="kpi-header">
                            <div className="kpi-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                                <Activity size={20} />
                            </div>
                            <span className="kpi-label">Health Score</span>
                            <span className={`kpi-trend ${healthPercentage > 90 ? 'up' : 'down'}`}>
                                {healthPercentage}%
                            </span>
                        </div>
                        <div className="kpi-value">{dashboardData.summary.online} / {dashboardData.summary.total}</div>
                        <div className="kpi-subtitle">Dispositivos Online</div>
                    </div>

                    <div className="analysis-card">
                        <div className="kpi-header">
                            <div className="kpi-icon" style={{ background: 'var(--error-soft)', color: 'var(--error)' }}>
                                <XCircle size={20} />
                            </div>
                            <span className="kpi-label">Incidentes</span>
                        </div>
                        <div className="kpi-value">{dashboardData.summary.offline}</div>
                        <div className="kpi-subtitle">Offline ou Inacessível</div>
                    </div>

                    <div className="analysis-card">
                        <div className="kpi-header">
                            <div className="kpi-icon" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>
                                <AlertTriangle size={20} />
                            </div>
                            <span className="kpi-label">Alertas</span>
                        </div>
                        <div className="kpi-value">{dashboardData.summary.warning}</div>
                        <div className="kpi-subtitle">Métricas em Atenção</div>
                    </div>

                    <div className="analysis-card">
                        <div className="kpi-header">
                            <div className="kpi-icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
                                <Zap size={20} />
                            </div>
                            <span className="kpi-label">Uptime Médio</span>
                        </div>
                        <div className="kpi-value">{dashboardData.summary.uptime || '99.9%'}</div>
                        <div className="kpi-subtitle">Disponibilidade de Rede</div>
                    </div>
                </div>
            )}

            <div className="filter-bar" style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
                <div className="search-box" style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, IP ou hostname..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-control"
                        style={{ paddingLeft: '40px', width: '100%' }}
                    />
                </div>

                <div className="filter-select-wrapper" style={{ minWidth: '200px' }}>
                    <select
                        className="form-control"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{ width: '100%' }}
                    >
                        <option value="all">Todos os tipos</option>
                        <option value="switches">Switches</option>
                        <option value="aps">Acess Points</option>
                        <option value="servers">Servidores</option>
                        <option value="cameras">Câmeras</option>
                    </select>
                </div>
            </div>

            <div className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="ivory-table premium-table">
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', paddingLeft: '24px' }}>DISPOSITIVO</th>
                            <th className="text-center">STATUS</th>
                            <th>PERFORMANCE</th>
                            <th>LOCALIZAÇÃO</th>
                            <th className="text-right" style={{ paddingRight: '24px' }}>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDevices.map((device) => (
                            <tr key={device._id} onClick={() => handleEdit(device)}>
                                <td style={{ paddingLeft: '24px' }}>
                                    <div className="user-info-cell">
                                        <div className="user-avatar" style={{ background: 'var(--surface-2)', color: 'var(--primary)', borderRadius: '12px' }}>
                                            {getTypeIcon(device.type)}
                                        </div>
                                        <div className="user-meta">
                                            <span className="user-name">{device.name}</span>
                                            <span className="user-email" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{device.ipAddress}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="text-center">
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        {getStatusBadge(device.status)}
                                    </div>
                                </td>
                                <td>
                                    <div className="performance-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
                                        <div className="perf-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 700, width: '24px', color: 'var(--text-muted)' }}>CPU</span>
                                            <div style={{ flex: 1, height: '4px', background: 'var(--surface-2)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div
                                                    style={{
                                                        height: '100%',
                                                        width: `${device.metrics?.cpuUsage || 0}%`,
                                                        background: (device.metrics?.cpuUsage || 0) > 80 ? 'var(--error)' : 'var(--success)',
                                                        transition: 'width 0.3s ease'
                                                    }}
                                                ></div>
                                            </div>
                                            <span style={{ fontSize: '10px', fontWeight: 700, width: '24px', textAlign: 'right' }}>{device.metrics?.cpuUsage || 0}%</span>
                                        </div>
                                        <div className="perf-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 700, width: '24px', color: 'var(--text-muted)' }}>RAM</span>
                                            <div style={{ flex: 1, height: '4px', background: 'var(--surface-2)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div
                                                    style={{
                                                        height: '100%',
                                                        width: `${device.metrics?.memoryUsage || 0}%`,
                                                        background: (device.metrics?.memoryUsage || 0) > 80 ? 'var(--error)' : 'var(--success)',
                                                        transition: 'width 0.3s ease'
                                                    }}
                                                ></div>
                                            </div>
                                            <span style={{ fontSize: '10px', fontWeight: 700, width: '24px', textAlign: 'right' }}>{device.metrics?.memoryUsage || 0}%</span>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    {device.location || <span style={{ opacity: 0.5 }}>Não definido</span>}
                                </td>
                                <td className="text-right" style={{ paddingRight: '24px' }}>
                                    <div className="actions-cell" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button
                                            className="btn-icon sm"
                                            onClick={(e) => { e.stopPropagation(); handleEdit(device); }}
                                            title="Editar"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="btn-icon sm"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(device._id); }}
                                            title="Excluir"
                                            style={{ color: 'var(--error)' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredDevices.length === 0 && (
                            <tr>
                                <td colSpan={5} className="empty-row" style={{ textAlign: 'center', padding: '60px 0' }}>
                                    <Network size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                    <p style={{ color: 'var(--text-muted)' }}>Nenhum dispositivo encontrado</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <NetworkDeviceModal
                    device={selectedDevice}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default NetworkDashboard;
