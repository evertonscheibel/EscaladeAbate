import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { UserPlus, User, Shield, Check, Save } from 'lucide-react';
import { StandardFormModal } from './StandardFormModal';

interface User {
    _id: string;
    name: string;
    email: string;
    supportLevel?: string;
    role: string;
}

interface AssignModalProps {
    ticketId: string;
    currentAssigneeId?: string;
    onClose: () => void;
    onAssign: (userId: string, level: string) => void;
}

export const AssignModal: React.FC<AssignModalProps> = ({ ticketId, currentAssigneeId, onClose, onAssign }) => {
    const [technicians, setTechnicians] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<string>(currentAssigneeId || '');
    const [supportLevel, setSupportLevel] = useState<string>('N1');

    useEffect(() => {
        loadTechnicians();
    }, []);

    const loadTechnicians = async () => {
        try {
            const response = await api.get('/users');

            let usersList: User[] = [];
            if (Array.isArray(response.data)) {
                usersList = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                usersList = response.data.data;
            } else if (response.data && response.data.users && Array.isArray(response.data.users)) {
                usersList = response.data.users;
            }

            const techs = usersList.filter((u: any) =>
                u.role === 'tecnico' || u.role === 'admin'
            );

            setTechnicians(techs);
        } catch (error) {
            console.error('Erro ao listar técnicos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAssign(selectedUser, supportLevel);
    };

    const footerContent = (
        <>
            <button type="button" className="sfm-btn sfm-btn-secondary" onClick={onClose}>
                Cancelar
            </button>
            <button
                type="submit"
                form="assign-form"
                className="sfm-btn sfm-btn-primary"
                disabled={!selectedUser}
            >
                <Check size={18} />
                Confirmar Atribuição
            </button>
        </>
    );

    return (
        <StandardFormModal
            isOpen={true}
            onClose={onClose}
            title="Atribuir Responsável"
            icon={<UserPlus size={22} />}
            size="sm"
            footer={footerContent}
        >
            <form id="assign-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label><User size={14} /> Selecionar Técnico / Administrador</label>
                    <select
                        value={selectedUser}
                        onChange={e => setSelectedUser(e.target.value)}
                        required
                    >
                        <option value="">Selecione o profissional...</option>
                        {technicians.map(tech => (
                            <option key={tech._id} value={tech._id}>
                                {tech.name} {tech.supportLevel ? `(${tech.supportLevel})` : ''} - {tech.role}
                            </option>
                        ))}
                    </select>
                    {loading && <span style={{ fontSize: '12px', color: '#64748b' }}>Carregando profissionais...</span>}
                </div>

                <div className="form-group" style={{ marginTop: '20px' }}>
                    <label><Shield size={14} /> Nível de Prioridade / Suporte</label>
                    <select
                        value={supportLevel}
                        onChange={e => setSupportLevel(e.target.value)}
                    >
                        <option value="N1">Nível 1 (Suporte Básico / Triagem)</option>
                        <option value="N2">Nível 2 (Suporte Avançado)</option>
                        <option value="N3">Nível 3 (Especialista / Consultoria)</option>
                        <option value="FIELD">Suporte de Campo (Presencial)</option>
                    </select>
                </div>

                <div style={{
                    marginTop: '24px',
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#64748b',
                    border: '1px dashed #e2e8f0'
                }}>
                    <p style={{ margin: 0 }}>* O técnico receberá uma notificação automática no painel e e-mail assim que a atribuição for confirmada.</p>
                </div>
            </form>
        </StandardFormModal>
    );
};
