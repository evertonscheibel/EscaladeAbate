import React, { useEffect, useState } from 'react';
import {
    FileText,
    Download,
    Plus,
    Search,
    Calendar,
    Shield,
    CheckCircle2,
    Clock,
    Filter
} from 'lucide-react';
import { pacService } from '../services/pacService';
import './AuditPackageList.css';

export const AuditPackageList: React.FC = () => {
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        loadPackages();
    }, []);

    const loadPackages = async () => {
        try {
            const response = await pacService.getAuditPackages();
            setPackages(response.data || []);
        } catch (err) {
            console.error('Erro ao carregar pacotes de auditoria:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Carregando pacotes de auditoria...</div>;

    return (
        <div className="audit-page">
            <header className="audit-header">
                <div>
                    <h1>Pacotes de Auditoria</h1>
                    <p>Geração de registros imutáveis para fiscalização (SIF/DIPOA)</p>
                </div>
                <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus size={20} /> Gerar Novo Pacote
                </button>
            </header>

            <div className="audit-grid">
                {packages.length === 0 ? (
                    <div className="no-data-card">
                        <FileText size={48} />
                        <p>Nenhum pacote de auditoria gerado ainda.</p>
                    </div>
                ) : (
                    packages.map(pkg => (
                        <div key={pkg._id} className="audit-card">
                            <div className="audit-card-icon">
                                <Shield size={32} />
                            </div>
                            <div className="audit-card-body">
                                <div className="audit-card-header">
                                    <span className="audit-code">{pkg.codigo_pacote}</span>
                                    <span className={`audit-status ${pkg.status.toLowerCase()}`}>{pkg.status}</span>
                                </div>
                                <h3 className="audit-title">{pkg.titulo}</h3>
                                <div className="audit-meta">
                                    <span><Calendar size={14} /> {pkg.periodo.inicio} - {pkg.periodo.fim}</span>
                                    <span><Clock size={14} /> Gerado em: {new Date(pkg.data_geracao).toLocaleDateString()}</span>
                                </div>
                                <div className="audit-programs">
                                    {pkg.programas.map((p: any) => (
                                        <span key={p._id} className="prog-tag">{p?.codigo || '---'}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="audit-card-footer">
                                <button className="btn-download">
                                    <Download size={18} /> Exportar PDF
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de criação simplificado por ora */}
            {isCreateModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Gerar Pacote Auditoria (SIF)</h2>
                        <form className="audit-form" onSubmit={(e) => {
                            e.preventDefault();
                            // Logic to create package
                            setIsCreateModalOpen(false);
                        }}>
                            <div className="form-group">
                                <label>Título do Pacote</label>
                                <input type="text" placeholder="Ex: PAC Março 2024 - BPF/PPHO" required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Data Início</label>
                                    <input type="date" required />
                                </div>
                                <div className="form-group">
                                    <label>Data Fim</label>
                                    <input type="date" required />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">Gerar Registros</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
