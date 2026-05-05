import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    CheckCircle,
    XCircle,
    MinusCircle,
    AlertTriangle,
    Save,
    ChevronLeft,
    Clock,
    User,
    Info,
    MapPin
} from 'lucide-react';
import { pacService } from '../services/pacService';
import { ChecklistModel, ProductionArea, ChecklistExecution } from '../types/pac';
import './ChecklistExecution.css';

export const ChecklistExecutionPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const areaId = searchParams.get('areaId');
    const modelId = searchParams.get('modelId');

    const [loading, setLoading] = useState(true);
    const [models, setModels] = useState<ChecklistModel[]>([]);
    const [selectedModel, setSelectedModel] = useState<ChecklistModel | null>(null);
    const [area, setArea] = useState<ProductionArea | null>(null);
    const [execution, setExecution] = useState<ChecklistExecution | null>(null);
    const [responses, setResponses] = useState<any>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (areaId) {
            loadInitialData();
        }
    }, [areaId]);

    const loadInitialData = async () => {
        try {
            const areasResponse = await pacService.getAreas();
            const foundArea = areasResponse.data.find((a: any) => a._id === areaId);
            setArea(foundArea);

            const modelsResponse = await pacService.getModels({ area: areaId, status: 'Ativo' });
            const fetchedModels = modelsResponse.data || [];
            setModels(fetchedModels);

            // Se vier um modelId pela URL, tenta iniciar automaticamente
            if (modelId) {
                const autoModel = fetchedModels.find((m: any) => m._id === modelId);
                if (autoModel) {
                    handleStartExecution(autoModel);
                }
            }
        } catch (err) {
            console.error('Erro ao carregar dados iniciais:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartExecution = async (model: ChecklistModel) => {
        try {
            setSaving(true);
            const response = await pacService.openExecution(model._id, areaId!, 'A'); // Turno mockado por ora
            setExecution(response.data);
            setSelectedModel(model);

            // Inicializar respostas
            const initialResponses: any = {};
            model.itens.forEach(item => {
                initialResponses[item._id] = {
                    item: item._id,
                    valor_resposta: null,
                    conforme: true,
                    observacao: ''
                };
            });
            setResponses(initialResponses);
        } catch (err) {
            console.error('Erro ao abrir execução:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleResponse = (itemId: string, value: any, conforme: boolean = true) => {
        const newResponses = {
            ...responses,
            [itemId]: {
                ...responses[itemId],
                valor_resposta: value,
                conforme
            }
        };
        setResponses(newResponses);

        // Persistência local (Offline-first)
        if (execution) {
            localStorage.setItem(`pac_exec_${execution._id}`, JSON.stringify(newResponses));
        }
    };

    // Tentar recuperar do localStorage se houver um execution ativo
    useEffect(() => {
        if (execution) {
            const saved = localStorage.getItem(`pac_exec_${execution._id}`);
            if (saved) {
                try {
                    setResponses(JSON.parse(saved));
                } catch (e) {
                    console.error('Erro ao restaurar cache local:', e);
                }
            }
        }
    }, [execution]);

    const handleFinalize = async () => {
        if (!execution) return;

        try {
            setSaving(true);
            // Primeiro salvamos o estado atual
            await pacService.updateExecution(execution._id, { responses: Object.values(responses) });
            // Depois finalizamos
            await pacService.finalizeExecution(execution._id);
            localStorage.removeItem(`pac_exec_${execution._id}`);
            navigate('/quality');
        } catch (err) {
            console.error('Erro ao finalizar:', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading">Iniciando execução...</div>;
    if (!area) return <div className="error">Área não encontrada.</div>;

    if (!selectedModel) {
        return (
            <div className="model-selection">
                <header className="page-header">
                    <button className="btn-back" onClick={() => navigate('/quality/scanner')}><ChevronLeft /></button>
                    <div>
                        <h1>Nova Inspeção: {area.nome}</h1>
                        <p>Selecione o checklist que deseja aplicar agora</p>
                    </div>
                </header>

                <div className="models-list">
                    {models.length === 0 ? (
                        <p className="no-data">Nenhum checklist ativo encontrado para esta área.</p>
                    ) : (
                        models.map(model => (
                            <div key={model._id} className="model-card" onClick={() => handleStartExecution(model)}>
                                <div className="model-info">
                                    <h3>{model.titulo}</h3>
                                    <span className="badge-programa">{model.programa?.codigo || '---'}</span>
                                    <span className="info-item"><Clock size={14} /> {model.frequencia}</span>
                                </div>
                                <button className="btn-start">Iniciar</button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="execution-container">
            <header className="execution-header">
                <div className="header-meta">
                    <h1>{selectedModel.titulo}</h1>
                    <div className="header-badges">
                        <span className="area-badge"><MapPin size={14} /> {area.nome}</span>
                        <span className="user-badge"><User size={14} /> Inspector</span>
                    </div>
                </div>
                <button className="btn-finalize" onClick={handleFinalize} disabled={saving}>
                    {saving ? 'Finalizando...' : 'Finalizar Checklist'}
                </button>
            </header>

            <div className="items-list">
                {selectedModel.itens.sort((a, b) => a.ordem - b.ordem).map(item => (
                    <div key={item._id} className={`item-card ${responses[item._id]?.valor_resposta === null ? 'pending' : ''}`}>
                        <div className="item-header">
                            <span className="item-ordem">#{item.ordem}</span>
                            <div className="item-main">
                                <p className="item-description">{item.descricao}</p>
                                {item.instrucao_item && (
                                    <div className="item-instruction">
                                        <Info size={14} />
                                        <span>{item.instrucao_item}</span>
                                    </div>
                                )}
                            </div>
                            {item.criticidade === 'Crítico' && <AlertTriangle size={20} color="#ef4444" />}
                        </div>

                        <div className="response-actions">
                            {item.tipo_resposta === 'OK_NOK_NA' && (
                                <div className="btn-group">
                                    <button
                                        className={`btn-opt ok ${responses[item._id]?.valor_resposta === 'OK' ? 'active' : ''}`}
                                        onClick={() => handleResponse(item._id, 'OK', true)}
                                    >
                                        <CheckCircle size={18} /> OK
                                    </button>
                                    <button
                                        className={`btn-opt nok ${responses[item._id]?.valor_resposta === 'NOK' ? 'active' : ''}`}
                                        onClick={() => handleResponse(item._id, 'NOK', false)}
                                    >
                                        <XCircle size={18} /> NOK
                                    </button>
                                    <button
                                        className={`btn-opt na ${responses[item._id]?.valor_resposta === 'NA' ? 'active' : ''}`}
                                        onClick={() => handleResponse(item._id, 'NA', true)}
                                    >
                                        <MinusCircle size={18} /> N/A
                                    </button>
                                </div>
                            )}
                            {item.tipo_resposta === 'Numérico' && (
                                <div className="input-group">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            const conforme = (!item.limite_minimo || val >= item.limite_minimo) &&
                                                (!item.limite_maximo || val <= item.limite_maximo);
                                            handleResponse(item._id, val, conforme);
                                        }}
                                    />
                                    {item.unidade_medida && <span className="unit">{item.unidade_medida}</span>}
                                </div>
                            )}
                        </div>

                        {responses[item._id]?.conforme === false && (
                            <div className="nc-alert">
                                <AlertTriangle size={16} />
                                <span>Atenção: Este item irá gerar uma Não Conformidade automática.</span>
                            </div>
                        )}

                        <textarea
                            className="item-obs"
                            placeholder="Adicionar observação ou evidência..."
                            onChange={(e) => {
                                setResponses({
                                    ...responses,
                                    [item._id]: { ...responses[item._id], observacao: e.target.value }
                                });
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
