import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Truck,
    User,
    Building2,
    ChevronRight,
    Save,
    X,
    ClipboardList,
    MapPin,
    CheckCircle2,
    Search,
    Info
} from 'lucide-react';
import { gatehouseService } from '../services/gatehouseService';
import {
    Gatehouse, AccessType, AccessReason,
    Company, Vehicle, AccessPerson
} from '../types/gatehouse';
import './GatehouseEntry.css';

export const GatehouseEntry: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [configs, setConfigs] = useState<{
        gatehouses: Gatehouse[],
        types: AccessType[],
        reasons: AccessReason[]
    }>({ gatehouses: [], types: [], reasons: [] });

    const [form, setForm] = useState({
        guarita_id: '',
        tipo_acesso_id: '',
        motivo_acesso_id: '',
        placa: '',
        tipo_veiculo: 'caminhao',
        marca_modelo: '',
        cor: '',
        visitante_nome: '',
        visitante_documento: '',
        empresa_id: '',
        destino: '',
        observacao_entrada: ''
    });

    const [existingVehicle, setExistingVehicle] = useState<Vehicle | null>(null);

    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                const [g, t, r] = await Promise.all([
                    gatehouseService.getConfigs.gatehouses(),
                    gatehouseService.getConfigs.types(),
                    gatehouseService.getConfigs.reasons()
                ]);
                setConfigs({
                    gatehouses: g.data,
                    types: t.data,
                    reasons: r.data
                });
                if (g.data.length > 0) setForm(prev => ({ ...prev, guarita_id: g.data[0]._id }));
            } catch (err) {
                console.error('Erro ao buscar configurações:', err);
            }
        };
        fetchConfigs();
    }, []);

    const handlePlacaBlur = async () => {
        if (form.placa.length >= 7) {
            try {
                const res = await gatehouseService.getVehicles({ search: form.placa });
                if (res.data.length > 0) {
                    const v = res.data[0];
                    setExistingVehicle(v);
                    setForm(prev => ({
                        ...prev,
                        tipo_veiculo: v.tipo_veiculo,
                        marca_modelo: v.marca_modelo || '',
                        cor: v.cor || '',
                        empresa_id: v.empresa_id?._id || v.empresa_id || ''
                    }));
                } else {
                    setExistingVehicle(null);
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const data: any = {
                guarita_id: form.guarita_id,
                tipo_acesso_id: form.tipo_acesso_id,
                motivo_acesso_id: form.motivo_acesso_id,
                destino: form.destino,
                observacao_entrada: form.observacao_entrada
            };

            if (existingVehicle) {
                data.veiculo_id = existingVehicle._id;
            } else {
                data.veiculo_novo = {
                    placa: form.placa,
                    tipo_veiculo: form.tipo_veiculo,
                    marca_modelo: form.marca_modelo,
                    cor: form.cor,
                    empresa_id: form.empresa_id || undefined
                };
            }

            if (form.visitante_nome) {
                data.pessoa_nova = {
                    nome: form.visitante_nome,
                    documento: form.visitante_documento,
                    empresa_id: form.empresa_id || undefined
                };
            }

            if (form.empresa_id) {
                data.empresa_id = form.empresa_id;
            }

            await gatehouseService.registerEntry(data);
            navigate('/gatehouse');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao registrar entrada');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="gatehouse-entry">
            <header className="entry-header">
                <button className="btn-back" onClick={() => navigate('/gatehouse')}>
                    <ArrowLeft size={24} />
                </button>
                <h1>Registrar Entrada de Veículo</h1>
            </header>

            <div className="steps-indicator">
                <div className={`step-item ${step >= 1 ? 'active' : ''}`}>Identificação</div>
                <div className={`step-item ${step >= 2 ? 'active' : ''}`}>Pessoas / Empresa</div>
                <div className={`step-item ${step >= 3 ? 'active' : ''}`}>Finalização</div>
            </div>

            <main className="entry-content">
                {step === 1 && (
                    <div className="step-pane">
                        <section className="form-section">
                            <h3><MapPin size={20} className="text-blue-500" /> Local de entrada</h3>
                            <label>Guarita de Acesso</label>
                            <select
                                value={form.guarita_id}
                                onChange={e => setForm({ ...form, guarita_id: e.target.value })}
                            >
                                {configs.gatehouses.map(g => (
                                    <option key={g._id} value={g._id}>{g.nome}</option>
                                ))}
                            </select>
                        </section>

                        <section className="form-section">
                            <div className="plate-input-container">
                                <label>Placa Identificada</label>
                                <input
                                    type="text"
                                    placeholder="AAA1A11"
                                    className="plate-input"
                                    value={form.placa}
                                    onChange={e => setForm({ ...form, placa: e.target.value.toUpperCase() })}
                                    onBlur={handlePlacaBlur}
                                />
                                {existingVehicle && (
                                    <div className="entity-found">
                                        <CheckCircle2 size={16} /> Veículo já cadastrado: {existingVehicle.marca_modelo}
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="form-section">
                            <h3><Truck size={20} className="text-blue-500" /> Detalhes do Veículo</h3>
                            <div className="form-grid">
                                <div className="field-group">
                                    <label>Tipo de Veículo</label>
                                    <select
                                        value={form.tipo_veiculo}
                                        onChange={e => setForm({ ...form, tipo_veiculo: e.target.value })}
                                    >
                                        <option value="caminhao">Caminhão</option>
                                        <option value="carreta">Carreta</option>
                                        <option value="boiadeiro">Caminhão Boiadeiro</option>
                                        <option value="carro">Carro de passeio</option>
                                        <option value="utilitario">Utilitário / Van</option>
                                        <option value="moto">Motocicleta</option>
                                    </select>
                                </div>
                                <div className="field-group">
                                    <label>Modelo / Cor</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Volvo Branco"
                                        value={form.marca_modelo}
                                        onChange={e => setForm({ ...form, marca_modelo: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>

                        <button className="btn-next" onClick={() => setStep(2)}>
                            CONTINUAR REGISTRO <ChevronRight size={20} />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-pane">
                        <section className="form-section">
                            <h3><Building2 size={20} className="text-blue-500" /> Origem / Vínculo</h3>
                            <label>Empresa ou Transportadora</label>
                            <input
                                type="text"
                                placeholder="Nome da empresa ou 'Particular'"
                                value={form.empresa_id}
                                onChange={e => setForm({ ...form, empresa_id: e.target.value })}
                            />
                        </section>

                        <section className="form-section">
                            <h3><User size={20} className="text-blue-500" /> Responsável</h3>
                            <div className="form-grid">
                                <div className="field-group">
                                    <label>Nome do Motorista / Visitante</label>
                                    <input
                                        type="text"
                                        placeholder="Nome completo"
                                        value={form.visitante_nome}
                                        onChange={e => setForm({ ...form, visitante_nome: e.target.value })}
                                    />
                                </div>
                                <div className="field-group">
                                    <label>Documento (CPF/RG)</label>
                                    <input
                                        type="text"
                                        placeholder="Informar documento..."
                                        value={form.visitante_documento}
                                        onChange={e => setForm({ ...form, visitante_documento: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="actions-footer">
                            <button className="btn-secondary-outline" onClick={() => setStep(1)}>VOLTAR</button>
                            <button className="btn-next" onClick={() => setStep(3)}>
                                PRÓXIMO PASSO <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="step-pane">
                        <section className="form-section">
                            <h3><ClipboardList size={20} className="text-blue-500" /> Finalidade do Acesso</h3>
                            <label>Classificação de Acesso</label>
                            <div className="type-selector">
                                {configs.types.map(t => (
                                    <button
                                        key={t._id}
                                        className={`type-btn ${form.tipo_acesso_id === t._id ? 'active' : ''}`}
                                        style={form.tipo_acesso_id === t._id ? { border: `2px solid ${t.cor}`, color: t.cor } : {}}
                                        onClick={() => setForm({ ...form, tipo_acesso_id: t._id })}
                                    >
                                        <Info size={16} />
                                        {t.nome}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="form-section">
                            <label>Motivo do Acesso</label>
                            <select
                                value={form.motivo_acesso_id}
                                onChange={e => setForm({ ...form, motivo_acesso_id: e.target.value })}
                                disabled={!form.tipo_acesso_id}
                            >
                                <option value="">Selecione um motivo...</option>
                                {configs.reasons
                                    .filter(r => r.tipo_acesso_id === form.tipo_acesso_id)
                                    .map(r => (
                                        <option key={r._id} value={r._id}>{r.nome}</option>
                                    ))
                                }
                            </select>
                        </section>

                        <section className="form-section">
                            <div className="form-grid">
                                <div className="field-group">
                                    <label>Destino Interno</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Galpão A, RH, Docas..."
                                        value={form.destino}
                                        onChange={e => setForm({ ...form, destino: e.target.value })}
                                    />
                                </div>
                                <div className="field-group">
                                    <label>Observação Extra</label>
                                    <input
                                        type="text"
                                        placeholder="Informação adicional..."
                                        value={form.observacao_entrada}
                                        onChange={e => setForm({ ...form, observacao_entrada: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="actions-footer">
                            <button className="btn-secondary-outline" onClick={() => setStep(2)}>VOLTAR</button>
                            <button className="btn-save" onClick={handleSubmit} disabled={loading || !form.tipo_acesso_id}>
                                {loading ? 'SALVANDO...' : 'RECONHECER ENTRADA'}
                                <Save size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
