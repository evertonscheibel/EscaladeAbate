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
    RefreshCw
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
        <div className="gatehouse-exit">
            <header className="exit-header">
                <button className="btn-back" onClick={() => navigate('/gatehouse')}>
                    <ArrowLeft size={24} />
                </button>
                <h1>Finalizar Permanência no Pátio</h1>
            </header>

            <main className="exit-container">
                <div className="sumula-container">
                    <div className="sumula-header">
                        <div className="plate-badge">{(access.veiculo_id as any).placa}</div>
                        <div className="ticket-badge">#{access.ticket || access._id.slice(-6).toUpperCase()}</div>
                    </div>

                    <div className="sumula-grid">
                        <div className="sumula-item">
                            <label><Truck size={14} /> Veículo de Acesso</label>
                            <span>{(access.veiculo_id as any).tipo_veiculo} - {(access.veiculo_id as any).marca_modelo}</span>
                        </div>
                        <div className="sumula-item">
                            <label><User size={14} /> Condutor Responsável</label>
                            <span>{(access.pessoa_id as any)?.nome || 'Motorista Particular'}</span>
                        </div>
                        <div className="sumula-item">
                            <label><Building2 size={14} /> Empresa / Vínculo</label>
                            <span>{(access.empresa_id as any)?.nome_fantasia || 'Particular'}</span>
                        </div>
                        <div className="sumula-item">
                            <label><Calendar size={14} /> Horário de Entrada</label>
                            <span>{entryTime.toLocaleString('pt-BR')}</span>
                        </div>
                    </div>

                    <div className="permanencia-indicator">
                        <Clock size={32} className="text-amber-400" />
                        <div className="perm-info">
                            <strong>{Math.floor(timeInPatio / 60)}h {timeInPatio % 60}min</strong>
                            <span>Tempo de Estadia Reportado</span>
                        </div>
                    </div>
                </div>

                <div className="exit-form">
                    <section className="form-section">
                        <label className="text-slate-800 font-bold text-base flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-green-500" /> Observação de Saída
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Descreva detalhes da saída (ex: carga conferida, sem avarias...)"
                            value={form.observacao_saida}
                            onChange={e => setForm({ ...form, observacao_saida: e.target.value })}
                        />
                    </section>

                    <div className="occurrence-section">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={form.houve_ocorrencia}
                                onChange={e => setForm({ ...form, houve_ocorrencia: e.target.checked })}
                            />
                            Registrar incidente ou ocorrência interna?
                        </label>

                        {form.houve_ocorrencia && (
                            <div className="occurrence-detail">
                                <label className="flex items-center gap-2 text-red-600 font-bold mb-2">
                                    <AlertTriangle size={14} /> Descrição da Ocorrência
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Explique o que ocorreu durante a permanência no pátio..."
                                    value={form.descricao_ocorrencia}
                                    onChange={e => setForm({ ...form, descricao_ocorrencia: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    <button className="btn-confirm-exit" onClick={handleSubmit} disabled={saving}>
                        {saving ? 'PROCESSANDO...' : 'RECONHECER SAÍDA'}
                        <Save size={20} />
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-4 italic">
                        Ao confirmar, o veículo será removido da listagem de veículos ativos no pátio.
                    </p>
                </div>
            </main>
        </div>
    );
};
