import React, { useState } from 'react';
import {
    Loader2,
    ArrowRight,
    Beef,
    Factory,
    Thermometer,
    BarChart,
    ChevronRight,
    FileUp,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

import importService from '../services/importService';



const PcpImports: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [type, setType] = useState('PRE_SCHEDULE_IMPORT');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [uploading, setUploading] = useState(false);
    const [currentJob, setCurrentJob] = useState<any>(null);

    const handleUpload = async () => {
        if (!file) return;
        try {
            setUploading(true);
            const response = await importService.upload(type, date, file);
            setCurrentJob(response.data);
            alert('Arquivo enviado. Processando...');

            // Polling simples
            pollStatus(response.data._id);
        } catch (error) {
            alert('Erro no upload');
            setUploading(false);
        }

    };

    const pollStatus = async (id: string) => {
        const check = async () => {
            try {
                const res = await importService.getJobStatus(id);
                setCurrentJob(res.data.job);
                if (res.data.job.status === 'VALIDATED' || res.data.job.status === 'FAILED') {
                    setUploading(false);
                    return;
                }
                setTimeout(check, 2000);
            } catch (e) {
                setUploading(false);
            }
        };
        check();
    };

    const handleCommit = async () => {
        if (!currentJob) return;
        try {
            setUploading(true);
            await importService.commitJob(currentJob._id);
            alert('Dados importados com sucesso!');
            setCurrentJob(null);
            setFile(null);
        } catch (error) {
            alert('Erro ao confirmar importação');
        } finally {

            setUploading(false);
        }
    };

    return (
        <div className="pcp-day-container">
            <header className="pcp-header">
                <div>
                    <h1>Importação de Dados (SISTEC)</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Importe planilhas de Pré-Escala ou Lotes Externos para o PCP.</p>
                </div>
                <div className="header-actions">
                    <button className="deb-new-btn-outline" onClick={() => window.history.back()}>
                        <ChevronRight style={{ transform: 'rotate(180deg)' }} /> Voltar
                    </button>
                </div>
            </header>

            <div className="pcp-grid" style={{ gridTemplateColumns: 'minmax(300px, 400px) 1fr', alignItems: 'start' }}>
                <div className="pcp-panel">
                    <div className="panel-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileUp size={18} />
                            <h3>Configuração</h3>
                        </div>
                    </div>

                    <div className="deb-new-form-group">
                        <label>Tipo de Importação</label>
                        <select value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="PRE_SCHEDULE_IMPORT">Pré-Escala de Abate</option>
                            <option value="EXTERNAL_LOT_IMPORT">Lotes de Terceiros (Desossa)</option>
                        </select>
                    </div>

                    <div className="deb-new-form-group" style={{ marginTop: '16px' }}>
                        <label>Data de Referência</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>

                    <div className="upload-area" style={{
                        marginTop: '24px',
                        border: '2px dashed var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '32px',
                        textAlign: 'center',
                        background: 'var(--surface-2)',
                        transition: 'all 0.2s'
                    }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
                    }}>
                        <FileUp size={48} color="var(--primary)" style={{ marginBottom: '16px', opacity: 0.5 }} />
                        {file ? (
                            <div className="file-info" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span className="file-name" style={{ fontWeight: 700, color: 'var(--primary)' }}>{file.name}</span>
                                <button className="deb-new-btn-icon danger" style={{ alignSelf: 'center' }} onClick={() => setFile(null)}>Remover</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Arraste o arquivo .csv ou .xlsx aqui</p>
                                <button className="deb-new-btn-outline" onClick={() => document.getElementById('fileInput')?.click()}>Selecionar Arquivo</button>
                            </div>
                        )}
                        <input
                            type="file"
                            id="fileInput"
                            style={{ display: 'none' }}
                            onChange={(e) => e.target.files && setFile(e.target.files[0])}
                        />
                    </div>

                    <button
                        className="deb-new-btn-primary"
                        style={{ width: '100%', marginTop: '24px' }}
                        disabled={!file || uploading}
                        onClick={handleUpload}
                    >
                        {uploading ? <Loader2 className="spinner" size={20} /> : <><ArrowRight size={20} /> Processar Arquivo</>}
                    </button>
                </div>

                {currentJob && (
                    <div className="pcp-panel">
                        <div className="panel-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Loader2 size={18} className={currentJob.status === 'PROCESSING' ? 'spinner' : ''} />
                                <h3>Status do Processamento</h3>
                            </div>
                            <span className={`deb-new-badge ${currentJob.status === 'VALIDATED' ? 'concluido' : currentJob.status === 'FAILED' ? 'pendente' : 'em-processo'}`}>
                                {currentJob.status}
                            </span>
                        </div>

                        <div className="pcp-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 0 }}>
                            <div className="stat">
                                <span className="label">Linhas</span>
                                <span className="value" style={{ fontSize: '1.5rem' }}>{currentJob.totalRows}</span>
                            </div>
                            <div className="stat">
                                <span className="label">Válidas</span>
                                <span className="value" style={{ fontSize: '1.5rem', color: 'var(--success)' }}>{currentJob.validRows}</span>
                            </div>
                            <div className="stat">
                                <span className="label">Erros</span>
                                <span className="value" style={{ fontSize: '1.5rem', color: 'var(--danger)' }}>{currentJob.errorRows}</span>
                            </div>
                        </div>

                        {currentJob.status === 'VALIDATED' && (
                            <div style={{ marginTop: '32px', padding: '24px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <CheckCircle color="var(--success)" size={24} />
                                    <h4 style={{ margin: 0 }}>Pronto para Importar</h4>
                                </div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                                    Os dados foram validados com sucesso. Deseja confirmar a importação para o dia <strong>{format(new Date(date), 'dd/MM/yyyy')}</strong>?
                                </p>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button className="deb-new-btn-primary" onClick={handleCommit}>
                                        <CheckCircle size={18} /> Confirmar Importação
                                    </button>
                                    <button className="deb-new-btn-outline" onClick={() => setCurrentJob(null)}>
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentJob.status === 'FAILED' && (
                            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                                    <AlertCircle size={20} />
                                    <strong style={{ fontSize: '0.875rem' }}>Falha na Validação</strong>
                                </div>
                                <p style={{ fontSize: '0.813rem', color: 'var(--danger)', marginTop: '8px' }}>
                                    Existem erros no arquivo que impedem a importação. Verifique os dados e tente novamente.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PcpImports;
