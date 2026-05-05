import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Usando instância api centralizada
import { PurchaseRequestModal } from '../components/PurchaseRequestModal';
import { ApprovalModal } from '../components/ApprovalModal';
import { CreateAssetModal } from '../components/CreateAssetModal';
import { useAuth } from '../context/AuthContext';
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
        <div className="purchase-requests-container">
            <div className="page-header">
                <h1>Solicitações de Compra</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <i className="fas fa-plus"></i> Nova Solicitação
                </button>
            </div>

            {/* Filtros */}
            <div className="filters-section">
                <div className="filter-group">
                    <label>Status:</label>
                    <select
                        value={filter.status}
                        onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                    >
                        <option value="">Todos</option>
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

                <div className="filter-group">
                    <label>Urgência:</label>
                    <select
                        value={filter.urgency}
                        onChange={(e) => setFilter({ ...filter, urgency: e.target.value })}
                    >
                        <option value="">Todas</option>
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica</option>
                    </select>
                </div>
            </div>

            {/* Tabela de Solicitações */}
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Número</th>
                            <th>Título</th>
                            <th>Departamento</th>
                            <th>Categoria</th>
                            <th>Valor Total</th>
                            <th>Urgência</th>
                            <th>Status</th>
                            <th>Solicitante</th>
                            <th>Data</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((request) => (
                            <tr key={request._id}>
                                <td>{request.requestNumber}</td>
                                <td>{request.title}</td>
                                <td>{request.department}</td>
                                <td>
                                    <span className="badge badge-info">{request.category}</span>
                                </td>
                                <td className="text-right">{formatCurrency(request.totalValue)}</td>
                                <td>
                                    <span className={`badge ${getUrgencyBadge(request.urgency)}`}>
                                        {request.urgency}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${getStatusBadge(request.status)}`}>
                                        {request.status.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td>{request.requester.name}</td>
                                <td>{formatDate(request.createdAt)}</td>
                                <td>
                                    <div className="action-buttons-group">
                                        <button
                                            className="btn btn-sm btn-info"
                                            onClick={() => setSelectedRequest(request)}
                                            title="Visualizar"
                                        >
                                            <i className="fas fa-eye"></i>
                                        </button>

                                        {/* Botão Submeter para Aprovação */}
                                        {request.status === 'rascunho' && (
                                            <button
                                                className="btn btn-sm btn-success"
                                                onClick={() => handleSubmitForApproval(request._id)}
                                                title="Submeter para Aprovação"
                                            >
                                                <i className="fas fa-paper-plane"></i>
                                            </button>
                                        )}

                                        {/* Botão Aprovar/Reprovar */}
                                        {user?.role === 'admin' && request.status === 'aguardando_aprovacao' && (
                                            <button
                                                className="btn btn-sm btn-warning"
                                                onClick={() => {
                                                    setRequestToApprove({ id: request._id, number: request.requestNumber });
                                                    setShowApprovalModal(true);
                                                }}
                                                title="Aprovar/Reprovar"
                                            >
                                                <i className="fas fa-check-circle"></i>
                                            </button>
                                        )}

                                        {/* Botão Criar Ativo */}
                                        {user?.role === 'admin' && request.status === 'concluido' && (
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => {
                                                    setRequestForAsset(request);
                                                    setShowCreateAssetModal(true);
                                                }}
                                                title="Criar Ativo"
                                            >
                                                <i className="fas fa-box"></i>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {requests.length === 0 && (
                <div className="empty-state">
                    <i className="fas fa-inbox fa-3x"></i>
                    <p>Nenhuma solicitação encontrada</p>
                </div>
            )}

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
