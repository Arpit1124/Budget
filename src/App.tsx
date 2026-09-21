import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { I18nProvider } from './context/I18nContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { DemoBanner } from './components/common/DemoBanner';
import { AskBudgetAIModal } from './components/ai/AskBudgetAIModal';
import { ToastContainer } from './components/common/ToastContainer';
import { GlobalCommandPalette } from './components/common/GlobalCommandPalette';
import { IdleTimeoutModal } from './components/common/IdleTimeoutModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { BudgetUtilizationPage } from './pages/BudgetUtilizationPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { ExpenditurePage } from './pages/ExpenditurePage';
import { FundReleasesPage } from './pages/FundReleasesPage';
import { SchemesPage } from './pages/SchemesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { AnomaliesPage } from './pages/AnomaliesPage';
import { ForecastPage } from './pages/ForecastPage';
import { RiskAnalysisPage } from './pages/RiskAnalysisPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditPage } from './pages/AuditPage';
import { DataImportPage } from './pages/DataImportPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { AdminPage } from './pages/AdminPage';
import { UserProfilePage } from './pages/UserProfilePage';

const AppContent: React.FC = () => {
  const { isAskAIOpen, setIsAskAIOpen, financialYear, selectedDepartment } = useApp();
  const [currentRoute, setCurrentRoute] = useState<string>('/dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Keyboard Shortcuts (Ctrl+K, Ctrl+D, Ctrl+B, Ctrl+E, etc.)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

      const isModifier = e.ctrlKey || e.metaKey;

      if (isModifier && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // If typing in an input, do not trigger single navigation shortcuts
      if (isInput) return;

      if (isModifier && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleNavigate('/dashboard');
      } else if (isModifier && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleNavigate('/budgets');
      } else if (isModifier && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleNavigate('/expenditure');
      } else if (isModifier && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        handleNavigate('/ai-anomalies');
      } else if (isModifier && (e.key.toLowerCase() === 'r' && (e.shiftKey || e.altKey))) {
        e.preventDefault();
        handleNavigate('/reports');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Synchronize with window.location.pathname or hash
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path && path !== '/') {
        setCurrentRoute(path);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
    window.history.pushState({}, '', route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentPage = () => {
    switch (currentRoute) {
      case '/':
        return <LandingPage onNavigate={handleNavigate} />;
      case '/dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case '/budget-utilization':
        return <BudgetUtilizationPage />;
      case '/budgets':
        return <BudgetsPage />;
      case '/expenditure':
        return <ExpenditurePage />;
      case '/fund-releases':
        return <FundReleasesPage />;
      case '/schemes':
        return <SchemesPage />;
      case '/projects':
        return <ProjectsPage />;
      case '/ai-anomalies':
        return <AnomaliesPage />;
      case '/forecast':
        return <ForecastPage />;
      case '/risks':
        return <RiskAnalysisPage />;
      case '/alerts':
        return <AlertsPage onNavigate={handleNavigate} />;
      case '/reports':
        return <ReportsPage />;
      case '/audit':
        return <AuditPage />;
      case '/data-import':
        return <DataImportPage />;
      case '/data-quality':
        return <DataQualityPage />;
      case '/admin':
        return <AdminPage />;
      case '/profile':
        return <UserProfilePage />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  const isPublicLanding = currentRoute === '/';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-150 selection:bg-indigo-500 selection:text-white">
      {/* Demo Scenario Controller Banner */}
      <DemoBanner />

      {/* Primary Gov-Tech Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onNavigate={handleNavigate}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Sidebar (Hidden only on public landing page) */}
        {!isPublicLanding && (
          <Sidebar
            currentRoute={currentRoute}
            onNavigate={handleNavigate}
            isMobileOpen={isSidebarOpen}
            onCloseMobile={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Official Government Print Letterhead (Rendered strictly during Print / PDF generation) */}
          <div className="hidden print:block p-4 mb-6 border-b-2 border-slate-900 bg-white text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-300 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-slate-900 flex items-center justify-center font-serif font-black text-slate-900 text-sm">
                  सत्य
                </div>
                <div>
                  <h1 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-serif leading-tight">
                    Government of India • Ministry of Finance
                  </h1>
                  <p className="text-[10px] font-semibold tracking-widest text-slate-700 uppercase">
                    Department of Expenditure • Public Financial Management System (PFMS)
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-600">
                <div className="font-bold text-slate-900 uppercase">Statutory Fiscal Record</div>
                <div>Rule 207 • General Financial Rules (GFR 2017)</div>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-700">
              <span><strong>View / Module:</strong> {currentRoute.replace('/', '').toUpperCase() || 'EXECUTIVE DASHBOARD'}</span>
              <span><strong>Financial Year:</strong> FY {financialYear}</span>
              <span><strong>Scope:</strong> {selectedDepartment === 'ALL' ? 'All 48 Union Departments' : selectedDepartment}</span>
              <span><strong>Generated:</strong> {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <div className={`${isPublicLanding ? 'w-full' : 'max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6'}`}>
            {renderCurrentPage()}
          </div>
        </main>
      </div>

      {/* Global AI Decision Support Dialog */}
      {isAskAIOpen && (
        <AskBudgetAIModal isOpen={isAskAIOpen} onClose={() => setIsAskAIOpen(false)} />
      )}

      {/* Global Command Palette & Shortcuts modal (Ctrl+K) */}
      <GlobalCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Government Security Compliance: Idle Timeout Modal with Visual Countdown */}
      <IdleTimeoutModal onSessionTerminated={() => handleNavigate('/')} />

      {/* Global Toast Notifications (Data Import, Report Exports, etc.) */}
      <ToastContainer />

      {/* Official Government Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
