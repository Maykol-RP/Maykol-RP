import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Scan, ShoppingCart, Trash2, Printer, 
  MapPin, Check, Plus, Minus, CreditCard, DollarSign, Wallet, X 
} from 'lucide-react';
import { Product, CashRegisterSession, Order, User } from '../types';
import { submitOrder, openCashRegister, closeCashRegister, addCashRegisterTransaction } from '../api';

interface POSViewProps {
  products: Product[];
  customers?: any[];
  cashRegisters: CashRegisterSession[];
  currentUser: User;
  onRefresh?: () => void;
  onSuccess?: () => void;
  isDarkMode: boolean;
}

export default function POSView({
  products,
  customers = [],
  cashRegisters,
  currentUser,
  onRefresh,
  onSuccess,
  isDarkMode
 }: POSViewProps) {
  const actualRefresh = onRefresh || onSuccess;
  
  // POS States
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [posCart, setPosCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA'>('EFECTIVO');
  const [customerDni, setCustomerDni] = useState('');
  const [customerName, setCustomerName] = useState('Cliente General POS');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Register initializers
  const [initialCajaAmount, setInitialCajaAmount] = useState('200');
  const [closeCajaAmount, setCloseCajaAmount] = useState('');
  const [cajaAdjustmentAmount, setCajaAdjustmentAmount] = useState('');
  const [cajaAdjustmentType, setCajaAdjustmentType] = useState<'INGRESO' | 'EGRESO'>('INGRESO');
  const [cajaAdjustmentDesc, setCajaAdjustmentDesc] = useState('');

  // Ticket Receipt preview
  const [printedReceipt, setPrintedReceipt] = useState<Order | null>(null);

  // Active cashier session lookup
  const activeSession = useMemo(() => {
    return cashRegisters.find(cr => cr.status === 'ABIERTA');
  }, [cashRegisters]);

  // Filter Active and in-stock products for POS view
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return products.filter(p => 
      p.status === 'ACTIVO' && 
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
       p.barcode.includes(searchTerm))
    );
  }, [products, searchTerm]);

  // Barcode quick add trigger
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!barcodeInput.trim()) return;

    const match = products.find(p => p.barcode === barcodeInput.trim() && p.status === 'ACTIVO');
    if (match) {
      if (match.stock <= 0) {
        setErrorMsg(`Producto ${match.name} sin stock suficiente`);
      } else {
        addToCart(match);
        setBarcodeInput('');
      }
    } else {
      setErrorMsg(`Código de barra ${barcodeInput} no encontrado`);
    }
  };

  // Cart operations
  const addToCart = (p: Product) => {
    setErrorMsg(null);
    if (p.stock <= 0) {
      setErrorMsg(`Producto ${p.name} no cuenta con stock disponible`);
      return;
    }

    const idx = posCart.findIndex(item => item.product.id === p.id);
    if (idx !== -1) {
      const currentQty = posCart[idx].quantity;
      if (currentQty >= p.stock) {
        setErrorMsg(`No puedes vender más de ${p.stock} unidades de ${p.name}`);
        return;
      }
      const updated = [...posCart];
      updated[idx].quantity += 1;
      setPosCart(updated);
    } else {
      setPosCart([...posCart, { product: p, quantity: 1 }]);
    }
  };

  const updateCartQty = (productId: string, delta: number) => {
    const idx = posCart.findIndex(item => item.product.id === productId);
    if (idx === -1) return;

    const updated = [...posCart];
    const newQty = updated[idx].quantity + delta;

    if (newQty <= 0) {
      updated.splice(idx, 1);
    } else if (newQty <= updated[idx].product.stock) {
      updated[idx].quantity = newQty;
    } else {
      setErrorMsg('Cantidad supera el inventario actual');
    }
    setPosCart(updated);
  };

  const removeFromCart = (productId: string) => {
    setPosCart(posCart.filter(item => item.product.id !== productId));
  };

  // Compute checkout numbers
  const cartSubtotal = useMemo(() => {
    return posCart.reduce((acc, item) => {
      const price = item.product.offerPrice > 0 ? item.product.offerPrice : item.product.salePrice;
      return acc + (price * item.quantity);
    }, 0);
  }, [posCart]);

  const cartTotal = cartSubtotal; // Pure POS checkout, optionally expand with discount rules

  // Cashier open/close/audit
  const handleOpenCaja = async () => {
    try {
      await openCashRegister(Number(initialCajaAmount) || 0, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role
      });
      actualRefresh?.();
      (window as any).showToast?.('Registro creado correctamente.', 'success');
    } catch (err: any) {
      (window as any).showToast?.(err.message || 'Error al procesar la solicitud.', 'error');
    }
  };

  const handleCloseCaja = async () => {
    if (!closeCajaAmount) {
      (window as any).showToast?.('Ingresa el monto total del arqueo de cierre.', 'warning');
      return;
    }
    try {
      await closeCashRegister(Number(closeCajaAmount) || 0, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role
      });
      setCloseCajaAmount('');
      actualRefresh?.();
      (window as any).showToast?.('Registro actualizado correctamente.', 'success');
    } catch (err: any) {
      (window as any).showToast?.(err.message || 'Error al procesar la solicitud.', 'error');
    }
  };

  const handleCajaAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cajaAdjustmentAmount || !cajaAdjustmentDesc) {
      (window as any).showToast?.('Completa los campos de ajuste.', 'warning');
      return;
    }
    try {
      await addCashRegisterTransaction(
        cajaAdjustmentType, 
        Number(cajaAdjustmentAmount), 
        cajaAdjustmentDesc, 
        {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role
        }
      );
      setCajaAdjustmentAmount('');
      setCajaAdjustmentDesc('');
      actualRefresh?.();
      (window as any).showToast?.('Registro creado correctamente.', 'success');
    } catch (err: any) {
      (window as any).showToast?.(err.message || 'Error al procesar la solicitud.', 'error');
    }
  };

  // Submit POS checkout
  const handlePOSCheckout = async () => {
    setErrorMsg(null);
    if (posCart.length === 0) {
      setErrorMsg('No hay elementos en el carrito');
      return;
    }

    try {
      const itemsPayload = posCart.map(item => {
        const price = item.product.offerPrice > 0 ? item.product.offerPrice : item.product.salePrice;
        return {
          productId: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          price: price,
          total: price * item.quantity
        };
      });

      const orderData = {
        channel: 'POS' as const,
        customerId: customerDni ? `c-pos-${customerDni}` : 'c-pos-general',
        customerName: customerName || 'Cliente General',
        items: itemsPayload,
        subtotal: cartSubtotal,
        discount: 0,
        shippingCost: 0,
        total: cartTotal,
        paymentMethod: paymentMethod
      };

      const result = await submitOrder(orderData, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role
      });

      setPrintedReceipt(result);
      setPosCart([]);
      setCustomerDni('');
      setCustomerName('Cliente General POS');
      actualRefresh?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error procesando la venta');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Open Caja Checker Block */}
      {!activeSession ? (
        <div className={`p-8 text-center rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'} shadow-sm max-w-lg mx-auto mt-10`}>
          <div className="bg-amber-100 dark:bg-amber-950/40 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-black tracking-tight mb-2">Apertura de Caja Obligatoria</h3>
          <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
            Para realizar operaciones en el Punto de Venta POS, es requerido abrir un turno de caja especificando el monto base inicial en efectivo para vuelto.
          </p>
          <div className="space-y-4 max-w-xs mx-auto">
            <div>
              <label className="text-[10px] text-zinc-400 block font-bold text-left mb-1">Monto inicial en caja (PEN):</label>
              <input
                type="number"
                value={initialCajaAmount}
                onChange={(e) => setInitialCajaAmount(e.target.value)}
                className="w-full px-4 py-2 text-sm rounded-xl border text-center font-mono focus:border-amber-600 outline-none dark:bg-zinc-800 dark:border-zinc-700"
              />
            </div>
            <button
              onClick={handleOpenCaja}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-lg"
            >
              Abrir Turno de Caja S/. {initialCajaAmount}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Block: Product Discovery (8/12) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* Scanners bar */}
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-neutral-100'} shadow-sm flex flex-col sm:flex-row gap-4`}>
              
              {/* Manual input list search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar prenda por SKU o Nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border outline-none ${
                    isDarkMode ? 'bg-zinc-800 border-zinc-700 focus:border-amber-600' : 'bg-neutral-50 border-neutral-200 focus:bg-white focus:border-amber-600'
                  }`}
                />
              </div>

              {/* Barcode scanner emulator */}
              <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                <div className="relative">
                  <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-4 text-amber-600" />
                  <input
                    type="text"
                    placeholder="Lector Código Barras..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className={`pl-9 pr-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                      isDarkMode ? 'bg-zinc-800 border-zinc-700 focus:border-amber-600' : 'bg-neutral-50 border-neutral-200 focus:bg-white focus:border-amber-500'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-zinc-900 border border-neutral-500 dark:bg-amber-600 dark:border-none hover:opacity-95 text-white font-bold px-3 py-1.5 rounded-xl text-xs"
                >
                  Escanear
                </button>
              </form>

            </div>

            {/* Catalog list selection helper */}
            {searchTerm.trim() ? (
              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-neutral-100'} shadow-sm`}>
                <h4 className="text-xs font-mono text-zinc-400 mb-3">Resultados de Búsqueda ({searchResults.length})</h4>
                {searchResults.length === 0 ? (
                  <p className="text-xs text-neutral-500 font-medium py-3">No se encontraron prendas coincidentes o están inactivas.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {searchResults.map(p => {
                      const hasOffer = p.offerPrice > 0;
                      const activePrice = hasOffer ? p.offerPrice : p.salePrice;
                      return (
                        <button
                          key={p.id}
                          onClick={() => addToCart(p)}
                          className={`p-2.5 rounded-xl border text-left flex gap-3 transition-colors ${
                            isDarkMode 
                              ? 'bg-zinc-850 hover:bg-zinc-800 border-zinc-800' 
                              : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200'
                          }`}
                        >
                          <img src={p.images[0]} alt={p.name} className="w-12 h-12 object-cover rounded-lg bg-zinc-200" />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-mono text-zinc-400 block line-clamp-1">{p.sku}</span>
                            <h5 className="text-[11px] font-bold line-clamp-1 truncate">{p.name}</h5>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-xs font-black text-amber-600">S/. {activePrice.toFixed(2)}</span>
                              <span className="font-mono text-[9px] text-zinc-500 font-medium">({p.stock} und)</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {/* Quick click top catalog favorites */}
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-neutral-100'} shadow-sm`}>
              <h4 className="text-xs font-bold text-neutral-500 dark:text-zinc-400 mb-4">Favoritos / Prendas más vendidas</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.filter(p => p.status === 'ACTIVO').slice(0, 8).map(p => {
                  const hasOffer = p.offerPrice > 0;
                  const price = hasOffer ? p.offerPrice : p.salePrice;
                  const isLow = p.stock <= p.minStock;
                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      disabled={p.stock <= 0}
                      className={`relative p-3 rounded-2xl border text-center transition-all ${
                        isDarkMode
                          ? 'bg-zinc-850 hover:border-amber-600 border-zinc-800 disabled:opacity-40'
                          : 'bg-white hover:shadow-md hover:border-amber-600 border-neutral-100 disabled:opacity-40'
                      }`}
                    >
                      <img src={p.images[0]} alt={p.name} className="w-full h-24 object-cover rounded-xl bg-zinc-100 dark:bg-zinc-800 mb-2" />
                      <span className="font-mono text-[9px] text-zinc-400 block uppercase">{p.sku}</span>
                      <h5 className="text-xs font-bold select-all truncate line-clamp-1">{p.name}</h5>
                      <span className="font-mono text-xs font-extrabold text-amber-600 mt-1 block">S/. {price.toFixed(2)}</span>
                      <div className={`text-[9px] font-mono mt-1 ${isLow ? 'text-amber-500 font-bold' : 'text-neutral-400'}`}>
                        Stock: {p.stock}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Caja Turn Control (Register drawer adjusters) & Turn details */}
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-neutral-100'} shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6`}>
              <div>
                <h4 className="text-xs font-bold text-amber-600 mb-1">Turno de Caja Abierto</h4>
                <p className="text-[10px] text-neutral-500 dark:text-zinc-400 mb-3">Abierto en: {new Date(activeSession.openedAt).toLocaleString()}</p>
                <div className="space-y-1.5 text-xs text-neutral-700 dark:text-zinc-300 font-mono">
                  <p><strong>Cajero:</strong> {activeSession.userName}</p>
                  <p><strong>Fondo Inicial:</strong> S/. {activeSession.initialAmount.toFixed(2)}</p>
                  <p><strong>Ventas POS:</strong> S/. {activeSession.transactions.reduce((acc, t) => acc + (t.type === 'VENTA' ? t.amount : 0), 0).toFixed(2)}</p>
                  <p><strong>Ingresos manuales:</strong> + S/. {activeSession.transactions.reduce((acc, t) => acc + (t.type === 'INGRESO' ? t.amount : 0), 0).toFixed(2)}</p>
                  <p><strong>Egresos manuales:</strong> - S/. {activeSession.transactions.reduce((acc, t) => acc + (t.type === 'EGRESO' ? t.amount : 0), 0).toFixed(2)}</p>
                </div>

                {/* Close Caja Button container */}
                <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-zinc-800 space-y-2">
                  <label className="text-[10px] text-zinc-400 font-bold block">Arqueo total real medido (PEN):</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Total auditado"
                      value={closeCajaAmount}
                      onChange={(e) => setCloseCajaAmount(e.target.value)}
                      className="px-2 py-1 text-xs font-mono rounded border flex-1 outline-none dark:bg-zinc-800 dark:border-zinc-700"
                    />
                    <button
                      onClick={handleCloseCaja}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1 text-xs rounded transition-all"
                    >
                      Cerrar Caja
                    </button>
                  </div>
                </div>
              </div>

              {/* Adjustments Form */}
              <div>
                <h4 className="text-xs font-bold text-neutral-500 dark:text-zinc-400 mb-2">Ajuste de Efectivo en Caja (Ingreso/Egreso)</h4>
                <form onSubmit={handleCajaAdjustment} className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={cajaAdjustmentType}
                      onChange={(e) => setCajaAdjustmentType(e.target.value as any)}
                      className="p-1.5 border text-xs rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                    >
                      <option value="INGRESO">Entrada (+)</option>
                      <option value="EGRESO">Salida (-)</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Monto"
                      required
                      value={cajaAdjustmentAmount}
                      onChange={(e) => setCajaAdjustmentAmount(e.target.value)}
                      className="p-1.5 border text-xs rounded font-mono bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Descripción / Concepto (ej: Pago de luz, sencillo vuelto)"
                    required
                    value={cajaAdjustmentDesc}
                    onChange={(e) => setCajaAdjustmentDesc(e.target.value)}
                    className="w-full p-1.5 border text-xs rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                  />
                  <button
                    type="submit"
                    className="w-full bg-zinc-900 dark:bg-zinc-800 text-white hover:opacity-90 font-bold py-1 px-3 rounded text-[10px]"
                  >
                    Registrar Ajuste Manual
                  </button>
                </form>
              </div>

            </div>

          </div>

          {/* Right Block: POS Checkout Terminal Cart (4/12) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className={`p-5 rounded-2xl border sticky top-24 space-y-4 ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-neutral-100 shadow-xl'
            }`}>
              
              <div className="flex items-center justify-between border-b pb-3 border-neutral-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-amber-600" />
                  <h3 className="font-extrabold text-sm uppercase mr-2">Venta de Mostrador</h3>
                </div>
                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {posCart.reduce((a, b) => a + b.quantity, 0)} items
                </span>
              </div>

              {/* Cart List */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {posCart.length === 0 ? (
                  <div className="text-center py-10">
                    <ShoppingCart className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs text-neutral-400 font-medium">Carrito POS vacío.</p>
                  </div>
                ) : (
                  posCart.map(item => {
                    const price = item.product.offerPrice > 0 ? item.product.offerPrice : item.product.salePrice;
                    return (
                      <div key={item.product.id} className="flex gap-3 justify-between items-center border-b pb-2.5 border-neutral-100 dark:border-zinc-800/60">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-xs truncate">{item.product.name}</h5>
                          <span className="text-[10px] font-mono text-zinc-400 block uppercase">{item.product.sku}</span>
                          <span className="text-xs font-bold text-amber-600 font-mono">S/. {price.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateCartQty(item.product.id, -1)}
                            className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-xs font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQty(item.product.id, 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-40"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-1 rounded hover:bg-red-50 text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Total calculations */}
              <div className="border-t border-b border-neutral-100 dark:border-zinc-800/80 py-3 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Subtotal:</span>
                  <span>S/. {cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-amber-600 border-t border-neutral-200 dark:border-zinc-800 pt-2">
                  <span>TOTAL A COBRAR:</span>
                  <span>S/. {cartTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Customer Linkage Info */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 block uppercase">Asignar Cliente (Boleta / Factura):</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="DNP/RUC Cliente"
                    value={customerDni}
                    onChange={(e) => setCustomerDni(e.target.value)}
                    className="p-1.5 border text-xs rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Nombre Completo"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="p-1.5 border text-xs rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 outline-none"
                  />
                </div>
              </div>

              {/* Payment Methods selections */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 block uppercase">Método de Pago:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['EFECTIVO', 'TARJETA', 'YAPE', 'PLIN', 'TRANSFERENCIA'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-1 text-[10px] font-bold rounded-lg border text-center transition-all ${
                        paymentMethod === m
                          ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800 border-neutral-200 dark:border-zinc-700 hover:bg-neutral-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-50 text-red-700 border border-red-300 rounded px-2 py-1 text-[10px] font-bold text-center">
                  {errorMsg}
                </div>
              )}

              {/* Cobrar Rápido btn */}
              <button
                onClick={handlePOSCheckout}
                disabled={posCart.length === 0}
                className="w-full bg-green-600 hover:bg-green-500 text-white transition-all font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <Check className="w-4 h-4" /> Registrar Cobro S/. {cartTotal.toFixed(2)}
              </button>

            </div>
          </div>

        </div>
      )}

      {/* POS Receipt Modal dialog showing print format */}
      <AnimatePresence>
        {printedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white text-zinc-900 border border-neutral-300 max-w-sm w-full p-6 rounded-2xl shadow-2xl relative font-sans"
            >
              <button
                onClick={() => setPrintedReceipt(null)}
                className="absolute top-4 right-4 p-1 text-neutral-500 hover:bg-neutral-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Thermal receipt simulator layout */}
              <div id="thermal-receipt" className="space-y-4 font-mono text-xs text-center border-t border-b border-dashed border-zinc-700 py-4">
                
                {/* Header info */}
                <div>
                  <h3 className="text-base font-black tracking-widest text-[#d97706]">ANDESMODA S.A.C.</h3>
                  <p className="text-[10px]">R.U.C. N° 20123456789</p>
                  <p className="text-[10px]">Portal de Venta Física: Tienda Miraflores</p>
                  <p className="text-[10px]">Av. Larco 456, Lima - Perú</p>
                </div>

                <div className="text-left border-b border-dotted border-zinc-400 pb-2 space-y-0.5 text-[9px]">
                  <p><strong>N° TICKET:</strong> {printedReceipt.code}</p>
                  <p><strong>FECHA:</strong> {new Date(printedReceipt.timestamp).toLocaleString()}</p>
                  <p><strong>CLIENTE:</strong> {printedReceipt.customerName}</p>
                  <p><strong>DNI/RUC:</strong> {printedReceipt.customerId.replace('c-pos-', '')}</p>
                  <p><strong>CAJER0:</strong> Carlos Mendoza</p>
                </div>

                {/* Items table */}
                <div className="text-left text-[9px] space-y-1 pb-2 border-b border-dotted border-zinc-400">
                  <div className="flex justify-between font-bold">
                    <span>PRENDA (SKU x QTY)</span>
                    <span>TOTAL</span>
                  </div>
                  {printedReceipt.items.map(it => (
                    <div key={it.productId} className="flex justify-between">
                      <span>{it.name.substring(0, 18)}.. ({it.sku}) x{it.quantity}</span>
                      <span>S/. {it.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="text-right space-y-0.5 text-[10px]">
                  <p>GRAVADA: S/. {(printedReceipt.total / 1.18).toFixed(2)}</p>
                  <p>I.G.V. (18%): S/. {(printedReceipt.total - (printedReceipt.total / 1.18)).toFixed(2)}</p>
                  <p className="text-sm font-black text-amber-600">TOTAL NETO: S/. {printedReceipt.total.toFixed(2)}</p>
                  <p>METODO: {printedReceipt.paymentMethod}</p>
                </div>

                {/* Barcode mock */}
                <div className="pt-3 border-t border-dashed border-zinc-400">
                  <p className="text-[9px] text-zinc-500">SISTEMA INTEGRADO POS ANDESMODA</p>
                  <div className="bg-zinc-200 h-8 w-2/3 mx-auto mt-2 mb-1 flex items-center justify-center text-[10px] tracking-widest font-bold">
                    |||||| | || ||||| | ||||| |
                  </div>
                  <span className="text-[9px] font-bold text-zinc-700">{printedReceipt.code}</span>
                  <p className="text-[9px] text-neutral-400 mt-2 font-sans italic">¡Gracias por adquirir el mejor arte andino!</p>
                </div>

              </div>

              {/* Mock trigger print alert */}
              <button
                onClick={() => {
                  (window as any).showToast?.("Imprimiendo recibo térmico de boleta mediante impresora conectada en puerto POS-01...", "success");
                  window.print();
                }}
                className="mt-4 w-full bg-[#d97706] text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 hover:opacity-95"
              >
                <Printer className="w-4 h-4" /> Imprimir Comprobante (Físico)
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
