
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import Overview from './views/Overview';
import Generation from './views/Generation';
import Inventory from './views/Inventory';
import Governance from './views/Governance';
import Library from './views/Library';
import Portfolio from './views/Portfolio';
import KpcCatalog from './views/KpcCatalog';
import OeaStrategy from './views/OeaStrategy';
import Intake from './views/Intake';
import Prioritization from './views/Prioritization';
import SquadGovernance from './views/SquadGovernance';
import VegaObservatory from './views/VegaObservatory';
import ArtifactConfig from './views/ArtifactConfig';
import GateDetailDrawer from './components/GateDetailDrawer';
import { Gate, PortfolioInitiative } from './types/types';
import { PORTFOLIO_2026 } from './constants/constants';
import { onAuthStateChange, getUserEmail, getUserDisplayName, logout } from './services/authService';
import { clearAllStorage } from './utils/clearStorage';
import { debugStorage } from './utils/debugStorage';
import { resetEverything } from './utils/resetDatabase';
import { migrateLocalStorageToDb } from './utils/migrateToDb';
import type { User } from 'firebase/auth';

/**
 * Local: sin login Microsoft/Firebase (evita auth/unauthorized-domain sin dominio en consola).
 * Producción / cuando Firebase tenga localhost autorizado: poner en true.
 */
const AUTH_ENABLED = false;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('oea');
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Global Context for the Header
  const [activeContext, setActiveContext] = useState({
    product: 'Portal Empresa', // Default from first portfolio item logic
    kpcVersion: PORTFOLIO_2026[0]?.kpcVersion || 'v1.0.0'
  });

  // Debug: Ver qué hay en storage al cargar + migrate to DB
  useEffect(() => {
    const storageData = debugStorage();
    console.log('📊 Datos en storage al cargar:', storageData);
    migrateLocalStorageToDb();
  }, []);

  // Auth state listener (solo si AUTH_ENABLED; si no, no suscribimos a Firebase aquí)
  useEffect(() => {
    if (!AUTH_ENABLED) {
      setIsAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      setIsAuthenticated(!!user);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const handleGateClick = (gate: Gate) => {
    setSelectedGate(gate);
    setIsDrawerOpen(true);
  };

  const handleGenerateFromDrawer = (artifactName: string) => {
    setIsDrawerOpen(false);
    setActiveTab('generation');
  };

  const handleInitiativeChange = (initiative: PortfolioInitiative) => {
    // Map Portfolio/Name to a friendly Product label for the header
    let productLabel = initiative.name;
    if (initiative.portfolio === 'Plataforma') productLabel = 'Conexión Única';
    else if (initiative.portfolio === 'VAR') productLabel = 'Kashio VAR';
    else if (initiative.portfolio === 'AI Initiatives') productLabel = 'Kashio AI';
    
    setActiveContext({
      product: productLabel,
      kpcVersion: initiative.kpcVersion || 'v0.0.1'
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'oea':
        return <OeaStrategy />;
      case 'portfolio':
        return <Portfolio />;
      case 'prioritization':
        return <Prioritization />;
      case 'overview':
        return <Overview onGateClick={handleGateClick} onInitiativeChange={handleInitiativeChange} />;
      case 'intake':
        return <Intake />;
      case 'generation':
        return <Generation />;
      case 'inventory':
        return <Inventory />;
      case 'library':
        return <Library />;
      case 'artifact-config':
        return <ArtifactConfig />;
      case 'kpc':
        return <KpcCatalog />;
      case 'governance':
        return <Governance />;
      case 'squad-governance':
        return <SquadGovernance />;
      case 'vega':
        return <VegaObservatory />;
      default:
        return <OeaStrategy />;
    }
  };

  // Loading state
  if (AUTH_ENABLED && isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (AUTH_ENABLED && !isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      activeContext={activeContext}
      user={currentUser}
      onLogout={AUTH_ENABLED ? handleLogout : undefined}
    >
      {renderContent()}
      
      <GateDetailDrawer 
        gate={selectedGate}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onGenerate={handleGenerateFromDrawer}
      />
    </Layout>
  );
};

export default App;
