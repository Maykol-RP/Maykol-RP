import React from 'react';
import { AuditLog } from '../types';
import { ShieldCheck, RefreshCcw, Key } from 'lucide-react';

interface AuditViewProps {
  auditLogs: AuditLog[];
  onRefresh: () => void;
  isDarkMode: boolean;
}

export default function AuditView({
  auditLogs,
  onRefresh,
  isDarkMode
}: AuditViewProps) {
  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-amber-600">Registro de Auditoría de Seguridad & Logs</h2>
          <p className="text-xs text-neutral-500 font-sans">Registro de todas las operaciones comerciales críticas y flujos del sistema ANDESMODA.</p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 border rounded-xl hover:bg-neutral-150 dark:hover:bg-zinc-805 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-sm'}`}>
        <div className="flex items-center gap-1.5 mb-4 text-emerald-600 font-extrabold text-sm uppercase tracking-wider">
          <ShieldCheck className="w-5 h-5 animate-pulse" /> Registro Inviolable De Transacciones (SIRET)
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`${isDarkMode ? 'bg-zinc-850' : 'bg-neutral-50'} text-zinc-500 font-bold uppercase font-mono text-[9px]`}>
                <th className="p-3 border-b">Estampa de Tiempo</th>
                <th className="p-3 border-b">Operador Responsable</th>
                <th className="p-3 border-b text-center">Acción Evento</th>
                <th className="p-3 border-b">Descripción de Operación</th>
                <th className="p-3 border-b text-center">Dificultad Sec.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800 font-sans">
              {auditLogs.map(al => {
                const isCritical = al.action.includes('ELI') || al.action.includes('PRE');
                return (
                  <tr key={al.id} className="hover:bg-neutral-50/50 dark:hover:bg-zinc-800/10">
                    <td className="p-3 font-mono text-[10px] text-zinc-400 whitespace-nowrap">{new Date(al.timestamp).toLocaleString()}</td>
                    <td className="p-3 font-bold whitespace-nowrap text-zinc-650 dark:text-zinc-300">{al.user}</td>
                    
                    <td className="p-3 text-center">
                      <span className="font-mono text-[9px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-black text-amber-600">
                        {al.action}
                      </span>
                    </td>

                    <td className="p-3 text-zinc-500 dark:text-zinc-400">{al.details}</td>
                    
                    <td className="p-3 text-center">
                      {isCritical ? (
                        <span className="bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-450 text-[9px] font-bold px-2 py-0.5 rounded-full">ALTA</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-400 text-[9px] font-bold px-2 py-0.5 rounded-full">BAJA</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
