import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Truck,
    Edit2,
    Trash2,
    Save,
    X,
    ClipboardList
} from 'lucide-react';

import pcpService from '../services/pcpService';
import { ExternalLot } from '../types/pcp';
import { format } from 'date-fns';
import './ExternalLots.css';

const ExternalLots: React.FC = () => {
    const [lots, setLots] = useState<ExternalLot[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLot, setEditingLot] = useState<Partial<ExternalLot> | null>(null);

    useEffect(() => {
        fetchLots();
    }, []);

    const fetchLots = async () => {
        try {
            setLoading(true);
            const data = await pcpService.getExternalLots();
            setLots(data || []);
        } catch (error) {
            console.error('Erro ao buscar lotes externos:', error);
            alert('Erro ao buscar lotes externos');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingLot?._id) {
                await pcpService.updateExternalLot(editingLot._id, editingLot);
                alert('Lote atualizado com sucesso');
            } else {
                await pcpService.createExternalLot(editingLot!);
                alert('Lote criado com sucesso');
            }

            setShowModal(false);
            setEditingLot(null);
            fetchLots();
        } catch (error) {
            console.error('Erro ao salvar lote:', error);
            alert('Erro ao salvar lote');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este lote externo?')) return;
        try {
            await pcpService.deleteExternalLot(id);
            alert('Lote excluído');
            fetchLots();
        } catch (error) {
            console.error('Erro ao excluir lote:', error);
            alert('Erro ao excluir lote');
        }
    };

    return (
        <div className="external-lots-container">
            <header className="page-header">
                <div className="header-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Truck className="text-primary" size={32} />
                        <div>
                            <h1>Lotes Externos (Terceiros)</h1>
                            <p>Gerencie lotes de carcaças de fornecedores externos</p>
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => { setEditingLot({ arrivalDate: new Date().toISOString().split('T')[0], defaultMarket: 'MI' }); setShowModal(true); }}>
                        <Plus size={18} /> Novo Lote Externo
                    </button>
                </div>
            </header>

            <div className="filter-bar-premium" style={{ marginBottom: '24px' }}>
                <div className="search-box-premium">
                    <Search size={18} />
                    <input type="text" placeholder="Filtrar por fornecedor ou código..." />
                </div>
            </div>

            <div className="table-container">
                {loading ? (
                    <div className="loading-state">Carregando lotes industriais...</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Chegada</th>
                                <th>Código</th>
                                <th>Fornecedor</th>
                                <th className="text-center">Carcaças</th>
                                <th className="text-center">Peso (kg)</th>
                                <th>Destino</th>
                                <th className="text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lots.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="empty-state">Nenhum lote externo registrado.</td>
                                </tr>
                            ) : (
                                lots.map(lot => (
                                    <tr key={lot._id}>
                                        <td>{format(new Date(lot.arrivalDate), 'dd/MM/yyyy')}</td>
                                        <td>
                                            <span className="status-badge-premium info" style={{ fontWeight: 800 }}>
                                                {lot.externalLotCode}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 700 }}>{lot.supplierName}</td>
                                        <td className="text-center" style={{ fontWeight: 800 }}>{lot.carcasses}</td>
                                        <td className="text-center">
                                            {lot.weightInKg ? (
                                                <span className="text-primary" style={{ fontWeight: 700 }}>
                                                    {lot.weightInKg.toLocaleString('pt-BR')} kg
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            <span className={`market-badge ${lot.defaultMarket.toLowerCase()}`}>
                                                {lot.defaultMarket}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div className="action-buttons">
                                                <button className="btn-icon" onClick={() => { setEditingLot(lot); setShowModal(true); }} title="Editar">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="btn-icon danger" onClick={() => handleDelete(lot._id)} title="Excluir">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="deb-modal-overlay">
                    <form className="deb-modal" onSubmit={handleSave}>
                        <div className="deb-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <ClipboardList color="var(--primary)" size={24} />
                                <h2 style={{ margin: 0, fontWeight: 800 }}>
                                    {editingLot?._id ? 'Editar Lote' : 'Novo Lote Externo'}
                                </h2>
                            </div>
                            <button type="button" className="deb-close" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="deb-modal-body">
                            <div className="deb-new-form-inline">
                                <div className="deb-new-form-group">
                                    <label>Código do Lote</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: LOTE-001"
                                        value={editingLot?.externalLotCode || ''}
                                        onChange={(e) => setEditingLot({ ...editingLot!, externalLotCode: e.target.value })}
                                    />
                                </div>
                                <div className="deb-new-form-group">
                                    <label>Data de Chegada</label>
                                    <input
                                        type="date"
                                        required
                                        value={editingLot?.arrivalDate?.split('T')[0] || ''}
                                        onChange={(e) => setEditingLot({ ...editingLot!, arrivalDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="deb-new-form-group" style={{ marginTop: '16px' }}>
                                <label>Fornecedor</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Nome do Fornecedor / Origem"
                                    value={editingLot?.supplierName || ''}
                                    onChange={(e) => setEditingLot({ ...editingLot!, supplierName: e.target.value })}
                                />
                            </div>

                            <div className="deb-new-form-inline" style={{ marginTop: '16px' }}>
                                <div className="deb-new-form-group">
                                    <label>Quantidade de Carcaças</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={editingLot?.carcasses || 0}
                                        onChange={(e) => setEditingLot({ ...editingLot!, carcasses: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="deb-new-form-group">
                                    <label>Peso Total (Kg)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Opcional"
                                        value={editingLot?.weightInKg || ''}
                                        onChange={(e) => setEditingLot({ ...editingLot!, weightInKg: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="deb-new-form-group" style={{ marginTop: '16px' }}>
                                <label>Mercado Destino Padrão</label>
                                <select
                                    value={editingLot?.defaultMarket || 'MI'}
                                    onChange={(e) => setEditingLot({ ...editingLot!, defaultMarket: e.target.value as any })}
                                >
                                    <option value="MI">Mercado Interno (MI)</option>
                                    <option value="EXP">Exportação (EXP)</option>
                                    <option value="MI_EXP">MI & EXP</option>
                                    <option value="IND">Industrialização (IND)</option>
                                </select>
                            </div>
                        </div>
                        <div className="deb-modal-footer">
                            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button type="submit" className="btn-primary">
                                <Save size={18} /> {editingLot?._id ? 'Atualizar Lote' : 'Criar Lote'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ExternalLots;
