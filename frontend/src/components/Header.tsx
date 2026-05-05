import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Bell, Search, Sun, Moon, Menu, Settings } from 'lucide-react';
import './Header.css';

interface HeaderProps {
    onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="app-header premium-glass">
            <div className="header-left">
                <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Menu">
                    <Menu size={22} />
                </button>
                <div className="header-logo-container">
                    <img src="/logo.png" alt="Indústria" className="header-logo-img" />
                </div>
            </div>

            <div className="header-right">
                <div className="header-search-premium">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Pesquisar no sistema..." />
                    <div className="search-shortcut">/</div>
                </div>

                <div className="header-actions-group">
                    <button className="header-icon-btn-premium" onClick={toggleTheme}>
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>

                    <button className="header-icon-btn-premium">
                        <Bell size={20} />
                        <span className="notification-dot"></span>
                    </button>
                </div>

                <Link to="/settings" className="header-user-card" title="Configurações da Conta">
                    <div className="user-avatar-premium">
                        {user?.name?.charAt(0) || <User size={18} />}
                    </div>
                    <div className="user-text-group">
                        <span className="user-display-name">{user?.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="user-display-role">{user?.role}</span>
                            <Settings size={10} style={{ opacity: 0.6 }} />
                        </div>
                    </div>
                </Link>
            </div>
        </header>
    );
};
