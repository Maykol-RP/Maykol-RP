import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  fetchFullDatabase, writeAuditTrailLog 
} from './api';
import { 
  Product, Category, Customer, Order, ShippingMethod, 
  Coupon, Banner, Promotion, CashRegister, FinanceJournal, User, AuditLog 
} from './types';

// Import Modular Sub views
import ClientStore from './components/ClientStore';
import POSView from './components/POSView';
import ProductsView from './components/ProductsView';
import CategoriesView from './components/CategoriesView';
import InventoryView from './components/InventoryView';
import CustomersView from './components/CustomersView';
import OrdersView from './components/OrdersView';
import ShippingView from './components/ShippingView';
import MarketingView from './components/MarketingView';
import ReportsView from './components/ReportsView';
import FinanceView from './components/FinanceView';
import UsersView from './components/UsersView';
import AuditView from './components/AuditView';
import ProfileView from './components/ProfileView';
import AIChatbot from './components/AIChatbot';

// Lucide Icons
import { 
  Building, LayoutDashboard, ShoppingCart, KeyRound, 
  Shirt, Folder, Activity, Users, Truck, Sparkles, 
  BarChart4, DollarSign, Shield, History, UserCircle, 
  Lightbulb, Moon, Sun, LogOut, Lock, HelpCircle,
  CheckCircle, AlertTriangle, X, XCircle, Trash2
} from 'lucide-react';

export default function App() {
  // Global Database State
  const [db, setDb] = useState<{
    products: Product[];
    categories: Category[];
    customers: Customer[];
    orders: Order[];
    shippingMethods: ShippingMethod[];
    coupons: Coupon[];
    banners: Banner[];
    promotions: Promotion[];
    cashRegisters: CashRegister[];
    financeLogs: FinanceJournal[];
    userNomina: User[];
    auditLogs: AuditLog[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  // Authentication State
  const [loggedUser, setLoggedUser] = useState<User | null>(null);

  // View Navigation State (ERP Tab selection)
  const [activeView, setActiveView] = useState<string>('CLIENT_STORE');

  // Dark Mode preference with localStorage backup
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const persisted = localStorage.getItem('isDarkMode');
      return persisted !== null ? persisted === 'true' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('isDarkMode', String(isDarkMode));
    } catch (e) {
      console.warn("Storage write failed", e);
    }
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- CUSTOM MODERN TOAST & CONFIRM MODALS ---
  // Custom Toast State
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'warning' | 'error' | 'cancelled';
  } | null>(null);

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    isMassive?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' | 'cancelled' = 'success') => {
    setToast({ message, type });
  };

  const askConfirm = (options: { title?: string; message: string; isMassive?: boolean; onConfirm: () => void; onCancel?: () => void }) => {
    setConfirmModal({
      title: options.title || 'Iniciando confirmación',
      message: options.message,
      isMassive: options.isMassive || false,
      onConfirm: () => {
        options.onConfirm();
        setConfirmModal(null);
      },
      onCancel: () => {
        if (options.onCancel) {
          options.onCancel();
        } else {
          showToast('Acción cancelada', 'cancelled');
        }
        setConfirmModal(null);
      }
    });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    (window as any).showToast = showToast;
    (window as any).askConfirm = askConfirm;
  }, [toast, confirmModal]);

  // Login Form States (Traditional fields fallback)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Fetch full data unifications
  const loadDatabase = async () => {
    try {
      setLoading(true);
      const data = await fetchFullDatabase();
      setDb(data);
    } catch (err) {
      console.error('Error cargando base de datos central:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  // Quick Instant Login Shortcuts
  const handleInstantLogin = (role: 'ADMINISTRADOR' | 'VENDEDOR' | 'CLIENTE') => {
    if (!db) return;
    const matchedUser = db.userNomina.find(u => u.role === role);
    if (matchedUser) {
      if (matchedUser.status === 'BLOQUEADO') {
        showToast('Este operario se encuentra bloqueado administrativamente.', 'error');
        return;
      }
      setLoggedUser(matchedUser);
      writeAuditTrailLog('INICIO_SESION', `Operador ${matchedUser.name} inició sesión exitosamente como '${role}'`, matchedUser);
      setLoginError('');
      // Route appropriately on login
      if (role === 'CLIENTE') {
        setActiveView('CLIENT_STORE');
      } else if (role === 'VENDEDOR') {
        setActiveView('POS_VIEW');
      } else {
        setActiveView('ERP_DASHBOARD');
      }
    }
  };

  // Credentials Login Handler
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    const match = db.userNomina.find(
      u => u.email.toLowerCase().trim() === loginEmail.toLowerCase().trim() && u.password === loginPassword
    );

    if (match) {
      if (match.status === 'BLOQUEADO') {
        setLoginError('Tu cuenta de operador ha sido bloqueada. Contacta al Administrador.');
        return;
      }
      setLoggedUser(match);
      writeAuditTrailLog('INICIO_SESION', `Operador ${match.name} ingresó mediante claves SMTP`, match);
      setLoginError('');

      if (match.role === 'CLIENTE') {
        setActiveView('CLIENT_STORE');
      } else if (match.role === 'VENDEDOR') {
        setActiveView('POS_VIEW');
      } else {
        setActiveView('ERP_DASHBOARD');
      }
    } else {
      setLoginError('Credenciales incorrectas. Prueba con los accesos directos rápidos.');
    }
  };

  // Sign out Handler
  const handleSignOut = () => {
    if (loggedUser) {
      writeAuditTrailLog('CERRAR_SESION', `Operador ${loggedUser.name} cerró sesión voluntariamente`, loggedUser);
    }
    setLoggedUser(null);
    setLoginEmail('');
    setLoginPassword('');
    setActiveView('ERP_DASHBOARD');
  };

  // Live real-time Clock ticking widget
  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('es-PE', { hour12: false }) + ' (Lima UTC-5)');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute limited menus if VENDEDOR
  const isVendedorRole = loggedUser?.role === 'VENDEDOR';
  const isAdminRole = loggedUser?.role === 'ADMINISTRADOR';
  const isClienteRole = loggedUser?.role === 'CLIENTE';

  // --- SEGURIDAD: Role-Based View Protection Guard ---
  useEffect(() => {
    if (!loggedUser || !db) return;
    
    const adminOnlyViews = ['USERS', 'AUDIT'];

    if (isClienteRole) {
      if (activeView !== 'CLIENT_STORE' && activeView !== 'PROFILE') {
        console.warn(`[RBAC Guard] Cliente unauthorized for view: ${activeView}. Redirecting to CLIENT_STORE.`);
        setActiveView('CLIENT_STORE');
      }
    } else if (isVendedorRole) {
      if (adminOnlyViews.includes(activeView)) {
        console.warn(`[RBAC Guard] Vendedor unauthorized for view: ${activeView}. Redirecting to ERP_DASHBOARD.`);
        setActiveView('ERP_DASHBOARD');
      }
    }
  }, [activeView, loggedUser, isClienteRole, isVendedorRole, db]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-zinc-950 text-white font-mono gap-4 animate-pulse">
        <Building className="w-12 h-12 text-amber-500 animate-spin" />
        <span className="text-xs uppercase font-extrabold tracking-widest text-amber-600">AndesModa ERP ● Cargando Almacenes...</span>
      </div>
    );
  }

  // --- PUBLIC CLIENT STORE RENDERING (Bypass login entirely to show the public store) ---
  if (activeView === 'CLIENT_STORE' && (!loggedUser || loggedUser.role === 'CLIENTE')) {
    return (
      <ClientStore
        products={db.products}
        categories={db.categories}
        shippingMethods={db.shippingMethods}
        coupons={db.coupons}
        banners={db.banners}
        promotions={db.promotions}
        orders={db.orders}
        userNomina={db.userNomina}
        customers={db.customers || []}
        currentUser={loggedUser}
        activeCustomer={loggedUser}
        onRefresh={loadDatabase}
        onOrderSuccess={loadDatabase}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onLogin={(user: User) => {
          setLoggedUser(user);
          if (user.role === 'CLIENTE') {
            setActiveView('CLIENT_STORE');
          } else if (user.role === 'VENDEDOR') {
            setActiveView('POS_VIEW');
          } else {
            setActiveView('ERP_DASHBOARD');
          }
        }}
        onLogout={handleSignOut}
      />
    );
  }

  // --- RENDER 1: LOGIN PORTAL SCREEN ---
  if (!loggedUser || !db) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-200 ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-neutral-100/50 text-zinc-900'}`}>
        
        {/* Absolute header options */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 border rounded-full hover:bg-neutral-200 dark:hover:bg-zinc-800 shrink-0 cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-neutral-600" />}
          </button>
        </div>

        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden border border-neutral-200 dark:border-zinc-800 shadow-2xl">
          
          {/* Cover landscape visual brand */}
          <div className="hidden md:flex flex-col justify-between p-8 bg-gradient-to-tr from-borgona via-[#40201d] to-marron text-white relative">
            <div className="space-y-4">
              <span className="bg-dorado/25 text-dorado border border-dorado/20 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest font-black uppercase inline-block">ANDESMODA ERP Enterprise v5</span>
              <h1 className="text-2xl font-black tracking-tight leading-tight mt-2 font-display">Tejidos Nobles y Confección Andina Inteligente</h1>
              <p className="text-xs opacity-85 font-sans leading-relaxed">Centraliza tu inventario, tus ventas en punto físico POS, tu comercio electrónico Web, finanzas de caja diaria, marketing de fidelización y auditoría legal en una plataforma única de alta costura.</p>
            </div>

            {/* Cozy Alpaca clothing theme photo placeholder */}
            <div className="rounded-2xl overflow-hidden bg-white/5 p-3 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150" 
                  alt="Alpaca Wool" 
                  className="w-10 h-10 object-cover rounded-xl border border-white/20" 
                  referrerPolicy="no-referrer"
                />
                <div>
                  <span className="text-[10px] block font-extrabold uppercase text-dorado font-display">Colección Otoño-Invierno</span>
                  <span className="text-[9px] block opacity-70 font-mono">100% Fibra Noble de Alpaca de Cusco</span>
                </div>
              </div>
            </div>
          </div>

          {/* Login Credentials and Role Selector */}
          <div className={`p-8 flex flex-col justify-between ${isDarkMode ? 'bg-zinc-900' : 'bg-amber-50'}`}>
            <div className="space-y-6">
              
              <div>
                <h2 className="text-lg font-black text-terracota font-display block uppercase tracking-tight">Iniciar Sesión en Andesmoda</h2>
                <p className="text-xs text-zinc-500">Ingresa con tus claves SMTP o utiliza el Selector de Rol y Accesos Directos.</p>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/30">
                  {loginError}
                </div>
              )}

              {/* Form Input fields */}
              <form onSubmit={handleCredentialsSubmit} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Correo Electrónico de Operario:</label>
                  <input
                    type="email"
                    required
                    placeholder="email@andesmoda.pe"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-neutral-50 dark:bg-zinc-850 text-zinc-100 placeholder:text-zinc-505 font-mono focus:ring-2 focus:ring-terracota"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Contraseña:</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-netural-50 dark:bg-zinc-850 text-zinc-100 placeholder:text-zinc-505 font-mono focus:ring-2 focus:ring-terracota"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-borgona to-terracota-bright hover:brightness-110 active:scale-[0.98] cursor-pointer text-white font-extrabold uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-terracota/10 transition-all font-display text-xs"
                >
                  <KeyRound className="w-4 h-4 text-dorado" /> Autenticar Claves
                </button>
              </form>

              {/* Role Selectors unifications */}
              <div className="space-y-3 pt-5 border-t border-neutral-200 dark:border-zinc-800">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Seleccionar Rol y Entrar al Instante:</span>
                <div className="grid grid-cols-3 gap-2 text-center font-bold text-[10px]">
                  
                  <button
                    onClick={() => handleInstantLogin('CLIENTE')}
                    className="p-2 border rounded-xl border-amber-300 hover:border-terracota bg-amber-100 dark:bg-amber-950/20 text-terracota transition-all cursor-pointer font-bold uppercase tracking-wider scale-hover"
                  >
                    🛒 E-Commerce
                  </button>

                  <button
                    onClick={() => handleInstantLogin('VENDEDOR')}
                    className="p-2 border rounded-xl border-dorado/30 hover:border-dorado bg-dorado/10 text-dorado transition-all cursor-pointer font-bold uppercase tracking-wider scale-hover"
                  >
                    🏪 POS Vendedor
                  </button>

                  <button
                    onClick={() => handleInstantLogin('ADMINISTRADOR')}
                    className="p-2 border rounded-xl border-borgona/35 hover:border-borgona bg-borgona/10 text-borgona-intense transition-all cursor-pointer font-bold uppercase tracking-wider scale-hover"
                  >
                    👑 Administrar
                  </button>

                </div>
              </div>

            </div>

            <span className="text-[10px] text-zinc-500 block text-center mt-6">AndesModa ERP S.A.C. Derechos Reservados © 2026</span>
          </div>

        </div>
      </div>
    );
  }

  // --- RENDER 2: PRIMARY FULL-STACK APPLICATION DASHBOARD ---
  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-200 ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-neutral-50 text-zinc-950'}`}>
      
      {/* 1. LEFT SIDEBAR PANEL (Common for all views with Brand Styling) */}
      <aside className={`w-full md:w-64 border-b md:border-b-0 md:border-r flex flex-col justify-between shrink-0 p-5 font-sans transition-colors duration-200 ${
        isDarkMode ? 'bg-[#151515] border-zinc-900 text-zinc-300' : 'bg-[#FAF8F5] border-amber-200 text-zinc-800'
      }`}>
        <div className="space-y-6">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-borgona to-terracota-bright h-9 w-9 rounded-2xl flex items-center justify-center font-black text-white hover:scale-110 transition-transform uppercase select-none font-display shadow-lg shadow-terracota/20">
              AM
            </div>
            <div>
              <span className={`text-sm font-black tracking-tight block font-display ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>ANDESMODA</span>
              <span className="text-[9px] text-dorado font-mono tracking-widest block uppercase font-bold">ERP + POS High-End</span>
            </div>
          </div>

          {/* Quick Active Operator indicator */}
          <div className={`p-3.5 rounded-2xl border space-y-1 transition-colors ${
            isDarkMode 
              ? 'bg-zinc-900/60 border-zinc-850 text-zinc-300' 
              : 'bg-amber-100/30 border-amber-200/50 text-zinc-800'
          }`}>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className={`text-xs font-black line-clamp-1 ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{loggedUser.name}</span>
            </div>
            <span className="bg-gradient-to-r from-borgona to-terracota text-white text-[8px] font-bold tracking-widest px-2 py-0.5 rounded-md uppercase inline-block">
              {loggedUser.role}
            </span>
          </div>

          {/* View Menu clusters */}
          <nav className="space-y-1 text-xs font-bold text-zinc-500">
            
            {/* PANEL DE CONTROL (ADMINISTRADOR or VENDEDOR) */}
            {(isAdminRole || isVendedorRole) && (
              <button
                onClick={() => setActiveView('ERP_DASHBOARD')}
                className={`w-full text-left py-2 px-3 rounded-xl flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
                  activeView === 'ERP_DASHBOARD' 
                    ? 'bg-gradient-to-r from-borgona to-terracota text-white font-bold shadow-lg shadow-terracota/10' 
                    : isDarkMode 
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900' 
                      : 'text-zinc-700 hover:text-zinc-950 hover:bg-amber-100/40'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 ${activeView === 'ERP_DASHBOARD' ? 'text-dorado' : 'text-terracota-bright'}`} /> Panel de Control
              </button>
            )}

            {/* TIENDA WEB E-COMMERCE (All roles) */}
            <button
              onClick={() => setActiveView('CLIENT_STORE')}
              className={`w-full text-left py-2 px-3 rounded-xl flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
                activeView === 'CLIENT_STORE' 
                  ? 'bg-gradient-to-r from-borgona to-terracota text-white font-bold shadow-lg shadow-terracota/10' 
                  : isDarkMode 
                    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900' 
                    : 'text-zinc-700 hover:text-zinc-950 hover:bg-amber-100/40'
              }`}
            >
              <ShoppingCart className={`w-4 h-4 ${activeView === 'CLIENT_STORE' ? 'text-dorado' : 'text-terracota-bright'}`} /> Tienda Web E-Commerce
            </button>

            {/* TERMINAL POS TIENDA (ADMINISTRADOR or VENDEDOR) */}
            {(isAdminRole || isVendedorRole) && (
              <button
                onClick={() => setActiveView('POS_VIEW')}
                className={`w-full text-left py-2 px-3 rounded-xl flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
                  activeView === 'POS_VIEW' 
                    ? 'bg-gradient-to-r from-borgona to-terracota text-white font-bold shadow-lg shadow-terracota/10' 
                    : isDarkMode 
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900' 
                      : 'text-zinc-700 hover:text-zinc-950 hover:bg-amber-100/40'
                }`}
              >
                <Building className={`w-4 h-4 ${activeView === 'POS_VIEW' ? 'text-dorado' : 'text-terracota-bright'}`} /> Terminal POS Tienda
              </button>
            )}

            {/* PRENDAS Y CATÁLOGO (ADMINISTRADOR or VENDEDOR) */}
            {(isAdminRole || isVendedorRole) && (
              <button
                onClick={() => setActiveView('PRODUCTS')}
                className={`w-full text-left py-2 px-3 rounded-xl flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
                  activeView === 'PRODUCTS' 
                    ? 'bg-gradient-to-r from-borgona to-terracota text-white font-bold shadow-lg shadow-terracota/10' 
                    : isDarkMode 
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900' 
                      : 'text-zinc-700 hover:text-zinc-950 hover:bg-amber-100/40'
                }`}
              >
                <Shirt className={`w-4 h-4 ${activeView === 'PRODUCTS' ? 'text-dorado' : 'text-terracota-bright'}`} /> Prendas y Catálogo
              </button>
            )}

            {/* COLECCIONES CATEGORÍAS (ADMINISTRADOR or VENDEDOR) */}
            {(isAdminRole || isVendedorRole) && (
              <button
                onClick={() => setActiveView('CATEGORIES')}
                className={`w-full text-left py-2 px-3 rounded-xl flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
                  activeView === 'CATEGORIES' 
                    ? 'bg-gradient-to-r from-borgona to-terracota text-white font-bold shadow-lg shadow-terracota/10' 
                    : isDarkMode 
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900' 
                      : 'text-zinc-700 hover:text-zinc-950 hover:bg-amber-100/40'
                }`}
              >
                <Folder className={`w-4 h-4 ${activeView === 'CATEGORIES' ? 'text-dorado' : 'text-terracota-bright'}`} /> Colecciones Categorías
              </button>
            )}

            {/* KÁRDEX ALMACÉN (ADMINISTRADOR or VENDEDOR) */}
            {(isAdminRole || isVendedorRole) && (
              <button
                onClick={() => setActiveView('INVENTORY')}
                className={`w-full text-left py-2 px-3 rounded-xl flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
                  activeView === 'INVENTORY' 
                    ? 'bg-gradient-to-r from-borgona to-terracota text-white font-bold shadow-lg shadow-terracota/10' 
                    : isDarkMode 
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900' 
                      : 'text-zinc-700 hover:text-zinc-950 hover:bg-amber-100/40'
                }`}
              >
                <Activity className={`w-4 h-4 ${activeView === 'INVENTORY' ? 'text-dorado' : 'text-terracota-bright'}`} /> Kárdex Almacén
              </button>
            )}

            {/* CARTERA CLIENTES (ADMINISTRADOR or VENDEDOR) */}
            {(isAdminRole || isVendedorRole) && (
              <button
                onClick={() => setActiveView('CUSTOMERS')}
                className={`w-full text-left py-2 px-3 rounded-xl flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
                  activeView === 'CUSTOMERS' 
                    ? 'bg-gradient-to-r from-borgona to-terracota text-white font-bold shadow-lg shadow-terracota/10' 
                    : isDarkMode 
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900' 
                      : 'text-zinc-700 hover:text-zinc-950 hover:bg-amber-100/40'
                }`}
              >
                <Users className={`w-4 h-4 ${activeView === 'CUSTOMERS' ? 'text-dorado' : 'text-terracota-bright'}`} /> Cartera Clientes
              </button>
            )}

            {/* PEDIDOS & VENTAS (ADMINISTRADOR or VENDEDOR) */}
            {(isAdminRole || isVendedorRole) && (
              <button
                onClick={() => setActiveView('ORDERS')}
                className={`w-full text-left py-2 px-3 rounded-xl flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
                  activeView === 'ORDERS' 
                    ? 'bg-gradient-to-r from-borgona to-terracota text-white font-bold shadow-lg shadow-terracota/10' 
                    : isDarkMode 
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900' 
                      : 'text-zinc-700 hover:text-zinc-950 hover:bg-amber-100/40'
                }`}
              >
                <History className={`w-4 h-4 ${activeView === 'ORDERS' ? 'text-dorado' : 'text-terracota-bright'}`} /> Pedidos & Ventas
              </button>
            )}

            {/* COURIERS & ENVÍOS (ADMINISTRADOR or VENDEDOR) */}
            {(isAdminRole || isVendedorRole) && (
              <button
                onClick={() => setActiveView('SHIPPING')}
                className={`w-full text-left py-2 px-3 rounded-xl flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
                  activeView === 'SHIPPING' 
                    ? 'bg-gradient-to-r from-borgona to-terracota text-white font-bold shadow-lg shadow-terracota/10' 
                    : isDarkMode 
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900' 
                      : 'text-zinc-700 hover:text-zinc-950 hover:bg-amber-100/40'
                }`}
              >
                <Truck className={`w-4 h-4 ${activeView === 'SHIPPING' ? 'text-dorado' : 'text-terracota-bright'}`} /> Couriers & Envíos
              </button>
            )}

            {/* CAMPAÑAS MARKETING (ADMINISTRADOR or VENDEDOR) */}
            {(isAdminRole || isVendedorRole) && (
              <button
                onClick={() => setActiveView('MARKETING')}
                className={`w-full text-left py-2 px-3 rounded-xl flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
                  activeView === 'MARKETING' 
                    ? 'bg-gradient-to-r from-borgona to-terracota text-white font-bold shadow-lg shadow-terracota/10' 
                    : isDarkMode 
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900' 
                      : 'text-zinc-700 hover:text-zinc-950 hover:bg-amber-100/40'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${activeView === 'MARKETING' ? 'text-dorado' : 'text-terracota-bright'}`} /> Campañas Marketing
              </button>
            )}

            {/* REPORTES & BI (ADMINISTRADOR or VENDEDOR) */}
            {(isAdminRole || isVendedorRole) && (
              <button
                onClick={() => setActiveView('REPORTS')}
                className={`w-full text-left py-2 px-3 rounded-xl flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
                  activeView === 'REPORTS' 
                    ? 'bg-gradient-to-r from-borgona to-terracota text-white font-bold shadow-lg shadow-terracota/10' 
                    : isDarkMode 
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900' 
                      : 'text-zinc-700 hover:text-zinc-950 hover:bg-amber-100/40'
                }`}
              >
                <BarChart4 className={`w-4 h-4 ${activeView === 'REPORTS' ? 'text-dorado' : 'text-terracota-bright'}`} /> Reportes & BI
              </button>
            )}

            {/* CAJA & FINANZAS (ADMINISTRADOR or VENDEDOR) */}
            {(isAdminRole || isVendedorRole) && (
              <button
                onClick={() => setActiveView('FINANCE')}
                className={`w-full text-left py-2 px-3 rounded-xl flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
                  activeView === 'FINANCE' 
                    ? 'bg-gradient-to-r from-borgona to-terracota text-white font-bold shadow-lg shadow-terracota/10' 
                    : isDarkMode 
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900' 
                      : 'text-zinc-700 hover:text-zinc-950 hover:bg-amber-100/40'
                }`}
              >
                <DollarSign className={`w-4 h-4 ${activeView === 'FINANCE' ? 'text-dorado' : 'text-terracota-bright'}`} /> Caja & Finanzas
              </button>
            )}

            {/* NÓMINA EMPLEADOS (ADMINISTRADOR only) */}
            {isAdminRole && (
              <button
                onClick={() => setActiveView('USERS')}
                className={`w-full text-left py-2 px-3 rounded-xl flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
                  activeView === 'USERS' 
                    ? 'bg-gradient-to-r from-borgona to-terracota text-white font-bold shadow-lg shadow-terracota/10' 
                    : isDarkMode 
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900' 
                      : 'text-zinc-700 hover:text-zinc-950 hover:bg-amber-100/40'
                }`}
              >
                <Shield className={`w-4 h-4 ${activeView === 'USERS' ? 'text-dorado' : 'text-terracota-bright'}`} /> Nómina Empleados
              </button>
            )}

            {/* LOGS AUDITORÍA (ADMINISTRADOR only) */}
            {isAdminRole && (
              <button
                onClick={() => setActiveView('AUDIT')}
                className={`w-full text-left py-2 px-3 rounded-xl flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
                  activeView === 'AUDIT' 
                    ? 'bg-gradient-to-r from-borgona to-terracota text-white font-bold shadow-lg shadow-terracota/10' 
                    : isDarkMode 
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-950' 
                      : 'text-zinc-700 hover:text-zinc-950 hover:bg-amber-100/40'
                }`}
              >
                <Lock className={`w-4 h-4 ${activeView === 'AUDIT' ? 'text-dorado' : 'text-terracota-bright'}`} /> Logs Auditoría
              </button>
            )}

            {/* PERFIL Y CLAVES (All roles) */}
            <button
              onClick={() => setActiveView('PROFILE')}
              className={`w-full text-left py-2 px-3 rounded-xl flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
                activeView === 'PROFILE' 
                  ? 'bg-gradient-to-r from-borgona to-terracota text-white font-bold shadow-lg shadow-terracota/10' 
                  : isDarkMode 
                    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900' 
                    : 'text-zinc-700 hover:text-zinc-950 hover:bg-amber-100/40'
              }`}
            >
              <UserCircle className={`w-4 h-4 ${activeView === 'PROFILE' ? 'text-dorado' : 'text-terracota-bright'}`} /> Perfil y Claves
            </button>

          </nav>

        </div>

        {/* Aside footer options */}
        <div className="pt-6 border-t border-neutral-200 dark:border-zinc-800 space-y-4">
          
          <div className="flex justify-between items-center">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 border rounded-xl hover:bg-neutral-200 dark:hover:bg-zinc-800 cursor-pointer text-zinc-450 transition-all border-amber-300/30 bg-amber-500/10"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-dorado" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Signout button */}
            <button
              onClick={handleSignOut}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Salir ERP
            </button>
          </div>

          <span className="text-[9px] text-zinc-500 font-mono block text-center">v5.4 • Base unificada exitosa</span>
        </div>
      </aside>

      {/* 2. MAIN HUB CONTENT CONTAINER */}
      <main className="flex-1 flex flex-col min-h-0 bg-transparent overflow-y-auto">
        
        {/* Top header stats and clock */}
        <header className={`p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0 ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200 shadow-xs'
        }`}>
          <div>
            <span className="font-mono text-zinc-400 text-[10px] block uppercase tracking-wider">{timeStr}</span>
          </div>
          
          <div className="flex items-center gap-3 text-xs">
            <span className="text-zinc-500 font-bold hidden sm:inline">Modo Simulador Integrado:</span>
            <div className="flex gap-2">
              <span className="bg-terracota/10 text-terracota dark:text-terracota-bright px-2.5 py-1 rounded-xl font-black uppercase text-[10px] border border-terracota-bright/20">
                Base unificada de {db.products.length} productos
              </span>
              <span className="bg-emerald-600/10 text-emerald-600 dark:text-emerald-450 px-2.5 py-1 rounded-xl font-black uppercase text-[10px] border border-emerald-500/10">
                {db.orders.length} ventas logradas
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic section injection */}
        <div className="p-6 flex-1">
          
          {/* VIEW: 1. CORE DASHBOARD */}
          {activeView === 'ERP_DASHBOARD' && (
            <div className="space-y-6">
              
              {/* Promotional welcoming card */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-borgona via-[#4F1522] to-marron text-white space-y-3 relative overflow-hidden shadow-xl shadow-terracota/5 border border-terracota-bright/20">
                <div className="z-10 relative space-y-2 max-w-lg">
                  <span className="text-[9px] font-mono font-black uppercase bg-dorado/20 text-dorado border border-dorado/30 px-2.5 py-1 rounded-full">Consola de Control de Andesmoda</span>
                  <h2 className="text-xl font-black font-display text-white">¡Bienvenido de vuelta, {loggedUser.name}!</h2>
                  <p className="text-xs opacity-85 leading-relaxed font-sans">El inventario unificado se encuentra sincronizado correctamente. Revisa el estado de la caja de POS, despacha las encomiendas pendientes del e-commerce y ajusta los precios o el abastecimiento técnico según sea necesario.</p>
                </div>
                
                {/* Visual backdrop deco */}
                <Building className="w-48 h-48 absolute -right-8 -bottom-10 opacity-10 rotate-12 text-dorado" />
              </div>

              {/* Aggregated indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs font-mono">
                
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-850' : 'bg-white border-amber-100'} shadow-sm`}>
                  <span className="text-[9px] text-zinc-400 block uppercase font-sans font-bold tracking-tight">Ventas Totales Facturadas</span>
                  <span className="text-xl font-black mt-1.5 block text-terracota font-display">
                    S/. {db.orders.filter(o => o.status !== 'CANCELADO').reduce((acc, o) => acc + o.total, 0).toFixed(2)}
                  </span>
                  <span className="text-[9px] text-zinc-500 mt-2 block font-sans">Suma agregada unificada</span>
                </div>

                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-850' : 'bg-white border-amber-100'} shadow-sm`}>
                  <span className="text-[9px] text-zinc-400 block uppercase font-sans font-bold tracking-tight">Prendas en Stock</span>
                  <span className="text-xl font-black mt-1.5 block text-dorado font-display">
                    {db.products.reduce((acc, p) => acc + p.stock, 0)} unidades
                  </span>
                  <span className="text-[9px] text-zinc-500 mt-2 block font-sans">Modelos totales: {db.products.length}</span>
                </div>

                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-850' : 'bg-white border-amber-100'} shadow-sm`}>
                  <span className="text-[9px] text-zinc-400 block uppercase font-sans font-bold tracking-tight">Registros de Clientes</span>
                  <span className="text-xl font-black mt-1.5 block text-emerald-600 dark:text-emerald-400 font-display">
                    {db.customers.length} personas
                  </span>
                  <span className="text-[9px] text-zinc-500 mt-2 block font-sans">POS y tienda web integrados</span>
                </div>

                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-850' : 'bg-white border-amber-100'} shadow-sm`}>
                  <span className="text-[9px] text-zinc-400 block uppercase font-sans font-bold tracking-tight">Arqueo de Turno de Caja</span>
                  <span className="text-xl font-black mt-1.5 block uppercase text-amber-500 text-xs font-display">
                    {db.cashRegisters.find(c => c.status === 'ABIERTA') ? '● ABIERTA (En servicio)' : '○ CERRADA'}
                  </span>
                  <span className="text-[9px] text-zinc-500 mt-2 block font-sans">Último cierre: {db.cashRegisters[0]?.openedAt ? new Date(db.cashRegisters[0].openedAt).toLocaleDateString() : 'Pendiente'}</span>
                </div>

              </div>

              {/* Quick Actions Shortcuts */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Atajos de Flujo Rápido Empresariales:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold font-sans">
                  
                  <button
                    onClick={() => setActiveView('POS_VIEW')}
                    className="p-4 rounded-2xl border border-dashed border-neutral-300 dark:border-zinc-800 hover:border-terracota-bright hover:bg-terracota/5 text-center transition-all cursor-pointer scale-hover"
                  >
                    <Building className="w-5 h-5 mx-auto mb-1.5 text-terracota-bright animate-bounce" />
                    <span>Abrir Pantalla de POS Caja</span>
                  </button>

                  <button
                    onClick={() => setActiveView('PRODUCTS')}
                    className="p-4 rounded-2xl border border-dashed border-neutral-300 dark:border-zinc-800 hover:border-dorado hover:bg-dorado/5 text-center transition-all cursor-pointer scale-hover"
                  >
                    <Shirt className="w-5 h-5 mx-auto mb-1.5 text-dorado" />
                    <span>Fijar Precios y Stocks</span>
                  </button>

                  <button
                    onClick={() => setActiveView('ORDERS')}
                    className="p-4 rounded-2xl border border-dashed border-neutral-300 dark:border-zinc-800 hover:border-emerald-600 hover:bg-emerald-55/10 text-center transition-all cursor-pointer scale-hover"
                  >
                    <History className="w-5 h-5 mx-auto mb-1.5 text-emerald-550" />
                    <span>Despachar Pedidos Web</span>
                  </button>

                  <button
                    onClick={() => setActiveView('REPORTS')}
                    className="p-4 rounded-2xl border border-dashed border-neutral-300 dark:border-zinc-800 hover:border-borgona hover:bg-borgona/5 text-center transition-all cursor-pointer scale-hover"
                  >
                    <BarChart4 className="w-5 h-5 mx-auto mb-1.5 text-borgona-intense" />
                    <span>Exportar Informes CSV</span>
                  </button>

                </div>
              </div>

              {/* Low Inventory notifications widgets */}
              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'} shadow-sm`}>
                <h4 className="text-xs font-black text-rose-500 uppercase mb-3 flex items-center gap-1.5"><Lightbulb className="w-4 h-4 text-rose-500 shrink-0" /> Suministro Crítico de Almacén</h4>
                <div className="space-y-3">
                  {db.products.filter(p => p.stock <= p.minStock).map(low => {
                    const isZero = low.stock === 0;
                    return (
                      <div key={low.id} className="flex justify-between items-center text-xs border-b pb-2 dark:border-zinc-850">
                        <span className="font-bold">{low.name} <span className="font-mono text-zinc-400 text-[10px]">({low.sku})</span></span>
                        <span className={`px-2 py-0.5 rounded font-sans font-bold text-[10px] uppercase ${isZero ? 'bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 border border-rose-500/15' : 'bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 border border-amber-500/15'}`}>
                          {isZero ? 'Sin Stock' : `${low.stock} unidades (Mín: ${low.minStock})`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* VIEW: 2. CLIENT WEB STORE (E-commerce) */}
          {activeView === 'CLIENT_STORE' && (
            <ClientStore
              products={db.products}
              categories={db.categories}
              shippingMethods={db.shippingMethods}
              coupons={db.coupons}
              banners={db.banners}
              promotions={db.promotions}
              orders={db.orders}
              userNomina={db.userNomina}
              currentUser={loggedUser}
              activeCustomer={loggedUser}
              onRefresh={loadDatabase}
              onOrderSuccess={loadDatabase}
              isDarkMode={isDarkMode}
              onLogin={(user: User) => {
                setLoggedUser(user);
                if (user.role === 'CLIENTE') {
                  setActiveView('CLIENT_STORE');
                } else if (user.role === 'VENDEDOR') {
                  setActiveView('POS_VIEW');
                } else {
                  setActiveView('ERP_DASHBOARD');
                }
              }}
              onLogout={handleSignOut}
            />
          )}

          {/* VIEW: 3. POINT OF SALE (POS) */}
          {activeView === 'POS_VIEW' && (
            <POSView
              products={db.products}
              customers={db.customers}
              cashRegisters={db.cashRegisters}
              currentUser={loggedUser}
              onSuccess={loadDatabase}
              isDarkMode={isDarkMode}
            />
          )}

          {/* VIEW: 4. PRODUCTS CATALOG LIST */}
          {activeView === 'PRODUCTS' && (
            <ProductsView
              products={db.products}
              categories={db.categories}
              currentUser={loggedUser}
              onRefresh={loadDatabase}
              isDarkMode={isDarkMode}
            />
          )}

          {/* VIEW: 5. CATEGORIES MANAGER */}
          {activeView === 'CATEGORIES' && (
            <CategoriesView
              categories={db.categories}
              currentUser={loggedUser}
              onRefresh={loadDatabase}
              isDarkMode={isDarkMode}
            />
          )}

          {/* VIEW: 6. INVENTORY KARDEX HISTORIC */}
          {activeView === 'INVENTORY' && (
            <InventoryView
              products={db.products}
              inventoryLogs={db.auditLogs
                .filter(l => l.action === 'STOCK_AJUSTE' || l.action === 'VENTA_POS' || l.action === 'VENTA_WEB' || l.action === 'PEDIDO_CANCELADO')
                .map(l => {
                  // Transform general logs to standard inventory representation helper
                  const parts = l.details.split(' | ');
                  const sku = parts[0] || 'SKU-?';
                  const pName = parts[1] || 'Prenda Andesmoda';
                  const type = l.action === 'PEDIDO_CANCELADO' ? 'ENTRADA' : (l.action.includes('VENTA') ? 'SALIDA' : 'AJUSTE') as 'ENTRADA' | 'SALIDA' | 'AJUSTE';
                  const qty = Number(parts[2]) || 1;
                  const prev = Number(parts[3]) || 0;
                  const nextVal = Number(parts[4]) || 0;
                  const prod = db.products.find(p => p.sku === sku);
                  
                  return {
                    id: l.id,
                    productId: prod ? prod.id : 'p-mock',
                    timestamp: l.timestamp,
                    sku,
                    productName: pName,
                    type,
                    quantity: qty,
                    previousStock: prev,
                    newStock: nextVal,
                    reason: parts[5] || l.details,
                    user: l.user
                  };
                })
              }
              isDarkMode={isDarkMode}
              onRefresh={loadDatabase}
            />
          )}

          {/* VIEW: 7. CUSTOMERS CRM LIST DIRECTORY */}
          {activeView === 'CUSTOMERS' && (
            <CustomersView
              customers={db.customers}
              currentUser={loggedUser}
              onRefresh={loadDatabase}
              isDarkMode={isDarkMode}
            />
          )}

          {/* VIEW: 8. LISTED ORDERS & TRACKING */}
          {activeView === 'ORDERS' && (
            <OrdersView
              orders={db.orders}
              currentUser={loggedUser}
              onRefresh={loadDatabase}
              isDarkMode={isDarkMode}
            />
          )}

          {/* VIEW: 9. SHIPPING METHOD WORKFLOWS */}
          {activeView === 'SHIPPING' && (
            <ShippingView
              shippingMethods={db.shippingMethods}
              currentUser={loggedUser}
              onRefresh={loadDatabase}
              isDarkMode={isDarkMode}
            />
          )}

          {/* VIEW: 10. MARKETING SETUPS */}
          {activeView === 'MARKETING' && (
            <MarketingView
              coupons={db.coupons}
              banners={db.banners}
              promotions={db.promotions}
              currentUser={loggedUser}
              onRefresh={loadDatabase}
              isDarkMode={isDarkMode}
            />
          )}

          {/* VIEW: 11. REPORTS BI SHEET ACTIONS */}
          {activeView === 'REPORTS' && (
            <ReportsView
              products={db.products}
              orders={db.orders}
              customers={db.customers}
              isDarkMode={isDarkMode}
              onRefresh={loadDatabase}
            />
          )}

          {/* VIEW: 12. FINANCE DELEGATED CAJA LOGS */}
          {activeView === 'FINANCE' && (
            <FinanceView
              financeLogs={db.financeLogs}
              cashRegisters={db.cashRegisters}
              currentUser={loggedUser}
              onRefresh={loadDatabase}
              isDarkMode={isDarkMode}
            />
          )}

          {/* VIEW: 13. NOMINA SYSTEM OPERATORS */}
          {activeView === 'USERS' && (
            <UsersView
              users={db.userNomina}
              currentUser={loggedUser}
              onRefresh={loadDatabase}
              isDarkMode={isDarkMode}
            />
          )}

          {/* VIEW: 14. INVIOLABLE SECURITY AUDIT TRACKINGS */}
          {activeView === 'AUDIT' && (
            <AuditView
              auditLogs={db.auditLogs}
              onRefresh={loadDatabase}
              isDarkMode={isDarkMode}
            />
          )}

          {/* VIEW: 15. USER PROFILE CRUD */}
          {activeView === 'PROFILE' && (
            <ProfileView
              currentUser={loggedUser}
              onRefresh={loadDatabase}
              isDarkMode={isDarkMode}
            />
          )}

          {/* DYNAMIC IA CHATBOT FOR REAL-TIME DECISION MAKING */}
          {db && (
            <AIChatbot 
              user={loggedUser}
              db={{
                products: db.products || [],
                sales: db.orders || [],
                customers: db.customers || [],
                inventory: db.inventoryLogs || [],
                categories: db.categories || []
              }} 
              isDarkMode={isDarkMode} 
            />
          )}

          {/* CUSTOM TOAST COMPONENT */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="fixed top-6 right-6 z-[9999] max-w-sm w-full"
              >
                <div className={`p-4 rounded-2xl border shadow-xl flex items-start gap-3 backdrop-blur-md ${
                  isDarkMode 
                    ? 'bg-zinc-900/95 border-amber-600/20 text-white' 
                    : 'bg-white/95 border-amber-650/10 text-zinc-900'
                }`}>
                  <div className="mt-0.5 shrink-0">
                    {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                    {toast.type === 'error' && <XCircle className="w-5 h-5 text-rose-500" />}
                    {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                    {toast.type === 'cancelled' && <X className="w-5 h-5 text-zinc-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-normal">{toast.message}</p>
                  </div>
                  <button
                    onClick={() => setToast(null)}
                    className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-400 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CUSTOM CONFIRMATION DIALOG MODAL (Andean Style) */}
          <AnimatePresence>
            {confirmModal && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => confirmModal.onCancel?.()}
                  className="absolute inset-0 bg-black/60 backdrop-blur-xs"
                />

                {/* Modal Container */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.93, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.93, y: 15 }}
                  className={`relative max-w-md w-full p-6 rounded-3xl border shadow-2xl overflow-hidden font-sans ${
                    isDarkMode 
                      ? 'bg-zinc-950 border-zinc-800 text-white' 
                      : 'bg-amber-50 border-amber-200 text-zinc-900'
                  }`}
                >
                  {/* Decorative Andean subtle top accent line */}
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-terracota via-dorado to-borgona animate-pulse" />

                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl shrink-0 ${
                      confirmModal.isMassive 
                        ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-600' 
                        : 'bg-amber-100 dark:bg-amber-950/30 text-amber-500'
                    }`}>
                      <AlertTriangle className="w-6 h-6 animate-bounce" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-sm font-black tracking-tight font-display text-zinc-950 dark:text-zinc-50 uppercase">
                        {confirmModal.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-zinc-650 dark:text-zinc-350">
                        {confirmModal.message}
                      </p>
                    </div>
                  </div>

                  {/* Warning banner for massive deletes */}
                  {confirmModal.isMassive && (
                    <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-955/15 border border-rose-500/10 text-[11px] font-bold text-rose-700 dark:text-rose-400 rounded-xl leading-relaxed flex items-center gap-2">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>Está a punto de eliminar múltiples registros. Esta acción no se puede deshacer.</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => confirmModal.onCancel?.()}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                        isDarkMode 
                          ? 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300' 
                          : 'bg-white border border-neutral-300 hover:bg-neutral-100 text-zinc-700'
                      }`}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={confirmModal.onConfirm}
                      className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition text-white shadow-lg cursor-pointer ${
                        confirmModal.isMassive 
                          ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/10' 
                          : 'bg-terracota-bright hover:bg-terracota shadow-terracota/10'
                      }`}
                    >
                      {confirmModal.isMassive ? 'Eliminar Todo' : 'Eliminar'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      </main>

    </div>
  );
}
