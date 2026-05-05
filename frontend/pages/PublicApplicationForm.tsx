import React, { useState, useEffect } from 'react';
import { candidateService, jobPositionService } from '../services';
import { JobPosition } from '../services/jobPositionService';

import {
    User,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    GraduationCap,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Send,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import './PublicApplicationForm.css';

const PublicApplicationForm: React.FC = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [protocol, setProtocol] = useState('');
    const [error, setError] = useState('');
    const [openPositions, setOpenPositions] = useState<JobPosition[]>([]);


    const [formData, setFormData] = useState({
        fullName: '',
        cpf: '',
        birthDate: '',
        gender: 'prefiro_nao_informar',
        maritalStatus: 'solteiro',
        email: '',
        phone: '',
        whatsapp: '',
        address: {
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: ''
        },
        desiredPosition: '',
        desiredSalary: '',
        workShift: 'integral',
        education: 'medio_completo',
        courses: '',
        skills: '',
        experiences: [
            { company: '', position: '', startDate: '', endDate: '', currentJob: false, description: '' }
        ],
        lgpdConsent: false,
        jobPosition: ''
    });

    useEffect(() => {
        const fetchPositions = async () => {
            try {
                const response = await jobPositionService.getOpen();
                setOpenPositions(response.data);
            } catch (err) {
                console.error('Erro ao carregar vagas:', err);
            }
        };
        fetchPositions();
    }, []);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev as any)[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleExperienceChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        const newExperiences = [...formData.experiences];
        (newExperiences as any)[index][name] = val;
        setFormData({ ...formData, experiences: newExperiences });
    };

    const addExperience = () => {
        setFormData({
            ...formData,
            experiences: [...formData.experiences, { company: '', position: '', startDate: '', endDate: '', currentJob: false, description: '' }]
        });
    };

    const removeExperience = (index: number) => {
        const newExperiences = formData.experiences.filter((_, i) => i !== index);
        setFormData({ ...formData, experiences: newExperiences });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.lgpdConsent) {
            setError('Você deve aceitar os termos da LGPD para continuar.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await candidateService.createPublic(formData);
            setProtocol(response.data.protocol);
            setSubmitted(true);
            window.scrollTo(0, 0);
        } catch (err: any) {
            console.error('Erro ao enviar formulário:', err);
            setError(err.response?.data?.message || 'Erro ao enviar sua candidatura. Por favor, tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    if (submitted) {
        return (
            <div className="public-form-container">
                <div className="success-card">
                    <div className="success-icon">
                        <CheckCircle2 size={64} />
                    </div>
                    <h1>Candidatura Enviada!</h1>
                    <p>Obrigado por seu interesse em fazer parte da nossa equipe.</p>
                    <div className="protocol-box">
                        <span>Seu número de protocolo:</span>
                        <strong>{protocol}</strong>
                    </div>
                    <p className="success-footer">
                        Guarde este número para consultas futuras. Nosso RH analisará seu perfil e entrará em contato se houver uma oportunidade compatível.
                    </p>
                    <button onClick={() => window.location.reload()} className="btn-refresh">
                        Enviar outra candidatura
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="public-form-container">
            <div className="form-header">
                <img src="/logo.png" alt="Logo" className="form-logo" />
                <h1>Trabalhe Conosco</h1>
                <p>Venha fazer parte do nosso time de talentos!</p>
            </div>

            <div className="form-progress">
                <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                    <div className="step-number">1</div>
                    <span>Dados Pessoais</span>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                    <div className="step-number">2</div>
                    <span>Endereço e Vaga</span>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                    <div className="step-number">3</div>
                    <span>Qualificação</span>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${step >= 4 ? 'active' : ''}`}>
                    <div className="step-number">4</div>
                    <span>Experiência</span>
                </div>
            </div>

            <div className="form-card">
                {error && (
                    <div className="error-banner">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {step === 1 && (
                        <div className="form-section">
                            <h2><User size={20} /> Informações Básicas</h2>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Nome Completo *</label>
                                    <input
                                        type="text" name="fullName" value={formData.fullName}
                                        onChange={handleInputChange} required placeholder="Seu nome completo"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>CPF *</label>
                                    <input
                                        type="text" name="cpf" value={formData.cpf}
                                        onChange={handleInputChange} required placeholder="000.000.000-00"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Data de Nascimento *</label>
                                    <input
                                        type="date" name="birthDate" value={formData.birthDate}
                                        onChange={handleInputChange} required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Gênero</label>
                                    <select name="gender" value={formData.gender} onChange={handleInputChange}>
                                        <option value="masculino">Masculino</option>
                                        <option value="feminino">Feminino</option>
                                        <option value="outro">Outro</option>
                                        <option value="prefiro_nao_informar">Prefiro não informar</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Estado Civil</label>
                                    <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange}>
                                        <option value="solteiro">Solteiro(a)</option>
                                        <option value="casado">Casado(a)</option>
                                        <option value="divorciado">Divorciado(a)</option>
                                        <option value="viuvo">Viúvo(a)</option>
                                        <option value="uniao_estavel">União Estável</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email" name="email" value={formData.email}
                                        onChange={handleInputChange} required placeholder="seu@email.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Telefone *</label>
                                    <input
                                        type="tel" name="phone" value={formData.phone}
                                        onChange={handleInputChange} required placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={nextStep} className="btn-next">
                                    Próximo <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="form-section">
                            <h2><MapPin size={20} /> Endereço e Cargo</h2>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>CEP</label>
                                    <input
                                        type="text" name="address.zipCode" value={formData.address.zipCode}
                                        onChange={handleInputChange} placeholder="00000-000"
                                    />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Cidade *</label>
                                    <input
                                        type="text" name="address.city" value={formData.address.city}
                                        onChange={handleInputChange} required placeholder="Sua cidade"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>UF *</label>
                                    <input
                                        type="text" name="address.state" value={formData.address.state}
                                        onChange={handleInputChange} required placeholder="EX: MS" maxLength={2}
                                    />
                                </div>
                                <div className="form-group full-width" style={{ marginTop: '1rem' }}>
                                    <hr className="divider" />
                                </div>
                                <div className="form-group full-width">
                                    <label><Briefcase size={18} /> Vaga Desejada *</label>
                                    <select
                                        name="jobPosition"
                                        value={formData.jobPosition}
                                        onChange={(e) => {
                                            const posId = e.target.value;
                                            const pos = openPositions.find(p => p._id === posId);
                                            setFormData({
                                                ...formData,
                                                jobPosition: posId,
                                                desiredPosition: pos ? pos.titulo_vaga : ''
                                            });
                                        }}
                                        required
                                    >
                                        <option value="">Selecione uma vaga</option>
                                        {openPositions.map(pos => (
                                            <option key={pos._id} value={pos._id}>
                                                {pos.titulo_vaga} ({pos.setor})
                                            </option>
                                        ))}
                                        <option value="outra">Outra (Especificar abaixo)</option>
                                    </select>
                                </div>
                                {formData.jobPosition === 'outra' && (
                                    <div className="form-group full-width">
                                        <label>Especifique o Cargo *</label>
                                        <input
                                            type="text"
                                            name="desiredPosition"
                                            value={formData.desiredPosition}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Ex: Motorista, Auxiliar Administrativo..."
                                        />
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Pretensão Salarial</label>
                                    <input
                                        type="number" name="desiredSalary" value={formData.desiredSalary}
                                        onChange={handleInputChange} placeholder="R$ 0,00"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Turno de Preferência</label>
                                    <select name="workShift" value={formData.workShift} onChange={handleInputChange}>
                                        <option value="manha">Manhã</option>
                                        <option value="tarde">Tarde</option>
                                        <option value="noite">Noite</option>
                                        <option value="integral">Integral</option>
                                        <option value="flexivel">Flexível</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={prevStep} className="btn-prev">
                                    <ChevronLeft size={18} /> Anterior
                                </button>
                                <button type="button" onClick={nextStep} className="btn-next">
                                    Próximo <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="form-section">
                            <h2><GraduationCap size={20} /> Qualificação</h2>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Escolaridade *</label>
                                    <select name="education" value={formData.education} onChange={handleInputChange} required>
                                        <option value="fundamental_incompleto">Fundamental Incompleto</option>
                                        <option value="fundamental_completo">Fundamental Completo</option>
                                        <option value="medio_incompleto">Ensino Médio Incompleto</option>
                                        <option value="medio_completo">Ensino Médio Completo</option>
                                        <option value="tecnico">Ensino Técnico</option>
                                        <option value="superior_incompleto">Ensino Superior Incompleto</option>
                                        <option value="superior_completo">Ensino Superior Completo</option>
                                        <option value="pos_graduacao">Pós-Graduação</option>
                                        <option value="mestrado_doutorado">Mestrado ou Doutorado</option>
                                    </select>
                                </div>
                                <div className="form-group full-width">
                                    <label>Resumo de Cursos e Treinamentos</label>
                                    <textarea
                                        name="courses" value={formData.courses} onChange={handleInputChange}
                                        placeholder="Liste seus principais cursos extras" rows={3}
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Habilidades e Conhecimentos</label>
                                    <textarea
                                        name="skills" value={formData.skills} onChange={handleInputChange}
                                        placeholder="Ex: Informática, Operação de Máquinas, Boas práticas de fabricação..." rows={3}
                                    />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={prevStep} className="btn-prev">
                                    <ChevronLeft size={18} /> Anterior
                                </button>
                                <button type="button" onClick={nextStep} className="btn-next">
                                    Próximo <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="form-section">
                            <h2><Calendar size={20} /> Experiência Profissional</h2>
                            <p className="section-hint">Adicione suas últimas 3 experiências, se houver.</p>

                            {formData.experiences.map((exp, index) => (
                                <div key={index} className="experience-item">
                                    <div className="exp-header">
                                        <h3>#{index + 1} Empresa/Experiência</h3>
                                        {formData.experiences.length > 1 && (
                                            <button type="button" onClick={() => removeExperience(index)} className="btn-remove">Remover</button>
                                        )}
                                    </div>
                                    <div className="form-grid">
                                        <div className="form-group full-width">
                                            <label>Empresa</label>
                                            <input
                                                type="text" name="company" value={exp.company}
                                                onChange={(e) => handleExperienceChange(index, e)} placeholder="Nome da empresa"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Cargo</label>
                                            <input
                                                type="text" name="position" value={exp.position}
                                                onChange={(e) => handleExperienceChange(index, e)} placeholder="Sua função"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Data Início</label>
                                            <input
                                                type="date" name="startDate" value={exp.startDate}
                                                onChange={(e) => handleExperienceChange(index, e)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Data Saída</label>
                                            <input
                                                type="date" name="endDate" value={exp.endDate} disabled={exp.currentJob}
                                                onChange={(e) => handleExperienceChange(index, e)}
                                            />
                                        </div>
                                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '1.5rem' }}>
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox" name="currentJob" checked={exp.currentJob}
                                                    onChange={(e) => handleExperienceChange(index, e)}
                                                />
                                                Emprego Atual
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {formData.experiences.length < 5 && (
                                <button type="button" onClick={addExperience} className="btn-add-exp">
                                    + Adicionar Experiência
                                </button>
                            )}

                            <div className="lgpd-consent-box">
                                <label className="lgpd-label">
                                    <input
                                        type="checkbox" checked={formData.lgpdConsent}
                                        onChange={(e) => setFormData({ ...formData, lgpdConsent: e.target.checked })}
                                        required
                                    />
                                    <span>
                                        Ao enviar meus dados, estou ciente e concordo com o armazenamento e processamento das minhas informações
                                        pelo Departamento de RH para fins de recrutamento e seleção, conforme a <strong>LGPD (Lei Geral de Proteção de Dados)</strong>.
                                        Meus dados serão mantidos em segurança e anonimizados após 180 dias se não houver contratação.
                                    </span>
                                </label>
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={prevStep} className="btn-prev">
                                    <ChevronLeft size={18} /> Anterior
                                </button>
                                <button type="submit" className="btn-submit" disabled={loading}>
                                    {loading ? 'Enviando...' : (
                                        <>Finalizar e Enviar Candidatura <Send size={18} /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default PublicApplicationForm;
