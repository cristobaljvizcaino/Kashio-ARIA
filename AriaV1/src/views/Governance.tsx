
import React from 'react';
import { GATES } from '../constants/constants';
import { GateStatus } from '../types/types';
import { AlertTriangle, Clock, ShieldCheck, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Governance: React.FC = () => {
  const chartData = GATES.map(g => ({
    name: g.id,
    blocks: g.blocks,
    slaStatus: g.sla === 'OK' ? 100 : g.sla === 'WARNING' ? 40 : 0
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Auditoría & Gobierno</h1>
          <p className="text-slate-500 mt-2 font-medium">Panel de Product Ops para supervisar salud del PDLC y cumplimiento normativo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-start space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <h4 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Cumplimiento SLA</h4>
            <p className="text-2xl font-bold text-slate-900 mt-1">84%</p>
            <p className="text-xs text-amber-600 font-bold mt-1">⚠️ 2 Gates en riesgo</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-start space-x-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Bloqueos Activos</h4>
            <p className="text-2xl font-bold text-slate-900 mt-1">1</p>
            <p className="text-xs text-red-600 font-bold mt-1">CRÍTICO: Roadmap</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-start space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="text-slate-500 text-sm font-bold uppercase tracking-wider">Precisión ARIA</h4>
            <p className="text-2xl font-bold text-slate-900 mt-1">98.2%</p>
            <p className="text-xs text-emerald-600 font-bold mt-1">Alta fidelidad</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
            <Zap size={20} className="text-indigo-600 mr-2" />
            Bloqueos Históricos por Gate
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="blocks" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.blocks > 0 ? '#ef4444' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h3 className="text-lg font-bold text-slate-900">Métricas de Salud de Gate</h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Gate</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Bloqueos</th>
                <th className="px-6 py-4">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {GATES.map((gate) => (
                <tr key={gate.id}>
                  <td className="px-6 py-4 font-bold text-slate-800">{gate.id}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center text-xs font-bold ${
                      gate.sla === 'OK' ? 'text-emerald-600' : 
                      gate.sla === 'WARNING' ? 'text-amber-600' : 'text-slate-400'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        gate.sla === 'OK' ? 'bg-emerald-500' : 
                        gate.sla === 'WARNING' ? 'bg-amber-500' : 'bg-slate-300'
                      }`}></div>
                      {gate.sla}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{gate.blocks}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{gate.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Governance;
