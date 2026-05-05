import React, { useEffect, useState } from 'react';
import { problemService } from '../services';
import { Plus, Search, Edit, Trash2, Link as LinkIcon, TrendingUp } from 'lucide-react';
import '../pages/Tickets.css';
import { StandardFormModal } from '../components/StandardFormModal';

export const Problems: React.FC = () => {
    const [problems, setProblems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedProblem, setSelectedProblem] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'outros',
        priority: 'media',
        impact: 'medio',
        status: 'identificado',
        rootCause: '',
        workaround: '',
        permanentSolution: ''
    });

    useEffect(() => {
        loadProblems();
    }, [filterStatus]);

    const loadProblems = async () => {
        try {
            const params = filterStatus ? { status: filterStatus } : {};
            const data = await problemService.getAll(params);
            setProblems(data.data);
        } catch (error) {
            console.error('Erro ao carregar problemas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedProblem(null);
        setFormData({
            title: '',
            description: '',
            category: 'outros',
            priority: 'media',
            impact: 'medio',
            status: 'identificado',
            rootCause: '',
            workaround: '',
            permanentSolution: ''
        });
        setShowModal(true);
    };

    const handleEdit = (problem: any) => {
        setSelectedProblem(problem);
        setFormData({
            title: problem.title,
            description: problem.description,
            category: problem.category,
            priority: problem.priority,
            impact: problem.impact,
            status: problem.status,
            rootCause: problem.rootCause || '',
            workaround: problem.workaround || '',
            permanentSolution: problem.permanentSolution || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este problema?')) return;

        try {
            await problemService.delete(id);
            loadProblems();
        } catch (error) {
            console.error('Erro ao excluir problema:', error);
            alert('Erro ao excluir problema');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (selectedProblem) {
                await problemService.update(selectedProblem._id, formData);
            } else {
                await problemService.create(formData);
            }
            setShowModal(false);
            loadProblems();
        } catch (error) {
            console.error('Erro ao salvar problema:', error);
            alert('Erro ao salvar problema');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const getStatusColor = (status: string) => {
        const colors: any = {
            identificado: '#f59e0b',
            em_analise: '#3b82f6',
            resolvido: '#10b981',
            fechado: '#64748b'
        };
        return colors[status] || '#64748b';
    };

    const getPriorityColor = (priority: string) => {
        const colors: any = {
            baixa: '#10b981',
            media: '#f59e0b',
            alta: '#f97316',
            critica: '#ef4444'
        };
        return colors[priority] || '#64748b';
    };

    const filteredProblems = problems.filter(problem =>
        problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div><p>Carregando problemas...</p></div>;
    }

    return (
        <div className="tickets-page">
            <div className="page-header">
                <div>
                    <h1>Gestão de Problemas</h1>
                    <p>{filteredProblems.length} problema(s) encontrado(s)</p>
                </div>
                <button className="btn-primary" onClick={handleCreate}>
                    <Plus size={20} />
                    Novo Problema
                </button>
            </div>

            <div className="tickets-toolbar">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Buscar problemas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                >
                    <option value="">Todos os Status</option>
                    <option value="identificado">Identificado</option>
                    <option value="em_analise">Em Análise</option>
                    <option value="resolvido">Resolvido</option>
                    <option value="fechado">Fechado</option>
                </select>
            </div>

            <div className="tickets-table-container">
                <table className="tickets-table">
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Categoria</th>
                            <th>Prioridade</th>
                            <th>Impacto</th>
                            <th>Status</th>
                            <th>Incidentes</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProblems.map((problem) => (
                            <tr key={problem._id}>
                                <td><strong>{problem.title}</strong></td>
                                <td>{problem.category}</td>
                                <td>
                                    <span className="status-badge" style={{ backgroundColor: getPriorityColor(problem.priority) }}>
                                        {problem.priority}
                                    </span>
                                </td>
                                <td>{problem.impact}</td>
                                <td>
                                    <span className="status-badge" style={{ backgroundColor: getStatusColor(problem.status) }}>
                                        {problem.status}
                                    </span>
                                </td>
                                <td>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <LinkIcon size={14} />
                                        {problem.relatedIncidents?.length || 0}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons" style={{ display: 'flex', gap: '6px' }}>
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleEdit(problem)}
                                            title="Editar"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="btn-icon danger"
                                            onClick={() => handleDelete(problem._id)}
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <StandardFormModal
                    isOpen={true}
                    onClose={() => setShowModal(false)}
                    title={selectedProblem ? 'Editar Problema' : 'Novo Problema'}
                    size="md"
                    footer={
                        <div className="sfm-footer-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
                            <button type="button" className="sfm-btn sfm-btn-secondary" onClick={() => setShowModal(false)}>
                                Cancelar
                            </button>
                            <button type="submit" form="problem-form" className="sfm-btn sfm-btn-primary">
                                {selectedProblem ? 'Atualizar' : 'Criar'} Problema
                            </button>
                        </div>
                    }
                >
                    <form id="problem-form" onSubmit={handleSubmit}>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>Título *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div className="form-group">
                                <label>Categoria</label>
                                <select name="category" value={formData.category} onChange={handleChange} style={{ width: '100%' }}>
                                    <option value="hardware">Hardware</option>
                                    <option value="software">Software</option>
                                    <option value="rede">Rede</option>
                                    <option value="acesso">Acesso</option>
                                    <option value="performance">Performance</option>
                                    <option value="seguranca">Segurança</option>
                                    <option value="outros">Outros</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Prioridade</label>
                                <select name="priority" value={formData.priority} onChange={handleChange} style={{ width: '100%' }}>
                                    <option value="baixa">Baixa</option>
                                    <option value="media">Média</option>
                                    <option value="alta">Alta</option>
                                    <option value="critica">Crítica</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div className="form-group">
                                <label>Impacto</label>
                                <select name="impact" value={formData.impact} onChange={handleChange} style={{ width: '100%' }}>
                                    <option value="baixo">Baixo</option>
                                    <option value="medio">Médio</option>
                                    <option value="alto">Alto</option>
                                    <option value="critico">Crítico</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} style={{ width: '100%' }}>
                                    <option value="identificado">Identificado</option>
                                    <option value="em_analise">Em Análise</option>
                                    <option value="resolvido">Resolvido</option>
                                    <option value="fechado">Fechado</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>Descrição *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                required
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>Causa Raiz</label>
                            <textarea
                                name="rootCause"
                                value={formData.rootCause}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Descreva a causa raiz identificada..."
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>Solução de Contorno (Workaround)</label>
                            <textarea
                                name="workaround"
                                value={formData.workaround}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Solução temporária enquanto problema não é resolvido..."
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Solução Permanente</label>
                            <textarea
                                name="permanentSolution"
                                value={formData.permanentSolution}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Solução definitiva para o problema..."
                                style={{ width: '100%' }}
                            />
                        </div>
                    </form>
                </StandardFormModal>
            )}
        </div>
    );
};
