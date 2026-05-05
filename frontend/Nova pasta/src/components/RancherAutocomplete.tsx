import React, { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { rancherService } from '../services';
import { Rancher } from '../types/slaughter';
import './RancherAutocomplete.css';

interface RancherAutocompleteProps {
    value: string;
    rancherId?: string;
    onChange: (name: string, rancherId?: string) => void;
    onCreateNew: (name: string) => void;
}

export const RancherAutocomplete: React.FC<RancherAutocompleteProps> = ({
    value,
    rancherId,
    onChange,
    onCreateNew
}) => {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<Rancher[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>();
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setQuery(value);
    }, [value]);

    useEffect(() => {
        // Click fora fecha dropdown
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const data = await rancherService.search(searchQuery);
            setResults(data);
            setShowResults(true);
        } catch (error) {
            console.error('Erro ao buscar pecuaristas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setQuery(newValue);
        onChange(newValue, undefined);

        // Debounce
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            handleSearch(newValue);
        }, 300);
    };

    const handleSelectRancher = (rancher: Rancher) => {
        setQuery(rancher.name);
        onChange(rancher.name, rancher._id);
        setShowResults(false);
    };

    const handleCreateNew = () => {
        onCreateNew(query);
        setShowResults(false);
    };

    const showCreateOption = query.length >= 3 && !results.find(r => r.name.toLowerCase() === query.toLowerCase());

    return (
        <div className="rancher-autocomplete" ref={wrapperRef}>
            <div className="autocomplete-input-wrapper">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => query.length >= 2 && setShowResults(true)}
                    placeholder="Digite o nome do pecuarista..."
                    className="autocomplete-input"
                />
            </div>

            {showResults && (
                <div className="autocomplete-results">
                    {loading && (
                        <div className="autocomplete-loading">Buscando...</div>
                    )}

                    {!loading && results.length === 0 && query.length >= 2 && (
                        <div className="autocomplete-empty">Nenhum pecuarista encontrado</div>
                    )}

                    {!loading && results.map(rancher => (
                        <div
                            key={rancher._id}
                            className="autocomplete-item"
                            onClick={() => handleSelectRancher(rancher)}
                        >
                            <div className="rancher-name">{rancher.name}</div>
                            {rancher.cpfCnpj && (
                                <div className="rancher-doc">{rancher.cpfCnpj}</div>
                            )}
                        </div>
                    ))}

                    {showCreateOption && (
                        <div
                            className="autocomplete-item create-new"
                            onClick={handleCreateNew}
                        >
                            <Plus size={16} />
                            <span>Cadastrar "{query}"</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
