import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Bell, Search, Sun, Moon } from 'lucide-react';
import './Header.css';

export const Header: React.FC = () => {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="app-header">
            <div className="header-left">
                <div className="header-logo-container">
                    <img src="/logo.png" alt="BridgeLogic Logo" className="header-logo-img" />
                </div>
            </div>

            <div className="header-right">
                <div className="header-search">
                    <Search size={18} />
                    <input type="text" placeholder="Buscar..." />
                </div>

                <button className="header-icon-btn" onClick={toggleTheme} title={theme === 'light' ? "Mudar para Escuro" : "Mudar para Claro"}>
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                <button className="header-icon-btn">
                    <Bell size={20} />
                    <span className="notification-badge"></span>
                </button>

                <div className="header-user-profile">
                    <div className="user-avatar-small">
                        {user?.name?.charAt(0) || <User size={16} />}
                    </div>
                    <div className="user-header-info">
                        <span className="user-header-name">{user?.name}</span>
                        <span className="user-header-role">{user?.role}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};
