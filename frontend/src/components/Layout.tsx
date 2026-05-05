import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import './Layout.css';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile && sidebarOpen) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        // Close sidebar on mobile on initial load
        if (window.innerWidth <= 768) {
            setSidebarOpen(false);
        }
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    };

    return (
        <div className="app-layout">
            {/* Mobile overlay when sidebar is open */}
            {isMobile && sidebarOpen && (
                <div className="sidebar-overlay" onClick={closeSidebar} />
            )}
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} onNavigate={closeSidebar} />
            <div className={`main-wrapper ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                <Header onMenuToggle={toggleSidebar} />
                <main className="main-content">
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
};
