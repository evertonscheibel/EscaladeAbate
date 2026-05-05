import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ModuleProvider } from './context/ModuleContext';
import { PrivateRoute } from './components/PrivateRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ModuleSelector } from './pages/ModuleSelector';
import { DashboardNew } from './pages/DashboardNew';
import { Tickets } from './pages/Tickets';
import { Assets } from './pages/Assets';
import { Documents } from './pages/Documents';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { UserManagement } from './pages/UserManagement';
import { UserDetail } from './pages/UserDetail';
import { PermissionProfiles } from './pages/PermissionProfiles';
import { Reports } from './pages/Reports';
import { PublicTicketForm } from './pages/PublicTicketForm';
import { AgentMetrics } from './pages/AgentMetrics';
import { ManagerMetrics } from './pages/ManagerMetrics';
import PurchaseRequests from './pages/PurchaseRequests';
import { NetworkDashboard } from './pages/NetworkDashboard';
import { Credentials } from './pages/Credentials';
import { Certificates } from './pages/Certificates';
import { Boletos } from './pages/Boletos';
import { Problems } from './pages/Problems';
import { Settings } from './pages/Settings';
import { SlaughterCalendar } from './pages/SlaughterCalendar';
import { SlaughterSchedule as SlaughterPreSchedule } from './pages/SlaughterSchedule';
import { GatehouseDashboard } from './pages/GatehouseDashboard';
import { GatehouseEntry } from './pages/GatehouseEntry';
import { GatehouseHistory } from './pages/GatehouseHistory';
import { GatehouseExit } from './pages/GatehouseExit';
import PublicApplicationForm from './pages/PublicApplicationForm';
import Candidates from './pages/Candidates';
import JobPositions from './pages/JobPositions';
// Módulo PCP removido PcpCalendar por PcpDayPlan
import PcpDayPlan from './pages/PcpDayPlan';
import PcpImports from './pages/PcpImports';
import ExternalLots from './pages/ExternalLots';
import PcpReports from './pages/PcpReports';
import SlaughterClosure from './pages/SlaughterClosure';
import SlaughterClosureList from './pages/SlaughterClosureList';
import { DeboningScheduleNew } from './pages/DeboningScheduleNew';
import { QualityDashboard } from './pages/QualityDashboard';
import { AreaScanner } from './pages/AreaScanner';
import { ChecklistExecutionPage } from './pages/ChecklistExecution';
import { NonConformityList } from './pages/NonConformityList';
import { AuditPackageList } from './pages/AuditPackageList';
import { ChecklistModelList } from './pages/ChecklistModelList';
import { PACSettings } from './pages/PACSettings';






import { ThemeProvider } from './context/ThemeContext';


function App() {
    return (
        <AuthProvider>
            <ModuleProvider>
                <ThemeProvider>
                    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                        <Routes>
                            {/* Rota pública - sem autenticação */}
                            <Route path="/ticket/new" element={<PublicTicketForm />} />
                            <Route path="/trabalhe-conosco" element={<PublicApplicationForm />} />


                            {/* Seleção de Módulos */}
                            <Route
                                path="/modules"
                                element={
                                    <PrivateRoute>
                                        <ModuleSelector />
                                    </PrivateRoute>
                                }
                            />

                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route
                                path="/dashboard"
                                element={
                                    <PrivateRoute roles={['admin', 'cliente']}>
                                        <Layout>
                                            <DashboardNew />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/tickets"
                                element={
                                    <PrivateRoute roles={['admin']}>
                                        <Layout>
                                            <Tickets />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/assets"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <Assets />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/certificates"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <Certificates />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/boletos"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <Boletos />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/documents"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <Documents />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/knowledge-base"
                                element={
                                    <PrivateRoute>
                                        <Layout>
                                            <KnowledgeBase />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/reports"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <Reports />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/metrics/my-performance"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <AgentMetrics />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/metrics/manager"
                                element={
                                    <PrivateRoute roles={['admin']} requireMaster={true}>
                                        <Layout>
                                            <ManagerMetrics />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/purchase-requests"
                                element={
                                    <PrivateRoute>
                                        <Layout>
                                            <PurchaseRequests />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/users"
                                element={
                                    <PrivateRoute roles={['admin']}>
                                        <Layout>
                                            <UserManagement />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/users/:id"
                                element={
                                    <PrivateRoute roles={['admin']}>
                                        <Layout>
                                            <UserDetail />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/permission-profiles"
                                element={
                                    <PrivateRoute roles={['admin']}>
                                        <Layout>
                                            <PermissionProfiles />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/network"
                                element={
                                    <PrivateRoute roles={['admin']}>
                                        <Layout>
                                            <NetworkDashboard />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/credentials"
                                element={
                                    <PrivateRoute roles={['admin']}>
                                        <Layout>
                                            <Credentials />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/problems"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <Problems />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/settings"
                                element={
                                    <PrivateRoute roles={['admin']}>
                                        <Layout>
                                            <Settings />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/slaughter"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <SlaughterCalendar />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/slaughter/schedule/:date"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <SlaughterPreSchedule />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />

                            {/* Módulo de Guaritas */}
                            <Route
                                path="/gatehouse"
                                element={
                                    <PrivateRoute roles={['admin', 'guarita_admin', 'guarita_supervisor', 'guarita_operador']}>
                                        <Layout>
                                            <GatehouseDashboard />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/gatehouse/entry"
                                element={
                                    <PrivateRoute roles={['admin', 'guarita_admin', 'guarita_supervisor', 'guarita_operador']}>
                                        <Layout>
                                            <GatehouseEntry />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/gatehouse/exit/:id"
                                element={
                                    <PrivateRoute roles={['admin', 'guarita_admin', 'guarita_supervisor', 'guarita_operador']}>
                                        <Layout>
                                            <GatehouseExit />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/gatehouse/history"
                                element={
                                    <PrivateRoute roles={['admin', 'guarita_admin', 'guarita_supervisor', 'guarita_operador']}>
                                        <Layout>
                                            <GatehouseHistory />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />

                            {/* Módulo ATS - Recrutamento */}
                            <Route
                                path="/candidates"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <Candidates />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />

                            <Route
                                path="/job-positions"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <JobPositions />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />

                            <Route
                                path="/pcp"
                                element={<Navigate to={`/deboning/schedules/${new Date().toISOString().split('T')[0]}`} replace />}
                            />
                            <Route
                                path="/pcp/day"
                                element={<Navigate to={`/pcp/day/${new Date().toISOString().split('T')[0]}`} replace />}
                            />
                            <Route
                                path="/pcp/day/:date"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <PcpDayPlan />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />

                            <Route
                                path="/pcp/imports"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <PcpImports />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/pcp/external-lots"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <ExternalLots />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/pcp/reports"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <PcpReports />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/slaughter-closure"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <SlaughterClosureList />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/slaughter-closure/:date"

                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <SlaughterClosure />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />

                            <Route
                                path="/deboning/schedules/:date"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <DeboningScheduleNew />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />

                            <Route
                                path="/quality"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <QualityDashboard />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/quality/scanner"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <AreaScanner />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/quality/non-conformities"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <NonConformityList />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/quality/execute"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <ChecklistExecutionPage />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/quality/audit-packages"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <AuditPackageList />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/quality/models"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <ChecklistModelList />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/quality/settings"
                                element={
                                    <PrivateRoute roles={['admin', 'tecnico']}>
                                        <Layout>
                                            <PACSettings />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/deboning"
                                element={<Navigate to="/pcp" replace />}
                            />
                            <Route path="/" element={<Navigate to="/modules" replace />} />


                            <Route path="*" element={<Navigate to="/modules" replace />} />

                        </Routes>
                    </BrowserRouter>
                </ThemeProvider>
            </ModuleProvider>
        </AuthProvider>
    );
}

export default App;
