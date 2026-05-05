import React, { useEffect, useState } from 'react';
import {
    Plus,
    Search,
    Edit,
    Copy,
    Trash2,
    CheckCircle,
    XCircle,
    FileText,
    MoreVertical,
    Filter,
    Play
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { pacService } from '../services/pacService';
import { ChecklistModel } from '../types/pac';
import './ChecklistModelList.css';

export const ChecklistModelList: React.FC = () => {
    const [models, setModels] = useState<ChecklistModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        try {
            const response = await pacService.getModels();
            setModels(response.data || []);
        } catch (err) {
            console.error('Erro ao carregar modelos:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredModels = models.filter(model =>
        model.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loading">Carregando modelos...</div>;

    return (
        <div className="models-page">
            <header className="models-header">
                <div>
                    <h1>Modelos de Checklist</h1>
                    <p>Gerencie os templates de inspeção e frequências</p>
                </div>
                <button className="btn-primary">
                    <Plus size={20} /> Novo Modelo
                </button>
            </header>

            <div className="models-actions">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por título ou código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <button className="btn-filter"><Filter size={18} /> Filtros</button>
                </div>
            </div>

            <div className="models-table-container">
                <table className="models-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Título</th>
                            <th>Programa</th>
                            <th>Área</th>
                            <th>Frequência</th>
                            <th>Status</th>
                            <th>Versão</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredModels.map(model => (
                            <tr key={model._id}>
                                <td className="font-mono">{model.codigo}</td>
                                <td className="font-bold">{model.titulo}</td>
                                <td><span className="prog-badge">{model.programa?.codigo || '---'}</span></td>
                                <td>{model.area?.nome || 'Área não definida'}</td>
                                <td>{model.frequencia}</td>
                                <td>
                                    <span className={`status-pill ${model.status.toLowerCase()}`}>
                                        {model.status === 'Ativo' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                        {model.status}
                                    </span>
                                </td>
                                <td>v{model.versao}</td>
                                <td>
                                    <div className="row-actions">
                                        <button
                                            className="btn-icon primary"
                                            title="Executar Agora"
                                            onClick={() => navigate(`/quality/execute?areaId=${model.area?._id}&modelId=${model._id}`)}
                                        >
                                            <Play size={16} />
                                        </button>
                                        <button className="btn-icon" title="Editar"><Edit size={16} /></button>
                                        <button className="btn-icon" title="Duplicar"><Copy size={16} /></button>
                                        <button className="btn-icon delete" title="Excluir"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredModels.length === 0 && (
                    <div className="no-data-table">Nenhum modelo encontrado.</div>
                )}
            </div>
        </div>
    );
};
