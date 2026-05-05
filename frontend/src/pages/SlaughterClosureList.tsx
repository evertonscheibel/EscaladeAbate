import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileSearch,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Clock,
    Plus
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import pcpService from '../services/pcpService';
import { slaughterService } from '../services/slaughterService';
import './SlaughterClosureList.css';


const SlaughterClosureList: React.FC = () => {
    const navigate = useNavigate();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [daysInfo, setDaysInfo] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [currentMonth]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const monthStr = format(currentMonth, 'yyyy-MM');
            const data = await slaughterService.getCalendar(monthStr);
            setDaysInfo(data.data || []);
        } catch (error) {
            console.error('Erro ao buscar dados de abate');
        } finally {
            setLoading(false);
        }
    };


    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    const getDayInfo = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return daysInfo.find(d => d.date === dateStr);
    };


    return (
        <div className="pcp-calendar-container">
            <header className="pcp-header">
                <div className="header-title">
                    <FileSearch className="title-icon" />
                    <h1>Fechamento Oficial SIF</h1>
                </div>
                <div className="header-nav">
                    <button className="btn-nav" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                        <ChevronLeft />
                    </button>
                    <span className="current-month">
                        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                    <button className="btn-nav" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                        <ChevronRight />
                    </button>
                </div>
            </header>

            <div className="calendar-grid">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                    <div key={d} className="weekday-label">{d}</div>
                ))}

                {days.map(day => {
                    const info = getDayInfo(day);
                    const hasAbate = info && info.totalCattle > 0;
                    const isScheduleClosed = info && info.status === 'CLOSED';


                    return (
                        <div
                            key={day.toISOString()}
                            className={`calendar-day ${!isSameMonth(day, currentMonth) ? 'off-month' : ''} ${hasAbate ? 'active-abate' : ''} ${isScheduleClosed ? 'ready-for-closure' : 'waiting-schedule'}`}
                            onClick={() => {
                                if (!hasAbate) return;
                                if (!isScheduleClosed) {
                                    alert('A escala de abate precisa ser FECHADA antes de iniciar o fechamento SIF.');
                                    return;
                                }
                                navigate(`/slaughter-closure/${format(day, 'yyyy-MM-dd')}`);
                            }}
                            style={{ opacity: hasAbate ? 1 : 0.5, cursor: hasAbate ? 'pointer' : 'default' }}
                        >

                            <span className="day-number">{format(day, 'd')}</span>
                            {hasAbate && (
                                <div className="day-indicators">
                                    <div className="indicator abate">
                                        <span className="dot"></span> {info.totalCattle} Animais
                                    </div>

                                    <div className={`status-badge-small ${info.status === 'CLOSED' ? 'closed' : 'pending'}`}>
                                        {info.status === 'CLOSED' ?
                                            <><CheckCircle2 size={10} /> Fechado</> :
                                            <><Clock size={10} /> Pendente</>
                                        }
                                    </div>

                                </div>
                            )}
                            {!hasAbate && isSameMonth(day, currentMonth) && (
                                <div className="no-data-hint">Sem Abate</div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="pcp-summary-footer">
                <div className="legend">
                    <div className="legend-item"><span className="status-dot closed"></span> SIF Fechado</div>
                    <div className="legend-item"><span className="status-dot in_progress"></span> SIF Pendente</div>
                </div>
                <div className="quick-access">
                    <p>Clique em um dia com abate para preencher o fechamento SIF.</p>
                </div>
            </div>
        </div>
    );
};

export default SlaughterClosureList;
