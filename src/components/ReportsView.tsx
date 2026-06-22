import React, { useState } from 'react';
import { Product, Order, Customer } from '../types';
import { 
  BarChart, TrendingUp, DollarSign, Award, 
  Download, FileSpreadsheet, RefreshCcw, Tag 
} from 'lucide-react';

interface ReportsViewProps {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  isDarkMode: boolean;
  onRefresh: () => void;
}

export default function ReportsView({
  products,
  orders,
  customers,
  isDarkMode,
  onRefresh
}: ReportsViewProps) {
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Calculations: Financial aggregates
  const totalSalesCount = orders.filter(o => o.status !== 'CANCELADO').length;
  
  const totalInvoicedMoney = orders
    .filter(o => o.status !== 'CANCELADO')
    .reduce((acc, o) => acc + o.total, 0);

  const totalCostMoney = orders
    .filter(o => o.status !== 'CANCELADO')
    .flatMap(o => o.items)
    .reduce((acc, it) => {
      // Find matching cost
      const matchP = products.find(p => p.id === it.productId || p.sku === it.productId);
      const costPerUnit = matchP ? matchP.purchasePrice : (it.price * 0.45);
      return acc + (costPerUnit * it.quantity);
    }, 0);

  const apparentNetProfit = totalInvoicedMoney - totalCostMoney;
  const averageTicketValue = totalSalesCount > 0 ? (totalInvoicedMoney / totalSalesCount) : 0;

  // 2. Calculations: Sales by category distribution
  const categoryFrequency: Record<string, number> = {};
  orders
    .filter(o => o.status !== 'CANCELADO')
    .flatMap(o => o.items)
    .forEach(it => {
      const matchP = products.find(p => p.id === it.productId || p.sku === it.productId);
      const cat = matchP ? matchP.category : 'Otros Textiles';
      categoryFrequency[cat] = (categoryFrequency[cat] || 0) + it.quantity;
    });

  const categoriesSorted = Object.entries(categoryFrequency).sort((a, b) => b[1] - a[1]);

  // 3. Export data as simulated CSV spreadsheet
  const handleExportCSV = () => {
    try {
      const headers = ['Código de Orden', 'Canal', 'Fecha', 'Cliente DNI/ID', 'Cliente Nombre', 'Metodo Pago', 'Total Facturado (PEN)', 'Costo Estimado', 'Estado'];
      const rows = orders.map(o => [
        o.code,
        o.channel,
        new Date(o.timestamp).toLocaleDateString(),
        o.customerId,
        o.customerName,
        o.paymentMethod,
        o.total.toFixed(2),
        (o.total * 0.45).toFixed(2),
        o.status
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `andesmoda_reporte_ventas_${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      (window as any).showToast?.('¡Reporte en formato CSV descargado satisfactoriamente!', 'success');
    } catch {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header operations */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-amber-600">Consola de Inteligencia de Negocios & Reportes</h2>
          <p className="text-xs text-neutral-500 font-sans">Visualiza el rendimiento financiero cruzado de tiendas físicas (POS) y canales en línea.</p>
        </div>

        <div className="flex gap-2 text-xs">
          <button
            onClick={onRefresh}
            className="p-2 border rounded-xl hover:bg-neutral-150 dark:hover:bg-zinc-805 shrink-0 transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={handleExportCSV}
            className="bg-amber-600 hover:bg-amber-500 font-bold text-white py-2 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-600/10"
          >
            <Download className="w-3.5 h-3.5" /> Exportar Ventas de Andesmoda (CSV)
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1.5 animate-pulse">
          <span>✔ {successMsg}</span>
        </div>
      )}

      {/* Financial aggregate metrics widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-mono">
        
        {/* Total revenue */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-sm'}`}>
          <div>
            <span className="text-[10px] text-zinc-400 font-sans block uppercase">Facturación Total (PVP)</span>
            <span className="text-xl font-black text-amber-600 mt-1 block">S/. {totalInvoicedMoney.toFixed(2)}</span>
            <span className="text-[9px] text-zinc-500 block font-sans">Retornos netos excluyendo cancelados</span>
          </div>
          <TrendingUp className="w-7 h-7 text-amber-500 opacity-60" />
        </div>

        {/* Estimated Cost price */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-sm'}`}>
          <div>
            <span className="text-[10px] text-zinc-400 font-sans block uppercase">Costo Total Manufactura</span>
            <span className="text-xl font-black text-rose-600 mt-1 block">S/. {totalCostMoney.toFixed(2)}</span>
            <span className="text-[9px] text-zinc-500 block font-sans">Compensación hilos y fletes</span>
          </div>
          <DollarSign className="w-7 h-7 text-rose-500 opacity-60" />
        </div>

        {/* Net Profit */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-sm'}`}>
          <div>
            <span className="text-[10px] text-zinc-400 font-sans block uppercase">Margen Utilidad Bruta</span>
            <span className="text-xl font-black text-emerald-600 mt-1 block">S/. {apparentNetProfit.toFixed(2)}</span>
            <span className="text-[9px] text-zinc-500 block font-sans">Rentabilidad real acumulada</span>
          </div>
          <Award className="w-7 h-7 text-emerald-500 opacity-60" />
        </div>

        {/* Average invoice ticket */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-sm'}`}>
          <div>
            <span className="text-[10px] text-zinc-400 font-sans block uppercase">Ticket de Compra Medio</span>
            <span className="text-xl font-black text-violet-600 mt-1 block">S/. {averageTicketValue.toFixed(2)}</span>
            <span className="text-[9px] text-zinc-500 block font-sans">Basado en {totalSalesCount} transacciones</span>
          </div>
          <BarChart className="w-7 h-7 text-violet-500 opacity-60" />
        </div>

      </div>

      {/* Detailed breakdown sub-sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TOP DEMANDED APPAREL CATEGORIES (Categoric distribution) */}
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-sm'} space-y-4`}>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 flex items-center gap-1">👕 Volumen De Prendas Despachadas Por Categoría</h3>
            <p className="text-[10px] text-zinc-400 font-sans">Ratios de venta agregando prendas unificadas de POS y E-commerce.</p>
          </div>

          <div className="space-y-3 font-sans">
            {categoriesSorted.length > 0 ? (
              categoriesSorted.map(([categoryName, unitCount]) => (
                <div key={categoryName} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span>{categoryName}</span>
                    <span className="font-mono text-zinc-500">{unitCount} unidades</span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (unitCount / Math.max(1, orders.length)) * 50)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-neutral-400 text-center py-6">Sin registros de venta por prendas.</p>
            )}
          </div>
        </div>

        {/* TOP VIP SPENDERS PORTFOLIO */}
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-sm'} space-y-4`}>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1">⭐ Historial de Clientes Frecuentes de la Marca</h3>
            <p className="text-[10px] text-zinc-400 font-sans">Identificación de clientes VIP recurrentes para marketing cruzado.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-zinc-400 font-bold text-[10px] uppercase border-b border-neutral-200 dark:border-zinc-800">
                  <th className="pb-2">Cliente / DNI</th>
                  <th className="pb-2 text-center">Frecuencia</th>
                  <th className="pb-2 text-right">Compra Acumulada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800 font-mono">
                {customers.slice(0, 5).map(c => (
                  <tr key={c.id} className="hover:bg-neutral-50/50">
                    <td className="py-2">
                      <span className="font-bold font-sans text-neutral-800 dark:text-zinc-100">{c.name} {c.lastName}</span>
                      <span className="block text-[9px] text-zinc-400 font-mono">ID: {c.dni}</span>
                    </td>
                    <td className="py-2 text-center font-bold font-sans">
                      <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px]">
                        {c.orderCount} ord
                      </span>
                    </td>
                    <td className="py-2 text-right text-amber-600 font-black">
                      S/. {c.totalSpent.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
