
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import Generation from './views/Generation';
import Inventory from './views/Inventory';
import Library from './views/Library';
import ArtifactConfig from './views/ArtifactConfig';
import AriaChat from './views/AriaChat';
import { useAuth, type AuthUser } from './auth/AuthContext';
import { debugStorage } from './utils/debugStorage';
import { migrateLocalStorageToDb } from './utils/migrateToDb';

function toLayoutUser(u: AuthUser) {
  return {
    displayName: u.name,
    email: u.email,
    photoURL: null as string | null,
  };
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('generation');
  const { user, logout } = useAuth();

  const activeContext = {
    product: 'Kashio ARIA',
    kpcVersion: 'v1.0.0'
  };

  useEffect(() => {
    const storageData = debugStorage();
    console.log('📊 Datos en storage al cargar:', storageData);
    migrateLocalStorageToDb();
  }, []);

  const handleLogout = useCallback(() => {
    void logout();
  }, [logout]);

  const layoutUser = useMemo(
    () => (user ? toLayoutUser(user) : undefined),
    [user]
  );
  const showAccountActions = !!user;

  const renderContent = () => {
    switch (activeTab) {
      case 'generation':
        return <Generation />;
      case 'chat':
        return <AriaChat />;
      case 'inventory':
        return <Inventory />;
      case 'library':
        return <Library />;
      case 'artifact-config':
        return <ArtifactConfig />;
      default:
        return <Generation />;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      activeContext={activeContext}
      user={layoutUser}
      onLogout={showAccountActions ? handleLogout : undefined}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
