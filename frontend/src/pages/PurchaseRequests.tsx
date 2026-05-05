import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Usando instância api centralizada
import { PurchaseRequestModal } from '../components/PurchaseRequestModal';
import { ApprovalModal } from '../components/ApprovalModal';
import { CreateAssetModal } from '../components/CreateAssetModal';
import { useAuth } from '../context/AuthContext';
import { Plus, Filter, AlertTriangle, Eye, Send, CheckCircle, Package, Search } from 'lucide-react';
import '../styles/PurchaseManagement.css';

interface PurchaseRequest {
    _id: string;
    requestNumber: string;
    title: string;
    description: string;
    category: string;
    quantity: number;
    estimatedValue: number;
    totalValue: number;
    department: string;
    urgency: string;
    justification: string;
    status: string;
    requester: { name: string };
    createdAt: string;
}

const PurchaseRequests: React.FC = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<PurchaseRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: '', department: '', urgency: '' });
    const [showModal, setShowModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [requestToApprove, setRequestToApprove] = useState<{ id: string; number: string } | null>(null);
    const [showCreateAssetModal, setShowCreateAssetModal] = useState(false);
    const [requestForAsset, setRequestForAsset] = useState<PurchaseRequest | null>(null);

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (filter.status) params.append('status', filter.status);
            if (filter.department) params.append('department', filter.department);
            if (filter.urgency) params.append('urgency', filter.urgency);

            const response = await api.get(`/purchase-requests?${params}`);
            console.log('Dados recebidos:', response.data.data);
            console.log('Primeira solicitação:', response.data.data[0]);
            setRequests(response.data.data);
        } catch (error) {
            console.error('Erro ao buscar solicitações:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitForApproval = async (requestId: string) => {
        console.log('Request ID recebido:', requestId);
        if (!confirm('Deseja submeter esta solicitação para aprovação?')) return;

        try {
            console.log('Enviando para:', `/purchase-requests/${requestId}/submit`);
            await api.post(`/purchase-requests/${requestId}/submit`);
            alert('Solicitação submetida para aprovação com sucesso!');
            fetchRequests();
        } catch (error: any) {
            console.error('Erro completo:', error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
            alert(`Erro ao submeter: ${errorMessage}`);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, string> = {
            rascunho: 'badge-secondary',
            aguardando_cotacao: 'badge-info',
            em_cotacao: 'badge-primary',
            aguardando_aprovacao: 'badge-warning',
            aprovado: 'badge-success',
            rejeitado: 'badge-danger',
            cancelado: 'badge-dark',
            concluido: 'badge-success'
        };
        return statusMap[status] || 'badge-secondary';
    };

    const getUrgencyBadge = (urgency: string) => {
        const urgencyMap: Record<string, string> = {
            baixa: 'badge-info',
            media: 'badge-primary',
            alta: 'badge-warning',
            critica: 'badge-danger'
        };
        return urgencyMap[urgency] || 'badge-secondary';
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    if (loading) {
        return <div className="loading">Carregando...</div>;
    }

    return (
        <div className="purchase-page-container">
            <header className="page-header">
                <div className="page-title-group">
                    <h1>Solicitações de Compra</h1>
                    <p className="page-subtitle">Gestão centralizada de suprimentos e aprovações</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} /> Nova Solicitação
                    </button>
                </div>
            </header>

            <div className="filter-bar">
                <div className="filter-item">
                    <Filter size={18} />
                    <select
                        value={filter.status}
                        onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                        className="form-control"
                    >
                        <option value="">Todos os Status</option>
                        <option value="rascunho">Rascunho</option>
                        <option value="aguardando_cotacao">Aguardando Cotação</option>
                        <option value="em_cotacao">Em Cotação</option>
                        <option value="aguardando_aprovacao">Aguardando Aprovação</option>
                        <option value="aprovado">Aprovado</option>
                        <option value="rejeitado">Rejeitado</option>
                        <option value="cancelado">Cancelado</option>
                        <option value="concluido">Concluído</option>
                    </select>
                </div>

                <div className="filter-item">
                    <AlertTriangle size={18} />
                    <select
                        value={filter.urgency}
                        onChange={(e) => setFilter({ ...filter, urgency: e.target.value })}
                        className="form-control"
                    >
                        <option value="">Todas as Urgências</option>
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica</option>
                    </select>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Número</th>
                            <th>Título</th>
                            <th>Departamento</th>
                            <th className="text-right">Valor Total</th>
                            <th className="text-center">Urgência</th>
                            <th className="text-center">Status</th>
                            <th>Solicitante</th>
                            <th>Data</th>
                            <th className="text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="empty-state">
                                    <Search size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                    <p>Nenhuma solicitação encontrada</p>
                                </td>
                            </tr>
                        ) : (
                            requests.map((request) => (
                                <tr key={request._id}>
                                    <td style={{ fontWeight: 800 }}>{request.requestNumber}</td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{request.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{request.category}</div>
                                    </td>
                                    <td>{request.department}</td>
                                    <td className="text-right" style={{ fontWeight: 800, color: 'var(--success)' }}>
                                        {formatCurrency(request.totalValue)}
                                    </td>
                                    <td className="text-center">
                                        <span className={`badge ${getUrgencyBadge(request.urgency)}`}>
                                            {request.urgency}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <span className={`status-badge status-${request.status === 'aprovado' || request.status === 'concluido' ? 'resolvido' : request.status === 'rejeitado' ? 'aberto' : 'pendente'}`}>
                                            {request.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td>{request.requester.name}</td>
                                    <td>{formatDate(request.createdAt)}</td>
                                    <td className="text-right">
                                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn-icon"
                                                onClick={() => setSelectedRequest(request)}
                                                title="Visualizar"
                                            >
                                                <Eye size={16} />
                                            </button>

                                            {request.status === 'rascunho' && (
                                                <button
                                                    className="btn-icon success"
                                                    onClick={() => handleSubmitForApproval(request._id)}
                                                    title="Submeter para Aprovação"
                                                >
                                                    <Send size={16} />
                                                </button>
                                            )}

                                            {user?.role === 'admin' && request.status === 'aguardando_aprovacao' && (
                                                <button
                                                    className="btn-icon warning"
                                                    onClick={() => {
                                                        setRequestToApprove({ id: request._id, number: request.requestNumber });
                                                        setShowApprovalModal(true);
                                                    }}
                                                    title="Aprovar/Reprovar"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}

                                            {user?.role === 'admin' && request.status === 'concluido' && (
                                                <button
                                                    className="btn-icon info"
                                                    onClick={() => {
                                                        setRequestForAsset(request);
                                                        setShowCreateAssetModal(true);
                                                    }}
                                                    title="Criar Ativo"
                                                >
                                                    <Package size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Solicitação */}
            {showModal && (
                <PurchaseRequestModal
                    request={selectedRequest}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedRequest(null);
                    }}
                    onSuccess={() => {
                        fetchRequests();
                    }}
                />
            )}

            {/* Modal de Aprovação */}
            {showApprovalModal && requestToApprove && (
                <ApprovalModal
                    requestId={requestToApprove.id}
                    requestNumber={requestToApprove.number}
                    onClose={() => {
                        setShowApprovalModal(false);
                        setRequestToApprove(null);
                    }}
                    onSuccess={() => {
                        fetchRequests();
                    }}
                />
            )}

            {/* Modal de Criar Ativo */}
            {showCreateAssetModal && requestForAsset && (
                <CreateAssetModal
                    requestId={requestForAsset._id}
                    requestNumber={requestForAsset.requestNumber}
                    requestTitle={requestForAsset.title}
                    requestValue={requestForAsset.totalValue}
                    requestDepartment={requestForAsset.department}
                    onClose={() => {
                        setShowCreateAssetModal(false);
                        setRequestForAsset(null);
                    }}
                    onSuccess={() => {
                        fetchRequests();
                    }}
                />
            )}
        </div>
    );
};

export default PurchaseRequests;
