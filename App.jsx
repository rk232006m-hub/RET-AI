import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import premiumIcon from './assetlogos/ret_ai_icon_premium.svg';

import AuthScreen from './screens/AuthScreen';
import DashboardScreen from './screens/DashboardScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import InsightsScreen from './screens/InsightsScreen';
import MonthlyReportScreen from './screens/MonthlyReportScreen';
import GoalsScreen from './screens/GoalsScreen';
import SettingsScreen from './screens/SettingsScreen';

import { 
  LayoutDashboard, 
  CircleDollarSign, 
  TrendingUp, 
  FilePieChart, 
  PiggyBank, 
  Settings as SettingsIcon,
  LogOut,
  Sparkles
} from 'lucide-react';

const AppContent = () => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const { t } = useLanguage();
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  if (loading) {
    return (
      <div className="auth-wrapper" style={{ flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
        <img src={premiumIcon} className="pulse" alt="RET AI Splash Icon" style={{ width: '80px', height: '80px', filter: 'drop-shadow(0 0 15px var(--primary-glow))' }} />
        <h2 style={{ fontWeight: 800, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0.5rem 0 0.25rem 0' }}>RET AI</h2>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>Securely Loading</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Screen selector
  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardScreen onNavigate={setCurrentScreen} />;
      case 'add-expense':
        return <AddExpenseScreen onNavigate={setCurrentScreen} />;
      case 'insights':
        return <InsightsScreen />;
      case 'report':
        return <MonthlyReportScreen />;
      case 'goals':
        return <GoalsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <div className="app-root">
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="logo-container" style={{ gap: '0.75rem' }}>
          <img src={premiumIcon} alt="RET AI Icon" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
          <span className="logo-text">RET AI</span>
        </div>

        <nav className="nav-links">
          <button 
            className={`nav-item ${currentScreen === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>{t('dashboard')}</span>
          </button>
          
          <button 
            className={`nav-item ${currentScreen === 'add-expense' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('add-expense')}
          >
            <CircleDollarSign size={20} />
            <span>{t('addExpense')}</span>
          </button>
          
          <button 
            className={`nav-item ${currentScreen === 'insights' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('insights')}
          >
            <TrendingUp size={20} />
            <span>{t('insights')}</span>
          </button>
          
          <button 
            className={`nav-item ${currentScreen === 'report' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('report')}
          >
            <FilePieChart size={20} />
            <span>{t('monthlyReport')}</span>
          </button>
          
          <button 
            className={`nav-item ${currentScreen === 'goals' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('goals')}
          >
            <PiggyBank size={20} />
            <span>{t('goals')}</span>
          </button>
          
          <button 
            className={`nav-item ${currentScreen === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('settings')}
          >
            <SettingsIcon size={20} />
            <span>{t('settings')}</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="user-avatar">
              {user?.username?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.username}</span>
              <span className="user-role">Private Account</span>
            </div>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', display: 'flex', gap: 6, justifyContent: 'center' }}
            onClick={logout}
          >
            <LogOut size={16} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main content frame */}
      <main className="main-content">
        {renderScreen()}
      </main>

      {/* Mobile Bottom Dock Menu */}
      <nav className="bottom-nav">
        <button 
          className={`bottom-nav-item btn-secondary ${currentScreen === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('dashboard')}
          style={{ background: 'transparent', border: 'none' }}
        >
          <LayoutDashboard size={20} />
          <span>{t('dashboard')}</span>
        </button>
        
        <button 
          className={`bottom-nav-item btn-secondary ${currentScreen === 'add-expense' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('add-expense')}
          style={{ background: 'transparent', border: 'none' }}
        >
          <CircleDollarSign size={20} />
          <span>{t('addExpense')}</span>
        </button>
        
        <button 
          className={`bottom-nav-item btn-secondary ${currentScreen === 'insights' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('insights')}
          style={{ background: 'transparent', border: 'none' }}
        >
          <TrendingUp size={20} />
          <span>{t('insights')}</span>
        </button>
        
        <button 
          className={`bottom-nav-item btn-secondary ${currentScreen === 'report' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('report')}
          style={{ background: 'transparent', border: 'none' }}
        >
          <FilePieChart size={20} />
          <span>Report</span>
        </button>

        <button 
          className={`bottom-nav-item btn-secondary ${currentScreen === 'goals' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('goals')}
          style={{ background: 'transparent', border: 'none' }}
        >
          <PiggyBank size={20} />
          <span>Goals</span>
        </button>
        
        <button 
          className={`bottom-nav-item btn-secondary ${currentScreen === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('settings')}
          style={{ background: 'transparent', border: 'none' }}
        >
          <SettingsIcon size={20} />
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
