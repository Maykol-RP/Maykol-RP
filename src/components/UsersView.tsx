import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Shield, ToggleLeft, ToggleRight, X, KeyRound, UserMinus } from 'lucide-react';
import { User } from '../types';
import { createUser, updateUser, deleteUser } from '../api';

interface UsersViewProps {
  users: User[];
  currentUser: any;
  onRefresh: () => void;
  isDarkMode: boolean;
}

export default function UsersView({
  users,
  currentUser,
  onRefresh,
  isDarkMode
}: UsersViewProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ADMINISTRADOR' | 'VENDEDOR' | 'CLIENTE'>('VENDEDOR');
  const [status, setStatus] = useState<'ACTIVO' | 'BLOQUEADO'>('ACTIVO');

  const handleOpenAdd = () => {
    setSelectedUser(null);
    setEmail('');
    setPassword('AndesModa2026!');
    setName('');
    setRole('VENDEDOR');
    setStatus('ACTIVO');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setSelectedUser(u);
    setEmail(u.email);
    setPassword(''); // keep blank unless modifying
    setName(u.name);
    setRole(u.role);
    setStatus(u.status);
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { email, password, name, role, status };
      await createUser(payload, currentUser);
      setIsAddOpen(false);
      onRefresh();
      (window as any).showToast?.('Registro creado correctamente.', 'success');
    } catch (err: any) {
      (window as any).showToast?.(err.message || 'Error al procesar la solicitud.', 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const payload: any = { email, name, role, status };
      if (password.trim()) {
        payload.password = password; // update password if specified
      }
      await updateUser(selectedUser.id, payload, currentUser);
      setIsEditOpen(false);
      setSelectedUser(null);
      onRefresh();
      (window as any).showToast?.('Registro actualizado correctamente.', 'success');
    } catch {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  const handleToggleBlock = async (u: User) => {
    if (u.id === currentUser.id) {
      (window as any).showToast?.('Prohibido bloquear tu propio usuario activo en sesión.', 'warning');
      return;
    }
    try {
      const nextS = u.status === 'ACTIVO' ? 'BLOQUEADO' : 'ACTIVO';
      await updateUser(u.id, { status: nextS }, currentUser);
      onRefresh();
      (window as any).showToast?.('Registro actualizado correctamente.', 'success');
    } catch {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (id === currentUser.id) {
      (window as any).showToast?.('Prohibido autoliquidarse de Andesmoda ERP.', 'warning');
      return;
    }
    (window as any).askConfirm?.({
      title: '¿Está seguro de que desea eliminar este registro?',
      message: `Está a punto de eliminar permanentemente al empleado / usuario "${name}" de AndesModa ERP.`,
      onConfirm: async () => {
        try {
          await deleteUser(id, currentUser);
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
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-amber-600">Nómina de Operadores & Cargos</h2>
          <p className="text-xs text-neutral-500">Administración de credenciales de empleados y restricciones de seguridad.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-amber-600 hover:bg-amber-500 font-bold text-white text-xs py-2.5 px-4 rounded-xl flex items-center gap-1 cursor-pointer shadow-lg"
        >
          <Plus className="w-4 h-4" /> Registrar Nuevo Operador
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
        {users.map(u => {
          const isMe = u.id === currentUser.id;
          const isBlocked = u.status === 'BLOQUEADO';
          const isAdmin = u.role === 'ADMINISTRADOR';

          return (
            <div
              key={u.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all duration-150 ${
                isBlocked 
                  ? 'bg-red-50/50 border-red-200 dark:bg-zinc-900 dark:border-zinc-800 opacity-75' 
                  : (isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 hover:shadow-lg shadow-sm')
              }`}
            >
              
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${isAdmin ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                    <Shield className="w-5 h-5" />
                  </div>

                  {/* Block Operator toggle */}
                  <button
                    onClick={() => handleToggleBlock(u)}
                    disabled={isMe}
                    title={isMe ? 'No puedes auto-bloquearte' : isBlocked ? 'Desbloquear' : 'Bloquear'}
                    className={`cursor-pointer transition-transform disabled:opacity-30`}
                  >
                    {isBlocked ? (
                      <ToggleLeft className="w-8 h-8 text-red-600" />
                    ) : (
                      <ToggleRight className="w-8 h-8 text-green-600" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 font-sans">
                  <h4 className="font-extrabold text-sm text-neutral-800 dark:text-zinc-100">{u.name}</h4>
                  {isMe && <span className="bg-amber-500 text-white font-sans text-[8px] px-1.5 py-0.5 rounded uppercase font-black">Mis credenciales</span>}
                </div>
                <p className="font-mono text-[10px] text-zinc-400 mt-0.5">{u.email}</p>
                <div className="mt-3 block font-mono">
                  <span className="text-[10px] text-zinc-400 font-sans block">Privilegio Contable:</span>
                  <span className={`text-[10px] uppercase font-bold py-0.5 px-2.5 rounded-md inline-block mt-1 ${isAdmin ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400' : 'bg-teal-100 text-teal-850 dark:bg-teal-950/20 dark:text-teal-400'}`}>
                    {u.role}
                  </span>
                </div>
              </div>

              {/* Actions footer */}
              <div className="border-t border-neutral-100 dark:border-zinc-800 pt-3 mt-4 flex justify-between items-center">
                <span className={`font-bold text-[9px] ${isBlocked ? 'text-red-600' : 'text-emerald-600'}`}>
                  {u.status}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(u)}
                    className="p-1 text-emerald-600 hover:bg-neutral-100 dark:hover:bg-zinc-850 rounded cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(u.id, u.name)}
                    disabled={isMe}
                    className="p-1 text-red-600 hover:bg-neutral-150 dark:hover:bg-zinc-850 rounded cursor-pointer disabled:opacity-20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* DIALOG 1: Add User */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`max-w-sm w-full p-6 rounded-2xl shadow-xl ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-sm text-amber-600 flex items-center gap-1.5"><Shield className="w-4 h-4 animate-bounce" /> Contratar Personal</h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 hover:bg-zinc-850 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nombre Completo del Operador:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sofía Quispe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-bold"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1 col-span-1">Correo Electrónico (Login):</label>
                <input
                  type="email"
                  required
                  placeholder="ej: sofia@andesmoda.pe"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1 flex items-center gap-1"><KeyRound className="w-3.5 h-3.5 text-amber-600" /> Contraseña de Acceso:</label>
                <input
                  type="text"
                  required
                  placeholder="Contraseña robusta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-mono font-bold text-center"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Cargo Roles:</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                  >
                    <option value="VENDEDOR">Vendedor / Cajero</option>
                    <option value="ADMINISTRADOR">Administrador Maestro</option>
                    <option value="CLIENTE">Cliente Standard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1 col-span-1">Estado de Cuenta:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="BLOQUEADO">BLOQUEADO</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-3 py-1.5 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white font-bold rounded">Contratar Operario</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG 2: Edit User */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`max-w-sm w-full p-6 rounded-2xl shadow-xl ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-sm text-emerald-600 flex items-center gap-1.5"><Shield className="w-4 h-4" /> Modificar Operador</h3>
              <button onClick={() => { setIsEditOpen(false); setSelectedUser(null); }} className="p-1 hover:bg-zinc-850 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-bold"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1 font-mono">Correo de Configuración:</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1 font-mono">Actualizar Contraseña (Opcional, dejar vacio):</label>
                <input
                  type="text"
                  placeholder="Mantener contraseña anterior"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Cargos:</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                  >
                    <option value="VENDEDOR">Vendedor</option>
                    <option value="ADMINISTRADOR">Administrador Maestro</option>
                    <option value="CLIENTE">Cliente Standard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Cuenta:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="BLOQUEADO">BLOQUEADO</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => { setIsEditOpen(false); setSelectedUser(null); }} className="px-3 py-1.5 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
