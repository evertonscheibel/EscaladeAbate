import React from 'react';
import { Edit, Trash2, Calendar, DollarSign } from 'lucide-react';

interface MaintenanceListProps {
    maintenances: any[];
    onEdit: (maintenance: any) => void;
    onDelete: (id: string) => void;
}

const statusColors: any = {
    agendada: '#3b82f6',
    em_andamento: '#f59e0b',
    concluida: '#10b981',
    cancelada: '#64748b'
};

const typeLabels: any = {
    preventiva: 'Preventiva',
    corretiva: 'Corretiva',
    preditiva: 'Preditiva',
    emergencial: 'Emergencial'
};

export const MaintenanceList: React.FC<MaintenanceListProps> = ({ maintenances, onEdit, onDelete }) => {
    const totalCost = maintenances.reduce((sum, m) => sum + (m.totalCost || 0), 0);

    return (
        <div>
            <div style={{ marginBottom: '16px', padding: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', opacity: 0.9 }}>Total de Manutenções</p>
                        <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>{maintenances.length}</h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', opacity: 0.9 }}>Custo Total</p>
                        <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>R$ {totalCost.toFixed(2)}</h3>
                    </div>
                </div>
            </div>

            {maintenances.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Nenhuma manutenção registrada</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {maintenances.map((maintenance) => (
                        <div key={maintenance._id} style={{
                            padding: '16px',
                            background: 'white',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            background: statusColors[maintenance.status] || '#64748b',
                                            color: 'white',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '600'
                                        }}>
                                            {maintenance.status}
                                        </span>
                                        <span style={{
                                            padding: '4px 10px',
                                            background: '#f1f5f9',
                                            color: '#475569',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '600'
                                        }}>
                                            {typeLabels[maintenance.type] || maintenance.type}
                                        </span>
                                    </div>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{maintenance.title}</h4>
                                    <p style={{ margin: '0', fontSize: '14px', color: '#64748b' }}>{maintenance.description}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => onEdit(maintenance)} style={{
                                        padding: '8px',
                                        background: '#f0f9ff',
                                        color: '#0369a1',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => onDelete(maintenance._id)} style={{
                                        padding: '8px',
                                        background: '#fee2e2',
                                        color: '#dc2626',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#64748b' }}>
                                {maintenance.startDate && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Calendar size={14} />
                                        <span>{new Date(maintenance.startDate).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                )}
                                {maintenance.totalCost > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1', fontWeight: '600' }}>
                                        <DollarSign size={14} />
                                        <span>R$ {maintenance.totalCost.toFixed(2)}</span>
                                    </div>
                                )}
                                {maintenance.responsible && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>Responsável: {maintenance.responsible.name}</span>
                                    </div>
                                )}
                            </div>

                            {maintenance.parts && maintenance.parts.length > 0 && (
                                <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Peças trocadas:</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {maintenance.parts.map((part: any, index: number) => (
                                            <span key={index} style={{
                                                padding: '4px 8px',
                                                background: 'white',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                color: '#475569'
                                            }}>
                                                {part.name} ({part.quantity}x)
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
