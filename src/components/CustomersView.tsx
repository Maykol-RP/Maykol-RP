import React, { useState } from 'react';
import { Plus, Edit2, Trash2, UserPlus, Phone, Mail, MapPin, X, Check } from 'lucide-react';
import { Customer } from '../types';
import { createCustomer, updateCustomer, deleteCustomer } from '../api';

interface CustomersViewProps {
  customers: Customer[];
  currentUser: any;
  onRefresh: () => void;
  isDarkMode: boolean;
}

export default function CustomersView({
  customers,
  currentUser,
  onRefresh,
  isDarkMode
}: CustomersViewProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [dni, setDni] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleOpenAdd = () => {
    setDni('');
    setName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { dni, name, lastName, email, phone, address };
      await createCustomer(payload, currentUser);
      setIsAddOpen(false);
      onRefresh();
      (window as any).showToast?.('Registro creado correctamente.', 'success');
    } catch (err) {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  const handleOpenEdit = (c: Customer) => {
    setSelectedCustomer(c);
    setDni(c.dni);
    setName(c.name);
    setLastName(c.lastName);
    setEmail(c.email);
    setPhone(c.phone);
    setAddress(c.address);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      const payload = { dni, name, lastName, email, phone, address };
      await updateCustomer(selectedCustomer.id, payload, currentUser);
      setIsEditOpen(false);
      setSelectedCustomer(null);
      onRefresh();
      (window as any).showToast?.('Registro actualizado correctamente.', 'success');
    } catch (err) {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    (window as any).askConfirm?.({
      title: '¿Está seguro de que desea eliminar este registro?',
      message: `Está a punto de borrar el perfil del cliente "${name}". Esta acción es irreversible.`,
      onConfirm: async () => {
        try {
          await deleteCustomer(id, currentUser);
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
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-amber-600">Cartera de Clientes Registrados</h2>
          <p className="text-xs text-neutral-500">Listado integrado de clientes de tienda física (POS) y tienda virtual.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
        >
          <UserPlus className="w-4 h-4" /> Registrar Cliente Nuevo
        </button>
      </div>

      <div className={`overflow-hidden rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-sm'}`}>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className={`${isDarkMode ? 'bg-zinc-850' : 'bg-neutral-50'} text-zinc-500 font-bold uppercase`}>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800">DNI / ID</th>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800">Nombre Cliente</th>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800">Información de Contacto</th>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800">Domicilio Fiscal/Despacho</th>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800 text-center">Compras Totales</th>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800 text-right font-mono">Gasto Acumulado</th>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800">
            {customers.map(c => {
              const isVIP = c.totalSpent > 150 || c.orderCount >= 2;
              return (
                <tr key={c.id} className="hover:bg-neutral-50/50 dark:hover:bg-zinc-800/10 transition-all">
                  <td className="p-4 font-mono font-bold whitespace-nowrap text-zinc-400">{c.dni || 'Sin DNI'}</td>
                  
                  {/* Name block */}
                  <td className="p-4 font-bold text-neutral-800 dark:text-zinc-100">
                    <div className="flex items-center gap-2">
                      <span>{c.name} {c.lastName}</span>
                      {isVIP && (
                        <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 text-[8px] font-sans font-black uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                          VIP
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Contact details */}
                  <td className="p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                      <Phone className="w-3.5 h-3.5 text-amber-600" />
                      <span>{c.phone || '--'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-mono text-[10px]">
                      <Mail className="w-3.5 h-3.5 text-amber-600" />
                      <span>{c.email || '--'}</span>
                    </div>
                  </td>

                  {/* Address */}
                  <td className="p-4 text-zinc-500 dark:text-zinc-400 max-w-xs truncate" title={c.address}>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{c.address || 'Pendiente de registrar'}</span>
                    </div>
                  </td>

                  {/* Order count */}
                  <td className="p-4 text-center font-mono font-bold">
                    <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-neutral-700 dark:text-zinc-300">
                      {c.orderCount} ord
                    </span>
                  </td>

                  {/* Total spent accumulated */}
                  <td className="p-4 text-right font-mono font-bold text-amber-600 text-sm whitespace-nowrap">
                    S/. {c.totalSpent.toFixed(2)}
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1 text-emerald-600 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, `${c.name} ${c.lastName}`)}
                        className="p-1 text-red-600 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`max-w-md w-full p-6 rounded-2xl shadow-xl ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-sm text-amber-600 flex items-center gap-1.5"><UserPlus className="w-4 h-4" /> Registrar Cliente</h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 hover:bg-zinc-850 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1 col-span-1">DNI / CE:</label>
                  <input
                    type="text"
                    required
                    placeholder="Documento nacional"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Nombres:</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombres"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Apellidos:</label>
                  <input
                    type="text"
                    required
                    placeholder="Apellidos completos"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Celular de Contacto:</label>
                  <input
                    type="tel"
                    placeholder="ej: 987654321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  placeholder="ej: cliente@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Dirección de Despacho Principal:</label>
                <input
                  type="text"
                  placeholder="ej: Urb. Los Laureles 102, Surco"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-3 py-1.5 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white font-bold rounded">Guardar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`max-w-md w-full p-6 rounded-2xl shadow-xl ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-sm text-emerald-600 flex items-center gap-1.5"><UserPlus className="w-4 h-4" /> Editar Cliente</h3>
              <button onClick={() => { setIsEditOpen(false); setSelectedCustomer(null); }} className="p-1 hover:bg-zinc-850 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1 col-span-1">DNI / CE:</label>
                  <input
                    type="text"
                    required
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Nombres:</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Apellidos:</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Celular de Contacto:</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Dirección de Despacho Principal:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => { setIsEditOpen(false); setSelectedCustomer(null); }} className="px-3 py-1.5 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
