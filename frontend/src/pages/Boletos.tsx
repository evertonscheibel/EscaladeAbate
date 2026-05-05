import React, { useEffect, useState } from 'react';
import { boletoService } from '../services';
import { Plus, DollarSign, AlertCircle, Edit, Trash2, Calendar, FileText, ChevronRight } from 'lucide-react';
import { BoletoModal } from '../components/BoletoModal';
import './Boletos.css';

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
        return <div className="loading-state">Carregando documentos financeiros...</div>;
    }

    return (
        <div className="boletos-page-container">
            <header className="page-header">
                <div className="header-info">
                    <h1>Gestão de Boletos</h1>
                    <p>{boletos.length} documento(s) financeiro(s) registrados</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={handleCreateBoleto}>
                        <Plus size={20} />
                        Novo Boleto
                    </button>
                </div>
            </header>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Descrição / Doc</th>
                            <th>Fornecedor</th>
                            <th className="text-right">Valor</th>
                            <th className="text-center">Vencimento</th>
                            <th className="text-center">Status</th>
                            <th>Observação</th>
                            <th className="text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {boletos.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="empty-state">Nenhum boleto encontrado.</td>
                            </tr>
                        ) : (
                            boletos.map((boleto) => {
                                const isOverdue = new Date(boleto.dueDate) < new Date() && boleto.status !== 'pago';

                                return (
                                    <tr key={boleto._id} className={isOverdue ? 'row-danger' : ''}>
                                        <td>
                                            <div className="stack-info" style={{ gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <FileText size={16} className="text-muted" />
                                                    <span style={{ fontWeight: 800 }}>{boleto.description}</span>
                                                </div>
                                                {isOverdue && (
                                                    <span className="overdue-badge">
                                                        <AlertCircle size={10} /> ATRASADO
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 700 }}>{boleto.provider}</td>
                                        <td className="text-right">
                                            <span className={`currency-value ${isOverdue ? 'danger' : 'success'}`}>
                                                R$ {boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <div className="date-badge-mini" style={{ color: isOverdue ? 'var(--error)' : 'inherit', fontWeight: 800 }}>
                                                <Calendar size={14} />
                                                {new Date(boleto.dueDate).toLocaleDateString('pt-BR')}
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <span className={`status-badge-premium ${boleto.status === 'pago' ? 'success' : boleto.status === 'atrasado' || isOverdue ? 'danger' : 'warning'}`}>
                                                {boleto.status}
                                            </span>
                                        </td>
                                        <td className="text-muted" style={{ fontSize: '0.813rem' }}>{boleto.observation || '-'}</td>
                                        <td className="text-right">
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleEditBoleto(boleto)}
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="btn-icon danger"
                                                    onClick={() => handleDeleteBoleto(boleto._id)}
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
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

export default Boletos;
