import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { slaughterService } from '../services';
import { CalendarDay } from '../types/slaughter';
import './SlaughterCalendar.css';

export const SlaughterCalendar: React.FC = () => {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendar, setCalendar] = useState<CalendarDay[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCalendar();
    }, [currentDate]);

    const loadCalendar = async () => {
        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const data = await slaughterService.getCalendar(`${year}-${month}`);
            setCalendar(data);
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
            const calendarDay = calendar.find(c => c.date === dateStr);

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
        navigate(`/slaughter/schedule/${dateStr}`);
    };

    const days = getDaysInMonth();
    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="slaughter-calendar">
            <div className="calendar-header">
                <div className="header-content">
                    <div className="title-section">
                        <CalendarDays size={32} color="#fff" />
                        <h1>Escala de Abate</h1>
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
                                                {day.status === 'DRAFT' ? 'Rasc' : 'Fechada'}
                                            </span>
                                            {day.status === 'CLOSED' && day.totalCattle !== undefined && (
                                                <span className="day-quantity">
                                                    {day.totalCattle} c.
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
                            <span className="legend-color closed"></span>
                            <span>Fechada</span>
                        </div>
                    </div>
                </div>
            </div>

            {loading && <div className="loading-overlay">Carregando...</div>}
        </div>
    );
};
