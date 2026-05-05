import React from 'react';
import './Footer.css';

export const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="app-footer">
            <p>{currentYear} Gestão TI Tecnologia</p>
        </footer>
    );
};
