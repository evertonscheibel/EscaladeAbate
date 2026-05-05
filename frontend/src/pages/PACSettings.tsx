import React, { useState, useEffect } from 'react';
import {
    Settings,
    Users,
    MapPin,
    FileText,
    Plus,
    Save,
    ChevronRight,
    Search
} from 'lucide-react';
import { pacService } from '../services/pacService';
import './PACSettings.css';

export const PACSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('areas');
    const [areas, setAreas] = useState<any[]>([]);
    const [programs, setPrograms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [areasRes, programsRes] = await Promise.all([
                pacService.getAreas(),
                pacService.getPrograms()
            ]);
            setAreas(areasRes.data || []);
            setPrograms(programsRes.data || []);
        } catch (err) {
            console.error('Erro ao carregar dados de configuração:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Carregando configurações...</div>;

    return (
        <div className="settings-page">
            <header className="settings-header">
                <div>
                    <h1>Configurações do Sistema PAC</h1>
                    <p>Gerencie áreas críticas, programas e responsabilidades técnicas</p>
                </div>
            </header>

            <div className="settings-layout">
                <nav className="settings-nav">
                    <button
                        className={`nav-item ${activeTab === 'areas' ? 'active' : ''}`}
                        onClick={() => setActiveTab('areas')}
                    >
                        <MapPin size={20} /> Áreas de Produção
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'programs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('programs')}
                    >
                        <FileText size={20} /> Programas PAC
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <Users size={20} /> Responsáveis Técnicos
                    </button>
                </nav>

                <main className="settings-content">
                    {activeTab === 'areas' && (
                        <div className="tab-pane">
                            <div className="pane-header">
                                <h2>Áreas de Produção</h2>
                                <button className="btn-add"><Plus size={18} /> Adicionar Área</button>
                            </div>
                            <div className="settings-list">
                                {areas.map(area => (
                                    <div key={area._id} className="settings-item">
                                        <div className="item-info">
                                            <strong>{area.nome}</strong>
                                            <span>Código: {area.codigo}</span>
                                        </div>
                                        <ChevronRight size={18} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'programs' && (
                        <div className="tab-pane">
                            <div className="pane-header">
                                <h2>Programas de Autocontrole</h2>
                                <button className="btn-add"><Plus size={18} /> Novo Programa</button>
                            </div>
                            <div className="settings-list">
                                {programs.map(prog => (
                                    <div key={prog._id} className="settings-item">
                                        <div className="item-info">
                                            <strong>{prog.nome}</strong>
                                            <span>Sigla: {prog.codigo}</span>
                                        </div>
                                        <ChevronRight size={18} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
