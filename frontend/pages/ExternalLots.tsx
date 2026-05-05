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
                alert('Lote atualizado');
            } else {
                await pcpService.createExternalLot(editingLot!);
                alert('Lote criado');
            }

            setShowModal(false);
            setEditingLot(null);
            fetchLots();
        } catch (error) {
            alert('Erro ao salvar');
        }
    };


    const handleDelete = async (id: string) => {
        if (!window.confirm('Excluir este lote?')) return;
        try {
            await pcpService.deleteExternalLot(id);
            alert('Lote excluído');
            fetchLots();
        } catch (error) {
            alert('Erro ao excluir');
        }

    };

    return (
        <div className="external-lots-container">
            <header className="pcp-header">
                <div className="title-section">
                    <Truck color="var(--primary)" size={32} />
                    <div className="header-title">
                        <h1>Lotes Externos (Terceiros)</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Gerencie lotes de carcaças de fornecedores externos.</p>
                    </div>
                </div>
                <button className="deb-new-btn-primary" onClick={() => { setEditingLot({ arrivalDate: new Date().toISOString().split('T')[0], defaultMarket: 'MI' }); setShowModal(true); }}>
                    <Plus size={18} /> Novo Lote Externo
                </button>
            </header>

            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input type="text" placeholder="Filtrar por fornecedor ou código..." />
                </div>
            </div>

            <div className="deb-new-card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Carregando lotes...</div>
                ) : (
                    <div className="deb-new-table-container" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                        <table className="deb-new-table">
                            <thead>
                                <tr>
                                    <th>Chegada</th>
                                    <th>Código</th>
                                    <th>Fornecedor</th>
                                    <th style={{ textAlign: 'center' }}>Carcaças</th>
                                    <th style={{ textAlign: 'center' }}>Peso (kg)</th>
                                    <th>Destino</th>
                                    <th style={{ textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lots.map(lot => (
                                    <tr key={lot._id}>
                                        <td>{format(new Date(lot.arrivalDate), 'dd/MM/yyyy')}</td>
                                        <td><span className="deb-new-badge info">{lot.externalLotCode}</span></td>
                                        <td style={{ fontWeight: 600 }}>{lot.supplierName}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 800 }}>{lot.carcasses}</td>
                                        <td style={{ textAlign: 'center' }}>{lot.weightInKg ? <strong>{lot.weightInKg.toLocaleString('pt-BR')} kg</strong> : '-'}</td>
                                        <td><span className={`market-badge ${lot.defaultMarket.toLowerCase()}`}>{lot.defaultMarket}</span></td>
                                        <td>
                                            <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                                                <button className="deb-new-btn-icon" onClick={() => { setEditingLot(lot); setShowModal(true); }} title="Editar">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="deb-new-btn-icon danger" onClick={() => handleDelete(lot._id)} title="Excluir">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="deb-modal-overlay">
                    <form className="deb-modal" style={{ maxWidth: '600px' }} onSubmit={handleSave}>
                        <div className="deb-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <ClipboardList color="var(--primary)" size={24} />
                                <h2 style={{ margin: 0, fontWeight: 800 }}>{editingLot?._id ? 'Editar Lote' : 'Novo Lote Externo'}</h2>
                            </div>
                            <button type="button" className="deb-close" onClick={() => setShowModal(false)}>&times;</button>
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
                            <button type="button" className="deb-new-btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button type="submit" className="deb-new-btn-primary">
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
