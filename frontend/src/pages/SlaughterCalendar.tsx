import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays, FileSearch } from 'lucide-react';
import { preScheduleService } from '../services/preScheduleService';
import { CalendarDay, MonthlySummary } from '../types/slaughter';
import './SlaughterCalendar.css';

export const SlaughterCalendar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendar, setCalendar] = useState<CalendarDay[]>([]);
    const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
    const [loading, setLoading] = useState(false);

    // Detect mode based on path
    const isClosureMode = location.pathname.startsWith('/slaughter-closure');
    const title = isClosureMode ? 'Fechamento Oficial SIF' : 'Escala de Abate';
    const Icon = isClosureMode ? FileSearch : CalendarDays;

    useEffect(() => {
        loadCalendar();
    }, [currentDate]);

    const loadCalendar = async () => {
        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const response = await preScheduleService.getCalendar(`${year}-${month}`);
            setCalendar(response.data);
            setMonthlySummary(response.monthlySummary);
        } catch (error) {
            console.error('Erro ao carregar calendário:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Dias vazios do início
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Dias do mês
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const calendarDay = calendar.find(c => {
                const cDate = typeof c.date === 'string' ? c.date.split('T')[0] : new Date(c.date).toISOString().split('T')[0];
                return cDate === dateStr;
            });

            days.push({
                date: dateStr,
                day,
                status: calendarDay?.status || null,
                totalCattle: calendarDay?.totalCattle
            });
        }

        return days;
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const handleDayClick = (dateStr: string) => {
        if (isClosureMode) {
            navigate(`/slaughter-closure/${dateStr}`);
        } else {
            navigate(`/slaughter/schedule/${dateStr}`);
        }
    };

    const days = getDaysInMonth();
    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="slaughter-calendar">
            <div className="calendar-header">
                <div className="header-content">
                    <div className="header-top-row">
                        <div className="title-section">
                            <Icon size={32} color="#fff" />
                            <h1>{title}</h1>
                        </div>
                        <div className="month-navigation">
                            <button onClick={handlePrevMonth} className="nav-btn">
                                <ChevronLeft size={20} />
                            </button>
                            <h2>{monthName}</h2>
                            <button onClick={handleNextMonth} className="nav-btn">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    {monthlySummary && (
                        <div className="monthly-summary">
                            <div className="summary-item">
                                <span className="summary-label">Boi</span>
                                <span className="summary-value">{monthlySummary.totalBoi}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Vaca</span>
                                <span className="summary-value">{monthlySummary.totalVaca}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Novilha</span>
                                <span className="summary-value">{monthlySummary.totalNovilha}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Bubalino</span>
                                <span className="summary-value">{monthlySummary.totalBubalino}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Touro</span>
                                <span className="summary-value">{monthlySummary.totalTouro}</span>
                            </div>
                            <div className="summary-item total">
                                <span className="summary-label">Total G.</span>
                                <span className="summary-value">{monthlySummary.totalCattle}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="calendar-container">
                <div className="calendar-grid">
                    <div className="weekday-header">Dom</div>
                    <div className="weekday-header">Seg</div>
                    <div className="weekday-header">Ter</div>
                    <div className="weekday-header">Qua</div>
                    <div className="weekday-header">Qui</div>
                    <div className="weekday-header">Sex</div>
                    <div className="weekday-header">Sáb</div>

                    {days.map((day, index) => (
                        <div
                            key={index}
                            className={`calendar-day ${day ? 'active' : 'empty'} ${day?.status ? day.status.toLowerCase() : ''}`}
                            onClick={() => day && handleDayClick(day.date)}
                        >
                            {day && (
                                <>
                                    <span className="day-number">{day.day}</span>
                                    {day.status && (
                                        <div className="day-status-info">
                                            <span className={`status-dash ${day.status.toLowerCase()}`}>
                                                {day.status === 'DRAFT' ? 'Rasc' :
                                                    day.status === 'ENVIADA' ? 'Fechado' :
                                                        day.status === 'PUBLISHED' ? 'Pub' : 'Canc'}
                                            </span>
                                            {(day.status === 'ENVIADA' || day.status === 'PUBLISHED') && (day.totalCattle !== undefined) && (
                                                <span className="day-quantity">
                                                    {day.totalCattle} cabs
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>

                <div className="calendar-legend">
                    <h3>Legenda:</h3>
                    <div className="legend-items">
                        <div className="legend-item">
                            <span className="legend-color empty"></span>
                            <span>Sem escala</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color draft"></span>
                            <span>Rascunho</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color enviada"></span>
                            <span>Enviada</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color published"></span>
                            <span>Publicada</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color cancelada"></span>
                            <span>Cancelada</span>
                        </div>
                    </div>
                </div>
            </div>

            {loading && <div className="loading-overlay">Carregando...</div>}
        </div>
    );
};
