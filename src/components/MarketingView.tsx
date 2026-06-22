import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Tag, Megaphone, 
  ToggleLeft, ToggleRight, X, Sparkles, Image as ImageIcon 
} from 'lucide-react';
import { Coupon, Banner, Promotion } from '../types';
import { 
  createCoupon, updateCoupon, deleteCoupon, 
  createBanner, updateBanner, deleteBanner, 
  createPromotion, updatePromotion, deletePromotion 
} from '../api';

interface MarketingViewProps {
  coupons: Coupon[];
  banners: Banner[];
  promotions: Promotion[];
  currentUser: any;
  onRefresh: () => void;
  isDarkMode: boolean;
}

export default function MarketingView({
  coupons,
  banners,
  promotions,
  currentUser,
  onRefresh,
  isDarkMode
}: MarketingViewProps) {
  // Navigation active tab
  const [activeSubTab, setActiveSubTab] = useState<'CUPONES' | 'BANNERS' | 'PROMOCIONES'>('CUPONES');

  // Dialog Toggles
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [isBannerOpen, setIsBannerOpen] = useState(false);
  const [isPromoOpen, setIsPromoOpen] = useState(false);

  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);

  // Form Fields: Coupons
  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState<'PORCENTAJE' | 'MONTO' | 'ENVIO'>('PORCENTAJE');
  const [couponValue, setCouponValue] = useState('10');
  const [couponStatus, setCouponStatus] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO');

  // Form Fields: Banners
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerImg, setBannerImg] = useState('');
  const [bannerLink, setBannerLink] = useState('#');
  const [bannerStatus, setBannerStatus] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO');

  // Form Fields: Promos
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDesc, setPromoDesc] = useState('');
  const [promoDiscount, setPromoDiscount] = useState('15');
  const [promoStatus, setPromoStatus] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO');

  // -- COUPON SUBMIT --
  const handleOpenCouponAdd = () => {
    setSelectedCoupon(null);
    setCouponCode('');
    setDiscountType('PORCENTAJE');
    setCouponValue('10');
    setCouponStatus('ACTIVO');
    setIsCouponOpen(true);
  };

  const handleOpenCouponEdit = (c: Coupon) => {
    setSelectedCoupon(c);
    setCouponCode(c.code);
    setDiscountType(c.discountType);
    setCouponValue(c.value.toString());
    setCouponStatus(c.status);
    setIsCouponOpen(true);
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: couponCode,
        discountType,
        value: Number(couponValue) || 0,
        status: couponStatus
      };
      if (selectedCoupon) {
        await updateCoupon(selectedCoupon.id, payload, currentUser);
      } else {
        await createCoupon(payload, currentUser);
      }
      setIsCouponOpen(false);
      onRefresh();
      (window as any).showToast?.('Registro guardado correctamente.', 'success');
    } catch {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  const handleToggleCoupon = async (c: Coupon) => {
    try {
      const nextS = c.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
      await updateCoupon(c.id, { status: nextS }, currentUser);
      onRefresh();
      (window as any).showToast?.('Registro actualizado correctamente.', 'success');
    } catch {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    (window as any).askConfirm?.({
      title: '¿Está seguro de que desea eliminar este registro?',
      message: `Está a punto de borrar el cupón "${code}" definitivamente de la campaña.`,
      onConfirm: async () => {
        try {
          await deleteCoupon(id, currentUser);
          onRefresh();
          (window as any).showToast?.('Registro eliminado correctamente.', 'success');
        } catch {
          (window as any).showToast?.('Error al procesar la solicitud.', 'error');
        }
      }
    });
  };

  // -- BANNER SUBMIT --
  const handleOpenBannerAdd = () => {
    setSelectedBanner(null);
    setBannerTitle('');
    setBannerImg('https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=800');
    setBannerLink('#');
    setBannerStatus('ACTIVO');
    setIsBannerOpen(true);
  };

  const handleOpenBannerEdit = (b: Banner) => {
    setSelectedBanner(b);
    setBannerTitle(b.title);
    setBannerImg(b.imageUrl);
    setBannerLink(b.link);
    setBannerStatus(b.status);
    setIsBannerOpen(true);
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: bannerTitle,
        imageUrl: bannerImg,
        link: bannerLink,
        status: bannerStatus
      };
      if (selectedBanner) {
        await updateBanner(selectedBanner.id, payload, currentUser);
        (window as any).showToast?.('Registro actualizado correctamente.', 'success');
      } else {
        await createBanner(payload, currentUser);
        (window as any).showToast?.('Registro creado correctamente.', 'success');
      }
      setIsBannerOpen(false);
      onRefresh();
    } catch {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  const handleToggleBanner = async (b: Banner) => {
    try {
      const nextS = b.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
      await updateBanner(b.id, { status: nextS }, currentUser);
      onRefresh();
      (window as any).showToast?.('Registro actualizado correctamente.', 'success');
    } catch {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  const handleDeleteBanner = async (id: string, title: string) => {
    (window as any).askConfirm?.({
      title: '¿Está seguro de que desea eliminar este registro?',
      message: `Está a punto de eliminar el banner publicitario "${title || 'Destacado'}" definitivamente de la campaña.`,
      onConfirm: async () => {
        try {
          await deleteBanner(id, currentUser);
          onRefresh();
          (window as any).showToast?.('Registro eliminado correctamente.', 'success');
        } catch {
          (window as any).showToast?.('Error al procesar la solicitud.', 'error');
        }
      }
    });
  };

  // -- PROMOTIONS SUBMIT --
  const handleOpenPromoAdd = () => {
    setSelectedPromo(null);
    setPromoTitle('');
    setPromoDesc('');
    setPromoDiscount('15');
    setPromoStatus('ACTIVO');
    setIsPromoOpen(true);
  };

  const handleOpenPromoEdit = (pr: Promotion) => {
    setSelectedPromo(pr);
    setPromoTitle(pr.title);
    setPromoDesc(pr.description);
    setPromoDiscount(pr.discount.toString());
    setPromoStatus(pr.status);
    setIsPromoOpen(true);
  };

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: promoTitle,
        description: promoDesc,
        discount: Number(promoDiscount) || 0,
        status: promoStatus
      };
      if (selectedPromo) {
        await updatePromotion(selectedPromo.id, payload, currentUser);
        (window as any).showToast?.('Registro actualizado correctamente.', 'success');
      } else {
        await createPromotion(payload, currentUser);
        (window as any).showToast?.('Registro creado correctamente.', 'success');
      }
      setIsPromoOpen(false);
      onRefresh();
    } catch {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  const handleTogglePromo = async (pr: Promotion) => {
    try {
      const nextS = pr.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
      await updatePromotion(pr.id, { status: nextS }, currentUser);
      onRefresh();
      (window as any).showToast?.('Registro actualizado correctamente.', 'success');
    } catch {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  const handleDeletePromo = async (id: string, title: string) => {
    (window as any).askConfirm?.({
      title: '¿Está seguro de que desea eliminar este registro?',
      message: `Está a punto de borrar la promoción "${title || 'Especial'}" definitivamente de las campañas activas.`,
      onConfirm: async () => {
        try {
          await deletePromotion(id, currentUser);
          onRefresh();
          (window as any).showToast?.('Registro eliminado correctamente.', 'success');
        } catch {
          (window as any).showToast?.('Error al procesar la solicitud.', 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Tab controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-200 dark:border-zinc-800 pb-3">
        <div>
          <h2 className="text-xl font-black text-amber-600">Marketing & Campañas de Venta</h2>
          <p className="text-xs text-neutral-500">Administra ofertas cruzadas, cupones de fidelidad y banners interactivos.</p>
        </div>
        
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('CUPONES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'CUPONES' ? 'bg-amber-600 text-white' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-zinc-100'}`}
          >
            Cupones Descuento
          </button>
          <button
            onClick={() => setActiveSubTab('BANNERS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'BANNERS' ? 'bg-amber-600 text-white' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-zinc-100'}`}
          >
            Banners Carrousel
          </button>
          <button
            onClick={() => setActiveSubTab('PROMOCIONES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'PROMOCIONES' ? 'bg-amber-600 text-white' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-zinc-100'}`}
          >
            Campañas Promocionales
          </button>
        </div>
      </div>

      {/* RENDER TAB PANEL: COUPONS (CRUD) */}
      {activeSubTab === 'CUPONES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-dotted border-neutral-200 dark:border-zinc-800">
            <p className="text-xs text-neutral-500"><strong>Sugerencia de Pruebas:</strong> Ingresa el código de estos cupones activos en el carrito de la Tienda Web del Cliente para activar descuentos instantáneos.</p>
            <button
              onClick={handleOpenCouponAdd}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Registrar Cupón
            </button>
          </div>

          <div className={`overflow-hidden rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-sm'}`}>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`${isDarkMode ? 'bg-zinc-850' : 'bg-neutral-50'} text-zinc-500 font-bold uppercase`}>
                  <th className="p-3 border-b">Código Cupón</th>
                  <th className="p-3 border-b">Tipo de Beneficio</th>
                  <th className="p-3 border-b text-center font-mono">Valor de Descuento</th>
                  <th className="p-3 border-b text-center">Estado Directo</th>
                  <th className="p-3 border-b text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-150 dark:divide-zinc-800">
                {coupons.map(c => (
                  <tr key={c.id} className="hover:bg-neutral-50/50 dark:hover:bg-zinc-800/10">
                    <td className="p-3 font-mono font-bold text-amber-600 text-sm">{c.code}</td>
                    <td className="p-3">
                      <span className="bg-zinc-100 dark:bg-zinc-805 p-1.5 rounded font-bold text-[9px] uppercase">
                        {c.discountType === 'PORCENTAJE' ? 'Porcentaje %' : c.discountType === 'MONTO' ? 'Monto fijo (PEN)' : 'Costo Envío S/. 0'}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-sm">
                      {c.value > 0 ? (c.discountType === 'PORCENTAJE' ? `${c.value}%` : `S/. ${c.value.toFixed(2)}`) : 'Envío Gratis'}
                    </td>
                    
                    {/* Status switcher */}
                    <td className="p-3 text-center">
                      <button onClick={() => handleToggleCoupon(c)} className="cursor-pointer">
                        {c.status === 'ACTIVO' ? (
                          <span className="bg-green-150 text-green-800 font-bold rounded-full py-0.5 px-2 text-[9px]">● ACTIVO</span>
                        ) : (
                          <span className="bg-red-100 text-red-800 font-bold rounded-full py-0.5 px-2 text-[9px]">○ INACTIVO</span>
                        )}
                      </button>
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => handleOpenCouponEdit(c)} className="p-1 hover:bg-neutral-100 dark:hover:bg-zinc-850 text-emerald-600 rounded">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteCoupon(c.id, c.code)} className="p-1 hover:bg-neutral-100 dark:hover:bg-zinc-850 text-red-600 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER TAB PANEL: BANNERS (CRUD) */}
      {activeSubTab === 'BANNERS' && (
        <div className="space-y-4">
          <div className="flex justify-end p-2">
            <button
              onClick={handleOpenBannerAdd}
              className="bg-amber-600 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Crear Slide Banner
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map(b => {
              const bActive = b.status === 'ACTIVO';
              return (
                <div key={b.id} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-sm'} space-y-3 flex flex-col justify-between`}>
                  <div>
                    <img src={b.imageUrl} alt={b.title} className="w-full h-32 object-cover rounded-xl bg-zinc-200" />
                    <h4 className="font-extrabold text-xs mt-3 line-clamp-1">{b.title}</h4>
                    <span className="font-mono text-[9px] text-zinc-400">Link web: {b.link}</span>
                  </div>

                  <div className="border-t pt-3 flex justify-between items-center text-xs">
                    <button onClick={() => handleToggleBanner(b)} className="flex items-center gap-1.5">
                      {bActive ? <ToggleRight className="w-6 h-6 text-green-600" /> : <ToggleLeft className="w-6 h-6 text-zinc-400" />}
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">{b.status}</span>
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenBannerEdit(b)} className="p-1 text-emerald-600"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteBanner(b.id, b.title)} className="p-1 text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RENDER TAB PANEL: CAMPAIGNS (CRUD) */}
      {activeSubTab === 'PROMOCIONES' && (
        <div className="space-y-4">
          <div className="flex justify-end p-2">
            <button
              onClick={handleOpenPromoAdd}
              className="bg-amber-600 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Lanzar Promoción
            </button>
          </div>

          <div className="space-y-3">
            {promotions.map(pr => {
              const active = pr.status === 'ACTIVO';
              return (
                <div key={pr.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-sm'}`}>
                  <div>
                    <span className="bg-amber-100 text-amber-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">Campaña de Liquidación</span>
                    <h4 className="font-extrabold text-xs mt-1.5">{pr.title}</h4>
                    <p className="text-xs text-neutral-500 dark:text-zinc-400">{pr.description}</p>
                    <span className="font-mono text-xs text-red-600 font-bold block mt-1">Descuento aplicado: {pr.discount}% en checkout selectivo</span>
                  </div>

                  <div className="flex items-center gap-3 justify-end shrink-0">
                    <button onClick={() => handleTogglePromo(pr)} className="flex items-center gap-1 text-xs">
                      {active ? <ToggleRight className="w-7 h-7 text-green-600" /> : <ToggleLeft className="w-7 h-7 text-zinc-400" />}
                      <span className="text-[10px] uppercase font-bold text-zinc-400">{pr.status}</span>
                    </button>
                    <button onClick={() => handleOpenPromoEdit(pr)} className="p-1 text-emerald-600 hover:bg-neutral-100 rounded"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDeletePromo(pr.id, pr.title)} className="p-1 text-red-600 hover:bg-neutral-100 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DIALOG 1: Coupon Form */}
      {isCouponOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`max-w-sm w-full p-6 rounded-2xl shadow-xl ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-sm text-amber-600 flex items-center gap-1.5"><Tag className="w-4 h-4" /> {selectedCoupon ? 'Ajustar Cupón' : 'Añadir Cupón'}</h3>
              <button onClick={() => setIsCouponOpen(false)} className="p-1 hover:bg-zinc-850 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleCouponSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Código del Cupón (Sin Espacios):</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: REGALOMODA"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-bold font-mono text-center text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Método de Rebaja:</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                  >
                    <option value="PORCENTAJE">Porcentaje (%)</option>
                    <option value="MONTO">Monto Fijo (S/.)</option>
                    <option value="ENVIO">Envío Gratis (S/. 0)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Monto de Descuento:</label>
                  <input
                    type="number"
                    required
                    disabled={discountType === 'ENVIO'}
                    value={couponValue}
                    onChange={(e) => setCouponValue(e.target.value)}
                    className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1 col-span-1">Estado de Lanzamiento:</label>
                <select
                  value={couponStatus}
                  onChange={(e) => setCouponStatus(e.target.value as any)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                >
                  <option value="ACTIVO">ACTIVO (Canal de E-commerce disponible)</option>
                  <option value="INACTIVO">INACTIVO (Bloqueado temporalmente)</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setIsCouponOpen(false)} className="px-3 py-1.5 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white font-bold rounded">Guardar Cupón</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG 2: Banner Form */}
      {isBannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`max-w-md w-full p-6 rounded-2xl shadow-xl ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-sm text-amber-600 flex items-center gap-1.5"><ImageIcon className="w-4 h-4" /> Slide Banner</h3>
              <button onClick={() => setIsBannerOpen(false)} className="p-1 hover:bg-zinc-850 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleBannerSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Título de la Campaña / Slide:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Fin de Temporada - 20% Off"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-bold"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">URL de Imagen Publicitaria (Unsplash):</label>
                <input
                  type="text"
                  required
                  value={bannerImg}
                  onChange={(e) => setBannerImg(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-mono text-[10px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Enlace de Redirección Web:</label>
                  <input
                    type="text"
                    required
                    value={bannerLink}
                    onChange={(e) => setBannerLink(e.target.value)}
                    className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Estado de Banner:</label>
                  <select
                    value={bannerStatus}
                    onChange={(e) => setBannerStatus(e.target.value as any)}
                    className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                  >
                    <option value="ACTIVO">ACTIVO (En portada)</option>
                    <option value="INACTIVO">OCULTO</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setIsBannerOpen(false)} className="px-3 py-1.5 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white font-bold rounded">Guardar Banner</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG 3: Promo Form */}
      {isPromoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`max-w-sm w-full p-6 rounded-2xl shadow-xl ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-sm text-amber-600 flex items-center gap-1.5"><Megaphone className="w-4 h-4" /> {selectedPromo ? 'Editar Campaña' : 'Crear Campaña'}</h3>
              <button onClick={() => setIsPromoOpen(false)} className="p-1 hover:bg-zinc-850 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handlePromoSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nombre Campaña Promocional:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Inka Fest Cyber"
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-bold"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Descripción o Eslogan Promocional:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Rebajas globales del 30% directas en el portal..."
                  value={promoDesc}
                  onChange={(e) => setPromoDesc(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1 font-mono text-[10px]">Tasa Descuento (%) :</label>
                  <input
                    type="number"
                    required
                    value={promoDiscount}
                    onChange={(e) => setPromoDiscount(e.target.value)}
                    className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Estado Operativo:</label>
                  <select
                    value={promoStatus}
                    onChange={(e) => setPromoStatus(e.target.value as any)}
                    className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                  >
                    <option value="ACTIVO">ACTIVO (En marquesina superior)</option>
                    <option value="INACTIVO">DESACTIVADO</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setIsPromoOpen(false)} className="px-3 py-1.5 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white font-bold rounded">Guardar Campaña</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
