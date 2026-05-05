import React, { useEffect, useState } from 'react';
import { certificateService } from '../services';
import { Plus, Search, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { CertificateModal } from '../components/CertificateModal';
import '../pages/Tickets.css';

export const Certificates: React.FC = () => {
    const [certificates, setCertificates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null);

    useEffect(() => {
        loadCertificates();
    }, []);

    const loadCertificates = async () => {
        try {
            const response = await certificateService.getAll();
            setCertificates(response.data);
        } catch (error) {
            console.error('Erro ao carregar certificados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCertificate = () => {
        setSelectedCertificate(null);
        setShowModal(true);
    };

    const handleEditCertificate = (cert: any) => {
        setSelectedCertificate(cert);
        setShowModal(true);
    };

    const handleDeleteCertificate = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este certificado?')) return;

        try {
            await certificateService.delete(id);
            loadCertificates();
        } catch (error) {
            console.error('Erro ao excluir certificado:', error);
            alert('Erro ao excluir certificado');
        }
    };

    const handleSave = () => {
        loadCertificates();
    };

    const getDaysUntilExpiration = (expirationDate: string) => {
        const diff = new Date(expirationDate).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div><p>Carregando certificados...</p></div>;
    }

    return (
        <div className="tickets-page">
            <div className="page-header">
                <div>
                    <h1>Certificados e Licenças</h1>
                    <p>{certificates.length} certificado(s)</p>
                </div>
                <button className="btn-primary" onClick={handleCreateCertificate}>
                    <Plus size={20} />
                    Novo Certificado
                </button>
            </div>

            <div className="tickets-table-container">
                <table className="tickets-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Tipo</th>
                            <th>Fornecedor</th>
                            <th>Emissão</th>
                            <th>Expiração</th>
                            <th>Dias Restantes</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {certificates.map((cert) => {
                            const daysLeft = getDaysUntilExpiration(cert.expirationDate);
                            const isExpiring = daysLeft <= 30;

                            return (
                                <tr key={cert._id} style={{ background: isExpiring ? '#fef3c7' : 'transparent' }}>
                                    <td>
                                        <strong>{cert.name}</strong>
                                        {isExpiring && <AlertTriangle size={16} color="#f59e0b" style={{ marginLeft: 8 }} />}
                                    </td>
                                    <td><span className="category-badge">{cert.type}</span></td>
                                    <td>{cert.provider || 'N/A'}</td>
                                    <td>{new Date(cert.issueDate).toLocaleDateString('pt-BR')}</td>
                                    <td>{new Date(cert.expirationDate).toLocaleDateString('pt-BR')}</td>
                                    <td>
                                        <strong style={{ color: daysLeft < 7 ? '#ef4444' : daysLeft < 30 ? '#f59e0b' : '#10b981' }}>
                                            {daysLeft} dias
                                        </strong>
                                    </td>
                                    <td>
                                        <span className="status-badge" style={{ backgroundColor: cert.status === 'ativo' ? '#10b981' : '#64748b' }}>
                                            {cert.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleEditCertificate(cert)}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="btn-icon danger"
                                                onClick={() => handleDeleteCertificate(cert._id)}
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
                <CertificateModal
                    certificate={selectedCertificate}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};
