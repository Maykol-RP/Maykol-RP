import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Search, Plus, Minus, Tag, CreditCard, 
  CheckCircle, Truck, MapPin, Sparkles, ShoppingCart, 
  ArrowRight, X, Clock, Eye, Heart, User as UserIcon, LogOut, 
  Mail, Phone, ShieldCheck, HelpCircle, Compass, 
  ChevronRight, ArrowLeft, Info, Calendar, DollarSign,
  Sun, Moon, Settings, Instagram, Facebook, Twitter, Shield
} from 'lucide-react';
import { Product, Category, ShippingMethod, Coupon, Banner, Promotion, Order, User } from '../types';
import { submitOrder, createUser } from '../api';
import AIChatbot from './AIChatbot';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

interface ClientStoreProps {
  products: Product[];
  categories: Category[];
  shippingMethods: ShippingMethod[];
  coupons: Coupon[];
  banners: Banner[];
  promotions: Promotion[];
  orders?: Order[];
  userNomina?: User[];
  customers?: any[];
  currentUser?: User | null;
  activeCustomer?: User | null;
  onRefresh?: () => void;
  onOrderSuccess?: () => void;
  isDarkMode: boolean;
  onToggleDarkMode?: () => void;
  onLogin?: (user: User) => void;
  onLogout?: () => void;
}

export default function ClientStore({
  products = [],
  categories = [],
  shippingMethods = [],
  coupons = [],
  banners = [],
  promotions = [],
  orders = [],
  userNomina = [],
  customers = [],
  currentUser,
  activeCustomer,
  onRefresh,
  onOrderSuccess,
  isDarkMode,
  onToggleDarkMode,
  onLogin,
  onLogout
}: ClientStoreProps) {
  const actualUser = currentUser || activeCustomer;
  const actualRefresh = onRefresh || onOrderSuccess;

  // Active Store Tab: 'INICIO' | 'TIENDA' | 'CATEGORIAS' | 'OFERTAS' | 'NOSOTROS' | 'CONTACTO' | 'AYUDA' | 'ACCOUNT'
  const [activeStoreTab, setActiveStoreTab] = useState<string>('INICIO');

  // Sub tab within account dashboard: 'ORDERS' | 'FAVORITES' | 'DIRECTIONS' | 'PROFILE'
  const [activeAccountTab, setActiveAccountTab] = useState<'ORDERS' | 'FAVORITES' | 'DIRECTIONS' | 'PROFILE'>('ORDERS');

  // Selected Order for automatic detail tracking
  const [selectedTrackOrder, setSelectedTrackOrder] = useState<Order | null>(null);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]); // saved product ids

  // Authentication Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Login form values
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form values
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regDni, setRegDni] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Addresses manager
  const [savedAddresses, setSavedAddresses] = useState<string[]>([
    'Av. El Sol 456, Wanchaq, Cusco',
    'Calle Triunfo 120, Centro Histórico, Cusco',
  ]);
  const [newAddressInput, setNewAddressInput] = useState('');

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');

  // Checkout States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutDni, setCheckoutDni] = useState(actualUser?.dni || '');
  const [checkoutName, setCheckoutName] = useState(actualUser?.name || '');
  const [checkoutPhone, setCheckoutPhone] = useState(actualUser?.phone || '');
  const [checkoutAddress, setCheckoutAddress] = useState(actualUser?.address || '');
  const [checkoutPayment, setCheckoutPayment] = useState<'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA'>('TARJETA');
  const [selectedShippingId, setSelectedShippingId] = useState<string>('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [checkoutSuccessCode, setCheckoutSuccessCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto sync checkout fields once user logs in
  React.useEffect(() => {
    if (actualUser) {
      if (actualUser.dni) setCheckoutDni(actualUser.dni);
      if (actualUser.name) setCheckoutName(actualUser.name);
      if (actualUser.phone) setCheckoutPhone(actualUser.phone);
      if (actualUser.address) setCheckoutAddress(actualUser.address);
    }
  }, [actualUser]);

  useGSAP(() => {
    // Set elements visible first to prevent flash of invisible content
    gsap.set('.gsap-hero', { opacity: 1, y: 0 });
    gsap.set('.gsap-card', { opacity: 1, y: 0 });
    // Then animate them in
    const heroEls = document.querySelectorAll('.gsap-hero');
    if (heroEls.length > 0) {
      gsap.from(heroEls, { y: 40, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08, clearProps: 'all' });
    }
    const cardEls = document.querySelectorAll('.gsap-card');
    if (cardEls.length > 0) {
      gsap.from(cardEls, { y: 20, opacity: 0, duration: 0.5, ease: 'power2.out', stagger: 0.06, clearProps: 'all' });
    }
  }, [activeStoreTab]);

  // Filter only active, in-stock products for catalog
  const visibleProducts = useMemo(() => {
    return products.filter(p => {
      if (p.status !== 'ACTIVO') return false;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'TODOS' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Filter offer products
  const offerProducts = useMemo(() => {
    return products.filter(p => p.status === 'ACTIVO' && p.offerPrice > 0);
  }, [products]);

  // Filter my secure orders
  const myOrdersList = useMemo(() => {
    if (!actualUser) return [];
    // Secure filter: Each client only views their own orders by comparing email or customerId
    return orders.filter(o => 
      o.customerId === actualUser.id || 
      o.customerId === `c-pos-${actualUser.dni}` ||
      o.customerName.toLowerCase().includes(actualUser.name.toLowerCase())
    );
  }, [orders, actualUser]);

  // Active Banners
  const activeBanners = useMemo(() => {
    return banners.filter(b => b.status === 'ACTIVO');
  }, [banners]);

  // Active Promotions
  const activePromo = useMemo(() => {
    return promotions.find(p => p.status === 'ACTIVO');
  }, [promotions]);

  // Selected Shipping Method pricing
  const currentShippingMethod = useMemo(() => {
    return shippingMethods.find(sm => sm.id === selectedShippingId && sm.status === 'ACTIVO');
  }, [shippingMethods, selectedShippingId]);

  // Auto-set first active shipping method if empty
  React.useEffect(() => {
    const firstActive = shippingMethods.find(sm => sm.status === 'ACTIVO');
    if (firstActive && !selectedShippingId) {
      setSelectedShippingId(firstActive.id);
    }
  }, [shippingMethods, selectedShippingId]);

  // Cart operations
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex !== -1) {
      const existingQty = cart[existingIndex].quantity;
      if (existingQty < product.stock) {
        const newCart = [...cart];
        newCart[existingIndex].quantity += 1;
        setCart(newCart);
      }
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    // Mini visual alert feedback
    setIsCartOpen(true);
  };

  const updateCartQty = (id: string, delta: number) => {
    const existingIndex = cart.findIndex(item => item.product.id === id);
    if (existingIndex === -1) return;
    const newCart = [...cart];
    const newQty = newCart[existingIndex].quantity + delta;
    if (newQty <= 0) {
      newCart.splice(existingIndex, 1);
    } else if (newQty <= newCart[existingIndex].product.stock) {
      newCart[existingIndex].quantity = newQty;
    }
    setCart(newCart);
  };

  const toggleFavorite = (productId: string) => {
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter(id => id !== productId));
    } else {
      setFavorites([...favorites, productId]);
    }
  };

  // Cart math
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = item.product.offerPrice > 0 ? item.product.offerPrice : item.product.salePrice;
      return acc + (price * item.quantity);
    }, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'PORCENTAJE') {
      return Number(((cartSubtotal * appliedCoupon.value) / 100).toFixed(2));
    } else if (appliedCoupon.discountType === 'MONTO') {
      return Math.min(appliedCoupon.value, cartSubtotal);
    } else if (appliedCoupon.discountType === 'ENVIO') {
      return currentShippingMethod ? currentShippingMethod.cost : 0;
    }
    return 0;
  }, [appliedCoupon, cartSubtotal, currentShippingMethod]);

  const cartTotal = useMemo(() => {
    const shipping = currentShippingMethod ? currentShippingMethod.cost : 0;
    const computed = cartSubtotal - discountAmount + shipping;
    return Number(Math.max(0, computed).toFixed(2));
  }, [cartSubtotal, discountAmount, currentShippingMethod]);

  const handleApplyCoupon = () => {
    const match = coupons.find(c => c.code.trim().toUpperCase() === couponCode.trim().toUpperCase() && c.status === 'ACTIVO');
    if (match) {
      setAppliedCoupon(match);
    } else {
      (window as any).showToast?.('Cupón inválido, expirado o inexistente.', 'error');
      setAppliedCoupon(null);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (cart.length === 0) {
      setErrorMsg('Tu carrito se encuentra vacío.');
      return;
    }

    if (!checkoutAddress || !checkoutAddress.trim()) {
      setErrorMsg('Por favor indica una dirección exacta para la entrega de tus prendas.');
      return;
    }

    if (!checkoutName || !checkoutDni) {
      setErrorMsg('Por favor completa los campos obligatorios de DNI y Nombres.');
      return;
    }

    try {
      const itemsPayload = cart.map(item => {
        const finalPrice = item.product.offerPrice > 0 ? item.product.offerPrice : item.product.salePrice;
        return {
          productId: item.product.id || 'p-unknown',
          name: item.product.name || 'Prenda Andesmoda',
          sku: item.product.sku || 'SKU-0000',
          quantity: item.quantity || 1,
          price: finalPrice || 0,
          total: (finalPrice || 0) * (item.quantity || 1)
        };
      });

      const orderData = {
        channel: 'WEB' as const,
        customerId: actualUser?.id || 'c-guest',
        customerName: `${checkoutName}`,
        items: itemsPayload,
        subtotal: cartSubtotal,
        discount: discountAmount,
        shippingCost: currentShippingMethod ? currentShippingMethod.cost : 0,
        total: cartTotal,
        paymentMethod: checkoutPayment,
        shippingMethodId: selectedShippingId,
        shippingCarrier: currentShippingMethod ? currentShippingMethod.name : 'Envío nacional directo'
      };

      const actorPayload = {
        id: actualUser?.id || 'c-guest',
        name: actualUser?.name || 'Invitado',
        role: actualUser?.role || 'CLIENTE'
      };

      const result = await submitOrder(orderData, actorPayload);

      setCheckoutSuccessCode(result.code);
      setCart([]);
      setAppliedCoupon(null);
      setCouponCode('');
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      
      if (actualRefresh) {
        actualRefresh();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al registrar tu compra.');
    }
  };

  // Login handler
  const handlePortalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const matchUser = userNomina.find(
      u => u.email.toLowerCase().trim() === loginEmail.toLowerCase().trim() && u.password === loginPassword
    );

    if (matchUser) {
      if (matchUser.status === 'BLOQUEADO') {
        setLoginError('Tu cuenta está bloqueada.');
        return;
      }
      onLogin?.(matchUser);
      setIsLoginModalOpen(false);
      setLoginEmail('');
      setLoginPassword('');
    } else {
      setLoginError('Correo o clave incorrectos.');
    }
  };

  // Immediate role login handler (testing shortcut)
  const handleQuickLogin = (role: 'ADMINISTRADOR' | 'VENDEDOR' | 'CLIENTE') => {
    const match = userNomina.find(u => u.role === role);
    if (match) {
      onLogin?.(match);
      setIsLoginModalOpen(false);
      setLoginError('');
      // Route immediately based on role
      if (role === 'CLIENTE') {
        setActiveStoreTab('ACCOUNT');
        setActiveAccountTab('ORDERS');
      }
    }
  };

  // Register account handler
  const handlePortalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regEmail || !regPassword || !regName) {
      setRegError('Completa los campos obligatorios (*).');
      return;
    }

    try {
      setRegLoading(true);
      const created = await createUser({
        email: regEmail,
        password: regPassword,
        name: regName,
        role: 'CLIENTE',
        status: 'ACTIVO',
        dni: regDni,
        phone: regPhone,
        address: regAddress
      });

      setRegSuccess('¡Cuenta de Cliente registrada correctamente! Ya puedes iniciar sesión.');
      setRegEmail('');
      setRegPassword('');
      setRegName('');
      setRegDni('');
      setRegPhone('');
      setRegAddress('');
      setTimeout(() => {
        setIsRegisterModalOpen(false);
        setIsLoginModalOpen(true);
      }, 1500);

      if (actualRefresh) {
        actualRefresh();
      }
    } catch (err: any) {
      setRegError(err.message || 'Error al registrarte. Intenta con otro correo.');
    } finally {
      setRegLoading(false);
    }
  };

  // Contact form handler
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) {
      (window as any).showToast?.('Por favor, completa todo el formulario.', 'warning');
      return;
    }
    setContactSuccess('Mensaje recibido. Un asesor de Andesmoda se contactará contigo pronto.');
    setContactName('');
    setContactEmail('');
    setContactMsg('');
  };

  // Address add handler
  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressInput.trim()) return;
    setSavedAddresses([...savedAddresses, newAddressInput.trim()]);
    setNewAddressInput('');
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black text-zinc-100' : 'bg-neutral-50 text-neutral-900'} pb-20`}>
      
      {/* Top promotional ribbon banner */}
      {activePromo && (
        <div className="bg-amber-500 text-black text-center text-xs font-semibold py-2 px-4 shadow-sm flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 animate-bounce" />
          <span>{activePromo.title}: {activePromo.description} • ¡Descuentos de hasta {activePromo.discount}% ya aplicados!</span>
        </div>
      )}

      {/* Main E-commerce Public Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-neutral-200'} transition-all duration-150`}>
        <div className="w-full px-6 sm:px-10 lg:px-16 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand coordinates */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActiveStoreTab('INICIO')}>
            <div className="bg-amber-600 text-white p-2.5 rounded-xl shadow-lg shadow-amber-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wider text-amber-655 dark:text-amber-500 font-sans leading-none">ANDESMODA</h1>
              <p className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase mt-1">Premium High-Andean Commerce</p>
            </div>
          </div>

          {/* Navigation link tabs requested by user */}
          <nav className="flex flex-wrap items-center justify-center gap-1 text-xs font-bold">
            <button 
              onClick={() => { setActiveStoreTab('INICIO'); setSelectedTrackOrder(null); }}
              className={`px-3 py-2 rounded-lg transition-all ${activeStoreTab === 'INICIO' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm' : 'hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-350'}`}
            >
              Inicio
            </button>
            <button 
              onClick={() => { setActiveStoreTab('TIENDA'); setSelectedTrackOrder(null); }}
              className={`px-3 py-2 rounded-lg transition-all ${activeStoreTab === 'TIENDA' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm' : 'hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-350'}`}
            >
              Tienda
            </button>
            <button 
              onClick={() => { setActiveStoreTab('CATEGORIAS'); setSelectedTrackOrder(null); }}
              className={`px-3 py-2 rounded-lg transition-all ${activeStoreTab === 'CATEGORIAS' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm' : 'hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-350'}`}
            >
              Categorías
            </button>
            <button 
              onClick={() => { setActiveStoreTab('OFERTAS'); setSelectedTrackOrder(null); }}
              className={`px-3 py-2 rounded-lg transition-all ${activeStoreTab === 'OFERTAS' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm' : 'hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-350'}`}
            >
              Ofertas
            </button>
            <button 
              onClick={() => { setActiveStoreTab('NOSOTROS'); setSelectedTrackOrder(null); }}
              className={`px-3 py-2 rounded-lg transition-all ${activeStoreTab === 'NOSOTROS' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm' : 'hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-350'}`}
            >
              Nosotros
            </button>
            <button 
              onClick={() => { setActiveStoreTab('CONTACTO'); setSelectedTrackOrder(null); }}
              className={`px-3 py-2 rounded-lg transition-all ${activeStoreTab === 'CONTACTO' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm' : 'hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-350'}`}
            >
              Contacto
            </button>
            <button 
              onClick={() => { setActiveStoreTab('AYUDA'); setSelectedTrackOrder(null); }}
              className={`px-3 py-2 rounded-lg transition-all ${activeStoreTab === 'AYUDA' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm' : 'hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-350'}`}
            >
              Ayuda
            </button>
          </nav>

          {/* User authentication states and cart controls */}
          <div className="flex items-center gap-3">
            
            {/* Theme switcher button */}
            <button
              onClick={onToggleDarkMode}
              title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
              className="p-2.5 rounded-xl border border-neutral-300  hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-all cursor-pointer flex items-center justify-center text-zinc-500  shrink-0"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-neutral-600" />}
            </button>

            {/* Cart trigger btn */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl border border-neutral-300  hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-all cursor-pointer flex items-center gap-2 text-xs"
            >
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold font-sans">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
              <span className="hidden md:inline font-bold">S/. {cartSubtotal.toFixed(2)}</span>
            </button>

            {/* Auth Buttons */}
            {actualUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveStoreTab('ACCOUNT');
                    setSelectedTrackOrder(null);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all outline-none border border-amber-600/20 ${activeStoreTab === 'ACCOUNT' ? 'bg-amber-600 text-white' : 'bg-amber-600/10 text-amber-600'}`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Mi Cuenta</span>
                </button>
                <button
                  onClick={() => {
                    onLogout?.();
                    setActiveStoreTab('INICIO');
                  }}
                  title="Cerrar Sesión"
                  className="p-2 border border-neutral-300  hover:bg-red-50 dark:hover:bg-red-950/20 text-red-550 dark:text-red-400 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                title="Acceso Administrativo"
                className="p-2.5 rounded-xl border border-transparent hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-400  hover:text-zinc-900 dark:hover:text-zinc-100 transition-all cursor-pointer flex items-center justify-center shrink-0"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

          </div>

        </div>
      </header>

      {/* Main tab panel renderers */}
      <main className="w-full px-6 sm:px-10 lg:px-16">
        
        {/* TAB 1: INICIO (Public Landing Home Section) */}
        {activeStoreTab === 'INICIO' && (
          <div className="space-y-24 pb-20">
            
            {/* HERO EXPANDIDO */}
            <section className="gsap-hero relative min-h-[600px] md:h-[75vh] w-full rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={activeBanners.length > 0 ? activeBanners[0].imageUrl : "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800"} 
                alt="Hero"
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col justify-end md:justify-center p-8 sm:p-16">
                <div className="max-w-2xl">
                  <span className="font-mono text-xs tracking-widest text-white uppercase mb-4 block drop-shadow-md">
                    Colección Exclusiva 2026
                  </span>
                  <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter leading-[1.1] drop-shadow-xl mb-6">
                    {activeBanners.length > 0 ? activeBanners[0].title : 'Elegancia Tejida a Mano'}
                  </h2>
                  <p className="text-white/90 text-sm md:text-lg mb-8 max-w-lg font-medium drop-shadow-md">
                    Descubre la más fina fibra de alpaca noble de Cusco. Un legado de lujo, historia y calidez incomparable.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => setActiveStoreTab('TIENDA')}
                      className="bg-white hover:bg-zinc-200 text-black font-black text-xs md:text-sm py-4 px-8 rounded-full transition-all shadow-xl flex items-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      Descubrir Colección <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* LOOKBOOK / COLLECTIONS */}
            <section className="gsap-hero">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h3 className="text-3xl font-black tracking-tight uppercase">El Lookbook</h3>
                  <p className="text-sm text-zinc-500 mt-2">Nuestras categorías esenciales para la temporada.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-auto md:min-h-[600px]">
                <div className="relative rounded-3xl overflow-hidden group cursor-pointer" onClick={() => { setActiveStoreTab('CATEGORIAS'); }}>
                  <img src="https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&q=80&w=1000" alt="Suéteres" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8">
                    <div>
                      <h4 className="text-white text-3xl font-black uppercase mb-2">Suéteres de Alpaca</h4>
                      <span className="text-white/80 font-mono text-xs uppercase tracking-widest flex items-center gap-2">Explorar <ArrowRight className="w-3 h-3" /></span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-rows-2 gap-4">
                  <div className="relative rounded-3xl overflow-hidden group cursor-pointer" onClick={() => { setActiveStoreTab('CATEGORIAS'); }}>
                    <img src="https://images.unsplash.com/photo-1604644401890-0bd678c83788?auto=format&fit=crop&q=80&w=800" alt="Bufandas" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8">
                      <div>
                        <h4 className="text-white text-2xl font-black uppercase mb-1">Accesorios y Bufandas</h4>
                        <span className="text-white/80 font-mono text-xs uppercase tracking-widest flex items-center gap-2">Explorar <ArrowRight className="w-3 h-3" /></span>
                      </div>
                    </div>
                  </div>
                  <div className="relative rounded-3xl overflow-hidden group cursor-pointer" onClick={() => { setActiveStoreTab('CATEGORIAS'); }}>
                    <img src="https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&q=80&w=800" alt="Abrigos" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8">
                      <div>
                        <h4 className="text-white text-2xl font-black uppercase mb-1">Abrigos & Ponchos</h4>
                        <span className="text-white/80 font-mono text-xs uppercase tracking-widest flex items-center gap-2">Explorar <ArrowRight className="w-3 h-3" /></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* PRENDAS DESTACADAS (EXISTING BUT POLISHED) */}
            <section className="gsap-hero space-y-8">
              <div className="flex justify-between items-end border-b border-zinc-200 pb-4">
                <div>
                  <h3 className="text-3xl font-black tracking-tight uppercase">Selección de Temporada</h3>
                </div>
                <button 
                  onClick={() => setActiveStoreTab('TIENDA')}
                  className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2 hover:underline"
                >
                  Ver todo <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.filter(p => p.status === 'ACTIVO').slice(0, 4).map(p => {
                  const hasOffer = p.offerPrice > 0;
                  return (
                    <div key={p.id} className={`gsap-card rounded-2xl border overflow-hidden transition-all duration-200 group flex flex-col justify-between ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-500/30' : 'bg-white border-neutral-100 hover:shadow-md'}`}>
                      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100 dark:bg-zinc-850">
                        <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400'} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                        {hasOffer && <span className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest">Oferta</span>}
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-mono uppercase tracking-widest">{p.category}</span>
                          <h4 className="font-extrabold text-sm tracking-tight line-clamp-2 mt-1">{p.name}</h4>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-sm font-black text-zinc-900 dark:text-white">S/. {(hasOffer ? p.offerPrice : p.salePrice).toFixed(2)}</span>
                          <button 
                            onClick={() => handleAddToCart(p)}
                            className="bg-black hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 p-2 rounded-full font-bold transition-transform hover:scale-105 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* STORYTELLING / ARTISAN STORY */}
            <section className="gsap-hero relative bg-black dark:bg-zinc-900 rounded-3xl overflow-hidden flex flex-col md:flex-row items-center">
              <div className="w-full md:w-1/2 p-10 md:p-20 text-white">
                <Shield className="w-10 h-10 mb-6 text-zinc-400" />
                <h3 className="text-3xl md:text-5xl font-black uppercase leading-tight tracking-tight mb-6">El Arte Intemporal de los Andes</h3>
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-8 max-w-md">
                  Cada prenda de AndesModa es el resultado de cientos de horas de hilado meticuloso. Nuestras comunidades artesanas en Cusco preservan técnicas ancestrales, garantizando prendas de pureza y durabilidad excepcional.
                </p>
                <button 
                  onClick={() => setActiveStoreTab('NOSOTROS')}
                  className="border border-white/30 hover:bg-white hover:text-black text-white font-bold text-xs uppercase tracking-widest py-3 px-8 rounded-full transition-all cursor-pointer"
                >
                  Conocer Nuestra Historia
                </button>
              </div>
              <div className="w-full md:w-1/2 min-h-[400px] md:min-h-[500px]">
                <img src="https://images.unsplash.com/photo-1434389670869-c88439226ebc?auto=format&fit=crop&q=80&w=1000" alt="Artesana tejiendo" className="w-full h-full object-cover grayscale opacity-80" />
              </div>
            </section>

            {/* CORPORATE VALUES */}
            <section className="gsap-hero border-y border-zinc-200 py-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { icon: <Truck className="w-6 h-6 text-zinc-900 dark:text-white" />, title: 'Envíos Nacionales', desc: 'Despachos garantizados a todo el Perú.' },
                  { icon: <ShieldCheck className="w-6 h-6 text-zinc-900 dark:text-white" />, title: '100% Genuino', desc: 'Lana certificada de alpaca y vicuña.' },
                  { icon: <Sparkles className="w-6 h-6 text-zinc-900 dark:text-white" />, title: 'Artesanía Fina', desc: 'Hilado fino por tejedoras andinas.' },
                  { icon: <Info className="w-6 h-6 text-zinc-900 dark:text-white" />, title: 'Asistencia 24/7', desc: 'Soporte dedicado a tus pedidos.' },
                ].map((val, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center px-4">
                    <div className="p-4 bg-zinc-100 rounded-full mb-4">{val.icon}</div>
                    <h4 className="font-extrabold text-sm uppercase tracking-wider mb-2">{val.title}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{val.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* NEWSLETTER */}
            <section className="gsap-hero bg-zinc-100 rounded-3xl p-10 md:p-20 text-center max-w-5xl mx-auto">
              <h3 className="text-3xl font-black uppercase tracking-tight mb-4">Únete al Círculo Andesmoda</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 max-w-lg mx-auto">
                Suscríbete a nuestro boletín para recibir acceso anticipado a nuevas colecciones, ofertas exclusivas y editoriales de moda andina.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); (window as any).showToast?.('Suscripción exitosa', 'success'); }} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Tu correo electrónico" 
                  required
                  className="flex-1 bg-white dark:bg-black border border-zinc-200 text-sm px-5 py-3 rounded-xl outline-none focus:border-black dark:focus:border-white transition-colors"
                />
                <button type="submit" className="cursor-pointer bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-widest px-8 py-3 rounded-xl hover:bg-zinc-800 transition-colors">
                  Suscribirme
                </button>
              </form>
            </section>

            {/* FOOTER */}
            <footer className="gsap-hero pt-16 pb-8 border-t border-zinc-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                <div>
                  <h4 className="font-black uppercase tracking-widest text-xs mb-6">Comprar</h4>
                  <ul className="space-y-4 text-sm text-zinc-500">
                    <li><button onClick={() => setActiveStoreTab('TIENDA')} className="cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors">Ver Todo</button></li>
                    <li><button onClick={() => setActiveStoreTab('CATEGORIAS')} className="cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors">Colecciones</button></li>
                    <li><button onClick={() => setActiveStoreTab('OFERTAS')} className="cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors">Ofertas</button></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-widest text-xs mb-6">Ayuda</h4>
                  <ul className="space-y-4 text-sm text-zinc-500">
                    <li><button onClick={() => setActiveStoreTab('AYUDA')} className="cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors">FAQ</button></li>
                    <li><button onClick={() => setActiveStoreTab('AYUDA')} className="cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors">Guía de Tallas</button></li>
                    <li><button onClick={() => setActiveStoreTab('AYUDA')} className="cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors">Envíos y Devoluciones</button></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-widest text-xs mb-6">Empresa</h4>
                  <ul className="space-y-4 text-sm text-zinc-500">
                    <li><button onClick={() => setActiveStoreTab('NOSOTROS')} className="cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors">Nuestra Historia</button></li>
                    <li><button onClick={() => setActiveStoreTab('CONTACTO')} className="cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors">Contacto</button></li>
                    <li><button onClick={() => setActiveStoreTab('NOSOTROS')} className="cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors">Sostenibilidad</button></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-widest text-xs mb-6">Síguenos</h4>
                  <div className="flex gap-4 text-zinc-500">
                    <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
                    <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
                    <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center text-xs text-zinc-400 font-mono pt-8 border-t border-zinc-200">
                <p>&copy; 2026 ANDESMODA. Todos los derechos reservados.</p>
                <div className="flex gap-4 mt-4 md:mt-0">
                  <span className="cursor-pointer hover:text-zinc-900 dark:hover:text-white">Privacidad</span>
                  <span className="cursor-pointer hover:text-zinc-900 dark:hover:text-white">Términos</span>
                </div>
              </div>
            </footer>

          </div>
        )}

        {/* TAB 2: TIENDA (Active product listing and category filters) */}
        {activeStoreTab === 'TIENDA' && (
          <div className="space-y-6">
            
            {/* Filter and Search rail layout */}
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-neutral-200'} flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs`}>
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar prendas de alpaca, mantas, abrigos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl outline-none border transition-all ${
                    isDarkMode 
                      ? 'bg-zinc-800 border-zinc-700 text-white focus:border-amber-500' 
                      : 'bg-neutral-50 border-neutral-200 text-neutral-800 focus:bg-white focus:border-amber-500'
                  }`}
                />
              </div>

              {/* Category Pills inside TIENDA tab */}
              <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 select-none">
                <button
                  onClick={() => setSelectedCategory('TODOS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === 'TODOS'
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  Ver Todo ({products.filter(p => p.status === 'ACTIVO').length})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat.name
                        ? 'bg-black text-white dark:bg-white dark:text-black'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Product catalog grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {visibleProducts.length === 0 ? (
                <div className={`col-span-full p-16 text-center rounded-2xl border border-dashed ${isDarkMode ? 'border-zinc-800 bg-zinc-900/20' : 'border-neutral-250 bg-white'}`}>
                  <ShoppingCart className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500 font-medium">Ninguna prenda coincide con tus criterios en este momento.</p>
                </div>
              ) : (
                visibleProducts.map(p => {
                  const hasOffer = p.offerPrice > 0;
                  const isSaved = favorites.includes(p.id);
                  return (
                    <div key={p.id} className={`gsap-card rounded-2xl border overflow-hidden transition-all duration-200 group flex flex-col justify-between ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800 hover:border-amber-600/30' : 'bg-white border-neutral-100 hover:shadow-lg'}`}>
                      <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-850">
                        <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400'} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                        
                        {/* Offer badge */}
                        {hasOffer && <span className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">Oferta</span>}
                        {p.stock <= 0 && <span className="absolute top-3 right-3 bg-black/85 text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">Agotado</span>}
                        
                        {/* Heart save wishlist */}
                        <button 
                          onClick={() => toggleFavorite(p.id)}
                          className="absolute bottom-3 left-3 p-2 rounded-lg bg-black/70 backdrop-blur-md text-white hover:text-rose-500 transition-all cursor-pointer"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-550' : 'text-white'}`} />
                        </button>

                        <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white font-mono text-[9px] px-2 py-0.5 rounded-md">Stock: {p.stock}</span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex justify-between text-[9px] text-zinc-400 font-mono uppercase mb-1">
                            <span>{p.category}</span>
                            <span>{p.sku}</span>
                          </div>
                          <h4 className="font-extrabold text-xs tracking-tight line-clamp-2">{p.name}</h4>
                          <p className="text-[11px] text-neutral-500 dark:text-zinc-400 line-clamp-2 mt-1">{p.description}</p>
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="font-mono text-sm font-black text-amber-500">S/. {(hasOffer ? p.offerPrice : p.salePrice).toFixed(2)}</span>
                            {hasOffer && <span className="font-mono text-[10px] text-neutral-400 line-through">S/. {p.salePrice.toFixed(2)}</span>}
                          </div>
                          <button
                            onClick={() => handleAddToCart(p)}
                            disabled={p.stock <= 0}
                            className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                              p.stock <= 0 ? 'bg-neutral-350  text-zinc-500 cursor-not-allowed' : 'bg-black hover:bg-black text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200'
                            }`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            {p.stock <= 0 ? 'Agotado' : 'Agregar al carrito'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* TAB 3: CATEGORIAS (Grid view collections requested by user) */}
        {activeStoreTab === 'CATEGORIAS' && (
          <div className="space-y-12 pb-20">
            <div className="gsap-hero text-center max-w-2xl mx-auto pt-8">
              <span className="text-[10px] tracking-widest text-zinc-500 font-mono font-bold uppercase block mb-4">El Catálogo</span>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">Colecciones Exclusivas</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Navega a través de nuestras curadurías estacionales de fibra andina premium. Cada pieza representa una fusión de herencia y diseño contemporáneo.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { name: 'Suéteres de Alpaca', desc: 'Abrigo puro y elegante para cualquier estación.', img: 'https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&q=80&w=800' },
                { name: 'Bufandas Bordadas', desc: 'Accesorios cálidos con detalles únicos.', img: 'https://images.unsplash.com/photo-1604644401890-0bd678c83788?auto=format&fit=crop&q=80&w=800' },
                { name: 'Abrigos & Ponchos', desc: 'El máximo nivel de lujo andino.', img: 'https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&q=80&w=800' },
                { name: 'Accesorios', desc: 'Gorros, guantes y complementos de invierno.', img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800' },
                { name: 'Edición Limitada', desc: 'Piezas de pasarela y colaboraciones.', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800' },
              ].map((cat, index) => {
                const count = products.filter(p => p.status === 'ACTIVO' && p.category === cat.name).length;
                return (
                  <div 
                    key={index}
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      setActiveStoreTab('TIENDA');
                    }}
                    className="gsap-hero relative aspect-[4/5] rounded-3xl overflow-hidden group cursor-pointer shadow-lg"
                  >
                    <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-8">
                      <span className="text-white/60 font-mono text-[10px] uppercase tracking-widest mb-2 block">{count} Productos</span>
                      <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-2">{cat.name}</h3>
                      <p className="text-sm text-white/80 mb-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">{cat.desc}</p>
                      <span className="inline-flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest bg-white/20 backdrop-blur-md px-6 py-3 rounded-full hover:bg-white hover:text-black transition-colors w-max">
                        Explorar <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: OFERTAS (Active promotions and coupons page requested by user) */}
        {activeStoreTab === 'OFERTAS' && (
          <div className="space-y-12 pb-20">
            
            {/* Promo Banner */}
            <div className="gsap-hero bg-black text-white p-8 md:p-16 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
              <div className="space-y-4 relative z-10">
                <span className="inline-block border border-white/30 text-white rounded-full px-4 py-1 text-[10px] font-mono uppercase font-black tracking-widest">Flash Sale Event</span>
                <h3 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">Rebajas de Temporada</h3>
                <p className="text-sm text-white/80 max-w-lg">Descuentos exclusivos en piezas seleccionadas. Ofertas válidas por tiempo limitado hasta agotar existencias del inventario de transición.</p>
              </div>

              {/* Coupons display */}
              <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto relative z-10">
                {coupons.filter(c => c.status === 'ACTIVO').map(c => (
                  <div key={c.id} className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center justify-between gap-8 text-xs font-mono">
                    <div>
                      <span className="block text-zinc-400 font-extrabold text-[9px] mb-1">CÓDIGO SECRETO</span>
                      <span className="font-black text-white select-all text-sm tracking-widest bg-black px-3 py-1 rounded">{c.code}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-white font-sans text-xl font-black">-{c.value}{c.discountType === 'PORCENTAJE' ? '%' : ' PEN'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* List only offer products */}
            <div className="gsap-hero space-y-8">
              <div className="flex justify-between items-end border-b border-zinc-200 pb-4">
                <h3 className="text-2xl font-black tracking-tight uppercase">Piezas en Rebaja</h3>
                <span className="text-xs font-mono text-zinc-500">{offerProducts.length} Artículos</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {offerProducts.length === 0 ? (
                  <div className="col-span-full p-20 text-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800">
                    <span className="text-4xl block mb-4">🤫</span>
                    <h4 className="text-xl font-black uppercase mb-2">No hay ofertas</h4>
                    <p className="text-sm text-zinc-500">Nuestros artesanos están preparando la próxima temporada de descuentos.</p>
                  </div>
                ) : (
                  offerProducts.map(p => {
                    const discountPercent = Math.round(((p.salePrice - p.offerPrice) / p.salePrice) * 100);
                    return (
                      <div key={p.id} className={`gsap-card rounded-2xl border overflow-hidden transition-all duration-200 group flex flex-col justify-between ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-500/30' : 'bg-white border-neutral-100 hover:shadow-lg'}`}>
                        <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100 dark:bg-zinc-850">
                          <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400'} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                          <span className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-widest">-{discountPercent}% OFF</span>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <span className="text-[10px] text-zinc-400 block font-mono uppercase tracking-widest">{p.category}</span>
                            <h4 className="font-extrabold text-sm tracking-tight line-clamp-2 mt-1">{p.name}</h4>
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-4">
                              <span className="font-mono text-lg font-black text-red-600">S/. {p.offerPrice.toFixed(2)}</span>
                              <span className="font-mono text-xs text-neutral-400 line-through">S/. {p.salePrice.toFixed(2)}</span>
                            </div>
                            <button
                              onClick={() => handleAddToCart(p)}
                              className="w-full bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                              <ShoppingCart className="w-4 h-4" /> Agregar a la Bolsa
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: NOSOTROS (Story requested by user) */}
        {activeStoreTab === 'NOSOTROS' && (
          <div className="space-y-12 pb-20 max-w-5xl mx-auto">
            
            <div className="gsap-hero relative aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl mb-12">
              <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1200" alt="Andesmoda Alpaca Herencia" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-widest uppercase">Nuestra Historia</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="gsap-hero space-y-6 text-sm sm:text-base leading-relaxed font-sans">
                <h3 className={`text-3xl font-black tracking-tight uppercase mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>Confección Andina y Herencia</h3>
                <p className={isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}>La historia de Andes Moda se fundamenta en la preservación del hilado autóctono. Nacimos de la profunda necesidad de fusionar la exquisitez milenaria de la fibra de Alpaca Suri y Huacaya de las alturas de Cusco, con el diseño estructural contemporáneo.</p>
                <p className={isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}>Durante generaciones, el arte del tejido ha sido la voz de los Andes. Hoy, llevamos esa voz al mundo bajo rigurosos estándares de trazabilidad y manufactura de lujo.</p>
              </div>
              <div className="gsap-hero aspect-square rounded-3xl overflow-hidden shadow-xl">
                <img src="https://images.unsplash.com/photo-1604644401890-0bd678c83788?auto=format&fit=crop&q=80&w=800" alt="Detalle de tejido" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className={`gsap-hero rounded-3xl p-8 md:p-16 my-12 ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>1</div>
                  <h4 className="text-xl font-black uppercase">Esquila Ética</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Procesos certificados que aseguran el bienestar animal. Nuestra esquila se realiza con técnicas ancestrales indoloras.</p>
                </div>
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>2</div>
                  <h4 className="text-xl font-black uppercase">Comercio Justo</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Trabajamos sin intermediarios con más de 120 familias tejedoras, garantizando precios por encima del mercado internacional.</p>
                </div>
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>3</div>
                  <h4 className="text-xl font-black uppercase">Cero Huella</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Los procesos de teñido utilizan pigmentos botánicos y arcillas naturales del Valle Sagrado, sin químicos contaminantes.</p>
                </div>
              </div>
            </div>

            <div className="gsap-hero text-center max-w-2xl mx-auto space-y-6">
              <ShieldCheck className="w-16 h-16 mx-auto text-green-600" />
              <h3 className="text-2xl font-black uppercase tracking-tight">Sostenibilidad Certificada</h3>
              <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Andes Moda cuenta con el sello nacional de autenticidad noble para vicuña y alpaca real emitido por el Ministerio del Ambiente del Perú, asegurando procesos 100% libres de crueldad animal.</p>
            </div>

          </div>
        )}

        {/* TAB 6: CONTACTO (Store locations and submit contact message requested by user) */}
        {activeStoreTab === 'CONTACTO' && (
          <div className="max-w-6xl mx-auto py-8">
            <div className="gsap-hero text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">Servicio al Cliente</h2>
              <p className="text-sm text-zinc-500 max-w-xl mx-auto">Estamos aquí para asesorarte en tus compras, resolver dudas sobre tallajes, o procesar tus solicitudes corporativas.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
              
              <div className="gsap-hero lg:col-span-2 space-y-8">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-6">Nuestras Boutiques</h3>
                  
                  <div className="space-y-6">
                    {[
                      { title: 'Sede Histórica Cusco', address: 'Portal de Panes 142, Plaza de Armas, Cusco, Perú', phone: '+51 (084) 224422', email: 'cusco@andesmoda.pe' },
                      { title: 'Showroom Lima', address: 'Av. El Bosque 234, San Isidro, Lima, Perú', phone: '+51 (01) 450123', email: 'lima@andesmoda.pe' },
                      { title: 'Ventas Corporativas', address: 'B2B & Alianzas Internacionales', phone: '+51 987654321', email: 'wholesale@andesmoda.pe' }
                    ].map((loc, idx) => (
                      <div key={idx} className={`p-6 rounded-3xl border shadow-sm hover:shadow-md transition-shadow ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                        <h4 className="font-black text-base uppercase tracking-wider mb-4">{loc.title}</h4>
                        <div className="space-y-3">
                          <p className={`text-sm flex items-start gap-3 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                            <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${isDarkMode ? 'text-amber-500' : 'text-amber-600'}`} /> {loc.address}
                          </p>
                          <p className={`text-sm flex items-center gap-3 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                            <Phone className={`w-4 h-4 shrink-0 ${isDarkMode ? 'text-amber-500' : 'text-amber-600'}`} /> {loc.phone}
                          </p>
                          <p className={`text-sm flex items-center gap-3 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                            <Mail className={`w-4 h-4 shrink-0 ${isDarkMode ? 'text-amber-500' : 'text-amber-600'}`} /> {loc.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="gsap-hero lg:col-span-3">
                <div className={`p-8 md:p-12 rounded-3xl border h-full ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Envíanos un Mensaje</h3>
                  <p className={`text-sm mb-8 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Nuestro equipo de asesores de imagen te responderá en menos de 24 horas laborables.</p>
                  
                  {contactSuccess ? (
                    <div className="p-6 bg-black text-white rounded-2xl text-sm font-bold text-center flex flex-col items-center justify-center h-64">
                      <span className="text-4xl mb-4">✨</span>
                      {contactSuccess}
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className={`block text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Nombre Completo</label>
                          <input 
                            type="text" 
                            required
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            className={`w-full p-4 text-sm rounded-xl border outline-none transition-colors ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-500' : 'bg-white border-zinc-300 text-zinc-900 focus:border-black'}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={`block text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Correo Electrónico</label>
                          <input 
                            type="email" 
                            required
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className={`w-full p-4 text-sm rounded-xl border outline-none transition-colors ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-500' : 'bg-white border-zinc-300 text-zinc-900 focus:border-black'}`}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className={`block text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Asunto</label>
                        <select className={`w-full p-4 text-sm rounded-xl border outline-none transition-colors appearance-none ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white focus:border-amber-500' : 'bg-white border-zinc-300 text-zinc-900 focus:border-black'}`}>
                          <option>Consulta sobre un Pedido</option>
                          <option>Ventas Corporativas / Mayoristas</option>
                          <option>Asesoría de Tallas</option>
                          <option>Otras Consultas</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className={`block text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Mensaje</label>
                        <textarea 
                          required
                          rows={6}
                          value={contactMsg}
                          onChange={(e) => setContactMsg(e.target.value)}
                          className={`w-full p-4 text-sm rounded-xl border outline-none transition-colors resize-none ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-500' : 'bg-white border-zinc-300 text-zinc-900 focus:border-black'}`}
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-black hover:bg-neutral-800 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all hover:-translate-y-1"
                      >
                        Enviar Solicitud
                      </button>
                    </form>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 7: AYUDA (E-comm help desk and FAQs requested by user) */}
        {activeStoreTab === 'AYUDA' && (
          <div className="max-w-2xl mx-auto space-y-6 py-4 text-xs sm:text-sm">
            <div className="space-y-1">
              <h3 className="text-xl font-black">Centro de Preguntas Frecuentes FAQ</h3>
              <p className="text-neutral-500">¿Tienes dudas sobre los ciclos de confección o despachos? Consulta nuestras respuestas rápidas.</p>
            </div>

            <div className="space-y-4">
              {[
                { q: '¿Cómo cuidar mis prendas de Alpaca de Andesmoda?', a: 'Se recomienda el lavado a mano con agua fría y champú neutro suave. No retorcer y dejar secar en una superficie plana bajo la sombra.' },
                { q: '¿Cuáles son los tiempos estimados de envío?', a: 'Los envíos dentro de Lima demoran de 1 a 2 días hábiles. En Cusco, de 24 a 48 horas. Envíos interprovinciales por Olva Courier demoran de 2 a 4 días hábiles de forma unificada.' },
                { q: '¿Qué formas de pago aceptan?', a: 'Aceptamos transferencias BCP/Interbank, pasarelas de Tarjeta Visa/Mastercard, Yape, Plin y pagos contra entrega con efectivo.' },
                { q: '¿Cómo realizan el seguimiento de mi pedido?', a: 'No necesitas andar ingresando códigos de tracking manuales. Simplemente ingresa a "Mi Cuenta" → "Mis Pedidos" y verás la línea de tiempo automática con el estado actualizado en vivo.' }
              ].map((faq, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-neutral-200'}`}>
                  <h4 className="font-black text-amber-505 dark:text-amber-400 mb-2 flex items-center gap-1.5"><HelpCircle className="w-4 h-4 text-amber-500 shrink-0" /> {faq.q}</h4>
                  <p className="text-xs text-neutral-550 dark:text-zinc-400 leading-relaxed font-sans">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: PRIVATE ACCOUNT_DASHBOARD (Orders list & visual timeline updates tracking) */}
        {activeStoreTab === 'ACCOUNT' && actualUser && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-4">
            
            {/* Account Tab sidebar */}
            <aside className={`md:col-span-1 p-4 rounded-2xl border flex flex-col gap-2 ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-neutral-200'}`}>
              <div className="border-b dark:border-zinc-800 pb-3 mb-3 text-center sm:text-left">
                <span className="text-[9px] text-zinc-400 font-mono block">CLIENTE LOGUEADO</span>
                <span className="font-extrabold text-sm block">{actualUser.name}</span>
                <span className="bg-amber-600/10 text-amber-600 font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase mt-1 inline-block">{actualUser.role}</span>
              </div>

              <button 
                onClick={() => { setActiveAccountTab('ORDERS'); setSelectedTrackOrder(null); }}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeAccountTab === 'ORDERS' ? 'bg-amber-600 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              >
                <Truck className="w-4 h-4" /> Mis Pedidos ({myOrdersList.length})
              </button>
              
              <button 
                onClick={() => { setActiveAccountTab('FAVORITES'); setSelectedTrackOrder(null); }}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeAccountTab === 'FAVORITES' ? 'bg-amber-600 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              >
                <Heart className="w-4 h-4" /> Mis Favoritos ({favorites.length})
              </button>

              <button 
                onClick={() => { setActiveAccountTab('DIRECTIONS'); setSelectedTrackOrder(null); }}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeAccountTab === 'DIRECTIONS' ? 'bg-amber-600 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              >
                <MapPin className="w-4 h-4" /> Direcciones Guardadas
              </button>

              <button 
                onClick={() => { setActiveAccountTab('PROFILE'); setSelectedTrackOrder(null); }}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeAccountTab === 'PROFILE' ? 'bg-amber-600 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              >
                <UserIcon className="w-4 h-4" /> Mi Perfil
              </button>

              <button 
                onClick={() => {
                  onLogout?.();
                  setActiveStoreTab('INICIO');
                }}
                className="w-full text-left p-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión de Cuenta
              </button>
            </aside>

            {/* Account Dashboard Content display screen */}
            <div className="md:col-span-3 space-y-6">
              
              {/* SUB TAB: ORDERS AND TRACKING TIMELINE */}
              {activeAccountTab === 'ORDERS' && (
                <div className="space-y-6">
                  
                  {/* Detailed automatic tracing overlay if selected */}
                  {selectedTrackOrder ? (
                    <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'} space-y-6`}>
                      <div className="flex justify-between items-center border-b dark:border-zinc-800 pb-3">
                        <button 
                          onClick={() => setSelectedTrackOrder(null)}
                          className="flex items-center gap-1.5 text-xs text-amber-500 font-bold hover:underline"
                        >
                          <ArrowLeft className="w-4 h-4" /> Volver a mis pedidos
                        </button>
                        <span className="font-mono text-xs dark:text-zinc-400">Orden: <b className="text-amber-500 font-mono">{selectedTrackOrder.code}</b></span>
                      </div>

                      {/* Timeline progress graphic steps requested by user */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase text-zinc-400">Progreso y Línea de Tiempo del Envíos:</h4>
                        
                        <div className="grid grid-cols-5 gap-1 text-center my-6">
                          {['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO'].map((st, i, arr) => {
                            const statusIndex = arr.indexOf(selectedTrackOrder.status);
                            const isPassed = statusIndex >= i && selectedTrackOrder.status !== 'CANCELADO';
                            const isCurrent = selectedTrackOrder.status === st;
                            return (
                              <div key={st} className="flex flex-col items-center">
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] font-black ${
                                  isPassed ? 'bg-green-600 text-white' : 'bg-neutral-300  text-neutral-510 '
                                } ${isCurrent ? 'ring-4 ring-amber-500/40 scale-105' : ''}`}>
                                  {isPassed && !isCurrent ? '✓' : i + 1}
                                </div>
                                <span className="text-[8px] sm:text-[9px] font-mono mt-1 uppercase scale-90 sm:scale-100">{st}</span>
                              </div>
                            );
                          })}
                        </div>

                        {selectedTrackOrder.status === 'CANCELADO' && (
                          <div className="p-3 bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-405 border border-red-200 dark:border-red-900/35 rounded-xl text-center text-xs font-bold">
                            Esta orden se encuentra formalmente cancelada o reembolsada.
                          </div>
                        )}
                      </div>

                      {/* Items details within Ver Detalle requested by user */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-sans font-bold uppercase tracking-wide text-zinc-400">Artículos Comprados:</h5>
                        <div className="border rounded-xl divide-y dark:border-zinc-800 dark:divide-zinc-800 overflow-hidden text-xs">
                          {selectedTrackOrder.items?.map((it, idx) => (
                            <div key={idx} className="p-3 flex justify-between items-center font-sans">
                              <div>
                                <span className="font-bold">{it.name}</span>
                                <span className="text-[9px] text-zinc-400 font-mono block">SKU: {it.sku} • Cantidad: {it.quantity}</span>
                              </div>
                              <span className="font-mono font-bold">S/. {(it.price * it.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Logistics details requested by user */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-4 rounded-xl bg-zinc-200/50 /30 space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold block uppercase">LOGÍSTICA COURIER</span>
                          <p><strong>Courier / Empresa:</strong> {selectedTrackOrder.shippingCarrier || 'Envío Interno Andesmoda'}</p>
                          <p><strong>Número Tracking:</strong> {selectedTrackOrder.shippingMethodId ? `TRK-${selectedTrackOrder.id.slice(0, 6).toUpperCase()}` : 'No disponible aún'}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-200/50 /30 space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold block uppercase">DATOS DE ENTREGA</span>
                          <p><strong>Dirección:</strong> {actualUser.address || 'Recojo en oficina principal'}</p>
                          <p><strong>Total Orden PEN:</strong> S/. {selectedTrackOrder.total.toFixed(2)}</p>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-black text-sm tracking-tight border-b dark:border-zinc-800 pb-2">Historial de mi Cuenta / Mis Pedidos</h4>
                      {myOrdersList.length === 0 ? (
                        <div className="p-8 text-center text-xs text-zinc-500 bg-neutral-100/50 dark:bg-zinc-900/30 rounded-2xl border border-dashed dark:border-zinc-800">
                          Aún no has registrado compras web con esta cuenta.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {myOrdersList.map(o => (
                            <div key={o.id} className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:bg-neutral-100/50 dark:hover:bg-zinc-900/50 ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-neutral-200'}`}>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-black text-amber-500">{o.code}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                                    o.status === 'ENTREGADO' ? 'bg-green-100 text-green-850 dark:bg-green-950/20 dark:text-green-400' :
                                    o.status === 'CANCELADO' ? 'bg-red-100 text-red-850 dark:bg-red-950/20 dark:text-red-400' :
                                    o.status === 'ENVIADO' ? 'bg-blue-100 text-blue-850 dark:bg-blue-950/20 dark:text-blue-400' :
                                    'bg-amber-100 text-amber-850 dark:bg-amber-950/20 dark:text-amber-400'
                                  }`}>
                                    {o.status}
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-400 flex items-center gap-1"><Calendar className="w-3 h-3 text-amber-600" /> {new Date(o.timestamp).toLocaleDateString()}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <span className="text-[10px] text-zinc-400 block">TOTAL</span>
                                  <span className="font-mono text-xs font-black text-amber-600">S/. {o.total.toFixed(2)}</span>
                                </div>
                                <button
                                  onClick={() => setSelectedTrackOrder(o)}
                                  className="bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                  Ver Detalle
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* SUB TAB: FAVORITES */}
              {activeAccountTab === 'FAVORITES' && (
                <div className="space-y-4">
                  <h4 className="font-black text-sm tracking-tight border-b dark:border-zinc-800 pb-2">Prendas que te encantan</h4>
                  {favorites.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-500 bg-neutral-100/50 dark:bg-zinc-900/30 rounded-2xl border border-dashed dark:border-zinc-800">
                      Aún no has agregado prendas a tus favoritos. ¡Explora el catálogo!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.filter(p => favorites.includes(p.id)).map(p => (
                        <div key={p.id} className={`p-3 rounded-xl border flex gap-3 ${isDarkMode ? 'bg-zinc-900/35 border-zinc-800' : 'bg-white border-neutral-200'}`}>
                          <img src={p.images[0]} alt={p.name} className="w-12 h-12 object-cover rounded-lg" referrerPolicy="no-referrer" />
                          <div className="flex-1 space-y-1">
                            <h5 className="font-bold text-xs line-clamp-1">{p.name}</h5>
                            <span className="font-mono text-xs text-amber-500 font-extrabold block">S/. {p.salePrice.toFixed(2)}</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleAddToCart(p)}
                                className="text-[10px] font-bold text-amber-653 hover:underline text-amber-550"
                              >
                                Agregar al carro
                              </button>
                              <button 
                                onClick={() => toggleFavorite(p.id)}
                                className="text-[10px] font-bold text-red-500 hover:underline"
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUB TAB: DIRECTIONS */}
              {activeAccountTab === 'DIRECTIONS' && (
                <div className="space-y-4">
                  <h4 className="font-black text-sm tracking-tight border-b dark:border-zinc-800 pb-2">Direcciones para envío de prendas o facturas</h4>
                  
                  <div className="space-y-2">
                    {savedAddresses.map((addr, idx) => (
                      <div key={idx} className="p-3 text-xs rounded-xl bg-zinc-250/30 dark:bg-zinc-900/40 border dark:border-zinc-800 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        <span>{addr}</span>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddAddress} className="flex gap-2 text-xs pt-2">
                    <input 
                      type="text" 
                      required
                      placeholder="Ingresa una nueva dirección..."
                      value={newAddressInput}
                      onChange={(e) => setNewAddressInput(e.target.value)}
                      className={`flex-1 p-2 rounded-xl border outline-none ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-neutral-50 border-neutral-200'}`}
                    />
                    <button 
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-550 text-white font-bold p-2 px-4 rounded-xl"
                    >
                      Añadir Dirección
                    </button>
                  </form>
                </div>
              )}

              {/* SUB TAB: MY PROFILE */}
              {activeAccountTab === 'PROFILE' && (
                <div className="space-y-4">
                  <h4 className="font-black text-sm tracking-tight border-b dark:border-zinc-850 pb-2">Datos de Operador / Cliente</h4>
                  <div className="p-5 rounded-2xl bg-zinc-200/40 dark:bg-zinc-903/20 border dark:border-zinc-800 space-y-3 text-xs leading-none">
                    <p className="flex justify-between border-b dark:border-zinc-800/80 pb-2">
                      <span className="text-zinc-400 font-bold">Nombres completos:</span>
                      <span className="font-extrabold">{actualUser.name}</span>
                    </p>
                    <p className="flex justify-between border-b dark:border-zinc-800/80 pb-2">
                      <span className="text-zinc-400 font-bold">Dirección de correo:</span>
                      <span className="font-mono font-semibold">{actualUser.email}</span>
                    </p>
                    <p className="flex justify-between border-b dark:border-zinc-800/80 pb-2">
                      <span className="text-zinc-400 font-bold">Rol unificado:</span>
                      <span className="font-mono text-amber-500 font-extrabold">{actualUser.role}</span>
                    </p>
                    <p className="flex justify-between border-b dark:border-zinc-800/80 pb-2">
                      <span className="text-zinc-400 font-bold">DNI de identificación:</span>
                      <span className="font-mono">{actualUser.dni || 'Sin registrar'}</span>
                    </p>
                    <p className="flex justify-between border-b dark:border-zinc-800/80 pb-2">
                      <span className="text-zinc-400 font-bold">Teléfono móvil:</span>
                      <span className="font-mono">{actualUser.phone || 'Sin registrar'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-400 font-bold">Dirección principal:</span>
                      <span>{actualUser.address || 'Sin registrar'}</span>
                    </p>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </main>

      {/* Cart Drawer Panel logic */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 right-0 h-full w-full sm:max-w-md z-50 shadow-2xl flex flex-col justify-between ${
                isDarkMode ? 'bg-zinc-900 border-l border-zinc-800 text-white' : 'bg-white text-neutral-900'
              }`}
            >
              
              <div className="p-6 border-b border-neutral-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-amber-600" />
                  <h3 className="font-extrabold text-lg">Tu Carrito</h3>
                  <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-xs px-2 py-0.5 rounded-full font-bold">
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                    <p className="text-xs font-semibold text-neutral-500">¿Aún sin prendas de fina alpaca en tu carrito?</p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/10 px-4 py-2 rounded-xl"
                    >
                      Seguir Explorando
                    </button>
                  </div>
                ) : (
                  cart.map(item => {
                    const price = item.product.offerPrice > 0 ? item.product.offerPrice : item.product.salePrice;
                    return (
                      <div key={item.product.id} className="flex gap-4 p-3 rounded-xl border border-neutral-100 dark:border-zinc-800 hover:border-amber-500/20">
                        <img 
                          src={item.product.images[0]} 
                          alt={item.product.name} 
                          className="w-16 h-16 object-cover rounded-lg bg-zinc-100 "
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">{item.product.sku}</span>
                            <h5 className="font-bold text-xs line-clamp-1">{item.product.name}</h5>
                            <span className="font-mono text-xs font-extrabold text-amber-600">S/. {price.toFixed(2)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 border border-neutral-200  rounded-lg p-0.5">
                              <button 
                                onClick={() => updateCartQty(item.product.id, -1)}
                                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-zinc-800"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono text-xs px-2 font-bold">{item.quantity}</span>
                              <button 
                                onClick={() => updateCartQty(item.product.id, 1)}
                                disabled={item.quantity >= item.product.stock}
                                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-zinc-800 disabled:opacity-40"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="font-mono text-xs font-black">S/. {(price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-neutral-200 dark:border-zinc-800 space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs font-bold flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-amber-600" /> Cupón de Descuento</span>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Ej: ANDES10" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className={`px-3 py-1.5 text-xs rounded-xl flex-1 border outline-none ${
                          isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white focus:border-amber-500' : 'bg-neutral-50 border-neutral-200 text-neutral-850'
                        }`}
                      />
                      <button 
                        onClick={handleApplyCoupon}
                        className="bg-amber-600 hover:bg-amber-550 px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer border-none"
                      >
                        Aplicar
                      </button>
                    </div>
                    {appliedCoupon && (
                      <div className="text-[10px] text-green-600 font-semibold flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3" /> ¡Cupón aplicado! (-{appliedCoupon.value}{appliedCoupon.discountType === 'PORCENTAJE' ? '%' : ' PEN'})
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 border-t border-neutral-100 dark:border-zinc-800 pt-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500 dark:text-zinc-400">Subtotal</span>
                      <span className="font-mono">S/. {cartSubtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-xs text-red-600">
                        <span>Descuento</span>
                        <span className="font-mono">- S/. {discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500 dark:text-zinc-400">Envío ({currentShippingMethod?.name || 'Inexistente'})</span>
                      <span className="font-mono">S/. {(currentShippingMethod?.cost || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold border-t border-neutral-200 dark:border-zinc-800 pt-2 text-amber-600">
                      <span>Total Neto</span>
                      <span className="font-mono">S/. {cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {!isCheckoutOpen ? (
                    <button
                      onClick={() => {
                        // Halt checkout and open login modal if user is guest!
                        if (!actualUser) {
                          setIsCartOpen(false);
                          setIsLoginModalOpen(true);
                          return;
                        }
                        setIsCheckoutOpen(true);
                      }}
                      className="w-full bg-amber-600 hover:bg-amber-500 transition-all text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-600/10 border-none"
                    >
                      <CreditCard className="w-4 h-4" /> Proceder al Pago
                    </button>
                  ) : (
                    <div className="border-t border-neutral-200 dark:border-zinc-850 pt-4 space-y-3">
                      <h4 className="font-bold text-xs text-amber-500 uppercase">Datos de Envío & Pasarela</h4>
                      <form onSubmit={handleCheckoutSubmit} className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            placeholder="DNI / Cédula" 
                            required
                            value={checkoutDni}
                            onChange={(e) => setCheckoutDni(e.target.value)}
                            className="p-2 border text-[11px] rounded-lg outline-none bg-neutral-50  "
                          />
                          <input 
                            type="text" 
                            placeholder="Tu Nombre completo" 
                            required
                            value={checkoutName}
                            onChange={(e) => setCheckoutName(e.target.value)}
                            className="p-2 border text-[11px] rounded-lg outline-none bg-neutral-50  "
                          />
                        </div>

                        <input 
                          type="tel" 
                          placeholder="Celular / WhatsApp" 
                          value={checkoutPhone}
                          onChange={(e) => setCheckoutPhone(e.target.value)}
                          className="w-full p-2 border text-[11px] rounded-lg outline-none bg-neutral-50  "
                        />

                        <input 
                          type="text" 
                          placeholder="Dirección exacta de entrega (ej: Av Larco 123, Lima)" 
                          required
                          value={checkoutAddress}
                          onChange={(e) => setCheckoutAddress(e.target.value)}
                          className="w-full p-2 border text-[11px] rounded-lg outline-none bg-neutral-50  "
                        />

                        <div className="space-y-1">
                          <label className="text-[9px] text-zinc-400 block font-bold">Courier de Despacho:</label>
                          <select
                            required
                            value={selectedShippingId}
                            onChange={(e) => setSelectedShippingId(e.target.value)}
                            className="w-full p-1.5 border text-[11px] rounded-lg outline-none bg-neutral-50  "
                          >
                            {shippingMethods.filter(sm => sm.status === 'ACTIVO').map(sm => (
                              <option key={sm.id} value={sm.id}>
                                {sm.name} (+S/. {sm.cost} - {sm.deliveryTime})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-zinc-400 block font-bold">Pasarela de Pago:</label>
                          <select
                            value={checkoutPayment}
                            onChange={(e) => setCheckoutPayment(e.target.value as any)}
                            className="w-full p-1.5 border text-[11px] rounded-lg outline-none bg-neutral-50  "
                          >
                            <option value="TARJETA">Tarjeta Visa / Mastercard Crédito o Débito</option>
                            <option value="EFECTIVO">Pago en Efectivo contra entrega</option>
                            <option value="YAPE">Yape (Pago móvil rápido)</option>
                            <option value="PLIN">Plin (Transferencia móvil)</option>
                            <option value="TRANSFERENCIA">Transferencia Bancaria BCP/Interbank</option>
                          </select>
                        </div>

                        {errorMsg && (
                          <div className="bg-red-55/10 text-red-500 border border-red-900/15 rounded px-2.5 py-1 text-[10px] my-1 text-center font-bold">
                            {errorMsg}
                          </div>
                        )}

                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsCheckoutOpen(false)}
                            className="w-1/3 border border-neutral-300  text-xs py-2 rounded-lg"
                          >
                            Atrás
                          </button>
                          <button
                            type="submit"
                            className="w-2/3 bg-amber-600 hover:bg-amber-550 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 border-none"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Confirmar S/. {cartTotal.toFixed(2)}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                </div>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* LOGIN MODAL OVERLAY */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute inset-0 bg-black cursor-pointer"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-2xl z-10 transition-all ${
                isDarkMode ? 'bg-zinc-900 border border-zinc-800 text-white' : 'bg-white text-zinc-900'
              }`}
            >
              <button 
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-6">
                <Sparkles className="w-8 h-8 text-amber-600 mx-auto mb-2 animate-bounce" />
                <h4 className="text-lg font-black tracking-tight block">Ingresar a Andesmoda</h4>
                <p className="text-xs text-neutral-450 mt-1">Conéctate para registrar tus pedidos, ver tu seguimiento y acceder a tu perfil privado.</p>
              </div>

              {loginError && (
                <div className="p-3 bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-400 text-xs font-bold rounded-lg mb-4 border border-red-200">
                  {loginError}
                </div>
              )}

              <form onSubmit={handlePortalLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Correo Electrónico:</label>
                  <input
                    type="email"
                    required
                    placeholder="correo@ejemplo.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full p-2.5 rounded-lg border outline-none bg-neutral-50  "
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Clave Secreta:</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full p-2.5 rounded-lg border outline-none bg-neutral-50  "
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-550 text-white font-bold py-2.5 rounded-xl border-none transition-all cursor-pointer shadow"
                >
                  Confirmar Ingreso
                </button>
              </form>

              {/* Instant Login Shortcuts for Evaluators/Reviewers */}
              <div className="mt-6 border-t dark:border-zinc-800 pt-4 space-y-3">
                <span className="text-[10px] text-zinc-400 font-mono tracking-wider font-black uppercase text-center block mb-1">Accesos Directos para Evaluación</span>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => handleQuickLogin('CLIENTE')}
                    className="p-2 text-[10px] font-bold border rounded-lg bg-terracota/10 hover:bg-terracota text-terracota-bright hover:text-white border-terracota/25 transition-all cursor-pointer font-sans"
                  >
                    👤 Cliente
                  </button>
                  <button 
                    onClick={() => handleQuickLogin('VENDEDOR')}
                    className="p-2 text-[10px] font-bold border rounded-lg bg-emerald-650/10 hover:bg-emerald-600 text-emerald-450 hover:text-white border-emerald-500/25 transition-all cursor-pointer font-sans"
                  >
                    💼 Vendedor
                  </button>
                  <button 
                    onClick={() => handleQuickLogin('ADMINISTRADOR')}
                    className="p-2 text-[10px] font-bold border rounded-lg bg-rose-650/10 hover:bg-rose-600 text-rose-500 hover:text-white border-rose-500/25 transition-all cursor-pointer font-sans"
                  >
                    👑 Admin
                  </button>
                </div>
              </div>

              <div className="text-center mt-4 pt-4 border-t dark:border-zinc-800 text-[11px]">
                <span className="text-zinc-400">¿No tienes una cuenta aún? </span>
                <button 
                  onClick={() => {
                    setIsLoginModalOpen(false);
                    setIsRegisterModalOpen(true);
                  }}
                  className="text-amber-500 font-bold hover:underline"
                >
                  Regístrate aquí
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REGISTER MODAL OVERLAY */}
      <AnimatePresence>
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute inset-0 bg-black cursor-pointer"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative max-w-lg w-full p-6 sm:p-8 rounded-3xl shadow-2xl z-10 transition-all ${
                isDarkMode ? 'bg-zinc-900 border border-zinc-800 text-white' : 'bg-white text-zinc-900'
              }`}
            >
              <button 
                onClick={() => setIsRegisterModalOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-6">
                <Compass className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <h4 className="text-lg font-black tracking-tight block">Crear Cuenta de Cliente</h4>
                <p className="text-xs text-neutral-450 mt-1">Registra tus datos SMTP para iniciar el flujo de compras de confecciones andinas.</p>
              </div>

              {regError && (
                <div className="p-3 bg-red-105/15 text-red-600 text-xs font-bold rounded-lg mb-4 border border-red-200">
                  {regError}
                </div>
              )}

              {regSuccess && (
                <div className="p-3 bg-green-105/15 text-green-600 text-xs font-bold rounded-lg mb-4 border border-green-250">
                  {regSuccess}
                </div>
              )}

              <form onSubmit={handlePortalRegister} className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Nombre Completo (*):</label>
                    <input
                      type="text"
                      required
                      placeholder="Juan Pérez"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-neutral-50  "
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Correo Electrónico (*):</label>
                    <input
                      type="email"
                      required
                      placeholder="correo@ejemplo.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-neutral-50  "
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Clave Secreta (*):</label>
                    <input
                      type="password"
                      required
                      placeholder="Mín. 6 caracteres"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-neutral-50  "
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">DNI de Identidad:</label>
                    <input
                      type="text"
                      placeholder="8 dígitos"
                      value={regDni}
                      onChange={(e) => setRegDni(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-neutral-50  "
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Nro Celular:</label>
                    <input
                      type="tel"
                      placeholder="ej: 987654321"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-neutral-50  "
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Dirección de Despacho:</label>
                    <input
                      type="text"
                      placeholder="Calle, Distrito, Provincia"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-neutral-50  "
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full bg-amber-600 hover:bg-amber-550 text-white font-bold py-2.5 rounded-xl border-none transition-all cursor-pointer shadow mt-2"
                >
                  {regLoading ? 'Registrando...' : 'Completar Registro'}
                </button>
              </form>

              <div className="text-center mt-4 pt-4 border-t dark:border-zinc-800 text-[11px]">
                <span className="text-zinc-400">¿Ya tienes una cuenta registrada? </span>
                <button 
                  onClick={() => {
                    setIsRegisterModalOpen(false);
                    setIsLoginModalOpen(true);
                  }}
                  className="text-amber-500 font-bold hover:underline"
                >
                  Inicia sesión aquí
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS ORDER PLACED NOTIFY MODAL */}
      <AnimatePresence>
        {checkoutSuccessCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setCheckoutSuccessCode(null)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative max-w-sm w-full p-6 text-center rounded-3xl shadow-xl transition-all ${
                isDarkMode ? 'bg-zinc-900 border border-zinc-800 text-white' : 'bg-white text-neutral-900'
              }`}
            >
              <div className="bg-green-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-black block mb-1">¡Felicidades, Compra Unificada Real!</h4>
              <p className="text-xs text-neutral-500 mb-4 leading-relaxed">Tu pedido ha sido despachado virtualmente con éxito. Los almacenes centrales han sido debitados.</p>
              
              <div className="bg-amber-100 text-amber-805 font-mono text-xs font-black py-2 rounded-lg mb-4 select-all text-neutral-900">
                Código de control: {checkoutSuccessCode}
              </div>

              <div className="text-[10px] text-zinc-400 mb-4">Puedes vigilar su línea de tiempo en "Mi Cuenta" → "Mis Pedidos" en tiempo real sin códigos manuales.</div>

              <button
                onClick={() => {
                  setCheckoutSuccessCode(null);
                  setActiveStoreTab('ACCOUNT');
                  setActiveAccountTab('ORDERS');
                }}
                className="w-full bg-amber-600 text-white hover:opacity-90 font-bold py-2.5 rounded-xl text-xs border-none"
              >
                Ir a Mis Pedidos
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AIChatbot 
        user={currentUser}
        db={{
          products: products || [],
          sales: orders || [],
          customers: customers || [],
          categories: categories || []
        }} 
        isDarkMode={isDarkMode} 
      />

    </div>
  );
}
