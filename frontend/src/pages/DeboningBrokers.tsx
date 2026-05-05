import React, { useState, useEffect } from 'react';
import deboningBrokerService from '../services/deboningBrokerService';
import { Plus, Edit2, Trash2, Search, User, FileText } from 'lucide-react';

const DeboningBrokers: React.FC = () => {
    const [brokers, setBrokers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBroker, setEditingBroker] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        cpfCnpj: '',
        razaoSocial: '',
        notes: ''
    });

    useEffect(() => {
        fetchBrokers();
    }, []);

    const fetchBrokers = async () => {
        try {
            setLoading(true);
            const data = await deboningBrokerService.getBrokers();
            setBrokers(data);
        } catch (error) {
            alert('Erro ao buscar corretores');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (broker?: any) => {
        if (broker) {
            setEditingBroker(broker);
            setFormData({
                name: broker.name,
                cpfCnpj: broker.cpfCnpj || '',
                razaoSocial: broker.razaoSocial || '',
                notes: broker.notes || ''
            });
        } else {
            setEditingBroker(null);
            setFormData({
                name: '',
                cpfCnpj: '',
                razaoSocial: '',
                notes: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingBroker) {
                await deboningBrokerService.updateBroker(editingBroker._id, formData);
                alert('Corretor atualizado com sucesso');
            } else {
                await deboningBrokerService.createBroker(formData);
                alert('Corretor cadastrado com sucesso');
            }
            setShowModal(false);
            fetchBrokers();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao salvar corretor');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja remover este corretor?')) return;
        try {
            await deboningBrokerService.deleteBroker(id);
            alert('Corretor removido');
            fetchBrokers();
        } catch (error) {
            alert('Erro ao remover corretor');
        }
    };

    const filteredBrokers = brokers.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.cpfCnpj?.includes(searchTerm) ||
        b.razaoSocial?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Corretores de Desossa</h1>
                    <p className="page-subtitle">Gerencie os parceiros e prestadores de serviço da desossa</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={20} /> Novo Corretor
                </button>
            </div>

            <div className="content-card">
                <div className="filter-bar" style={{ marginBottom: '24px' }}>
                    <div className="search-input">
                        <Search size={20} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nome, CNPJ ou razão social..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">Carregando corretores...</div>
                ) : (
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>CPF/CNPJ</th>
                                <th>Razão Social</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBrokers.map(broker => (
                                <tr key={broker._id}>
                                    <td>
                                        <div className="user-info">
                                            <div className="user-avatar">
                                                <User size={18} />
                                            </div>
                                            <div className="user-details">
                                                <span className="user-name">{broker.name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{broker.cpfCnpj || '-'}</td>
                                    <td>{broker.razaoSocial || '-'}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="action-btn edit" onClick={() => handleOpenModal(broker)}>
                                                <Edit2 size={18} />
                                            </button>
                                            <button className="action-btn delete" onClick={() => handleDelete(broker._id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2>{editingBroker ? 'Editar Corretor' : 'Novo Corretor'}</h2>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>Nome do Corretor</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>CPF / CNPJ</label>
                                        <input 
                                            type="text" 
                                            value={formData.cpfCnpj}
                                            onChange={(e) => setFormData({...formData, cpfCnpj: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Razão Social</label>
                                        <input 
                                            type="text" 
                                            value={formData.razaoSocial}
                                            onChange={(e) => setFormData({...formData, razaoSocial: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Observações</label>
                                        <textarea 
                                            rows={3}
                                            value={formData.notes}
                                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary">Salvar Corretor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeboningBrokers;
