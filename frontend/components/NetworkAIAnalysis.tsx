import React, { useState } from 'react';
import { X, Brain, AlertTriangle, CheckCircle, TrendingUp, Server, Wifi, Activity, RefreshCw } from 'lucide-react';
import './NetworkAIAnalysis.css';

interface NetworkAIAnalysisProps {
    devices: any[];
    onClose: () => void;
}

interface AnalysisResult {
    summary: string;
    healthScore: number;
    status: 'healthy' | 'warning' | 'critical';
    issues: Array<{
        severity: 'critical' | 'warning' | 'info';
        device: string;
        message: string;
        recommendation: string;
    }>;
    recommendations: string[];
    metrics: {
        avgCpu: number;
        avgMemory: number;
        avgTemperature: number;
        onlinePercent: number;
    };
}

export const NetworkAIAnalysis: React.FC<NetworkAIAnalysisProps> = ({ devices, onClose }) => {
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const runAnalysis = async () => {
        setAnalyzing(true);
        setError(null);

        try {
            // Simular tempo de análise
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Análise local dos dispositivos
            const analysis = analyzeDevices(devices);
            setResult(analysis);

        } catch (err) {
            console.error('Erro na análise:', err);
            setError('Erro ao executar análise. Tente novamente.');
        } finally {
            setAnalyzing(false);
        }
    };

    const analyzeDevices = (devices: any[]): AnalysisResult => {
        // Calcular métricas
        const onlineDevices = devices.filter(d => d.status === 'online');
        const offlineDevices = devices.filter(d => d.status === 'offline');
        const warningDevices = devices.filter(d => d.status === 'warning');

        const avgCpu = devices.reduce((sum, d) => sum + (d.metrics?.cpuUsage || 0), 0) / (devices.length || 1);
        const avgMemory = devices.reduce((sum, d) => sum + (d.metrics?.memoryUsage || 0), 0) / (devices.length || 1);
        const avgTemp = devices.reduce((sum, d) => sum + (d.metrics?.temperature || 0), 0) / (devices.length || 1);
        const onlinePercent = (onlineDevices.length / (devices.length || 1)) * 100;

        // Identificar problemas
        const issues: AnalysisResult['issues'] = [];

        // Dispositivos offline
        offlineDevices.forEach(d => {
            issues.push({
                severity: 'critical',
                device: d.name,
                message: `Dispositivo ${d.name} está offline`,
                recommendation: `Verificar conectividade física e alimentação do ${d.name} em ${d.location}`
            });
        });

        // Dispositivos com alertas
        warningDevices.forEach(d => {
            issues.push({
                severity: 'warning',
                device: d.name,
                message: `${d.name} apresenta alertas de performance`,
                recommendation: `Monitorar ${d.name} e verificar logs do dispositivo`
            });
        });

        // Dispositivos com CPU alta
        devices.filter(d => (d.metrics?.cpuUsage || 0) >= 80).forEach(d => {
            issues.push({
                severity: 'warning',
                device: d.name,
                message: `CPU alta em ${d.name}: ${d.metrics?.cpuUsage}%`,
                recommendation: `Verificar processos e considerar redistribuição de carga`
            });
        });

        // Dispositivos com memória alta
        devices.filter(d => (d.metrics?.memoryUsage || 0) >= 85).forEach(d => {
            issues.push({
                severity: 'warning',
                device: d.name,
                message: `Memória alta em ${d.name}: ${d.metrics?.memoryUsage}%`,
                recommendation: `Verificar vazamentos de memória ou reiniciar o dispositivo`
            });
        });

        // Dispositivos com temperatura alta
        devices.filter(d => (d.metrics?.temperature || 0) >= 60).forEach(d => {
            issues.push({
                severity: d.metrics?.temperature >= 75 ? 'critical' : 'warning',
                device: d.name,
                message: `Temperatura elevada em ${d.name}: ${d.metrics?.temperature}°C`,
                recommendation: `Verificar ventilação e ambiente de instalação`
            });
        });

        // Calcular score de saúde
        let healthScore = 100;
        healthScore -= offlineDevices.length * 15;
        healthScore -= warningDevices.length * 5;
        healthScore -= issues.filter(i => i.severity === 'critical').length * 10;
        healthScore -= issues.filter(i => i.severity === 'warning').length * 3;
        healthScore = Math.max(0, Math.min(100, healthScore));

        // Determinar status geral
        let status: 'healthy' | 'warning' | 'critical' = 'healthy';
        if (healthScore < 50 || offlineDevices.length > 2) status = 'critical';
        else if (healthScore < 80 || issues.length > 3) status = 'warning';

        // Gerar recomendações gerais
        const recommendations: string[] = [];

        if (offlineDevices.length > 0) {
            recommendations.push(`Priorizar restauração de ${offlineDevices.length} dispositivo(s) offline`);
        }

        if (avgCpu > 70) {
            recommendations.push('Avaliar distribuição de carga entre os dispositivos');
        }

        if (avgTemp > 50) {
            recommendations.push('Verificar condições de ventilação do ambiente');
        }

        const switchesWithoutBackup = devices.filter(d => d.type === 'switch' && !d.hasBackup);
        if (switchesWithoutBackup.length > 0) {
            recommendations.push('Considerar redundância para switches críticos');
        }

        if (devices.length > 20) {
            recommendations.push('Implementar monitoramento automatizado (SNMP/Zabbix)');
        }

        if (recommendations.length === 0) {
            recommendations.push('Manter rotina de verificação periódica');
            recommendations.push('Documentar topologia de rede atualizada');
        }

        // Gerar resumo
        let summary = '';
        if (status === 'healthy') {
            summary = `A infraestrutura de rede está operando normalmente. ${onlineDevices.length} de ${devices.length} dispositivos estão online (${onlinePercent.toFixed(0)}%). Não há problemas críticos identificados.`;
        } else if (status === 'warning') {
            summary = `A infraestrutura de rede requer atenção. Foram identificados ${issues.length} pontos de atenção. ${warningDevices.length} dispositivo(s) apresentam alertas.`;
        } else {
            summary = `ATENÇÃO: A infraestrutura de rede apresenta problemas críticos. ${offlineDevices.length} dispositivo(s) estão offline. Ação imediata recomendada.`;
        }

        return {
            summary,
            healthScore,
            status,
            issues: issues.sort((a, b) => {
                const severityOrder = { critical: 0, warning: 1, info: 2 };
                return severityOrder[a.severity] - severityOrder[b.severity];
            }),
            recommendations,
            metrics: {
                avgCpu: Math.round(avgCpu),
                avgMemory: Math.round(avgMemory),
                avgTemperature: Math.round(avgTemp),
                onlinePercent: Math.round(onlinePercent)
            }
        };
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <AlertTriangle size={16} className="text-red-500" />;
            case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
            default: return <CheckCircle size={16} className="text-blue-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'green';
            case 'warning': return 'yellow';
            case 'critical': return 'red';
            default: return 'gray';
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="ai-analysis-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="ai-header">
                    <div className="header-content">
                        <div className="ai-icon">
                            <Brain size={24} />
                        </div>
                        <div>
                            <h2>Análise Inteligente da Rede</h2>
                            <p>Diagnóstico automatizado da infraestrutura</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="ai-body">
                    {!result && !analyzing && (
                        <div className="ai-start">
                            <div className="start-icon">
                                <Brain size={64} />
                            </div>
                            <h3>Análise de Infraestrutura</h3>
                            <p>
                                Esta análise irá verificar {devices.length} dispositivos de rede 
                                e identificar problemas, alertas e oportunidades de melhoria.
                            </p>
                            <button className="btn-analyze" onClick={runAnalysis}>
                                <Activity size={20} />
                                Iniciar Análise
                            </button>
                        </div>
                    )}

                    {analyzing && (
                        <div className="ai-loading">
                            <div className="loading-spinner">
                                <RefreshCw size={48} className="spin" />
                            </div>
                            <h3>Analisando infraestrutura...</h3>
                            <p>Verificando {devices.length} dispositivos</p>
                            <div className="loading-steps">
                                <div className="step active">
                                    <CheckCircle size={16} />
                                    <span>Coletando métricas</span>
                                </div>
                                <div className="step active">
                                    <CheckCircle size={16} />
                                    <span>Analisando status</span>
                                </div>
                                <div className="step">
                                    <Activity size={16} />
                                    <span>Gerando diagnóstico</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className="ai-result">
                            {/* Health Score */}
                            <div className={`health-card ${result.status}`}>
                                <div className="health-score">
                                    <div className="score-circle">
                                        <span className="score-value">{result.healthScore}</span>
                                        <span className="score-label">Score</span>
                                    </div>
                                </div>
                                <div className="health-info">
                                    <h3>
                                        {result.status === 'healthy' && '✓ Rede Saudável'}
                                        {result.status === 'warning' && '⚠ Atenção Necessária'}
                                        {result.status === 'critical' && '✕ Problemas Críticos'}
                                    </h3>
                                    <p>{result.summary}</p>
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className="metrics-grid">
                                <div className="metric-card">
                                    <Server size={20} />
                                    <div className="metric-value">{result.metrics.onlinePercent}%</div>
                                    <div className="metric-label">Disponibilidade</div>
                                </div>
                                <div className="metric-card">
                                    <Activity size={20} />
                                    <div className="metric-value">{result.metrics.avgCpu}%</div>
                                    <div className="metric-label">CPU Média</div>
                                </div>
                                <div className="metric-card">
                                    <TrendingUp size={20} />
                                    <div className="metric-value">{result.metrics.avgMemory}%</div>
                                    <div className="metric-label">Memória Média</div>
                                </div>
                                <div className="metric-card">
                                    <Wifi size={20} />
                                    <div className="metric-value">{result.metrics.avgTemperature}°C</div>
                                    <div className="metric-label">Temp. Média</div>
                                </div>
                            </div>

                            {/* Issues */}
                            {result.issues.length > 0 && (
                                <div className="issues-section">
                                    <h4>
                                        <AlertTriangle size={18} />
                                        Problemas Identificados ({result.issues.length})
                                    </h4>
                                    <div className="issues-list">
                                        {result.issues.map((issue, index) => (
                                            <div key={index} className={`issue-card ${issue.severity}`}>
                                                <div className="issue-header">
                                                    {getSeverityIcon(issue.severity)}
                                                    <span className="issue-device">{issue.device}</span>
                                                    <span className={`severity-badge ${issue.severity}`}>
                                                        {issue.severity === 'critical' ? 'Crítico' : 'Alerta'}
                                                    </span>
                                                </div>
                                                <p className="issue-message">{issue.message}</p>
                                                <p className="issue-recommendation">
                                                    <strong>Recomendação:</strong> {issue.recommendation}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            <div className="recommendations-section">
                                <h4>
                                    <CheckCircle size={18} />
                                    Recomendações
                                </h4>
                                <ul className="recommendations-list">
                                    {result.recommendations.map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                                </ul>
                            </div>

                            {/* Re-analyze button */}
                            <button className="btn-reanalyze" onClick={runAnalysis}>
                                <RefreshCw size={18} />
                                Analisar Novamente
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="ai-error">
                            <AlertTriangle size={48} />
                            <h3>Erro na Análise</h3>
                            <p>{error}</p>
                            <button className="btn-retry" onClick={runAnalysis}>
                                Tentar Novamente
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NetworkAIAnalysis;
