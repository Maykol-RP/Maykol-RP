import React from 'react';
import { Product, InventoryLog } from '../types';
import { ShieldAlert, ArrowUpRight, ArrowDownRight, ClipboardList, RefreshCcw } from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  inventoryLogs: InventoryLog[];
  isDarkMode: boolean;
  onRefresh: () => void;
}

export default function InventoryView({
  products,
  inventoryLogs,
  isDarkMode,
  onRefresh
}: InventoryViewProps) {
  // Compute stocks statistics
  const totalStockItems = products.reduce((acc, p) => acc + p.stock, 0);
  const outOfStockItems = products.filter(p => p.stock <= 0);
  const warningStockItems = products.filter(p => p.stock > 0 && p.stock <= p.minStock);

  return (
    <div className="space-y-6">
      
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total stock amount */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150 shadow-sm'
        }`}>
          <div>
            <span className="text-[10px] text-zinc-400 font-mono block uppercase">Total Unidades Almacenadas</span>
            <span className="text-2xl font-black text-amber-600 font-mono mt-1 block">{totalStockItems} und</span>
            <span className="text-[10px] text-zinc-500 mt-2 block">Suma del catálogo total de prendas</span>
          </div>
          <ClipboardList className="w-8 h-8 text-amber-500 opacity-60" />
        </div>

        {/* Out of Stock warning */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          outOfStockItems.length > 0 
            ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/30 text-red-700' 
            : (isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150 shadow-sm')
        }`}>
          <div>
            <span className="text-[10px] text-zinc-400 font-mono block uppercase">Prendas Sin Stock</span>
            <span className="text-2xl font-black font-mono mt-1 block text-red-600">{outOfStockItems.length} items</span>
            <span className="text-[10px] text-zinc-500 mt-2 block">Requieren resurtido inmediato</span>
          </div>
          <ShieldAlert className="w-8 h-8 text-red-500 opacity-60" />
        </div>

        {/* Warning stock alerting */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          warningStockItems.length > 0 
            ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30 text-amber-700' 
            : (isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150 shadow-sm')
        }`}>
          <div>
            <span className="text-[10px] text-zinc-400 font-mono block uppercase">Stock Mínimo Excedido</span>
            <span className="text-2xl font-black font-mono mt-1 block text-amber-600">{warningStockItems.length} items</span>
            <span className="text-[10px] text-zinc-500 mt-2 block">Abastecer antes de quiebre de stock</span>
          </div>
          <ShieldAlert className="w-8 h-8 text-amber-500 opacity-60 animate-bounce" />
        </div>

      </div>

      {/* Critical Stock Alert Details list */}
      {(outOfStockItems.length > 0 || warningStockItems.length > 0) && (
        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-red-950/10 border-red-900/30' : 'bg-red-50/50 border-red-150'} space-y-3`}>
          <h4 className="text-xs font-black text-red-700 flex items-center gap-1.5 uppercase">🚨 ALERTAS CRITICAS DE ABASTECIMIENTO</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[...outOfStockItems, ...warningStockItems].map(p => {
              const isZero = p.stock <= 0;
              return (
                <div key={p.id} className={`p-2.5 rounded-lg border text-xs flex justify-between items-center ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-xs'}`}>
                  <div>
                    <span className="font-bold line-clamp-1 truncate block">{p.name}</span>
                    <span className="font-mono text-[9px] text-zinc-400 uppercase">{p.sku} | Min: {p.minStock}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${isZero ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                    {p.stock} und
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kardex List Table */}
      <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-sm'}`}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-tight text-amber-600">Kárdex de Movimiento de Inventarios Unificado</h3>
            <p className="text-[10px] text-zinc-400">Historial completo en orden cronológico de entradas, salidas y ajustes manuales o canalizados.</p>
          </div>
          <button
            onClick={onRefresh}
            title="Refrescar Kardex"
            className="p-2 border rounded-xl hover:bg-neutral-150 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`${isDarkMode ? 'bg-zinc-850' : 'bg-neutral-50'} text-zinc-500 font-bold uppercase font-mono text-[10px]`}>
                <th className="p-3 border-b border-neutral-200 dark:border-zinc-800">Fecha y Hora</th>
                <th className="p-3 border-b border-neutral-200 dark:border-zinc-800">Operador</th>
                <th className="p-3 border-b border-neutral-200 dark:border-zinc-800">Prenda SKU</th>
                <th className="p-3 border-b border-neutral-200 dark:border-zinc-800">Nombre De Prenda</th>
                <th className="p-3 border-b border-neutral-200 dark:border-zinc-800 text-center">Operación</th>
                <th className="p-3 border-b border-neutral-200 dark:border-zinc-800 font-mono text-center">Cantidad</th>
                <th className="p-3 border-b border-neutral-200 dark:border-zinc-800 font-mono text-right">Stock Anterior</th>
                <th className="p-3 border-b border-neutral-200 dark:border-zinc-800 font-mono text-right">Stock Nuevo</th>
                <th className="p-3 border-b border-neutral-200 dark:border-zinc-800 max-w-[200px]">Detalle / Justificación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800 font-sans">
              {inventoryLogs.map(l => {
                const isEntrada = l.type === 'ENTRADA';
                const isSalida = l.type === 'SALIDA';
                return (
                  <tr key={l.id} className="hover:bg-neutral-50/50 dark:hover:bg-zinc-800/10">
                    <td className="p-3 whitespace-nowrap text-zinc-400 font-mono text-[10px]">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="p-3 whitespace-nowrap text-neutral-600 dark:text-zinc-300 font-medium">{l.user || 'Desconocido'}</td>
                    <td className="p-3 whitespace-nowrap font-mono font-bold text-amber-600">{l.sku}</td>
                    <td className="p-3 truncate max-w-[150px] font-bold">{l.productName}</td>
                    
                    {/* Operation pill */}
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                        isEntrada ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400' :
                        isSalida ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                      }`}>
                        {l.type}
                      </span>
                    </td>

                    {/* Quantity impact */}
                    <td className="p-3 font-mono text-center font-bold">
                      {isEntrada ? (
                        <span className="text-green-600 flex items-center justify-center gap-0.5 bg-green-50 dark:bg-green-950/10 px-1 py-0.5 rounded">+ {l.quantity}</span>
                      ) : isSalida ? (
                        <span className="text-red-600 flex items-center justify-center gap-0.5 bg-red-50 dark:bg-red-950/10 px-1 py-0.5 rounded">- {l.quantity}</span>
                      ) : (
                        <span className="text-blue-600">{l.quantity}</span>
                      )}
                    </td>

                    {/* Stock calculations */}
                    <td className="p-3 font-mono text-right text-zinc-400">{l.previousStock}</td>
                    <td className="p-3 font-mono text-right font-black text-neutral-800 dark:text-zinc-100">{l.newStock}</td>
                    
                    {/* Reason log */}
                    <td className="p-3 text-zinc-500 dark:text-zinc-400 max-w-[200px] truncate" title={l.reason}>
                      {l.reason}
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
