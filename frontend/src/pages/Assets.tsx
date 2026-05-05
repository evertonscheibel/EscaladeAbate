import React, { useEffect, useState, useRef } from 'react';
import { assetService, maintenanceService } from '../services';
import { Plus, Search, Edit, Trash2, Wrench, Clock, Upload, Download, FileSpreadsheet, Filter, MapPin, Package, Info, History, Loader2 } from 'lucide-react';
import { AssetModal } from '../components/AssetModal';
import { MaintenanceModal } from '../components/MaintenanceModal';
import { AssetTimelineModal } from '../components/AssetTimelineModal';
import { MaintenanceList } from '../components/MaintenanceList';
import './Assets.css';

export const Assets: React.FC = () => {
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [showTimelineModal, setShowTimelineModal] = useState(false);
    const [showMaintenanceList, setShowMaintenanceList] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
    const [selectedMaintenance, setSelectedMaintenance] = useState<any | null>(null);
    const [maintenances, setMaintenances] = useState<any[]>([]);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        try {
            const data = await assetService.getAll();
            setAssets(data);
        } catch (error) {
            console.error('Erro ao carregar ativos:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMaintenances = async (assetId: string) => {
        try {
            const response = await maintenanceService.getByAsset(assetId);
            setMaintenances(response.data);
        } catch (error) {
            console.error('Erro ao carregar manutenções:', error);
        }
    };

    const handleCreateAsset = () => {
        setSelectedAsset(null);
        setShowAssetModal(true);
    };

    const handleEditAsset = (asset: any) => {
        setSelectedAsset(asset);
        setShowAssetModal(true);
    };

    const handleDeleteAsset = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este ativo?')) return;

        try {
            await assetService.delete(id);
            loadAssets();
        } catch (error) {
            console.error('Erro ao excluir ativo:', error);
            alert('Erro ao excluir ativo');
        }
    };

    const handleNewMaintenance = (asset: any) => {
        setSelectedAsset(asset);
        setSelectedMaintenance(null);
        setShowMaintenanceModal(true);
    };

    const handleViewTimeline = (asset: any) => {
        setSelectedAsset(asset);
        setShowTimelineModal(true);
    };

    const handleViewMaintenances = async (asset: any) => {
        setSelectedAsset(asset);
        await loadMaintenances(asset._id);
        setShowMaintenanceList(true);
    };

    const handleEditMaintenance = (maintenance: any) => {
        setSelectedMaintenance(maintenance);
        setShowMaintenanceModal(true);
    };

    const handleDeleteMaintenance = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta manutenção?')) return;

        try {
            await maintenanceService.delete(id);
            if (selectedAsset) {
                await loadMaintenances(selectedAsset._id);
            }
        } catch (error) {
            console.error('Erro ao excluir manutenção:', error);
            alert('Erro ao excluir manutenção');
        }
    };

    const handleSave = () => {
        loadAssets();
    };

    const handleMaintenanceSave = async () => {
        if (selectedAsset) {
            await loadMaintenances(selectedAsset._id);
        }
    };

    const handleExport = async () => {
        try {
            const blob = await assetService.exportAssets();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ativos_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erro ao exportar ativos:', error);
            alert('Erro ao exportar ativos');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await assetService.importAssets(formData);
            alert(`Importação concluída!\nSucesso: ${response.results.success}\nErros: ${response.results.errors}`);
            loadAssets();
        } catch (error) {
            console.error('Erro ao importar ativos:', error);
            alert('Erro ao importar ativos. Verifique se o arquivo é um Excel válido.');
        } finally {
            setImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const uniqueLocations = Array.from(new Set(assets.map(a => a.location).filter(Boolean))).sort();

    const filteredAssets = assets.filter(asset => {
        const matchesSearch = (asset.assetId?.toString().toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (asset.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesLocation = filterLocation ? asset.location === filterLocation : true;
        const matchesStatus = filterStatus ? asset.status === filterStatus : true;
        const matchesType = filterType ? asset.type === filterType : true;
        return matchesSearch && matchesLocation && matchesStatus && matchesType;
    });

    const totalValue = filteredAssets.reduce((sum, asset) => sum + (asset.purchaseValue || 0), 0);

    const clearFilters = () => {
        setSearchTerm('');
        setFilterLocation('');
        setFilterStatus('');
        setFilterType('');
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const assetStatusOptions = [
        { value: 'ativo', label: 'Ativo' },
        { value: 'em_manutencao', label: 'Em Manutenção' },
        { value: 'disponivel', label: 'Disponível' },
        { value: 'descartado', label: 'Descartado' },
        { value: 'perdido', label: 'Perdido' }
    ];

    const assetTypeOptions = [
        { value: 'notebook', label: 'Notebook' },
        { value: 'desktop', label: 'Desktop' },
        { value: 'monitor', label: 'Monitor' },
        { value: 'impressora', label: 'Impressora' },
        { value: 'servidor', label: 'Servidor' },
        { value: 'rede', label: 'Rede' },
        { value: 'periferico', label: 'Periférico' },
        { value: 'software', label: 'Software' },
        { value: 'outro', label: 'Outro' }
    ];

    if (loading) {
        return <div className="loading-state">Carregando ativos corporativos...</div>;
    }

    return (
        <div className="assets-page-container">
            <header className="page-header">
                <div className="header-info">
                    <h1>Gestão de Ativos & Inventário</h1>
                    <p>Controle de hardware, software e ciclo de vida de ativos TI</p>
                </div>
                <div className="header-actions">
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                    />
                    <button
                        className="btn-secondary"
                        onClick={handleImportClick}
                        disabled={importing}
                        title="Importar de Excel"
                    >
                        {importing ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                        <span>Importar</span>
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={handleExport}
                        title="Exportar para Excel"
                    >
                        <Download size={20} />
                        <span>Exportar</span>
                    </button>
                    <button className="btn-primary" onClick={handleCreateAsset}>
                        <Plus size={20} />
                        Novo Ativo
                    </button>
                </div>
            </header>

            <div className="reports-kpi-grid" style={{ marginBottom: '32px' }}>
                <div className="analysis-card">
                    <div className="kpi-value">{assets.length}</div>
                    <div className="kpi-label">Ativos Totais</div>
                </div>
                <div className="analysis-card">
                    <div className="kpi-value">{filteredAssets.length}</div>
                    <div className="kpi-label">Ativos Filtrados</div>
                </div>
                <div className="analysis-card">
                    <div className="kpi-value">{formatCurrency(totalValue)}</div>
                    <div className="kpi-label">Patrimônio Estimado</div>
                </div>
                <div className="analysis-card">
                    <div className="kpi-value" style={{ color: 'var(--warning)' }}>
                        {assets.filter(a => a.status === 'em_manutencao').length}
                    </div>
                    <div className="kpi-label">Em Manutenção</div>
                </div>
            </div>

            <div className="filter-bar">
                <div className="filter-item" style={{ flex: 1 }}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por ID, Hostname ou Descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-item">
                    <Filter size={18} />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">Todos Status</option>
                        {assetStatusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-item">
                    <Package size={18} />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="">Todos Tipos</option>
                        {assetTypeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-item">
                    <MapPin size={18} />
                    <select
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                    >
                        <option value="">Todas Localizações</option>
                        {uniqueLocations.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </select>
                </div>

                {(searchTerm || filterLocation || filterStatus || filterType) && (
                    <button className="btn-secondary" onClick={clearFilters}>
                        Limpar Filtros
                    </button>
                )}
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Etiqueta / ID</th>
                            <th>Ativo / Hostname</th>
                            <th>Modelo / Specs</th>
                            <th>Identificação Rede</th>
                            <th>Localização</th>
                            <th className="text-center">Status</th>
                            <th>Responsável</th>
                            <th className="text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAssets.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="empty-state">Nenhum ativo encontrado para os filtros selecionados.</td>
                            </tr>
                        ) : (
                            filteredAssets.map((asset) => (
                                <tr key={asset._id}>
                                    <td style={{ fontWeight: 900, color: 'var(--primary)' }}>{asset.assetId}</td>
                                    <td>
                                        <div className="stack-info">
                                            <span style={{ fontWeight: 700 }}>{asset.hostname || 'Sem Hostname'}</span>
                                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>{asset.description}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{asset.model || asset.specs?.model || '-'}</div>
                                    </td>
                                    <td>
                                        <div className="stack-info" style={{ fontSize: '0.75rem' }}>
                                            <span style={{ fontWeight: 700 }}>IP: {asset.ipAddress || 'Não definido'}</span>
                                            <span className="text-muted">MAC: {asset.macAddress || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="location-badge-mini">
                                            <MapPin size={12} />
                                            {asset.location || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <span className={`status-badge-premium ${asset.status === 'ativo' || asset.status === 'disponivel' ? 'success' : asset.status === 'em_manutencao' ? 'warning' : 'danger'}`}>
                                            {asset.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>{asset.assignedTo?.name || asset.responsible?.name || 'Não atribuído'}</td>
                                    <td className="text-right">
                                        <div className="action-buttons">
                                            <button
                                                className="btn-icon info"
                                                onClick={() => handleViewMaintenances(asset)}
                                                title="Manutenções"
                                            >
                                                <Wrench size={16} />
                                            </button>
                                            <button
                                                className="btn-icon success"
                                                onClick={() => handleNewMaintenance(asset)}
                                                title="Registrar Manutenção"
                                            >
                                                <Plus size={16} />
                                            </button>
                                            <button
                                                className="btn-icon warning"
                                                onClick={() => handleViewTimeline(asset)}
                                                title="Timeline / Histórico"
                                            >
                                                <History size={16} />
                                            </button>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleEditAsset(asset)}
                                                title="Editar Ativo"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="btn-icon danger"
                                                onClick={() => handleDeleteAsset(asset._id)}
                                                title="Remover"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showAssetModal && (
                <AssetModal
                    asset={selectedAsset}
                    onClose={() => setShowAssetModal(false)}
                    onSave={handleSave}
                />
            )}

            {showMaintenanceModal && selectedAsset && (
                <MaintenanceModal
                    maintenance={selectedMaintenance}
                    assetId={selectedAsset._id}
                    onClose={() => {
                        setShowMaintenanceModal(false);
                        setSelectedMaintenance(null);
                    }}
                    onSave={handleMaintenanceSave}
                />
            )}

            {showTimelineModal && selectedAsset && (
                <AssetTimelineModal
                    assetId={selectedAsset._id}
                    assetName={`${selectedAsset.assetId} - ${selectedAsset.description}`}
                    onClose={() => setShowTimelineModal(false)}
                />
            )}

            {showMaintenanceList && selectedAsset && (
                <div className="modal-overlay" onClick={() => setShowMaintenanceList(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                        <div className="modal-header">
                            <div className="header-info">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Wrench size={20} className="text-primary" />
                                    <h2>Manutenções do Ativo</h2>
                                </div>
                                <p>
                                    {selectedAsset.assetId} - {selectedAsset.description}
                                </p>
                            </div>
                            <button className="close-btn" onClick={() => setShowMaintenanceList(false)}>
                                <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: '24px' }}>
                                <button
                                    className="btn-primary"
                                    onClick={() => {
                                        setShowMaintenanceList(false);
                                        handleNewMaintenance(selectedAsset);
                                    }}
                                >
                                    <Plus size={18} /> Nova Manutenção
                                </button>
                            </div>
                            <MaintenanceList
                                maintenances={maintenances}
                                onEdit={handleEditMaintenance}
                                onDelete={handleDeleteMaintenance}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Assets;
