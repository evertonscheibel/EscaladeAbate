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
    Calendar,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    LogOut,
    Info
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

    if (loading) return (
        <div className="flex items-center justify-center min-vh-100 bg-slate-50" style={{ minHeight: '100vh' }}>
            <div className="flex flex-col items-center gap-4">
                <RefreshCw size={40} className="animate-spin text-blue-500" />
                <span className="font-bold text-slate-500">Recuperando registro do pátio...</span>
            </div>
        </div>
    );

    if (!access) return (
        <div className="flex items-center justify-center min-vh-100 bg-slate-50" style={{ minHeight: '100vh' }}>
            <div className="bg-white p-8 rounded-24 shadow-lg flex flex-col items-center gap-4" style={{ borderRadius: '24px' }}>
                <AlertCircle size={48} className="text-red-500" />
                <h2 className="text-xl font-bold">Registro não encontrado</h2>
                <button onClick={() => navigate('/gatehouse')} className="text-blue-500 font-bold underline">Voltar para o Dashboard</button>
            </div>
        </div>
    );

    const entryTime = new Date(access.dt_entrada);
    const timeInPatio = Math.floor((new Date().getTime() - entryTime.getTime()) / (1000 * 60));

    return (
        <div className="page-container gatehouse-exit-page">
            <header className="page-header">
                <div className="header-info">
                    <div className="header-title-row">
                        <button className="btn-icon-only tertiary" onClick={() => navigate('/gatehouse')} style={{ marginRight: '1rem' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <div className="header-icon">
                            <LogOut size={24} />
                        </div>
                        <h1>Registro de Saída</h1>
                    </div>
                    <p>Encerramento de permanência e liberação de veículo</p>
                </div>
                <div className="header-actions">
                    <div className={`time-badge larger ${timeInPatio > 120 ? 'danger' : 'warning'}`}>
                        <Clock size={16} />
                        <span>Permanência: <strong>{Math.floor(timeInPatio / 60)}h {timeInPatio % 60}min</strong></span>
                    </div>
                </div>
            </header>

            <main className="exit-main-content">
                <div className="exit-layout-grid">
                    <div className="summary-column">
                        <div className="content-card summary-card">
                            <div className="section-title">
                                <Info size={18} />
                                <h3>Resumo do Acesso</h3>
                            </div>

                            <div className="access-summary-header">
                                <div className="plate-badge-premium x-large">
                                    <span className="plate-text">{(access.veiculo_id as any).placa}</span>
                                    <span className="plate-type">{(access.veiculo_id as any).tipo_veiculo}</span>
                                </div>
                                <div className="access-ticket">
                                    <span className="label">Ticket de Controle</span>
                                    <span className="value">#{access.ticket || access._id.slice(-6).toUpperCase()}</span>
                                </div>
                            </div>

                            <div className="summary-list-premium">
                                <div className="summary-item">
                                    <div className="item-icon"><User size={16} /></div>
                                    <div className="item-content">
                                        <label>Condutor</label>
                                        <span>{(access.pessoa_id as any)?.nome || 'Não identificado'}</span>
                                    </div>
                                </div>
                                <div className="summary-item">
                                    <div className="item-icon"><Building2 size={16} /></div>
                                    <div className="item-content">
                                        <label>Empresa / Vínculo</label>
                                        <span>{(access.empresa_id as any)?.nome_fantasia || 'Particular'}</span>
                                    </div>
                                </div>
                                <div className="summary-item">
                                    <div className="item-icon"><MapPin size={16} /></div>
                                    <div className="item-content">
                                        <label>Destino Interno</label>
                                        <span>{access.destino || 'Pátio Central'}</span>
                                    </div>
                                </div>
                                <div className="summary-item">
                                    <div className="item-icon"><Calendar size={16} /></div>
                                    <div className="item-content">
                                        <label>Entrada em</label>
                                        <span>{entryTime.toLocaleString('pt-BR')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-column">
                        <div className="content-card form-card">
                            <div className="section-title">
                                <CheckCircle2 size={18} />
                                <h3>Check-out de Saída</h3>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Observações de Saída</label>
                                <textarea
                                    className="form-control"
                                    rows={4}
                                    placeholder="Descreva detalhes da saída, conferência de carga, etc..."
                                    value={form.observacao_saida}
                                    onChange={e => setForm({ ...form, observacao_saida: e.target.value })}
                                />
                            </div>

                            <div className="occurrence-toggle-wrapper">
                                <label className="custom-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={form.houve_ocorrencia}
                                        onChange={e => setForm({ ...form, houve_ocorrencia: e.target.checked })}
                                    />
                                    <span className="checkbox-box" />
                                    <span className="checkbox-text">Houve alguma ocorrência ou incidente?</span>
                                </label>
                            </div>

                            {form.houve_ocorrencia && (
                                <div className="occurrence-entry-pane">
                                    <div className="pane-header">
                                        <AlertTriangle size={16} />
                                        <span>Detalhes da Ocorrência</span>
                                    </div>
                                    <textarea
                                        className="form-control danger-focus"
                                        rows={3}
                                        placeholder="Descreva o incidente ocorrido no pátio..."
                                        value={form.descricao_ocorrencia}
                                        onChange={e => setForm({ ...form, descricao_ocorrencia: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="exit-actions-footer">
                                <button className="btn-secondary" onClick={() => navigate('/gatehouse')}>
                                    Cancelar
                                </button>
                                <button className="btn-primary danger" onClick={handleSubmit} disabled={saving}>
                                    {saving ? 'Processando...' : 'Confirmar Saída'}
                                    {!saving && <LogOut size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
