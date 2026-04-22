
import React from 'react';
import { Gate, GateStatus } from '../types/types';
import { Check, Loader2, Lock, Ban } from 'lucide-react';

interface TimelineProps {
  gates: Gate[];
  onGateClick: (gate: Gate) => void;
  activeGateId?: string;
}

const Timeline: React.FC<TimelineProps> = ({ gates, onGateClick, activeGateId }) => {
  return (
    <div className="flex items-center justify-between w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-8 overflow-x-auto">
      {gates.map((gate, index) => {
        const isLast = index === gates.length - 1;
        const isActive = activeGateId === gate.id;
        
        let statusIcon;
        let colorClass;
        let textClass;

        switch (gate.status) {
          case GateStatus.APPROVED:
            statusIcon = <Check size={16} />;
            colorClass = 'bg-indigo-600 text-white';
            textClass = 'text-indigo-600';
            break;
          case GateStatus.IN_PROGRESS:
            statusIcon = <Loader2 size={16} className="animate-spin" />;
            colorClass = 'bg-amber-500 text-white';
            textClass = 'text-amber-600';
            break;
          case GateStatus.BLOCKED:
            statusIcon = <Ban size={16} />;
            colorClass = 'bg-red-500 text-white';
            textClass = 'text-red-600';
            break;
          default:
            statusIcon = null;
            colorClass = 'bg-slate-100 text-slate-400 border-2 border-slate-200';
            textClass = 'text-slate-400';
        }

        return (
          <React.Fragment key={gate.id}>
            <button 
              onClick={() => onGateClick(gate)}
              className={`flex flex-col items-center group relative ${isActive ? 'scale-105 z-10' : ''} transition-transform`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-md transition-all ${colorClass} ${isActive ? 'ring-4 ring-indigo-100' : ''}`}>
                {statusIcon || <span className="text-sm font-bold">{gate.id}</span>}
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${textClass}`}>{gate.id}</span>
              <span className={`text-sm font-medium ${gate.status === GateStatus.NOT_STARTED ? 'text-slate-400' : 'text-slate-700'}`}>{gate.name}</span>
              
              {isActive && (
                <div className="absolute -bottom-2 w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
              )}
            </button>
            
            {!isLast && (
              <div className="flex-1 mx-4 h-0.5 bg-slate-100 min-w-[40px] relative">
                <div className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                  gate.status === GateStatus.APPROVED ? 'w-full bg-indigo-300' : 'w-0'
                }`}></div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Timeline;
