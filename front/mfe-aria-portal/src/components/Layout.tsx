
import React from 'react';
import { 
  LayoutDashboard, 
  Archive, 
  ShieldCheck, 
  Cpu, 
  Settings, 
  LogOut,
  BookOpen,
  FolderKanban,
  Layers,
  Compass,
  ClipboardList,
  BarChart3,
  Users,
  Activity
} from 'lucide-react';
import AriaAgentBot from './AriaAgentBot';

interface LayoutProps {
  children: React.ReactNode;
  user?: any;
  onLogout?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeContext: {
    product: string;
    kpcVersion: string;
  };
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, activeContext, user, onLogout }) => {
  const menuItems = [
    { id: 'oea', label: 'OEA Strategy', icon: Compass },
    { id: 'portfolio', label: 'Portafolio 2026', icon: FolderKanban },
    { id: 'prioritization', label: 'Priorización', icon: BarChart3 },
    { id: 'overview', label: 'PDLC Overview', icon: LayoutDashboard },
    { id: 'intake', label: 'Intake Hub', icon: ClipboardList },
    { id: 'generation', label: 'ARIA Generation', icon: Cpu },
    { id: 'inventory', label: 'Artefactos Generados', icon: Archive },
    { id: 'library', label: 'Librería de Fuentes', icon: BookOpen },
    { id: 'artifact-config', label: 'Config. Artefactos', icon: Layers },
    { id: 'kpc', label: 'KPC Catalog', icon: Layers },
    { id: 'governance', label: 'Governance', icon: ShieldCheck },
    { id: 'squad-governance', label: 'Squad Governance', icon: Users },
    { id: 'vega', label: 'VEGA Observatory', icon: Activity },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold shadow-lg shadow-indigo-500/20">K</div>
          <span className="text-xl font-bold tracking-tight">Kashio ARIA</span>
        </div>
        
        <nav className="flex-1 mt-6 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          {user && (
            <div className="px-4 py-3 bg-slate-800 rounded-xl mb-2">
              <div className="flex items-center space-x-3">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=4f46e5&color=fff`}
                  alt={user.displayName || 'User'}
                  className="w-10 h-10 rounded-full ring-2 ring-indigo-400 shadow-lg"
                  onError={(e) => {
                    // Fallback si la foto de Microsoft falla
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=4f46e5&color=fff&size=128`;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {user.displayName || user.email}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <button className="w-full flex items-center space-x-3 px-4 py-2 text-slate-400 hover:text-white transition-colors">
            <Settings size={18} />
            <span className="text-xs font-semibold">Configuración</span>
          </button>
          
          {onLogout && (
            <button 
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-4 py-2 text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut size={18} />
              <span className="text-xs font-semibold">Cerrar Sesión</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-4 text-sm font-medium">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Producto:</span>
            <span className="text-indigo-600 font-bold">{activeContext.product}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Versión KPC:</span>
            <span className="bg-indigo-50 px-2 py-0.5 rounded text-indigo-700 font-mono text-xs">{activeContext.kpcVersion}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-100 uppercase tracking-tighter">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>ARIA Engine Ready</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300"></div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
          {children}
        </div>

        {/* ARIA Agent Global Bot */}
        <AriaAgentBot />
      </main>
    </div>
  );
};

export default Layout;
