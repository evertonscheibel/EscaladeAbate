import React, { useState, useEffect, useCallback } from 'react';
import {
    candidateService,
    Candidate,
    userService
} from '../services';
import {
    X,
    User,
    FileText,
    MessageSquare,
    Calendar,
    MapPin,
    Briefcase,
    GraduationCap,
    CheckCircle2,
    Plus,
    Save,
    Trash2,
    Star,
    ExternalLink
} from 'lucide-react';
import './CandidateModal.css';

interface CandidateModalProps {
    candidateId: string;
    onClose: () => void;
}

const STATUS_OPTIONS = [
    { id: 'novo', label: 'Novo', color: '#3b82f6' },
    { id: 'em_analise', label: 'Em Análise', color: '#f59e0b' },
    { id: 'pre_selecionado', label: 'Pré-selecionado', color: '#8b5cf6' },
    { id: 'aguardando_entrevista', label: 'Aguardando Entrevista', color: '#ec4899' },
    { id: 'entrevistado', label: 'Entrevistado', color: '#6366f1' },
    { id: 'aprovado', label: 'Aprovado', color: '#10b981' },
    { id: 'reprovado', label: 'Reprovado', color: '#ef4444' },
    { id: 'desistente', label: 'Desistente', color: '#64748b' },
    { id: 'contratado', label: 'Contratado', color: '#059669' }
];

const CandidateModal: React.FC<CandidateModalProps> = ({ candidateId, onClose }) => {
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info');
    const [users, setUsers] = useState<any[]>([]);
    const [newNote, setNewNote] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    // Form de Entrevista
    const [interviewData, setInterviewData] = useState({
        scheduledDate: '',
        type: 'presencial',
        interviewer: '',
        location: '',
        notes: ''
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [respCand, respUsers] = await Promise.all([
                candidateService.getById(candidateId),
                userService.getAll()
            ]);
            setCandidate(respCand.data);
            setUsers(respUsers.data);
        } catch (error) {
            console.error('Erro ao carregar dados do candidato:', error);
            onClose();
        } finally {
            setLoading(false);
        }
    }, [candidateId, onClose]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleUpdateStatus = async (status: string) => {
        try {
            await candidateService.updateStatus(candidateId, status);
            loadData();
        } catch (error) {
            alert('Erro ao atualizar status');
        }
    };

    const handleAssign = async (userId: string) => {
        try {
            await candidateService.assign(candidateId, userId === '' ? null : userId);
            loadData();
        } catch (error) {
            alert('Erro ao atribuir responsável');
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setSavingNote(true);
        try {
            await candidateService.addNote(candidateId, newNote);
            setNewNote('');
            loadData();
        } catch (error) {
            alert('Erro ao adicionar nota');
        } finally {
            setSavingNote(false);
        }
    };

    const handleScheduleInterview = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await candidateService.scheduleInterview(candidateId, interviewData);
            setInterviewData({
                scheduledDate: '',
                type: 'presencial',
                interviewer: '',
                location: '',
                notes: ''
            });
            loadData();
            alert('Entrevista agendada com sucesso!');
        } catch (error) {
            alert('Erro ao agendar entrevista');
        }
    };

    if (loading || !candidate) {
        return (
            <div className="candidate-modal-overlay">
                <div className="candidate-modal-loading">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="candidate-modal-overlay">
            <div className="candidate-modal-card">
                <header className="modal-header">
                    <div className="candidate-header-info">
                        <div className="candidate-avatar-large">
                            {candidate.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2>{candidate.fullName}</h2>
                            <p>{candidate.desiredPosition} • <code className="protocol-text">{candidate.protocol}</code></p>
                        </div>
                    </div>
                    <button className="btn-close" onClick={onClose}><X size={24} /></button>
                </header>

                <div className="modal-top-bar">
                    <div className="top-bar-item">
                        <label>Status do Processo</label>
                        <select
                            value={candidate.status}
                            onChange={(e) => handleUpdateStatus(e.target.value)}
                            style={{
                                background: STATUS_OPTIONS.find(o => o.id === candidate.status)?.color || '#ddd',
                                color: 'white'
                            }}
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="top-bar-item">
                        <label>Responsável RH</label>
                        <select
                            value={candidate.assignedTo?._id || ''}
                            onChange={(e) => handleAssign(e.target.value)}
                        >
                            <option value="">Não atribuído</option>
                            {users.map(user => (
                                <option key={user._id} value={user._id}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="top-bar-item">
                        <label>Prioridade</label>
                        <div className="priority-badge">
                            {candidate.priority.toUpperCase()}
                        </div>
                    </div>
                </div>

                <nav className="modal-tabs">
                    <button className={activeTab === 'info' ? 'active' : ''} onClick={() => setActiveTab('info')}>
                        <User size={18} /> Perfil
                    </button>
                    <button className={activeTab === 'notes' ? 'active' : ''} onClick={() => setActiveTab('notes')}>
                        <MessageSquare size={18} /> Notas ({candidate.notes.length})
                    </button>
                    <button className={activeTab === 'interviews' ? 'active' : ''} onClick={() => setActiveTab('interviews')}>
                        <Calendar size={18} /> Entrevistas ({candidate.interviews.length})
                    </button>
                    <button className={activeTab === 'docs' ? 'active' : ''} onClick={() => setActiveTab('docs')}>
                        <FileText size={18} /> Documentos ({candidate.documents.length})
                    </button>
                </nav>

                <main className="modal-content">
                    {activeTab === 'info' && (
                        <div className="tab-pane-info">
                            <div className="info-section">
                                <h3><User size={18} /> Dados Pessoais</h3>
                                <div className="info-grid">
                                    <div className="info-item"><span>CPF</span><p>{candidate.cpf}</p></div>
                                    <div className="info-item"><span>Nascimento</span><p>{new Date(candidate.birthDate).toLocaleDateString()}</p></div>
                                    <div className="info-item"><span>Email</span><p>{candidate.email}</p></div>
                                    <div className="info-item"><span>Telefone</span><p>{candidate.phone}</p></div>
                                    <div className="info-item"><span>Escolaridade</span><p>{candidate.education.replace('_', ' ')}</p></div>
                                    <div className="info-item"><span>Endereço</span><p>{candidate.address.city} - {candidate.address.state}</p></div>
                                </div>
                            </div>

                            <div className="info-section">
                                <h3><Briefcase size={18} /> Experiência Profissional</h3>
                                <div className="experience-list">
                                    {candidate.experiences.length > 0 ? candidate.experiences.map((exp: any, i: number) => (
                                        <div key={i} className="exp-card">
                                            <div className="exp-icon"><Briefcase size={16} /></div>
                                            <div className="exp-details">
                                                <h4>{exp.position}</h4>
                                                <p className="exp-company">{exp.company} • {new Date(exp.startDate).toLocaleDateString()} - {exp.currentJob ? 'Atual' : exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'N/A'}</p>
                                                {exp.description && <p className="exp-desc">{exp.description}</p>}
                                            </div>
                                        </div>
                                    )) : <p className="empty-msg">Nenhuma experiência registrada.</p>}
                                </div>
                            </div>

                            <div className="info-section">
                                <h3><Star size={18} /> Qualificações e Habilidades</h3>
                                <div className="skills-content">
                                    {candidate.skills ? (
                                        <div className="skill-tags">
                                            {candidate.skills.split(',').map((s: string, i: number) => <span key={i} className="skill-tag">{s.trim()}</span>)}
                                        </div>
                                    ) : <p className="empty-msg">Nenhuma habilidade informada.</p>}
                                    {candidate.courses && (
                                        <div className="courses-box">
                                            <strong>Cursos:</strong>
                                            <p>{candidate.courses}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="tab-pane-notes">
                            <form className="note-form" onSubmit={handleAddNote}>
                                <textarea
                                    placeholder="Adicionar um comentário ou observação sobre este candidato..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    rows={3}
                                />
                                <button type="submit" disabled={savingNote || !newNote.trim()}>
                                    {savingNote ? 'Salvando...' : <><Save size={18} /> Salvar Nota</>}
                                </button>
                            </form>

                            <div className="notes-timeline">
                                {candidate.notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(note => (
                                    <div key={note._id} className="timeline-item">
                                        <div className="timeline-dot"></div>
                                        <div className="note-content">
                                            <div className="note-header">
                                                <strong>{note.author}</strong>
                                                <span>{new Date(note.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p>{note.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {candidate.notes.length === 0 && <p className="empty-msg">Sem notas registradas.</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'interviews' && (
                        <div className="tab-pane-interviews">
                            <div className="interview-grid">
                                <div className="interview-form-col">
                                    <form className="schedule-form" onSubmit={handleScheduleInterview}>
                                        <h3>Agendar Entrevista</h3>
                                        <div className="form-group">
                                            <label>Data e Hora</label>
                                            <input
                                                type="datetime-local" required
                                                value={interviewData.scheduledDate}
                                                onChange={(e) => setInterviewData({ ...interviewData, scheduledDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Tipo</label>
                                            <select
                                                value={interviewData.type}
                                                onChange={(e) => setInterviewData({ ...interviewData, type: e.target.value })}
                                            >
                                                <option value="presencial">Presencial</option>
                                                <option value="video">Chamada de Vídeo</option>
                                                <option value="telefone">Telefone</option>
                                                <option value="tecnica">Teste Técnico</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Entrevistador</label>
                                            <input
                                                type="text" placeholder="Nome do entrevistador"
                                                value={interviewData.interviewer}
                                                onChange={(e) => setInterviewData({ ...interviewData, interviewer: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Local/Link</label>
                                            <input
                                                type="text" placeholder="Local ou Link da sala"
                                                value={interviewData.location}
                                                onChange={(e) => setInterviewData({ ...interviewData, location: e.target.value })}
                                            />
                                        </div>
                                        <button type="submit" className="btn-schedule">
                                            <Plus size={18} /> Confirmar Agendamento
                                        </button>
                                    </form>
                                </div>
                                <div className="interview-list-col">
                                    <h3>Histórico de Entrevistas</h3>
                                    <div className="interviews-list">
                                        {candidate.interviews.map((interview: any) => (
                                            <div key={interview._id} className="interview-card">
                                                <div className="int-header">
                                                    <span className="int-type">{interview.type.toUpperCase()}</span>
                                                    <span className={`int-status status-${interview.status}`}>{interview.status}</span>
                                                </div>
                                                <div className="int-body">
                                                    <div className="int-info"><Calendar size={14} /> {new Date(interview.scheduledDate).toLocaleString()}</div>
                                                    <div className="int-info"><User size={14} /> {interview.interviewer || 'N/A'}</div>
                                                    {interview.location && <div className="int-info"><MapPin size={14} /> {interview.location}</div>}
                                                </div>
                                            </div>
                                        ))}
                                        {candidate.interviews.length === 0 && <p className="empty-msg">Nenhuma entrevista agendada.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'docs' && (
                        <div className="tab-pane-docs">
                            <div className="docs-list">
                                <div className="doc-item mock-doc">
                                    <div className="doc-icon"><FileText size={24} /></div>
                                    <div className="doc-info">
                                        <strong>Currículo Automático.pdf</strong>
                                        <span>PDF • Gerado pelo sistema</span>
                                    </div>
                                    <button className="btn-download"><ExternalLink size={18} /></button>
                                </div>
                                {candidate.documents.map((doc: any) => (
                                    <div key={doc._id} className="doc-item">
                                        <div className="doc-icon"><FileText size={24} /></div>
                                        <div className="doc-info">
                                            <strong>{doc.name}</strong>
                                            <span>{doc.type} • {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                        </div>
                                        <button className="btn-download" onClick={() => window.open(doc.url, '_blank')}>
                                            <ExternalLink size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="doc-upload-zone">
                                <p>Anexar currículo ou certificados adicionais</p>
                                <button className="btn-upload"><Plus size={18} /> Selecionar Arquivo</button>
                            </div>
                        </div>
                    )}
                </main>

                <footer className="modal-footer">
                    <p className="privacy-msg">
                        <CheckCircle2 size={14} /> Candidato aceitou os termos LGPD em {new Date(candidate.lgpdConsentDate).toLocaleString()}
                    </p>
                    <div className="footer-actions">
                        <button className="btn-delete-modal"><Trash2 size={18} /> Excluir Candidato</button>
                        <button className="btn-close-footer" onClick={onClose}>Fechar</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default CandidateModal;
