import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { updateUser } from '../api';
import { 
  UserCheck, Shield, KeyRound, Clock, Mail, CheckCircle, Sparkles, 
  Database, RefreshCw, Server, AlertTriangle, Cpu, Terminal,
  Copy, ExternalLink, Play, Check, ChevronRight
} from 'lucide-react';

interface ProfileViewProps {
  currentUser: User;
  onRefresh: () => void;
  isDarkMode: boolean;
}

export default function ProfileView({
  currentUser,
  onRefresh,
  isDarkMode
}: ProfileViewProps) {
  // Form fields
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200');
  const [phone, setPhone] = useState('987 654 321');
  const [location, setLocation] = useState('Lima, Perú');
  const [message, setMessage] = useState('');

  // Supabase connection and guide states
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [migrationLogs, setMigrationLogs] = useState<string[]>([]);
  const [migrating, setMigrating] = useState(false);
  const [sqlSchemaText, setSqlSchemaText] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTabGuide, setActiveTabGuide] = useState<'pasos' | 'sql_raw'>('pasos');

  const fetchSupabaseStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/supabase/status');
      const data = await res.json();
      setSupabaseStatus(data);
    } catch (err) {
      console.error(err);
      setSupabaseStatus({
        configured: false,
        status: 'ERROR',
        message: 'No se pudo contactar con los endpoints del servidor de AndesModa para verificar el estado de Supabase. Asegúrate de que el backend Express esté corriendo.'
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchSupabaseStatus();
    
    // Fetch SQL schema directly from the local file so they can copy it with 1 click!
    fetch('/andesmoda_schema.sql')
      .then(r => r.text())
      .then(text => setSqlSchemaText(text))
      .catch(() => setSqlSchemaText('-- No se pudo recuperar el archivo local andesmoda_schema.sql. Revisa si existe en la raíz de tu proyecto como andesmoda_schema.sql'));
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
    (window as any).showToast?.('Esquema SQL copiado al portapapeles correctamente.', 'success');
  };

  const handleMigrate = async () => {
    setMigrating(true);
    setMigrationLogs(['Iniciando migración de datos unificados...', 'Leyendo base de datos local JSON...']);
    try {
      const response = await fetch('/api/supabase/migrate', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        setMigrationLogs(prev => [
          ...prev, 
          ...data.logs, 
          '🎉 ¡SINTONIZACIÓN Y MIGRACIÓN COMPLETADA CON ÉXITO!', 
          'Todos tus datos locales fueron clonados de manera segura en tu base de datos en la nube de Supabase.'
        ]);
        (window as any).showToast?.(data.message, 'success');
        fetchSupabaseStatus();
      } else {
        const warnings = data.warnings || [];
        setMigrationLogs(prev => [
          ...prev, 
          ...(data.logs || []),
          ...warnings.map((w: string) => `⚠️ ADVERTENCIA: ${w}`),
          '❌ La migración falló en una o más tablas.',
          'Revisa si creaste todas las tablas en Supabase ejecutando el script SQL primero.'
        ]);
        (window as any).showToast?.(data.message, 'warning');
      }
    } catch (err: any) {
      setMigrationLogs(prev => [...prev, `❌ Error de red: ${err.message}`]);
      (window as any).showToast?.('Fallo al migrar los datos a Supabase.', 'error');
    } finally {
      setMigrating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name,
        email
      };
      if (password.trim()) {
        payload.password = password;
      }
      await updateUser(currentUser.id, payload, currentUser);
      onRefresh();
      (window as any).showToast?.('Registro actualizado correctamente.', 'success');
    } catch {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      
      {/* View Header */}
      <div>
        <h2 className="text-xl font-black text-amber-600">Mi Perfil de Operador y Conexiones</h2>
        <p className="text-xs text-neutral-500 font-sans">Gestiona tus credenciales personales y vincula tu base de datos unificada de AndesModa con la nube de Supabase.</p>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-100 text-emerald-850 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-pulse">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Two-Column Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: User profile editing form */}
        <div className={`col-span-1 lg:col-span-5 p-6 rounded-3xl border h-fit space-y-6 ${
          isDarkMode ? 'bg-[#151515] border-zinc-900 text-white' : 'bg-white border-neutral-100 shadow-sm'
        }`}>
          <div className="flex items-center gap-4 border-b border-neutral-150 dark:border-zinc-800 pb-5">
            <img src={avatar} alt={currentUser.name} className="w-16 h-16 rounded-2xl object-cover bg-amber-100" />
            <div>
              <h3 className="font-extrabold text-sm">{currentUser.name}</h3>
              <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded tracking-wider mt-1 inline-block">
                Rango ERP: {currentUser.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            <div className="space-y-3">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nombre Comercial Registrado:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-sans font-bold text-neutral-800 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Celular Corporativo:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-mono"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Correo Electrónico (Login):</label>
                <input
                  type="email"
                  required
                  value={email}
                  disabled
                  title="El correo principal no puede modificarse por seguridad de nómina"
                  className="w-full p-2.5 border rounded-xl bg-neutral-100 dark:bg-zinc-900 dark:border-zinc-800 font-mono text-zinc-400 dark:text-zinc-505 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Localidad de Operaciones:</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>
            </div>

            <div className="p-3.5 bg-neutral-50 dark:bg-zinc-850 rounded-2xl space-y-3 border border-amber-500/10">
              <h4 className="font-bold flex items-center gap-1 text-[11px] text-amber-600 uppercase">
                <KeyRound className="w-3.5 h-3.5" /> Clave de Acceso
              </h4>
              <p className="text-[10px] text-zinc-400 leading-tight">Si deseas modificar tu contraseña de inicio sesión en AndesModa ERP, digítala aquí:</p>
              <input
                type="password"
                placeholder="Ingresar nueva contraseña segura"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded-xl bg-neutral-100 dark:bg-zinc-800 dark:border-zinc-750 font-mono"
              />
            </div>

            <div className="flex justify-end pt-2 text-xs">
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-500 text-white font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-600/15"
              >
                <UserCheck className="w-4 h-4" /> Guardar Cambios
              </button>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN: Supabase Integration Panel */}
        <div className="col-span-1 lg:col-span-7 space-y-6">
          
          {/* SUPABASE STATUS CARD */}
          <div className={`p-6 rounded-3xl border ${
            isDarkMode ? 'bg-[#151515] border-zinc-900' : 'bg-white border-neutral-100 shadow-sm'
          } space-y-4`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-mono font-black uppercase text-amber-500 bg-amber-505/10 px-2.5 py-0.5 rounded-full">
                  INTEGRACIÓN DE BASE DE DATOS
                </span>
                <h3 className="text-base font-black mt-1 flex items-center gap-1.5">
                  <Database className="w-5 h-5 text-emerald-500" /> Sincronización con Supabase (PostgreSQL)
                </h3>
              </div>
              <button
                onClick={fetchSupabaseStatus}
                disabled={loadingStatus}
                className={`p-2 rounded-xl text-zinc-450 hover:bg-neutral-150 dark:hover:bg-zinc-800 transition ${
                  loadingStatus ? 'animate-spin' : ''
                }`}
                title="Comprobar conexión"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Connection State Panel */}
            {loadingStatus ? (
              <div className="p-4 bg-amber-500/5 text-center rounded-2xl animate-pulse text-zinc-400 text-xs">
                Verificando estado de credenciales de Supabase en el servidor...
              </div>
            ) : supabaseStatus ? (
              <div className="space-y-4">
                
                {/* 1. Status Badges */}
                {supabaseStatus.status === 'CONNECTED' ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span className="text-xs font-black text-emerald-500 uppercase tracking-wider">
                        ● CONEXIÓN ESTABLE CON SUPABASE (NUBE ACTIVA)
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      {supabaseStatus.message} Las transacciones están preparadas para ser archivadas de manera confiable.
                    </p>
                    {supabaseStatus.url && (
                      <span className="text-[10px] font-mono text-zinc-500 block break-all">
                        Host: {supabaseStatus.url}
                      </span>
                    )}

                    {/* Table row counts */}
                    {supabaseStatus.counts && (
                      <div className="pt-2 border-t border-emerald-500/10 mt-2">
                        <span className="text-[9px] font-bold text-zinc-400 block uppercase mb-1">
                          Registros en la Nube:
                        </span>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-zinc-900/40 p-2 rounded-xl">
                            <span className="text-[10px] text-zinc-400 block">Prendas</span>
                            <span className="text-xs font-mono font-black text-emerald-400">
                              {supabaseStatus.counts.products}
                            </span>
                          </div>
                          <div className="bg-zinc-900/40 p-2 rounded-xl">
                            <span className="text-[10px] text-zinc-400 block">Ventas</span>
                            <span className="text-xs font-mono font-black text-emerald-400">
                              {supabaseStatus.counts.orders}
                            </span>
                          </div>
                          <div className="bg-zinc-900/40 p-2 rounded-xl">
                            <span className="text-[10px] text-zinc-400 block">Clientes</span>
                            <span className="text-xs font-mono font-black text-emerald-400">
                              {supabaseStatus.counts.customers}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : supabaseStatus.status === 'ERROR' ? (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span className="text-xs font-black text-rose-500 uppercase tracking-wider">
                        ⚠️ ERROR EN LA CONEXIÓN
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-350 leading-relaxed font-sans">
                      {supabaseStatus.message}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      Recuerda que debes crear el esquema de tablas en Supabase para que el servidor pueda mapear los objetos correctamente.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-zinc-900 border border-neutral-300/10 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                      <span className="text-xs font-black uppercase tracking-wider">
                        ⚪ SIN CONFIGURAR (MODO MOCK EN DATA/DB.JSON)
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      El servidor está operando mediante el archivo local JSON de alta velocidad (`data/db.json`). Para conectar tu base de datos relacional de Supabase y asegurar que tu negocio mantenga persistencia duradera, sigue la guía a continuación de 0 a 100.
                    </p>
                  </div>
                )}

              </div>
            ) : (
              <div className="p-4 bg-zinc-800/10 text-center rounded-2xl text-zinc-400 text-xs">
                Cargando estado de la base de datos...
              </div>
            )}
          </div>

          {/* DYNAMIC SETUP GUIDE & SQL PANEL */}
          <div className={`p-6 rounded-3xl border overflow-hidden ${
            isDarkMode ? 'bg-[#151515] border-zinc-900' : 'bg-white border-neutral-100 shadow-sm'
          } space-y-4`}>
            
            <div className="flex border-b border-zinc-800 pb-2 gap-4">
              <button
                onClick={() => setActiveTabGuide('pasos')}
                className={`py-1 text-xs font-black border-b-2 transition ${
                  activeTabGuide === 'pasos' 
                    ? 'border-amber-500 text-amber-500' 
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                Guía Paso a Paso (De 0)
              </button>
              <button
                onClick={() => setActiveTabGuide('sql_raw')}
                className={`py-1 text-xs font-black border-b-2 transition ${
                  activeTabGuide === 'sql_raw' 
                    ? 'border-amber-500 text-amber-500' 
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                Ver/Copiar Código SQL de Tablas
              </button>
            </div>

            {/* TAB 1: Step by step steps */}
            {activeTabGuide === 'pasos' && (
              <div className="space-y-4 text-xs">
                
                <div className="space-y-3 font-sans text-zinc-400">
                  
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-550/10 border border-amber-500 text-amber-500 font-bold flex items-center justify-center text-[10px] mt-0.5 shrink-0">1</span>
                    <div className="space-y-1">
                      <p className="font-extrabold text-white">Crea tu cuenta y proyecto en Supabase</p>
                      <p className="text-[10px]">
                        Ingresa a <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-amber-550 underline flex-inline items-center gap-0.5">supabase.com <ExternalLink className="w-2.5 h-2.5 inline" /></a>, inicia sesión o crea una cuenta gratuita, y crea un nuevo proyecto llamado <strong className="text-zinc-300">AndesModa ERP</strong>. Elige una contraseña robusta para la base de datos PostgreSQL.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-550/10 border border-amber-500 text-amber-500 font-bold flex items-center justify-center text-[10px] mt-0.5 shrink-0">2</span>
                    <div className="space-y-1">
                      <p className="font-extrabold text-white">Ejecuta las tablas en el SQL Editor</p>
                      <p className="text-[10px]">
                        En tu proyecto de Supabase, ve a la sección <strong className="text-zinc-300">SQL Editor</strong> en la barra lateral izquierda, clickea en "New Query". Alterna a la pestaña contigua arriba ("Ver/Copiar Código SQL de Tablas") de esta pantalla, presiona el botón copiar, pégalo en Supabase y haz click en <span className="bg-emerald-650 text-white px-2 py-0.5 rounded font-bold uppercase text-[9px]">RUN</span>. Esto creará el esquema con la integridad correcta de AndesModa.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-550/10 border border-amber-500 text-amber-500 font-bold flex items-center justify-center text-[10px] mt-0.5 shrink-0">3</span>
                    <div className="space-y-1">
                      <p className="font-extrabold text-white">Registra tus claves de entorno en AI Studio</p>
                      <p className="text-[10px]">
                        En tu panel de Supabase ve a <strong className="text-zinc-300">Project Settings &gt; API</strong>. Obtén la <strong className="text-zinc-300">Project URL</strong> y la clave <strong className="text-zinc-300">anon public API key</strong>. Clicka el botón de Settings (Rueda de engranaje) en la esquina de Google AI Studio, abre <strong className="text-zinc-300">Secrets (Secrets Panel)</strong> y agrega las siguientes variables:
                      </p>
                      <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] font-mono select-all text-amber-500 space-y-1 mt-1">
                        <div>SUPABASE_URL="tu_project_url_completa"</div>
                        <div>SUPABASE_ANON_KEY="tu_anon_public_key"</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-550/10 border border-amber-500 text-amber-500 font-bold flex items-center justify-center text-[10px] mt-0.5 shrink-0">4</span>
                    <div className="space-y-1">
                      <p className="font-extrabold text-white">Sincronización Automática Inmediata</p>
                      <p className="text-[10px]">
                        ¡Ya no requiere migración manual! El sistema ahora guarda cada dato de forma inmediata y directa en Supabase. No se permite almacenamiento temporal en local.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Automation migration triggers (manual trigger is now disabled/removed as per strict cloud rules) */}
                {supabaseStatus && supabaseStatus.configured ? (
                  <div className="pt-3 border-t border-zinc-800 space-y-3">
                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-[11px] text-zinc-300 text-center leading-relaxed font-sans">
                      🟢 <strong className="text-emerald-400 block mb-1">¡Sincronización Real Automática Activa!</strong> 
                      Cada acción de creación (CREATE/INSERT) de productos, clientes, ventas y categorías se envía de manera obligatoria y en tiempo real a Supabase. La migración manual ha sido deshabilitada por seguridad de integridad de datos.
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-500/5 rounded-2xl border border-rose-500/10 text-[10px] text-zinc-400 text-center leading-normal font-sans">
                    💡 <strong className="text-rose-450">Conexión de Seguridad:</strong> Debes configurar tus Secrets <code className="text-amber-500 font-mono">SUPABASE_URL</code> y <code className="text-amber-500 font-mono">SUPABASE_ANON_KEY</code>. Cualquier operación de guardado fallará inmediatamente si Supabase no está conectado de forma correcta, previniendo datos locales huérfanos.
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: SQL Editor clipboard copy tab */}
            {activeTabGuide === 'sql_raw' && (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center bg-zinc-900 px-4 py-2 rounded-2xl">
                  <span className="text-[10px] text-zinc-400 font-mono">andesmoda_schema.sql (PostgreSQL 15-17)</span>
                  <button
                    onClick={handleCopySql}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSql ? 'Copiado' : 'Copiar Esquema SQL'}
                  </button>
                </div>
                
                <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                  Copia este código y pégalo directamente en la consola de tu base de datos de Supabase. El script contiene llaves primarias, restricciones de verificación para evitar compras con sobrestock negativo, índices optimizadores, semillas iniciales preinstaladas y extensiones UUID:
                </p>

                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-2xl font-mono text-[9px] max-h-60 overflow-y-auto text-zinc-400 whitespace-pre scrollbar-thin">
                  {sqlSchemaText}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

