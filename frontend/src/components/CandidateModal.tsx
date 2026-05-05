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
    ExternalLink,
    Mail,
    Phone,
    ClipboardList
} from 'lucide-react';
import './CandidateModal.css';

interface CandidateModalProps {
    candidateId?: string;
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
    const isEditing = !!candidateId;
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [loading, setLoading] = useState(isEditing);
    const [activeTab, setActiveTab] = useState(isEditing ? 'info' : 'create');
    const [users, setUsers] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    // Form de Criação/Edição
    const [formData, setFormData] = useState<Partial<Candidate>>({
        fullName: '',
        cpf: '',
        email: '',
        phone: '',
        birthDate: '',
        desiredPosition: '',
        education: 'medio_completo',
        status: 'novo',
        priority: 'normal',
        address: {
            city: '',
            state: ''
        },
        experiences: [],
        skills: '',
        lgpdConsent: true
    });

    const [newNote, setNewNote] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    const [interviewData, setInterviewData] = useState({
        scheduledDate: '',
        type: 'presencial',
        interviewer: '',
        location: '',
        notes: ''
    });

    const loadData = useCallback(async () => {
        if (!candidateId) {
            // Se for criação, carregar apenas usuários para o seletor (se necessário futuro)
            try {
                const respUsers = await userService.getAll();
                setUsers(respUsers.data);
            } catch (error) {
                console.error('Erro ao carregar usuários:', error);
            }
            return;
        }

        setLoading(true);
        try {
            const [respCand, respUsers] = await Promise.all([
                candidateService.getById(candidateId),
                userService.getAll()
            ]);
            setCandidate(respCand.data);
            setUsers(respUsers.data);
            setFormData(respCand.data);
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

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('address.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address!,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEditing) {
                await candidateService.update(candidateId, formData);
            } else {
                await candidateService.create(formData);
            }
            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar candidato:', error);
            alert(error.response?.data?.message || 'Erro ao salvar candidato. Verifique os campos obrigatórios e se o CPF já está cadastrado.');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        try {
            await candidateService.updateStatus(candidateId!, status);
            loadData();
        } catch (error) {
            alert('Erro ao atualizar status');
        }
    };

    const handleAssign = async (userId: string) => {
        try {
            await candidateService.assign(candidateId!, userId === '' ? null : userId);
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
            await candidateService.addNote(candidateId!, newNote);
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
            await candidateService.scheduleInterview(candidateId!, interviewData);
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

    if (loading) {
        return (
            <div className="candidate-modal-overlay">
                <div className="candidate-modal-loading">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="candidate-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="candidate-modal-card">
                <header className="modal-header">
                    <div className="candidate-header-info">
                        <div className="candidate-avatar-large">
                            {isEditing ? (candidate?.fullName?.charAt(0).toUpperCase() || '?') : <Plus size={32} />}
                        </div>
                        <div>
                            <h2>{isEditing ? (candidate?.fullName || 'Sem Nome') : 'Novo Candidato'}</h2>
                            <p>{isEditing ? `${candidate?.desiredPosition || 'Cargo não inf.'} • ${candidate?.protocol || 'Sem protocolo'}` : 'Cadastrar novo talento manualmente'}</p>
                        </div>
                    </div>
                    <button className="btn-close" onClick={onClose}><X size={24} /></button>
                </header>

                {isEditing && (
                    <div className="modal-top-bar">
                        <div className="top-bar-item">
                            <label>Status do Processo</label>
                            <select
                                value={candidate?.status}
                                onChange={(e) => handleUpdateStatus(e.target.value)}
                                style={{
                                    background: STATUS_OPTIONS.find(o => o.id === candidate?.status)?.color || '#ddd',
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
                                value={candidate?.assignedTo?._id || ''}
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
                                {candidate?.priority.toUpperCase()}
                            </div>
                        </div>
                    </div>
                )}

                <nav className="modal-tabs">
                    {!isEditing ? (
                        <button className="active"><ClipboardList size={18} /> Dados do Candidato</button>
                    ) : (
                        <>
                            <button className={activeTab === 'info' ? 'active' : ''} onClick={() => setActiveTab('info')}>
                                <User size={18} /> Perfil
                            </button>
                            <button className={activeTab === 'notes' ? 'active' : ''} onClick={() => setActiveTab('notes')}>
                                <MessageSquare size={18} /> Notas ({candidate?.notes.length})
                            </button>
                            <button className={activeTab === 'interviews' ? 'active' : ''} onClick={() => setActiveTab('interviews')}>
                                <Calendar size={18} /> Entrevistas ({candidate?.interviews.length})
                            </button>
                            <button className={activeTab === 'docs' ? 'active' : ''} onClick={() => setActiveTab('docs')}>
                                <FileText size={18} /> Documentos ({candidate?.documents.length})
                            </button>
                        </>
                    )}
                </nav>

                <main className="modal-content">
                    {(!isEditing || activeTab === 'create') ? (
                        <form id="candidate-form" className="candidate-form-create" onSubmit={handleCreateSubmit}>
                            <div className="form-section">
                                <h3><User size={18} /> Dados Pessoais</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Nome Completo *</label>
                                        <input type="text" name="fullName" value={formData.fullName} onChange={handleFormChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>CPF *</label>
                                        <input type="text" name="cpf" value={formData.cpf} onChange={handleFormChange} required placeholder="000.000.000-00" />
                                    </div>
                                    <div className="form-group">
                                        <label>Data de Nascimento *</label>
                                        <input type="date" name="birthDate" value={String(formData.birthDate).split('T')[0]} onChange={handleFormChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Email *</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleFormChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Telefone *</label>
                                        <input type="text" name="phone" value={formData.phone} onChange={handleFormChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Cidade *</label>
                                        <input type="text" name="address.city" value={formData.address?.city} onChange={handleFormChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Estado *</label>
                                        <input type="text" name="address.state" value={formData.address?.state} onChange={handleFormChange} required placeholder="EX: SP" />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3><Briefcase size={18} /> Candidatura</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Cargo Desejado *</label>
                                        <input type="text" name="desiredPosition" value={formData.desiredPosition} onChange={handleFormChange} required placeholder="Ex: Operador de Produção" />
                                    </div>
                                    <div className="form-group">
                                        <label>Escolaridade</label>
                                        <select name="education" value={formData.education} onChange={handleFormChange}>
                                            <option value="fundamental_incompleto">Fundamental Incompleto</option>
                                            <option value="fundamental_completo">Fundamental Completo</option>
                                            <option value="medio_incompleto">Médio Incompleto</option>
                                            <option value="medio_completo">Médio Completo</option>
                                            <option value="tecnico">Técnico</option>
                                            <option value="superior_incompleto">Superior Incompleto</option>
                                            <option value="superior_completo">Superior Completo</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Prioridade</label>
                                        <select name="priority" value={formData.priority} onChange={handleFormChange}>
                                            <option value="normal">Normal</option>
                                            <option value="alta">Alta</option>
                                            <option value="urgente">Urgente</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <>
                        {activeTab === 'info' && candidate && (
                            <div className="tab-pane-info">
                                <div className="info-section">
                                    <h3><User size={18} /> Dados Pessoais</h3>
                                    <div className="info-grid">
                                        <div className="info-item"><span>CPF</span><p>{candidate.cpf}</p></div>
                                        <div className="info-item"><span>Nascimento</span><p>{candidate.birthDate ? new Date(candidate.birthDate).toLocaleDateString() : 'Não inf.'}</p></div>
                                        <div className="info-item"><span>Email</span><p>{candidate.email || 'Não inf.'}</p></div>
                                        <div className="info-item"><span>Telefone</span><p>{candidate.phone || 'Não inf.'}</p></div>
                                        <div className="info-item"><span>Escolaridade</span><p>{candidate.education?.replace('_', ' ') || 'Não inf.'}</p></div>
                                        <div className="info-item"><span>Endereço</span><p>{candidate.address?.city || 'Cidade?' } - {candidate.address?.state || 'Estado?'}</p></div>
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
                                    {candidate?.notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(note => (
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
                                    {candidate?.notes.length === 0 && <p className="empty-msg">Sem notas registradas.</p>}
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
                                            {candidate?.interviews.map((interview: any) => (
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
                                            {candidate?.interviews.length === 0 && <p className="empty-msg">Nenhuma entrevista agendada.</p>}
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
                                    {candidate?.documents.map((doc: any) => (
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
                        </>
                    )}
                </main>

                <footer className="modal-footer">
                    {isEditing && activeTab !== 'create' ? (
                        <>
                            <p className="privacy-msg">
                                <CheckCircle2 size={14} /> Candidato aceitou os termos LGPD em {new Date(candidate!.lgpdConsentDate).toLocaleString()}
                            </p>
                            <div className="footer-actions">
                                <button type="button" className="btn-delete-modal"><Trash2 size={18} /> Excluir Candidato</button>
                                <button type="button" className="btn-close-footer" onClick={onClose}>Fechar</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="privacy-msg">O cadastro manual pressupõe consentimento conforme LGPD.</p>
                            <div className="footer-actions">
                                <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
                                <button type="submit" form="candidate-form" className="btn-primary" disabled={saving}>
                                    {saving ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Cadastrar Candidato')}
                                </button>
                            </div>
                        </>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default CandidateModal;
