import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Camera, AlertCircle, MapPin, Search } from 'lucide-react';
import { pacService } from '../services/pacService';
import { ProductionArea } from '../types/pac';
import './AreaScanner.css';

export const AreaScanner: React.FC = () => {
    const navigate = useNavigate();
    const [areas, setAreas] = useState<ProductionArea[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAreas();
    }, []);

    const loadAreas = async () => {
        try {
            const response = await pacService.getAreas();
            setAreas(response.data || []);
        } catch (err) {
            setError('Não foi possível carregar as áreas de produção.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectArea = (area: ProductionArea) => {
        navigate(`/quality/execute?areaId=${area._id}`);
    };

    const filteredAreas = areas.filter(area =>
        area.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loading">Carregando áreas...</div>;

    return (
        <div className="area-scanner-page">
            <header className="scanner-header">
                <h1>Identificação de Área</h1>
                <p>Escaneie o QR Code no local ou selecione na lista abaixo</p>
            </header>

            <div className="scanner-action">
                <div className="qr-simulated-box">
                    <QrCode size={80} strokeWidth={1} />
                    <button className="btn-primary btn-scan">
                        <Camera size={20} />
                        Abrir Câmera para Scan
                    </button>
                    <p className="hint">O scanner validará a posição geográfica do checklist</p>
                </div>
            </div>

            <div className="manual-selection">
                <div className="search-bar">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Buscar área por nome ou código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="error-alert">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <div className="areas-grid">
                    {filteredAreas.map(area => (
                        <div
                            key={area._id}
                            className="area-item-card"
                            onClick={() => handleSelectArea(area)}
                        >
                            <div className="area-icon"><MapPin size={24} /></div>
                            <div className="area-details">
                                <span className="area-code">{area.codigo}</span>
                                <h3 className="area-name">{area.nome}</h3>
                                <span className="area-sector">{area.setor}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
