import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ModuleType = 'gestao-ti' | 'gep' | 'escala-abate' | 'gestao-ativos' | null;

interface ModuleContextType {
    selectedModule: ModuleType;
    setSelectedModule: (module: ModuleType) => void;
    clearModule: () => void;
    moduleName: string;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

const MODULE_STORAGE_KEY = 'gestaopro_selected_module';

const moduleNames: Record<string, string> = {
    'gestao-ti': 'Gestão TI',
    'gep': 'GEP',
    'escala-abate': 'Escala de Abate',
    'gestao-ativos': 'Gestão de Ativos'
};

export const ModuleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedModule, setSelectedModuleState] = useState<ModuleType>(() => {
        const stored = localStorage.getItem(MODULE_STORAGE_KEY);
        return stored as ModuleType;
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
