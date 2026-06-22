import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Copy, ToggleLeft, ToggleRight, 
  DollarSign, ArrowUpRight, ArrowDownRight, Clipboard, Tag, X, CheckCircle, Upload 
} from 'lucide-react';
import { Product, Category } from '../types';
import { 
  createProduct, updateProduct, deleteProduct, 
  fixProductPrice, updateProductStock, duplicateProduct 
} from '../api';

interface ProductsViewProps {
  products: Product[];
  categories: Category[];
  currentUser: any;
  onRefresh: () => void;
  isDarkMode: boolean;
}

export default function ProductsView({
  products,
  categories,
  currentUser,
  onRefresh,
  isDarkMode
}: ProductsViewProps) {
  // App states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Dialog Toggles
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);

  // Form Fields: Add/Edit Product
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('AndesModa');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('0');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('5');
  const [imagePlaceholderUrl, setImagePlaceholderUrl] = useState('');

  // File Upload states and handlers
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: file.name,
            base64: base64,
          }),
        });

        if (!res.ok) {
          throw new Error('Error al subir el archivo al servidor');
        }

        const data = await res.json();
        if (data.url) {
          setImagePlaceholderUrl(data.url);
        }
      };
      reader.onerror = () => {
        setUploadError('Error al leer el archivo');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  // Form Fields: Fijar Precio (Price Fixing)
  const [fixPurchase, setFixPurchase] = useState('');
  const [fixSale, setFixSale] = useState('');
  const [fixOffer, setFixOffer] = useState('');

  // Form Fields: Actualizar Stock (Stock adjusting)
  const [adjustStockVal, setAdjustStockVal] = useState('');
  const [adjustReason, setAdjustReason] = useState('Actualización periódica de almacén');

  // Trigger Add Modal
  const openAddModal = () => {
    setSku('AND-' + Math.floor(Math.random() * 9000 + 1000));
    setBarcode('775' + Math.floor(Math.random() * 8999999999 + 1000000000));
    setName('');
    setDescription('');
    setCategory(categories[0]?.name || 'Suéteres de Alpaca');
    setBrand('AndesModa');
    setPurchasePrice('50');
    setSalePrice('120');
    setOfferPrice('0');
    setStock('20');
    setMinStock('5');
    setImagePlaceholderUrl('https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400');
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        sku,
        barcode,
        name,
        description,
        category,
        brand,
        purchasePrice: Number(purchasePrice) || 0,
        salePrice: Number(salePrice) || 0,
        offerPrice: Number(offerPrice) || 0,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 0,
        images: [imagePlaceholderUrl || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400'],
        status: 'ACTIVO' as const
      };
      await createProduct(payload, currentUser);
      setIsAddOpen(false);
      onRefresh();
      (window as any).showToast?.('Registro creado correctamente.', 'success');
    } catch (err) {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  // Trigger Edit Modal
  const openEditModal = (p: Product) => {
    setSelectedProduct(p);
    setSku(p.sku);
    setBarcode(p.barcode);
    setName(p.name);
    setDescription(p.description);
    setCategory(p.category);
    setBrand(p.brand);
    setPurchasePrice(p.purchasePrice.toString());
    setSalePrice(p.salePrice.toString());
    setOfferPrice(p.offerPrice.toString());
    setMinStock(p.minStock.toString());
    setImagePlaceholderUrl(p.images[0]);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const payload = {
        sku,
        barcode,
        name,
        description,
        category,
        brand,
        purchasePrice: Number(purchasePrice),
        salePrice: Number(salePrice),
        offerPrice: Number(offerPrice),
        minStock: Number(minStock),
        images: [imagePlaceholderUrl]
      };
      await updateProduct(selectedProduct.id, payload, currentUser);
      setIsEditOpen(false);
      setSelectedProduct(null);
      onRefresh();
      (window as any).showToast?.('Registro actualizado correctamente.', 'success');
    } catch (err) {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  // Trigger Price Fixing Dialog (Fijar Precio)
  const openPriceModal = (p: Product) => {
    setSelectedProduct(p);
    setFixPurchase(p.purchasePrice.toString());
    setFixSale(p.salePrice.toString());
    setFixOffer(p.offerPrice.toString());
    setIsPriceOpen(true);
  };

  const handlePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await fixProductPrice(
        selectedProduct.id, 
        Number(fixPurchase), 
        Number(fixSale), 
        Number(fixOffer),
        currentUser
      );
      setIsPriceOpen(false);
      setSelectedProduct(null);
      onRefresh(); // Updates list/table automatically!
      (window as any).showToast?.('Registro actualizado correctamente.', 'success');
    } catch (err) {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  // Trigger Stock Adjustments Modal (Actualizar Stock)
  const openStockModal = (p: Product) => {
    setSelectedProduct(p);
    setAdjustStockVal(p.stock.toString());
    setAdjustReason('Ajuste físico de inventario en almacén central');
    setIsStockOpen(true);
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await updateProductStock(
        selectedProduct.id, 
        Number(adjustStockVal), 
        adjustReason, 
        currentUser
      );
      setIsStockOpen(false);
      setSelectedProduct(null);
      onRefresh();
      (window as any).showToast?.('Registro actualizado correctamente.', 'success');
    } catch (err) {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  // Duplicate product triggers
  const handleDuplicate = async (p: Product) => {
    try {
      await duplicateProduct(p.id, currentUser);
      onRefresh();
      (window as any).showToast?.('Registro creado correctamente.', 'success');
    } catch (err) {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  // Toggle status triggers
  const handleToggleStatus = async (p: Product) => {
    try {
      const nextStatus = p.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
      await updateProduct(p.id, { status: nextStatus }, currentUser);
      onRefresh();
      (window as any).showToast?.('Registro actualizado correctamente.', 'success');
    } catch (err) {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  // Delete product triggers
  const handleDelete = async (id: string, name: string) => {
    (window as any).askConfirm?.({
      title: '¿Está seguro de que desea eliminar este registro?',
      message: `Está a punto de eliminar el producto "${name}". Esta acción actualizará los reportes relacionados de forma segura.`,
      onConfirm: async () => {
        try {
          await deleteProduct(id, currentUser);
          onRefresh();
          (window as any).showToast?.('Registro eliminado correctamente.', 'success');
        } catch (err) {
          (window as any).showToast?.('Error al procesar la solicitud.', 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header operations */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-amber-600 block">Prendas & Catálogo central de Productos</h2>
          <p className="text-xs text-neutral-500">Gestión de datos de inventario compartida de ANDESMODA para POS y tienda Web.</p>
        </div>
        
        <button
          onClick={openAddModal}
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-600/25"
        >
          <Plus className="w-4 h-4" /> Registrar Prenda Nueva
        </button>
      </div>

      {/* Grid List Products Table */}
      <div className={`overflow-x-auto rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-sm'}`}>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className={`${isDarkMode ? 'bg-zinc-850' : 'bg-neutral-50'} text-zinc-500 dark:text-zinc-400 font-bold uppercase`}>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800">Prenda SKU / Código</th>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800">Detalles de Prenda</th>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800">Categoría</th>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800 font-mono text-right">Costos (Compra)</th>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800 font-mono text-right">Precios (Venta)</th>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800 font-mono text-right">Oferta</th>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800 text-center">Stock</th>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800 text-center">Estado</th>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800">
            {products.map(p => {
              const isOutOfStock = p.stock <= 0;
              const isUnderMinStock = p.stock > 0 && p.stock <= p.minStock;

              return (
                <tr key={p.id} className="hover:bg-neutral-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                  
                  {/* SKU block */}
                  <td className="p-4 font-mono font-bold whitespace-nowrap text-amber-600 block sm:inline-block">
                    <div>{p.sku}</div>
                    <div className="text-[10px] text-zinc-400 font-medium">CB: {p.barcode}</div>
                  </td>

                  {/* Name block */}
                  <td className="p-4 min-w-[160px]">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded-lg bg-zinc-200" />
                      <div>
                        <span className="font-bold sm:text-xs block text-neutral-800 dark:text-zinc-100 line-clamp-1">{p.name}</span>
                        <span className="text-[10px] text-zinc-400 block line-clamp-1">Marca: {p.brand}</span>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="p-4 font-medium text-neutral-600 dark:text-zinc-300">
                    <span className="bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg text-[10px]">{p.category}</span>
                  </td>

                  {/* Cost Price */}
                  <td className="p-4 font-mono text-right font-medium text-neutral-600 dark:text-zinc-300">
                    S/. {p.purchasePrice.toFixed(2)}
                  </td>

                  {/* Sale Price */}
                  <td className="p-4 font-mono text-right font-bold text-neutral-800 dark:text-zinc-100">
                    S/. {p.salePrice.toFixed(2)}
                  </td>

                  {/* Offer Price */}
                  <td className="p-4 font-mono text-right">
                    {p.offerPrice > 0 ? (
                      <span className="text-red-600 font-bold">S/. {p.offerPrice.toFixed(2)}</span>
                    ) : (
                      <span className="text-zinc-400 font-normal">--</span>
                    )}
                  </td>

                  {/* Stock counter with thresholds indicators */}
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded font-mono font-bold text-[10px] ${
                      isOutOfStock ? 'bg-red-100 text-red-800 dark:bg-red-950/45 dark:text-red-400' :
                      isUnderMinStock ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/45 dark:text-amber-400' :
                      'bg-green-100 text-green-800 dark:bg-green-950/45 dark:text-green-400'
                    }`}>
                      {p.stock} und
                    </span>
                    <div className="text-[9px] text-zinc-400 mt-1 font-mono">Min: {p.minStock}</div>
                  </td>

                  {/* Status toggle */}
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(p)}
                      className="cursor-pointer hover:scale-105 transition-transform"
                    >
                      {p.status === 'ACTIVO' ? (
                        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">● Activo</span>
                      ) : (
                        <span className="bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 text-[10px] px-2 py-0.5 rounded-full font-bold">○ Inactivo</span>
                      )}
                    </button>
                  </td>

                  {/* Action buttons */}
                  <td className="p-4 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => openPriceModal(p)}
                        title="Fijar Precio"
                        className="p-1.5 rounded hover:bg-neutral-150 dark:hover:bg-zinc-800 text-amber-600 hover:text-amber-500 cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openStockModal(p)}
                        title="Actualizar Stock"
                        className="p-1.5 rounded hover:bg-neutral-150 dark:hover:bg-zinc-800 text-blue-600 hover:text-blue-500 cursor-pointer"
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(p)}
                        title="Duplicar Prenda"
                        className="p-1.5 rounded hover:bg-neutral-150 dark:hover:bg-zinc-800 text-violet-600 hover:text-violet-500 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(p)}
                        title="Editar Prenda"
                        className="p-1.5 rounded hover:bg-neutral-150 dark:hover:bg-zinc-800 text-emerald-600 hover:text-emerald-500 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        title="Eliminar"
                        className="p-1.5 rounded hover:bg-neutral-150 dark:hover:bg-zinc-800 text-red-600 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: Add product */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`relative max-w-lg w-full p-6 rounded-2xl shadow-xl ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-base text-amber-600">Registrar Prenda Nueva en Catálogo</h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 hover:bg-zinc-800/25 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">SKU:</label>
                  <input type="text" required value={sku} onChange={(e) => setSku(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-mono" />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Código de Barras:</label>
                  <input type="text" required value={barcode} onChange={(e) => setBarcode(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nombre Comercial de la Prenda:</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700" placeholder="Ej: Suéter Andino Chic de Invierno" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Categoría:</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700">
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Marca de Prenda:</label>
                  <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700" />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Descripción de la Fibra y Costura:</label>
                <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700" placeholder="Detalles de composición y tejido..." />
              </div>

              <div className="grid grid-cols-3 gap-3 font-mono">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1 text-[10px]">Costo Compra (S/.):</label>
                  <input type="number" required value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700" />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1 text-[10px]">Precio Venta (S/.):</label>
                  <input type="number" required value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 animate-pulse" />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1 text-[10px]">Precio Oferta (S/.):</label>
                  <input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1 text-[10px]">Stock Inicial (und):</label>
                  <input type="number" required value={stock} onChange={(e) => setStock(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700" />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1 text-[10px]">Alerta Mínima (und):</label>
                  <input type="number" required value={minStock} onChange={(e) => setMinStock(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700" />
                </div>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl bg-zinc-900/5">
                <span className="block text-zinc-400 font-bold mb-2 text-[10px] uppercase tracking-wide">Fotografía / Imagen de Prenda:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-1">Opción A: Subir archivo de tu PC</span>
                    <label className="flex flex-col items-center justify-center border border-dashed border-zinc-450 hover:border-amber-500 rounded-lg p-2.5 cursor-pointer bg-neutral-50 dark:bg-zinc-800 transition-colors text-center text-[10px] text-zinc-400">
                      <Upload className="w-4 h-4 mb-1 text-zinc-500" />
                      <span>{uploading ? 'Subiendo...' : 'Elegir archivo imagen'}</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                    {uploadError && <p className="text-[9px] text-rose-500 mt-1">{uploadError}</p>}
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-1">Opción B: Seleccionar de Galería</span>
                    <select value={imagePlaceholderUrl} onChange={(e) => setImagePlaceholderUrl(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 text-xs">
                      <option value="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=400">Suéter Cusco</option>
                      <option value="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400">Saco Tradicional</option>
                      <option value="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400">Bufanda Telar</option>
                      <option value="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=400">Vestido Bordado</option>
                      <option value="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=400">Polo de Lino</option>
                    </select>
                    <div className="mt-2 text-[9px] font-mono text-zinc-500 flex items-center gap-1.5 truncate">
                      <span>URL activa:</span>
                      <span className="truncate max-w-[110px]">{imagePlaceholderUrl}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 border rounded-lg bg-transparent">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg">Guardar Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit product */}
      {isEditOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`relative max-w-lg w-full p-6 rounded-2xl shadow-xl ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-base text-emerald-600">Editar Datos de Prenda</h3>
              <button onClick={() => { setIsEditOpen(false); setSelectedProduct(null); }} className="p-1 hover:bg-zinc-800/25 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">SKU:</label>
                  <input type="text" required value={sku} onChange={(e) => setSku(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-mono" />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Código de Barras:</label>
                  <input type="text" required value={barcode} onChange={(e) => setBarcode(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nombre Comercial de la Prenda:</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Categoría:</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700">
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Marca de Prenda:</label>
                  <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700" />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Descripción de la Fibra y Costura:</label>
                <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-sans" />
              </div>

              <div className="grid grid-cols-3 gap-3 font-mono">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1 text-[10px]">Costo Compra (S/.):</label>
                  <input type="number" required value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700" />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1 text-[10px]">Precio Venta (S/.):</label>
                  <input type="number" required value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700" />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1 text-[10px]">Precio Oferta (S/.):</label>
                  <input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1 text-[10px]">Alerta Mínima (und):</label>
                  <input type="number" required value={minStock} onChange={(e) => setMinStock(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700" />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1 text-[10px]">Subir Nueva Foto:</label>
                  <label className="flex items-center justify-center gap-2 border border-dashed border-zinc-450 hover:border-emerald-500 rounded-lg p-2 cursor-pointer bg-neutral-50 dark:bg-zinc-800 transition-colors text-[10px] text-zinc-400 font-sans">
                    <Upload className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{uploading ? 'Subiendo...' : 'Elegir archivo'}</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {uploadError && <p className="text-[9px] text-rose-500 font-sans">{uploadError}</p>}

              <div className="font-mono">
                <label className="block text-zinc-400 font-bold mb-1 text-[10px]">URL de Imagen de la Prenda:</label>
                <input type="text" required value={imagePlaceholderUrl} onChange={(e) => setImagePlaceholderUrl(e.target.value)} className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700" />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => { setIsEditOpen(false); setSelectedProduct(null); }} className="px-4 py-2 border rounded-lg bg-transparent">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Fijar Precio (COMPLETELY functional prices updater dialog!) */}
      {isPriceOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`relative max-w-sm w-full p-6 rounded-2xl shadow-xl ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-sm text-amber-500 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 animate-bounce" /> Reajustar Tarifas / Fijar Precio
              </h3>
              <button onClick={() => { setIsPriceOpen(false); setSelectedProduct(null); }} className="p-1 hover:bg-zinc-800/25 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            
            <p className="text-[10px] text-zinc-400 mb-4">Actualiza los costos base y valores pVP de <strong>{selectedProduct.name}</strong> ({selectedProduct.sku}). Guardará en la base de datos central y actualizará la consola.</p>
            
            <form onSubmit={handlePriceSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Precio Compra de Taller (S/.):</label>
                <input 
                  type="number" 
                  step="0.01"
                  required 
                  value={fixPurchase} 
                  onChange={(e) => setFixPurchase(e.target.value)} 
                  className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700" 
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Precio Venta Público PVP (S/.):</label>
                <input 
                  type="number" 
                  step="0.01"
                  required 
                  value={fixSale} 
                  onChange={(e) => setFixSale(e.target.value)} 
                  className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-bold" 
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Precio Oferta de Campaña (S/., ó 0):</label>
                <input 
                  type="number" 
                  step="0.01"
                  required 
                  value={fixOffer} 
                  onChange={(e) => setFixOffer(e.target.value)} 
                  className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 text-red-500 font-bold" 
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 font-sans">
                <button type="button" onClick={() => { setIsPriceOpen(false); setSelectedProduct(null); }} className="px-4 py-2 border rounded-lg bg-transparent text-xs">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md">
                  <CheckCircle className="w-3.5 h-3.5" /> Fijar y Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Actualizar Stock (COMPLETELY functional Stocks updating logs Kardex) */}
      {isStockOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`relative max-w-sm w-full p-6 rounded-2xl shadow-xl ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-sm text-blue-500 flex items-center gap-1.5">
                <Clipboard className="w-4 h-4 animate-spinner" /> Ajustar Almacén / Actualizar Stock
              </h3>
              <button onClick={() => { setIsStockOpen(false); setSelectedProduct(null); }} className="p-1 hover:bg-zinc-800/25 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            
            <p className="text-[10px] text-zinc-400 mb-4">Ingresa el nuevo stock total para <strong>{selectedProduct.name}</strong>. Esto registrará una entrada/salida correspondiente en el Kardex de auditoría.</p>
            
            <form onSubmit={handleStockSubmit} className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-zinc-150 dark:bg-zinc-850 rounded-lg text-[11px] leading-tight text-neutral-500 dark:text-zinc-400 flex items-center justify-between">
                <span>Stock Actual en Base Datos:</span>
                <span className="font-bold text-neutral-800 dark:text-zinc-100">{selectedProduct.stock} unidades</span>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Monto Nuevo del Inventario Total:</label>
                <input 
                  type="number" 
                  required 
                  value={adjustStockVal} 
                  onChange={(e) => setAdjustStockVal(e.target.value)} 
                  className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-bold text-center" 
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1 font-sans">Razón / Justificación del Ajuste:</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-sans"
                >
                  <option value="Carga por nuevo suministro de tejedores/artesanos">Nuevo lote de confección</option>
                  <option value="Ajuste de inventario físico por arqueo anual">Arqueo físico anual</option>
                  <option value="Sustitución por merma o error de empaque">Mermas o reposiciones</option>
                  <option value="Corrección de error de digitación anterior">Corrección de digitación</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2 font-sans text-xs">
                <button type="button" onClick={() => { setIsStockOpen(false); setSelectedProduct(null); }} className="px-4 py-2 border rounded-lg bg-transparent">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-1">
                  Registrar Ajuste Almacén
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
