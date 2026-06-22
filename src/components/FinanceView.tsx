import React, { useState } from 'react';
import { 
  DollarSign, ArrowUpRight, ArrowDownRight, Clipboard, 
  Plus, CheckSquare, RefreshCcw, AlertTriangle, Scale, X 
} from 'lucide-react';
import { FinanceJournal, CashRegister } from '../types';
import { openCashRegister, closeCashRegister, createFinanceInput } from '../api';

interface FinanceViewProps {
  financeLogs: FinanceJournal[];
  cashRegisters: CashRegister[];
  currentUser: any;
  onRefresh: () => void;
  isDarkMode: boolean;
}

export default function FinanceView({
  financeLogs,
  cashRegisters,
  currentUser,
  onRefresh,
  isDarkMode
}: FinanceViewProps) {
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [isToggleCajaOpen, setIsToggleCajaOpen] = useState(false);

  // Form Fields: New Finance Entry
  const [entryType, setEntryType] = useState<'INGRESO' | 'EGRESO'>('INGRESO');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [reference, setReference] = useState('Recibo interno de gerencia');

  // Form Fields: Cash Register Opening
  const [initialCash, setInitialCash] = useState('150');

  // Compute stats
  const activeCaja = cashRegisters.find(c => c.status === 'ABIERTA');
  
  const totalIncomes = financeLogs
    .filter(f => f.type === 'INGRESO')
    .reduce((acc, f) => acc + f.amount, 0);

  const totalExpenses = financeLogs
    .filter(f => f.type === 'EGRESO')
    .reduce((acc, f) => acc + f.amount, 0);

  const netCashFlowSum = totalIncomes - totalExpenses;

  // Form action submits
  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !concept.trim()) return;
    try {
      const payload = {
        type: entryType,
        amount: Number(amount) || 0,
        concept,
        reference
      };
      await createFinanceInput(payload, currentUser);
      setIsInputOpen(false);
      setAmount('');
      setConcept('');
      onRefresh();
    } catch {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  const handleOpenCajaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await openCashRegister(Number(initialCash) || 0, currentUser);
      setIsToggleCajaOpen(false);
      onRefresh();
      (window as any).showToast?.('Registro creado correctamente.', 'success');
    } catch (err: any) {
      (window as any).showToast?.(err.message || 'Error al procesar la solicitud.', 'error');
    }
  };

  const handleCloseCaja = async () => {
    (window as any).askConfirm?.({
      title: 'Arqueo y Cierre de Caja',
      message: '¿Está seguro de proceder al arqueo y Cierre de Caja definitivo del turno actual? Se asentarán los saldos en el libro diario de AndesModa.',
      onConfirm: async () => {
        try {
          await closeCashRegister(currentUser);
          onRefresh();
          (window as any).showToast?.('Caja cerrada con éxito. Registro actualizado correctamente.', 'success');
        } catch (err: any) {
          (window as any).showToast?.(err.message || 'Error al procesar la solicitud.', 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Metrics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-mono text-xs">
        
        {/* Income total */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-sm'}`}>
          <div>
            <span className="text-[10px] text-zinc-400 font-sans block uppercase">Flujo de Ingresos</span>
            <span className="text-lg font-black text-emerald-600 mt-1 block">S/. {totalIncomes.toFixed(2)}</span>
            <span className="text-[9px] text-zinc-500 block font-sans">Venta POS/Web + Ajustes manuales</span>
          </div>
          <ArrowUpRight className="w-6 h-6 text-emerald-500 opacity-60" />
        </div>

        {/* Expenses total */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-sm'}`}>
          <div>
            <span className="text-[10px] text-zinc-400 font-sans block uppercase">Flujo de Egresos</span>
            <span className="text-lg font-black text-rose-600 mt-1 block">S/. {totalExpenses.toFixed(2)}</span>
            <span className="text-[9px] text-zinc-500 block font-sans">Fletes, mermas, impuestos</span>
          </div>
          <ArrowDownRight className="w-6 h-6 text-rose-500 opacity-60" />
        </div>

        {/* Cash balance flow */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-sm'}`}>
          <div>
            <span className="text-[10px] text-zinc-400 font-sans block uppercase">Flujo de Caja Neto</span>
            <span className={`text-lg font-black mt-1 block ${netCashFlowSum >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              S/. {netCashFlowSum.toFixed(2)}
            </span>
            <span className="text-[9px] text-zinc-500 block font-sans">Saldo real en tesorería</span>
          </div>
          <Scale className="w-6 h-6 text-blue-500 opacity-60" />
        </div>

        {/* Cash Register state */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          activeCaja 
            ? 'bg-emerald-50/50 border-emerald-250 text-emerald-800 dark:bg-zinc-900 dark:border-zinc-800' 
            : 'bg-amber-50/40 border-amber-200 text-amber-800 dark:bg-zinc-900 dark:border-zinc-800'
        }`}>
          <div>
            <span className="text-[10px] text-zinc-400 font-sans block uppercase">Caja POS Diaria</span>
            <span className="text-xs font-black block mt-1 uppercase">
              {activeCaja ? `● Abierta: S/. ${activeCaja.initialAmount}` : '○ Turno Cerrado'}
            </span>
            <div className="mt-2 flex gap-1 font-sans">
              {activeCaja ? (
                <button 
                  onClick={handleCloseCaja}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-2 py-0.5 rounded text-[9px] cursor-pointer"
                >
                  Arqueo y Cerrar
                </button>
              ) : (
                <button 
                  onClick={() => setIsToggleCajaOpen(true)}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-2 py-0.5 rounded text-[9px] cursor-pointer"
                >
                  Abrir Turno Caja
                </button>
              )}
            </div>
          </div>
          <CheckSquare className="w-6 h-6 text-amber-600 opacity-50 shrink-0" />
        </div>

      </div>

      {/* Button panel forms */}
      <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/10 p-3.5 rounded-xl border border-neutral-100 dark:border-zinc-800">
        <p className="text-xs text-neutral-400 font-medium">Asienta desembolsos o amortizaciones directamente en el balance comercial mediante recibos internos.</p>
        <button
          onClick={() => setIsInputOpen(true)}
          className="bg-amber-600 hover:bg-amber-500 font-bold text-white text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Asentar Partida Financiera
        </button>
      </div>

      {/* Financial ledger journal table */}
      <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-sm'}`}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-extrabold uppercase text-amber-600 tracking-tight">Libro Registro de Movimientos de Caja Diarios</h3>
            <p className="text-[10px] text-zinc-400 font-sans">Control oficial de ingresos por POS, pasarela E-commerce y devengados de almacén.</p>
          </div>
          <button onClick={onRefresh} className="p-2 border rounded-xl hover:bg-zinc-805 transition-colors">
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`${isDarkMode ? 'bg-zinc-850' : 'bg-neutral-50'} text-zinc-500 font-bold uppercase font-mono text-[9px]`}>
                <th className="p-3 border-b">F. Registro</th>
                <th className="p-3 border-b text-center">Tipo</th>
                <th className="p-3 border-b">Concepto / Partida Contable</th>
                <th className="p-3 border-b font-mono">Ref. / Nota</th>
                <th className="p-3 border-b whitespace-nowrap">Asentado Por</th>
                <th className="p-3 border-b text-right font-mono">Suma Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800 font-sans">
              {financeLogs.map(fl => (
                <tr key={fl.id} className="hover:bg-neutral-50/50 dark:hover:bg-zinc-800/20">
                  <td className="p-3 text-zinc-400 font-mono text-[10px]">{new Date(fl.timestamp).toLocaleString()}</td>
                  
                  {/* Category badge */}
                  <td className="p-3 text-center">
                    {fl.type === 'INGRESO' ? (
                      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full">INGRESO</span>
                    ) : (
                      <span className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 text-[9px] font-bold px-2 py-0.5 rounded-full">EGRESO</span>
                    )}
                  </td>

                  <td className="p-3 font-bold">{fl.description}</td>
                  <td className="p-3 font-mono text-zinc-400 max-w-[200px] truncate">{fl.refId || 'N/A'}</td>
                  <td className="p-3 text-neutral-600 dark:text-zinc-300 font-semibold">{fl.category}</td>
                  
                  {/* Amount */}
                  <td className={`p-3 text-right font-mono font-bold ${fl.type === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {fl.type === 'INGRESO' ? '+' : '-'} S/. {fl.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOG 1: New Financial entry */}
      {isInputOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`max-w-sm w-full p-6 rounded-2xl shadow-xl ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-sm text-amber-600 flex items-center gap-1.5"><DollarSign className="w-4 h-4 animate-bounce" /> Asentar Partida</h3>
              <button onClick={() => setIsInputOpen(false)} className="p-1 hover:bg-zinc-850 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleEntrySubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Tipo de Partida Financiera:</label>
                <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setEntryType('INGRESO')}
                    className={`py-2 rounded-lg border cursor-pointer ${entryType === 'INGRESO' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-transparent border-zinc-700 text-zinc-400'}`}
                  >
                    Ingreso Cash (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryType('EGRESO')}
                    className={`py-2 rounded-lg border cursor-pointer ${entryType === 'EGRESO' ? 'bg-rose-600 text-white border-rose-500' : 'bg-transparent border-zinc-700 text-zinc-400'}`}
                  >
                    Egreso / Costo (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Monto Neto PEN (S/.):</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-bold font-mono text-center text-sm"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Concepto Justificado:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pago de flete Shalom para despacho Ica"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Referencia o Nro de Boleta:</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-mono"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setIsInputOpen(false)} className="px-3 py-1.5 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white font-bold rounded">Postear Asiento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG 2: Open turn caja */}
      {isToggleCajaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`max-w-xs w-full p-6 rounded-2xl shadow-xl ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-sm text-emerald-600 flex items-center gap-1.5"><DollarSign className="w-4 h-4 animate-pulse" /> Abrir Caja Turno</h3>
              <button onClick={() => setIsToggleCajaOpen(false)} className="p-1 hover:bg-zinc-850 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleOpenCajaSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-zinc-400 font-sans font-bold mb-1 col-span-1">Efectivo Inicial en Caja (S/.):</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={initialCash}
                  onChange={(e) => setInitialCash(e.target.value)}
                  className="w-full p-2.5 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-bold text-center text-sm text-emerald-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 font-sans text-xs">
                <button type="button" onClick={() => setIsToggleCajaOpen(false)} className="px-3 py-1.5 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded">Confirmar Apertura</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
