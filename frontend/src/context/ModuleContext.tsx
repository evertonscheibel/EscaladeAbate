import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';


export type ModuleType = 'gestao-ti' | 'gep' | 'escala-abate' | 'gestao-ativos' | 'slaughter' | 'candidates' | 'job-positions' | 'tickets' | 'knowledge-base' | 'documents' | 'gatehouse' | 'noc' | 'pcp' | 'desossa' | 'industria' | 'quality' | null;



interface ModuleContextType {
    selectedModule: ModuleType;
    setSelectedModule: (module: ModuleType) => void;
    clearModule: () => void;
    moduleName: string;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

const MODULE_STORAGE_KEY = 'gestaoti_selected_module';

const moduleNames: Record<string, string> = {
    'gestao-ti': 'Gestão TI',
    'gep': 'GEP',
    'escala-abate': 'Escala de Abate',
    'gestao-ativos': 'Gestão de Ativos',
    'slaughter': 'Abate',
    'candidates': 'Candidatos',
    'job-positions': 'Vagas',
    'tickets': 'Chamados',
    'knowledge-base': 'Base de Conhecimento',
    'documents': 'Documentos',
    'gatehouse': 'Portaria',
    'noc': 'NOC',
    'pcp': 'PCP',
    'desossa': 'Desossa',
    'industria': 'Indústria',
    'quality': 'Qualidade'
};



export const ModuleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedModule, setSelectedModuleState] = useState<ModuleType>(() => {
        const stored = localStorage.getItem(MODULE_STORAGE_KEY);
        if (stored) return stored as ModuleType;
        
        // Fallback para a chave antiga para evitar perda de sessão
        const oldStored = localStorage.getItem('chronos_selected_module');
        if (oldStored) {
            localStorage.setItem(MODULE_STORAGE_KEY, oldStored);
            return oldStored as ModuleType;
        }
        return null;
    });

    const setSelectedModule = (module: ModuleType) => {
        setSelectedModuleState(module);
        if (module) {
            localStorage.setItem(MODULE_STORAGE_KEY, module);
        } else {
            localStorage.removeItem(MODULE_STORAGE_KEY);
        }
    };

    const clearModule = () => {
        setSelectedModuleState(null);
        localStorage.removeItem(MODULE_STORAGE_KEY);
    };

    const moduleName = selectedModule ? moduleNames[selectedModule] : '';

    return (
        <ModuleContext.Provider value={{ selectedModule, setSelectedModule, clearModule, moduleName }}>
            {children}
        </ModuleContext.Provider>
    );
};

export const useModule = (): ModuleContextType => {
    const context = useContext(ModuleContext);
    if (!context) {
        throw new Error('useModule must be used within a ModuleProvider');
    }
    return context;
};
