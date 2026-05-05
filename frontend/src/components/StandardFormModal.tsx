import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import './StandardFormModal.css';

export interface StandardFormModalProps {
    /** Controla se o modal está visível */
    isOpen: boolean;
    /** Callback quando o modal deve ser fechado */
    onClose: () => void;
    /** Título exibido no header */
    title: string;
    /** Ícone opcional ao lado do título */
    icon?: React.ReactNode;
    /** Tamanho do modal: sm (640px), md (920px), lg (1120px) */
    size?: 'sm' | 'md' | 'lg';
    /** Conteúdo do body do modal */
    children: React.ReactNode;
    /** Conteúdo do footer (botões de ação) */
    footer?: React.ReactNode;
    /** Classe CSS adicional para o modal */
    className?: string;
    /** Se true, não fecha ao clicar no overlay */
    disableOverlayClose?: boolean;
    /** Se true, não fecha com ESC */
    disableEscClose?: boolean;
}

export const StandardFormModal: React.FC<StandardFormModalProps> = ({
    isOpen,
    onClose,
    title,
    icon,
    size = 'md',
    children,
    footer,
    className = '',
    disableOverlayClose = false,
    disableEscClose = false,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const firstFocusableRef = useRef<HTMLElement | null>(null);

    // Fechar com ESC
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && !disableEscClose) {
            onClose();
        }
    }, [onClose, disableEscClose]);

    // Gerenciar eventos de teclado e foco
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';

            // Auto-focus no primeiro campo focável
            setTimeout(() => {
                if (modalRef.current) {
                    const focusable = modalRef.current.querySelector<HTMLElement>(
                        'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
                    );
                    if (focusable && focusable.tagName !== 'BUTTON') {
                        firstFocusableRef.current = focusable;
                        focusable.focus();
                    }
                }
            }, 100);

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = '';
            };
        }
    }, [isOpen, handleKeyDown]);

    // Não renderizar se não estiver aberto
    if (!isOpen) return null;

    // Click no overlay fecha o modal
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !disableOverlayClose) {
            onClose();
        }
    };

    return (
        <div className="sfm-overlay" onClick={handleOverlayClick}>
            <div
                ref={modalRef}
                className={`sfm-modal sfm-${size} ${className}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="sfm-title"
            >
                {/* Header Fixo */}
                <div className="sfm-header">
                    <h2 id="sfm-title" className="sfm-header-title">
                        {icon}
                        {title}
                    </h2>
                    <button
                        type="button"
                        className="sfm-close-btn"
                        onClick={onClose}
                        aria-label="Fechar modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Scrollable */}
                <div className="sfm-body">
                    {children}
                </div>

                {/* Footer Fixo */}
                {footer && (
                    <div className="sfm-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StandardFormModal;
