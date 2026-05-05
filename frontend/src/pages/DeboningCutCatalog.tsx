import React, { useState, useEffect } from 'react';
import deboningCutService from '../services/deboningCutService';
import deboningBrokerService from '../services/deboningBrokerService';
import { Plus, Edit2, Trash2, Search, Filter, Image as ImageIcon, Upload, X } from 'lucide-react';

const DeboningCutCatalog: React.FC = () => {
    const [cuts, setCuts] = useState<any[]>([]);
    const [brokers, setBrokers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCut, setEditingCut] = useState<any>(null);
    const [selectedBroker, setSelectedBroker] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        broker: '',
        image: null as File | null
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchCuts();
    }, [selectedBroker]);

    const fetchInitialData = async () => {
        try {
            const brokersData = await deboningBrokerService.getBrokers();
            setBrokers(brokersData);
        } catch (error) {
            alert('Erro ao buscar corretores');
        }
    };

    const fetchCuts = async () => {
        try {
            setLoading(true);
            const data = await deboningCutService.getCuts(selectedBroker);
            setCuts(data);
        } catch (error) {
            alert('Erro ao buscar catálogo de cortes');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (cut?: any) => {
        if (cut) {
            setEditingCut(cut);
            setFormData({
                name: cut.name,
                description: cut.description || '',
                broker: cut.broker?._id || '',
                image: null
            });
            setImagePreview(cut.imageUrl ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${cut.imageUrl}` : null);
        } else {
            setEditingCut(null);
            setFormData({
                name: '',
                description: '',
                broker: selectedBroker,
                image: null
            });
            setImagePreview(null);
        }
        setShowModal(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Imagem muito grande (máx 5MB)');
                return;
            }
            setFormData({ ...formData, image: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('broker', formData.broker);
            if (formData.image) {
                data.append('image', formData.image);
            }

            if (editingCut) {
                await deboningCutService.updateCut(editingCut._id, data);
                alert('Corte atualizado com sucesso');
            } else {
                await deboningCutService.createCut(data);
                alert('Corte cadastrado no catálogo');
            }
            setShowModal(false);
            fetchCuts();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao salvar corte');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Deseja remover este corte do catálogo?')) return;
        try {
            await deboningCutService.deleteCut(id);
            alert('Corte removido');
            fetchCuts();
        } catch (error) {
            alert('Erro ao remover corte');
        }
    };

    const filteredCuts = cuts.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Catálogo de Cortes</h1>
                    <p className="page-subtitle">Consulte e gerencie os padrões de corte por corretor</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={20} /> Novo Corte
                </button>
            </div>

            <div className="filter-bar-premium" style={{ marginBottom: '24px' }}>
                <div className="form-group-premium">
                    <label>Filtrar por Corretor</label>
                    <select value={selectedBroker} onChange={(e) => setSelectedBroker(e.target.value)}>
                        <option value="">Todos os Corretores</option>
                        {brokers.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                </div>
                <div className="form-group-premium">
                    <label>Buscar Corte</label>
                    <div className="input-with-icon">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Nome do corte..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Carregando catálogo...</div>
            ) : (
                <div className="cuts-grid">
                    {filteredCuts.length === 0 && (
                        <div className="empty-state">Nenhum corte encontrado para este corretor.</div>
                    )}
                    {filteredCuts.map(cut => (
                        <div className="cut-card" key={cut._id}>
                            <div className="cut-image">
                                {cut.imageUrl ? (
                                    <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${cut.imageUrl}`} alt={cut.name} />
                                ) : (
                                    <div className="no-image">
                                        <ImageIcon size={48} />
                                        <span>Sem Imagem</span>
                                    </div>
                                )}
                                <div className="cut-actions">
                                    <button onClick={() => handleOpenModal(cut)} title="Editar"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(cut._id)} title="Excluir" className="btn-danger"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <div className="cut-info">
                                <span className="cut-broker">{cut.broker?.name || 'Padrão Geral'}</span>
                                <h3 className="cut-name">{cut.name}</h3>
                                <p className="cut-description">{cut.description || 'Sem descrição detalhada.'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '650px' }}>
                        <div className="modal-header">
                            <h2>{editingCut ? 'Editar Corte' : 'Novo Corte no Catálogo'}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>Nome do Corte</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            placeholder="Ex: Picanha Premium, Alcatra Limpa..."
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Corretor / Terceiro Associado</label>
                                        <select 
                                            required
                                            value={formData.broker}
                                            onChange={(e) => setFormData({...formData, broker: e.target.value})}
                                        >
                                            <option value="">Selecione um corretor...</option>
                                            {brokers.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Descrição e Padrões de Toalete</label>
                                        <textarea 
                                            rows={4}
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            placeholder="Descreve as particularidades deste corte para este corretor..."
                                        ></textarea>
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Imagem do Corte</label>
                                        <div className="image-upload-wrapper">
                                            {imagePreview ? (
                                                <div className="preview-container">
                                                    <img src={imagePreview} alt="Preview" />
                                                    <button type="button" className="remove-img" onClick={() => {
                                                        setImagePreview(null);
                                                        setFormData({...formData, image: null});
                                                    }}><X size={16} /></button>
                                                </div>
                                            ) : (
                                                <label className="upload-placeholder">
                                                    <Upload size={32} />
                                                    <span>Clique para enviar imagem</span>
                                                    <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary">Salvar no Catálogo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .cuts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 24px;
                }
                .cut-card {
                    background: var(--surface);
                    border-radius: 16px;
                    border: 1px solid var(--border);
                    overflow: hidden;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                }
                .cut-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-lg);
                    border-color: var(--primary-soft);
                }
                .cut-image {
                    position: relative;
                    height: 180px;
                    background: var(--bg-soft);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .cut-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .no-image {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    color: var(--text-muted);
                }
                .cut-actions {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    display: flex;
                    gap: 8px;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .cut-card:hover .cut-actions {
                    opacity: 1;
                }
                .cut-actions button {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    border: none;
                    background: rgba(255,255,255,0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: var(--text);
                    transition: all 0.2s;
                }
                .cut-actions button:hover {
                    background: var(--primary);
                    color: white;
                }
                .cut-actions button.btn-danger:hover {
                    background: var(--danger);
                }
                .cut-info {
                    padding: 20px;
                }
                .cut-broker {
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: var(--primary);
                    letter-spacing: 0.5px;
                }
                .cut-name {
                    font-size: 1.15rem;
                    font-weight: 700;
                    margin: 4px 0 10px;
                    color: var(--text);
                }
                .cut-description {
                    font-size: 0.875rem;
                    color: var(--text-muted);
                    line-height: 1.5;
                }
                .image-upload-wrapper {
                    width: 100%;
                    height: 200px;
                    border: 2px dashed var(--border);
                    border-radius: 12px;
                    overflow: hidden;
                }
                .upload-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    cursor: pointer;
                    color: var(--text-muted);
                    transition: all 0.2s;
                }
                .upload-placeholder:hover {
                    background: var(--bg-soft);
                    color: var(--primary);
                    border-color: var(--primary);
                }
                .preview-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                .preview-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .remove-img {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: rgba(0,0,0,0.5);
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default DeboningCutCatalog;
