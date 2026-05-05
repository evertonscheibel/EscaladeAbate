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
        <div className="netguard-container">
            <div className="netguard-content full-width">
                {/* Main Content */}
                <main className="netguard-main">
                    {/* Toolbar */}
                    <div className="inventory-toolbar">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search inventory..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="filter-select-wrapper">
                            <select
                                className="filter-select"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="all">Todos os tipos</option>
                                <option value="switches">Switches</option>
                                <option value="aps">APs</option>
                                <option value="servers">Servers</option>
                                <option value="cameras">Cameras</option>
                            </select>
                        </div>

                        <div className="toolbar-actions">
                            {/* AI Button Removed */}
                            <button className="btn-refresh" onClick={handleRefresh} disabled={refreshing}>
                                <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                            />
                            <button className="btn-import" onClick={handleImportClick} disabled={importing}>
                                {importing ? <div className="spinner-small"></div> : <Upload size={18} />}
                            </button>
                            <button className="btn-add" onClick={handleCreate}>
                                <Plus size={18} />
                                Add Device
                            </button>
                        </div>
                    </div>

                    {/* Inventory Table */}
                    <div className="inventory-table-container">
                        <table className="inventory-table">
                            <thead>
                                <tr>
                                    <th>DEVICE</th>
                                    <th>STATUS</th>
                                    <th>PERFORMANCE</th>
                                    <th>LOCATION</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDevices.map((device) => (
                                    <tr key={device._id} onClick={() => handleEdit(device)}>
                                        <td>
                                            <div className="device-cell">
                                                <span className="device-icon">{getTypeIcon(device.type)}</span>
                                                <div className="device-info">
                                                    <span className="device-name">{device.name}</span>
                                                    <span className="device-ip">{device.ipAddress}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{getStatusBadge(device.status)}</td>
                                        <td>
                                            <div className="performance-cell">
                                                <div className="perf-row">
                                                    <span className="perf-label">CPU</span>
                                                    <div className="perf-bar">
                                                        <div
                                                            className={`perf-bar-fill ${(device.metrics?.cpuUsage || 0) > 80 ? 'high' : ''}`}
                                                            style={{ width: `${device.metrics?.cpuUsage || 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div className="perf-row">
                                                    <span className="perf-label">MEM</span>
                                                    <div className="perf-bar">
                                                        <div
                                                            className={`perf-bar-fill ${(device.metrics?.memoryUsage || 0) > 80 ? 'high' : ''}`}
                                                            style={{ width: `${device.metrics?.memoryUsage || 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="location-cell">{device.location || '-'}</td>
                                        <td>
                                            <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    className="action-btn edit"
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(device); }}
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(device._id); }}
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredDevices.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="empty-row">
                                            <Network size={40} />
                                            <span>Nenhum dispositivo encontrado</span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </main>
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
