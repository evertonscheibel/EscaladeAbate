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
        <div className="page-container gatehouse-entry-page">
            <header className="page-header">
                <div className="header-info">
                    <div className="header-title-row">
                        <button className="btn-icon-only tertiary" onClick={() => navigate('/gatehouse')} style={{ marginRight: '1rem' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <div className="header-icon">
                            <Truck size={24} />
                        </div>
                        <h1>Registro de Entrada</h1>
                    </div>
                    <p>Identificação de veículo e pessoal para acesso às dependências</p>
                </div>
            </header>

            <div className="stepper-horizontal">
                <div className={`step-node ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                    <div className="step-circle">{step > 1 ? <CheckCircle2 size={16} /> : 1}</div>
                    <span className="step-label">Identificação</span>
                </div>
                <div className="step-line" />
                <div className={`step-node ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                    <div className="step-circle">{step > 2 ? <CheckCircle2 size={16} /> : 2}</div>
                    <span className="step-label">Vínculo</span>
                </div>
                <div className="step-line" />
                <div className={`step-node ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                    <div className="step-circle">3</div>
                    <span className="step-label">Finalização</span>
                </div>
            </div>

            <main className="entry-main-content">
                <div className="content-card">
                    {step === 1 && (
                        <div className="step-content-pane">
                            <div className="section-title">
                                <MapPin size={18} />
                                <h3>Local de Acesso</h3>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Guarita de Controle</label>
                                <select
                                    className="form-control"
                                    value={form.guarita_id}
                                    onChange={e => setForm({ ...form, guarita_id: e.target.value })}
                                >
                                    {configs.gatehouses.map(g => (
                                        <option key={g._id} value={g._id}>{g.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <hr className="section-divider" />

                            <div className="section-title">
                                <Truck size={18} />
                                <h3>Veículo</h3>
                            </div>

                            <div className="form-grid-three">
                                <div className="form-group plate-field">
                                    <label className="form-label">Placa Identificada</label>
                                    <div className="input-with-icon">
                                        <Search size={16} />
                                        <input
                                            type="text"
                                            className="form-control plate-input-premium"
                                            placeholder="ABC-1234"
                                            value={form.placa}
                                            onChange={e => setForm({ ...form, placa: e.target.value.toUpperCase() })}
                                            onBlur={handlePlacaBlur}
                                        />
                                    </div>
                                    {existingVehicle && (
                                        <div className="field-hint success">
                                            <CheckCircle2 size={12} /> Veículo já cadastrado
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Tipo de Veículo</label>
                                    <select
                                        className="form-control"
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

                                <div className="form-group">
                                    <label className="form-label">Modelo / Cor</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Ex: Volvo Branco"
                                        value={form.marca_modelo}
                                        onChange={e => setForm({ ...form, marca_modelo: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="step-actions-footer">
                                <button className="btn-primary" onClick={() => setStep(2)}>
                                    Continuar <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="step-content-pane">
                            <div className="section-title">
                                <Building2 size={18} />
                                <h3>Origem / Vínculo</h3>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Empresa ou Transportadora</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Nome da empresa ou 'Particular'"
                                    value={form.empresa_id}
                                    onChange={e => setForm({ ...form, empresa_id: e.target.value })}
                                />
                            </div>

                            <hr className="section-divider" />

                            <div className="section-title">
                                <User size={18} />
                                <h3>Condutor / Responsável</h3>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Nome Completo</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Motorista ou Visitante"
                                        value={form.visitante_nome}
                                        onChange={e => setForm({ ...form, visitante_nome: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Documento (CPF/RG)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="000.000.000-00"
                                        value={form.visitante_documento}
                                        onChange={e => setForm({ ...form, visitante_documento: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="step-actions-footer">
                                <button className="btn-secondary" onClick={() => setStep(1)}>Voltar</button>
                                <button className="btn-primary" onClick={() => setStep(3)}>
                                    Próximo Passo <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="step-content-pane">
                            <div className="section-title">
                                <ClipboardList size={18} />
                                <h3>Finalidade do Acesso</h3>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Tipo de Acesso</label>
                                <div className="access-types-grid">
                                    {configs.types.map(t => (
                                        <button
                                            key={t._id}
                                            className={`access-type-card ${form.tipo_acesso_id === t._id ? 'selected' : ''}`}
                                            style={form.tipo_acesso_id === t._id ? { '--type-color': t.cor } as any : {}}
                                            onClick={() => setForm({ ...form, tipo_acesso_id: t._id })}
                                        >
                                            <div className="type-check">
                                                {form.tipo_acesso_id === t._id ? <CheckCircle2 size={16} /> : <div className="dot" />}
                                            </div>
                                            <span className="type-name">{t.nome}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Motivo</label>
                                    <select
                                        className="form-control"
                                        value={form.motivo_acesso_id}
                                        onChange={e => setForm({ ...form, motivo_acesso_id: e.target.value })}
                                        disabled={!form.tipo_acesso_id}
                                    >
                                        <option value="">Selecione o motivo...</option>
                                        {configs.reasons
                                            .filter(r => r.tipo_acesso_id === form.tipo_acesso_id)
                                            .map(r => (
                                                <option key={r._id} value={r._id}>{r.nome}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Destino Interno</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Ex: RH, Almoxarifado, Docas..."
                                        value={form.destino}
                                        onChange={e => setForm({ ...form, destino: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Observações</label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    placeholder="Informações adicionais relevantes..."
                                    value={form.observacao_entrada}
                                    onChange={e => setForm({ ...form, observacao_entrada: e.target.value })}
                                />
                            </div>

                            <div className="step-actions-footer">
                                <button className="btn-secondary" onClick={() => setStep(2)}>Voltar</button>
                                <button className="btn-primary" onClick={handleSubmit} disabled={loading || !form.tipo_acesso_id}>
                                    {loading ? 'Processando...' : 'Finalizar Registro'}
                                    {!loading && <Save size={18} />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
