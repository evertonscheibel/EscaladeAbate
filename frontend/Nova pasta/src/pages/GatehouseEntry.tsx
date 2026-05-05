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
    MapPin
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

    // Estados para cadastros existentes (autocomplete fake para simplificar)
    const [existingVehicle, setExistingVehicle] = useState<Vehicle | null>(null);
    const [existingPerson, setExistingPerson] = useState<AccessPerson | null>(null);

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

            // Se veículo não existe, envia para cadastro rápido
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

            // Se pessoa (visitante) foi informada
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
                <h1>Registrar Entrada</h1>
            </header>

            <div className="steps-indicator">
                <div className={`step-item ${step >= 1 ? 'active' : ''}`}>1. Identificação</div>
                <div className={`step-item ${step >= 2 ? 'active' : ''}`}>2. Origem e Vínculo</div>
                <div className={`step-item ${step >= 3 ? 'active' : ''}`}>3. Finalização</div>
            </div>

            <main className="entry-content">
                {step === 1 && (
                    <div className="step-pane">
                        <div className="form-section">
                            <label><MapPin size={18} /> Guarita de Entrada</label>
                            <select
                                value={form.guarita_id}
                                onChange={e => setForm({ ...form, guarita_id: e.target.value })}
                            >
                                {configs.gatehouses.map(g => (
                                    <option key={g._id} value={g._id}>{g.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-section">
                            <label><Truck size={18} /> Placa do Veículo</label>
                            <input
                                type="text"
                                placeholder="ABC1D23"
                                className="plate-input"
                                value={form.placa}
                                onChange={e => setForm({ ...form, placa: e.target.value.toUpperCase() })}
                                onBlur={handlePlacaBlur}
                            />
                            {existingVehicle && <span className="entity-found">Veículo encontrado: {existingVehicle.marca_modelo}</span>}
                        </div>

                        <div className="form-grid">
                            <div className="form-section">
                                <label>Tipo de Veículo</label>
                                <select
                                    value={form.tipo_veiculo}
                                    onChange={e => setForm({ ...form, tipo_veiculo: e.target.value })}
                                >
                                    <option value="caminhao">Caminhão</option>
                                    <option value="carreta">Carreta</option>
                                    <option value="carro">Carro</option>
                                    <option value="utilitario">Utilitário</option>
                                    <option value="moto">Moto</option>
                                </select>
                            </div>
                            <div className="form-section">
                                <label>Modelo/Cor</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Volvo Branco"
                                    value={`${form.marca_modelo} ${form.cor}`.trim()}
                                    onChange={e => {
                                        const values = e.target.value.split(' ');
                                        setForm({ ...form, marca_modelo: values[0] || '', cor: values.slice(1).join(' ') || '' });
                                    }}
                                />
                            </div>
                        </div>

                        <button className="btn-next" onClick={() => setStep(2)}>
                            PRÓXIMO PASSO <ChevronRight size={20} />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-pane">
                        <div className="form-section">
                            <label><Building2 size={18} /> Empresa / Portador</label>
                            <input
                                type="text"
                                placeholder="Nome da empresa ou 'Particular'"
                                value={form.empresa_id} // Simplificado: Ideal usar autocomplete select
                                onChange={e => setForm({ ...form, empresa_id: e.target.value })}
                            />
                        </div>

                        <div className="form-section">
                            <label><User size={18} /> Nome do Motorista / Visitante</label>
                            <input
                                type="text"
                                placeholder="Nome completo"
                                value={form.visitante_nome}
                                onChange={e => setForm({ ...form, visitante_nome: e.target.value })}
                            />
                        </div>

                        <div className="form-section">
                            <label>Documento (CPF/RG)</label>
                            <input
                                type="text"
                                placeholder="000.000.000-00"
                                value={form.visitante_documento}
                                onChange={e => setForm({ ...form, visitante_documento: e.target.value })}
                            />
                        </div>

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
                        <div className="form-section">
                            <label><ClipboardList size={18} /> Tipo de Acesso</label>
                            <div className="type-selector">
                                {configs.types.map(t => (
                                    <button
                                        key={t._id}
                                        className={`type-btn ${form.tipo_acesso_id === t._id ? 'active' : ''}`}
                                        style={form.tipo_acesso_id === t._id ? { backgroundColor: t.cor, color: 'white' } : {}}
                                        onClick={() => setForm({ ...form, tipo_acesso_id: t._id })}
                                    >
                                        {t.nome}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-section">
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
                        </div>

                        <div className="form-section">
                            <label>Destino Interno</label>
                            <input
                                type="text"
                                placeholder="Ex: Galpão A, Docas, RH..."
                                value={form.destino}
                                onChange={e => setForm({ ...form, destino: e.target.value })}
                            />
                        </div>

                        <div className="form-section">
                            <label>Observações</label>
                            <textarea
                                rows={3}
                                placeholder="Informações adicionais..."
                                value={form.observacao_entrada}
                                onChange={e => setForm({ ...form, observacao_entrada: e.target.value })}
                            />
                        </div>

                        <div className="actions-footer">
                            <button className="btn-secondary-outline" onClick={() => setStep(2)}>VOLTAR</button>
                            <button className="btn-save" onClick={handleSubmit} disabled={loading || !form.tipo_acesso_id}>
                                {loading ? 'SALVANDO...' : 'FINALIZAR REGISTRO'}
                                <Save size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
