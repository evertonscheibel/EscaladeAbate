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
            <header className="page-header">
                <div className="header-info">
                    <h1>Importação de Dados (SISTEC)</h1>
                    <p>Importe planilhas de Pré-Escala ou Lotes Externos para o PCP.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => window.history.back()}>
                        <ChevronRight style={{ transform: 'rotate(180deg)' }} /> Voltar
                    </button>
                </div>
            </header>

            <div className="pcp-grid" style={{ gridTemplateColumns: '400px 1fr' }}>
                <div className="pcp-panel">
                    <div className="panel-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileUp size={18} />
                            <h3>Configuração</h3>
                        </div>
                    </div>

                    <div className="form-group-premium">
                        <label>Tipo de Importação</label>
                        <select value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="PRE_SCHEDULE_IMPORT">Pré-Escala de Abate</option>
                            <option value="EXTERNAL_LOT_IMPORT">Lotes de Terceiros (Desossa)</option>
                        </select>
                    </div>

                    <div className="form-group-premium" style={{ marginTop: '20px' }}>
                        <label>Data de Referência</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>

                    <div
                        className="upload-area-premium"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
                        }}
                    >
                        <FileUp size={48} className="upload-icon" />
                        {file ? (
                            <div className="selected-file">
                                <span className="file-name">{file.name}</span>
                                <button className="btn-text-danger" onClick={() => setFile(null)}>Remover Arquivo</button>
                            </div>
                        ) : (
                            <div className="upload-prompt">
                                <p>Arraste o arquivo .csv ou .xlsx aqui</p>
                                <button className="btn-outline-primary" onClick={() => document.getElementById('fileInput')?.click()}>Selecionar Arquivo</button>
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
                        className="btn-primary large-full"
                        style={{ marginTop: '24px' }}
                        disabled={!file || uploading}
                        onClick={handleUpload}
                    >
                        {uploading ? <Loader2 className="animate-spin" size={20} /> : <><ArrowRight size={20} /> Processar Arquivo</>}
                    </button>
                </div>

                {currentJob && (
                    <div className="pcp-panel">
                        <div className="panel-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Loader2 size={18} className={currentJob.status === 'PROCESSING' ? 'animate-spin' : ''} />
                                <h3>Status do Processamento</h3>
                            </div>
                            <span className={`status-badge-premium ${currentJob.status === 'VALIDATED' ? 'success' : currentJob.status === 'FAILED' ? 'danger' : 'warning'}`}>
                                {currentJob.status}
                            </span>
                        </div>

                        <div className="stats-mini-grid">
                            <div className="stat-mini">
                                <label>Total Linhas</label>
                                <span className="value">{currentJob.totalRows}</span>
                            </div>
                            <div className="stat-mini">
                                <label>Válidas</label>
                                <span className="value text-success">{currentJob.validRows}</span>
                            </div>
                            <div className="stat-mini">
                                <label>Erros</label>
                                <span className="value text-danger">{currentJob.errorRows}</span>
                            </div>
                        </div>

                        {currentJob.status === 'VALIDATED' && (
                            <div className="commit-pane-premium">
                                <div className="pane-header">
                                    <CheckCircle size={24} />
                                    <h4>Pronto para Importar</h4>
                                </div>
                                <p>
                                    Os dados foram validados. Deseja confirmar a importação para o dia <strong>{format(new Date(date), 'dd/MM/yyyy')}</strong>?
                                </p>
                                <div className="pane-actions">
                                    <button className="btn-primary" onClick={handleCommit}>
                                        <CheckCircle size={18} /> Confirmar Importação
                                    </button>
                                    <button className="btn-ghost" onClick={() => setCurrentJob(null)}>
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentJob.status === 'FAILED' && (
                            <div className="error-pane-premium">
                                <div className="pane-header">
                                    <AlertCircle size={20} />
                                    <strong>Falha na Validação</strong>
                                </div>
                                <p>
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
