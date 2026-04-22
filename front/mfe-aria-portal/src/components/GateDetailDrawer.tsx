
import React from 'react';
import { Gate, GateStatus } from '../types/types';
import { X, CheckCircle2, Circle, AlertCircle, Play, Users, Check, Ban } from 'lucide-react';
import { INPUTS_G2, ARTIFACTS } from '../constants/constants';

interface GateDetailDrawerProps {
  gate: Gate | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (artifactName: string) => void;
}

const GateDetailDrawer: React.FC<GateDetailDrawerProps> = ({ gate, isOpen, onClose, onGenerate }) => {
  if (!gate) return null;

  const gateArtifacts = ARTIFACTS.filter(a => a.gate === gate.id);
  const allInputsReady = INPUTS_G2.every(i => i.completed);

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
      <div 
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      <div className={`absolute top-0 right-0 w-full max-w-xl h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Gate {gate.id} – {gate.name}</h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                gate.status === GateStatus.APPROVED ? 'bg-emerald-50 text-emerald-700' : 
                gate.status === GateStatus.IN_PROGRESS ? 'bg-amber-50 text-amber-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {gate.status.replace('_', ' ')}
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-500 text-xs font-medium">Responsable: {gate.owner}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Inputs Section */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
              <span>Inputs Requeridos (ARIA Checklist)</span>
              {allInputsReady ? (
                <CheckCircle2 size={16} className="ml-2 text-emerald-500" />
              ) : (
                <AlertCircle size={16} className="ml-2 text-amber-500" />
              )}
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              {INPUTS_G2.map((input, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {input.completed ? (
                      <CheckCircle2 size={18} className="text-indigo-600" />
                    ) : (
                      <Circle size={18} className="text-slate-300" />
                    )}
                    <span className={`text-sm font-medium ${input.completed ? 'text-slate-900' : 'text-slate-500'}`}>
                      {input.name}
                    </span>
                  </div>
                  {input.required && <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 rounded">OBLIGATORIO</span>}
                </div>
              ))}
            </div>
          </section>

          {/* Outputs Section */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Outputs Esperados</h3>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Artefacto</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Versión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gateArtifacts.map((art) => (
                    <tr key={art.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700">{art.name}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold ${art.status === 'ACTIVE' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {art.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono">{art.version}</td>
                    </tr>
                  ))}
                  {gateArtifacts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">No hay artefactos definidos</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 grid grid-cols-2 gap-4">
          <button 
            disabled={!allInputsReady}
            onClick={() => onGenerate('Estrategia de Producto')}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-bold transition-all ${
              allInputsReady 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Play size={18} fill="currentColor" />
            <span>Generar ARIA</span>
          </button>
          
          <button className="flex items-center justify-center space-x-2 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all">
            <Users size={18} />
            <span>Enviar a HITL</span>
          </button>
          
          <button className="flex items-center justify-center space-x-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl font-bold hover:bg-emerald-100 transition-all">
            <Check size={18} />
            <span>Aprobar Gate</span>
          </button>
          
          <button className="flex items-center justify-center space-x-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl font-bold hover:bg-red-100 transition-all">
            <Ban size={18} />
            <span>Bloquear Gate</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GateDetailDrawer;
