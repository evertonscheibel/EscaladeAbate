import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Beef, Weight, TrendingUp } from 'lucide-react';
import { deboningService } from '../services/deboningService';
import { DeboningCalendarDay, DeboningMonthlySummary } from '../types/deboning';
import './DeboningCalendar.css';

export const DeboningCalendar: React.FC = () => {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendar, setCalendar] = useState<DeboningCalendarDay[]>([]);
    const [monthlySummary, setMonthlySummary] = useState<DeboningMonthlySummary | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCalendar();
    }, [currentDate]);

    const loadCalendar = async () => {
        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const { data, monthlySummary } = await deboningService.getCalendar(`${year}-${month}`);
            setCalendar(data);
            setMonthlySummary(monthlySummary);
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

        const days: any[] = [];

        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const calendarDay = calendar.find(c => c.date === dateStr);

            days.push({
                date: dateStr,
                day,
                status: calendarDay?.status || null,
                totalCarcassas: calendarDay?.totalCarcassas,
                totalProduzidoKg: calendarDay?.totalProduzidoKg
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
        navigate(`/deboning/schedule/${dateStr}`);
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'Rasc';
            case 'IN_PROGRESS': return 'Prod';
            case 'CLOSED': return 'Fech';
            default: return '';
        }
    };

    const days = getDaysInMonth();
    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="deboning-calendar">
            <div className="calendar-header">
                <div className="header-content">
                    <div className="header-top-row">
                        <div className="title-section">
                            <Beef size={32} color="#fff" />
                            <h1>Programação de Desossa</h1>
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
                                <span className="summary-label">Total Carc.</span>
                                <span className="summary-value">{monthlySummary.totalCarcassas}</span>
                            </div>
                            <div className="summary-item production">
                                <Weight size={14} />
                                <span className="summary-label">Produção</span>
                                <span className="summary-value">{monthlySummary.totalProduzidoKg.toLocaleString('pt-BR')} kg</span>
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
                            className={`calendar-day ${day ? 'active' : 'empty'} ${day?.status ? day.status.toLowerCase().replace('_', '-') : ''}`}
                            onClick={() => day && handleDayClick(day.date)}
                        >
                            {day && (
                                <>
                                    <span className="day-number">{day.day}</span>
                                    {day.status && (
                                        <div className="day-status-info">
                                            <span className={`status-dash ${day.status.toLowerCase().replace('_', '-')}`}>
                                                {getStatusLabel(day.status)}
                                            </span>
                                            {day.totalCarcassas !== undefined && day.totalCarcassas > 0 && (
                                                <span className="day-quantity">
                                                    {day.totalCarcassas} c.
                                                </span>
                                            )}
                                            {day.status === 'CLOSED' && day.totalProduzidoKg > 0 && (
                                                <span className="day-production">
                                                    {(day.totalProduzidoKg / 1000).toFixed(1)}t
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
                            <span>Sem programação</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color draft"></span>
                            <span>Rascunho</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color in-progress"></span>
                            <span>Em Produção</span>
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
