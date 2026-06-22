import React, { useState } from 'react';
import { Order } from '../types';
import { updateOrderStatus } from '../api';
import { Check, ClipboardList, Eye, RefreshCcw, XCircle } from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  currentUser: any;
  onRefresh: () => void;
  isDarkMode: boolean;
}

export default function OrdersView({
  orders,
  currentUser,
  onRefresh,
  isDarkMode
}: OrdersViewProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status, currentUser);
      onRefresh();
      if (selectedOrder && selectedOrder.id === orderId) {
        // Keep selected sync
        const nextOrderIndex = orders.findIndex(o => o.id === orderId);
        if (nextOrderIndex !== -1) {
          setSelectedOrder({
            ...selectedOrder,
            status: status as any
          });
        }
      }
      (window as any).showToast?.('Registro actualizado correctamente.', 'success');
    } catch (err: any) {
      (window as any).showToast?.(err.message || 'Error al procesar la solicitud.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-amber-600">Registro de Pedidos & Ventas</h2>
          <p className="text-xs text-neutral-500">Listado centralizado de transacciones unificadas en canales POS y E-commerce.</p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 border rounded-xl hover:bg-neutral-150 dark:hover:bg-zinc-800 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Orders Table list (2/3 col of grid) */}
        <div className={`xl:col-span-2 overflow-x-auto rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-sm'}`}>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`${isDarkMode ? 'bg-zinc-850' : 'bg-neutral-50'} text-zinc-500 font-bold uppercase`}>
                <th className="p-3 border-b border-neutral-200 dark:border-zinc-800">Código</th>
                <th className="p-3 border-b border-neutral-200 dark:border-zinc-800">Canal</th>
                <th className="p-3 border-b border-neutral-200 dark:border-zinc-800">Cliente</th>
                <th className="p-3 border-b border-neutral-200 dark:border-zinc-800">Fecha</th>
                <th className="p-3 border-b border-neutral-200 dark:border-zinc-800 text-right">Total</th>
                <th className="p-3 border-b border-neutral-200 dark:border-zinc-800 text-center">Estado</th>
                <th className="p-3 border-b border-neutral-200 dark:border-zinc-800 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-neutral-50/50 dark:hover:bg-zinc-800/10 cursor-pointer" onClick={() => setSelectedOrder(o)}>
                  <td className="p-3 font-mono font-bold text-amber-600">{o.code}</td>
                  
                  {/* Channel tag */}
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      o.channel === 'POS' ? 'bg-[#fef3c7] text-[#d97706] dark:bg-amber-950/20 dark:text-amber-400' : 'bg-[#e0f2fe] text-[#0284c7] dark:bg-blue-950/20 dark:text-blue-400'
                    }`}>
                      {o.channel}
                    </span>
                  </td>

                  <td className="p-3 font-bold">{o.customerName}</td>
                  <td className="p-3 text-zinc-400 font-mono">{new Date(o.timestamp).toLocaleDateString()}</td>
                  <td className="p-3 text-right font-mono font-bold">S/. {o.total.toFixed(2)}</td>

                  {/* Status tag color */}
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 text-[9px] rounded-full font-bold uppercase ${
                      o.status === 'ENTREGADO' ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400' :
                      o.status === 'CANCELADO' ? 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400' :
                      o.status === 'ENVIADO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400' :
                      o.status === 'PREPARANDO' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400'
                    }`}>
                      {o.status}
                    </span>
                  </td>

                  {/* View trigger indicator */}
                  <td className="p-3 text-center">
                    <button className="text-zinc-400 hover:text-amber-600">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Order Detailed side panel (1/3 col of grid) */}
        <div>
          {selectedOrder ? (
            <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-neutral-100 shadow-xl'}`}>
              <div className="border-b pb-3 mb-4 flex justify-between items-center">
                <h3 className="font-extrabold text-sm uppercase text-amber-600">Detalles de la Orden {selectedOrder.code}</h3>
                <span className="font-mono text-[10px] text-zinc-400">{selectedOrder.channel} / {selectedOrder.paymentMethod}</span>
              </div>

              {/* Items list */}
              <div className="space-y-2 border-b pb-3 mb-4">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Items comprados:</p>
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span>{it.name} (x{it.quantity})</span>
                    <span className="font-mono font-semibold">S/. {(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Calculations breakdown */}
              <div className="space-y-1 text-xs font-mono border-b pb-3 mb-4 text-zinc-600 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>S/. {selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Descuento aplicado:</span>
                    <span>- S/. {selectedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                {selectedOrder.shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span>Costo de Envío:</span>
                    <span>+ S/. {selectedOrder.shippingCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-amber-600 border-t border-dashed mt-2 pt-1">
                  <span>TOTAL COMPRA:</span>
                  <span>S/. {selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Shipping address details if WEB */}
              {selectedOrder.channel === 'WEB' && (
                <div className="space-y-1 text-xs border-b pb-3 mb-4">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Datos Logísticos:</p>
                  <p><strong>Destinatario:</strong> {selectedOrder.customerName}</p>
                  <p><strong>Coordinadora de Envío:</strong> {selectedOrder.shippingCarrier || 'Pendiente'}</p>
                </div>
              )}

              {/* Status workflow transitions switches */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase block">Actualizar Estado Comercial:</p>
                
                {selectedOrder.status === 'CANCELADO' ? (
                  <div className="bg-red-50 text-red-700 border border-red-300 rounded p-2.5 text-center text-xs font-bold font-sans">
                    🚫 PEDIDO CANCELADO S/. {selectedOrder.total} reembolsado a inventario
                  </div>
                ) : selectedOrder.status === 'ENTREGADO' ? (
                  <div className="bg-green-50 text-green-700 border border-green-300 rounded p-2.5 text-center text-xs font-bold font-sans flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4" /> COMPLETO / ENTREGADO S/. {selectedOrder.total}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'CONFIRMADO')}
                      disabled={selectedOrder.status !== 'PENDIENTE'}
                      className="py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 rounded text-center transition-all disabled:opacity-40"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'PREPARANDO')}
                      disabled={selectedOrder.status !== 'CONFIRMADO'}
                      className="py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 rounded text-center"
                    >
                      Preparar
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'ENVIADO')}
                      disabled={selectedOrder.status !== 'PREPARANDO'}
                      className="py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 rounded text-center"
                    >
                      Despachar Envío
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'ENTREGADO')}
                      disabled={selectedOrder.status !== 'ENVIADO' && selectedOrder.status !== 'PENDIENTE'}
                      className="py-1.5 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/20 dark:text-green-400 rounded text-center"
                    >
                      Entregar
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'CANCELADO')}
                      className="py-1.5 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 rounded text-center col-span-2 flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancelar Pedido (Regresa Stock)
                    </button>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className={`p-8 text-center rounded-2xl border border-dashed ${isDarkMode ? 'border-zinc-800 bg-zinc-900/10' : 'border-neutral-200 bg-white'}`}>
              <ClipboardList className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs text-neutral-400 font-semibold">Selecciona una orden de la lista para ver el desglose y despachar productos.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
