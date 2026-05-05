import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Clock,
    Save,
    AlertCircle,
    Truck,
    User,
    Building2,
    Calendar
} from 'lucide-react';
import { gatehouseService } from '../services/gatehouseService';
import { GatehouseAccess } from '../types/gatehouse';
import './GatehouseExit.css';

export const GatehouseExit: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [access, setAccess] = useState<GatehouseAccess | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        observacao_saida: '',
        houve_ocorrencia: false,
        descricao_ocorrencia: ''
    });

    useEffect(() => {
        const fetchAccess = async () => {
            try {
                // Reaproveitando getHistory com filtro de ID para simplificar
                const res = await gatehouseService.getHistory({ _id: id });
                if (res.data.length > 0) setAccess(res.data[0]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAccess();
    }, [id]);

    const handleSubmit = async () => {
        if (!access) return;
        try {
            setSaving(true);
            await gatehouseService.registerExit(access._id, form);
            navigate('/gatehouse');
        } catch (err) {
            console.error(err);
            alert('Erro ao registrar saída');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-pane">Carregando registro...</div>;
    if (!access) return <div className="error-pane">Registro não encontrado</div>;

    const entryTime = new Date(access.dt_entrada);
    const timeInPatio = Math.floor((new Date().getTime() - entryTime.getTime()) / (1000 * 60));

    return (
        <div className="gatehouse-exit">
            <header className="exit-header">
                <button className="btn-back" onClick={() => navigate('/gatehouse')}>
                    <ArrowLeft size={24} />
                </button>
                <h1>Registrar Saída</h1>
            </header>

            <main className="exit-container">
                <div className="sumula-container">
                    <div className="sumula-header">
                        <div className="plate-badge">{(access.veiculo_id as any).placa}</div>
                        <div className="ticket-badge">{access.ticket}</div>
                    </div>

                    <div className="sumula-grid">
                        <div className="sumula-item">
                            <label><Truck size={16} /> Veículo</label>
                            <span>{(access.veiculo_id as any).tipo_veiculo} - {(access.veiculo_id as any).marca_modelo}</span>
                        </div>
                        <div className="sumula-item">
                            <label><User size={16} /> Motorista</label>
                            <span>{(access.pessoa_id as any)?.nome || 'N/A'}</span>
                        </div>
                        <div className="sumula-item">
                            <label><Building2 size={16} /> Empresa</label>
                            <span>{(access.empresa_id as any)?.nome_fantasia || 'Particular'}</span>
                        </div>
                        <div className="sumula-item">
                            <label><Calendar size={16} /> Entrada</label>
                            <span>{entryTime.toLocaleString('pt-BR')}</span>
                        </div>
                    </div>

                    <div className="permanencia-indicator">
                        <Clock size={32} />
                        <div className="perm-info">
                            <strong>{Math.floor(timeInPatio / 60)}h {timeInPatio % 60}min</strong>
                            <span>Tempo Total no Pátio</span>
                        </div>
                    </div>
                </div>

                <div className="exit-form">
                    <div className="form-section">
                        <label>Observação de Saída</label>
                        <textarea
                            rows={3}
                            placeholder="Alguma observação relevante sobre a saída..."
                            value={form.observacao_saida}
                            onChange={e => setForm({ ...form, observacao_saida: e.target.value })}
                        />
                    </div>

                    <div className="form-section occurrence-section">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={form.houve_ocorrencia}
                                onChange={e => setForm({ ...form, houve_ocorrencia: e.target.checked })}
                            />
                            Houve ocorrência durante a permanência?
                        </label>

                        {form.houve_ocorrencia && (
                            <div className="occurrence-detail">
                                <label><AlertCircle size={14} /> Detalhes da Ocorrência</label>
                                <textarea
                                    rows={2}
                                    placeholder="Descreva o que houve..."
                                    value={form.descricao_ocorrencia}
                                    onChange={e => setForm({ ...form, descricao_ocorrencia: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    <button className="btn-confirm-exit" onClick={handleSubmit} disabled={saving}>
                        {saving ? 'PROCESSANDO...' : 'CONFIRMAR SAÍDA'}
                        <Save size={20} />
                    </button>
                </div>
            </main>
        </div>
    );
};
