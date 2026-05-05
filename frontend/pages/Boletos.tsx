import React, { useEffect, useState } from 'react';
import { boletoService } from '../services';
import { Plus, DollarSign, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { BoletoModal } from '../components/BoletoModal';
import '../pages/Tickets.css';

export const Boletos: React.FC = () => {
    const [boletos, setBoletos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedBoleto, setSelectedBoleto] = useState<any | null>(null);

    useEffect(() => {
        loadBoletos();
    }, []);

    const loadBoletos = async () => {
        try {
            const response = await boletoService.getAll();
            setBoletos(response.data);
        } catch (error) {
            console.error('Erro ao carregar boletos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBoleto = () => {
        setSelectedBoleto(null);
        setShowModal(true);
    };

    const handleEditBoleto = (boleto: any) => {
        setSelectedBoleto(boleto);
        setShowModal(true);
    };

    const handleDeleteBoleto = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este boleto?')) return;

        try {
            await boletoService.delete(id);
            loadBoletos();
        } catch (error) {
            console.error('Erro ao excluir boleto:', error);
            alert('Erro ao excluir boleto');
        }
    };

    const handleSave = () => {
        loadBoletos();
    };

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div><p>Carregando boletos...</p></div>;
    }

    return (
        <div className="tickets-page">
            <div className="page-header">
                <div>
                    <h1>Gestão de Boletos</h1>
                    <p>{boletos.length} boleto(s)</p>
                </div>
                <button className="btn-primary" onClick={handleCreateBoleto}>
                    <Plus size={20} />
                    Novo Boleto
                </button>
            </div>

            <div className="tickets-table-container">
                <table className="tickets-table">
                    <thead>
                        <tr>
                            <th>Descrição</th>
                            <th>Fornecedor</th>
                            <th>Valor</th>
                            <th>Vencimento</th>
                            <th>Entregar Até</th>
                            <th>Status</th>
                            <th>Observação</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {boletos.map((boleto) => {
                            const isOverdue = new Date(boleto.dueDate) < new Date() && boleto.status === 'pendente';

                            return (
                                <tr key={boleto._id} style={{ background: isOverdue ? '#fee2e2' : 'transparent' }}>
                                    <td>
                                        <strong>{boleto.description}</strong>
                                        {isOverdue && <AlertCircle size={16} color="#ef4444" style={{ marginLeft: 8 }} />}
                                    </td>
                                    <td>{boleto.provider}</td>
                                    <td>
                                        <strong style={{ color: '#10b981' }}>
                                            R$ {boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </strong>
                                    </td>
                                    <td>{new Date(boleto.dueDate).toLocaleDateString('pt-BR')}</td>
                                    <td>{new Date(boleto.deliverByDate).toLocaleDateString('pt-BR')}</td>
                                    <td>
                                        <span
                                            className="status-badge"
                                            style={{
                                                backgroundColor: boleto.status === 'pago' ? '#10b981' : boleto.status === 'atrasado' ? '#ef4444' : '#f59e0b'
                                            }}
                                        >
                                            {boleto.status}
                                        </span>
                                    </td>
                                    <td>{boleto.observation || '-'}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleEditBoleto(boleto)}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="btn-icon danger"
                                                onClick={() => handleDeleteBoleto(boleto._id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <BoletoModal
                    boleto={selectedBoleto}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};
