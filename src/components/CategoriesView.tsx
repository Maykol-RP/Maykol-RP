import React, { useState } from 'react';
import { Plus, Edit2, Trash2, FolderPlus, Tag, X } from 'lucide-react';
import { Category } from '../types';
import { createCategory, updateCategory, deleteCategory } from '../api';

interface CategoriesViewProps {
  categories: Category[];
  currentUser: any;
  onRefresh: () => void;
  isDarkMode: boolean;
}

export default function CategoriesView({
  categories,
  currentUser,
  onRefresh,
  isDarkMode
}: CategoriesViewProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createCategory(name, description, currentUser);
      setIsAddOpen(false);
      setName('');
      setDescription('');
      onRefresh();
      (window as any).showToast?.('Registro creado correctamente.', 'success');
    } catch (err) {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  const handleEditOpen = (c: Category) => {
    setSelectedCategory(c);
    setName(c.name);
    setDescription(c.description);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !name.trim()) return;
    try {
      await updateCategory(selectedCategory.id, name, description, currentUser);
      setIsEditOpen(false);
      setSelectedCategory(null);
      setName('');
      setDescription('');
      onRefresh();
      (window as any).showToast?.('Registro actualizado correctamente.', 'success');
    } catch (err) {
      (window as any).showToast?.('Error al procesar la solicitud.', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    (window as any).askConfirm?.({
      title: '¿Está seguro de que desea eliminar este registro?',
      message: `Está a punto de borrar la categoría "${name}". Los productos asociados perderán esta agrupación.`,
      onConfirm: async () => {
        try {
          await deleteCategory(id, currentUser);
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
          <h2 className="text-xl font-black text-amber-600">Categorías de Ropa</h2>
          <p className="text-xs text-neutral-500">Agrupador de prendas de vestir de alta gama.</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
        >
          <Plus className="w-4 h-4" /> Crear Nueva Categoría
        </button>
      </div>

      <div className={`overflow-hidden rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-100 shadow-sm'}`}>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className={`${isDarkMode ? 'bg-zinc-850' : 'bg-neutral-50'} text-zinc-500 font-bold uppercase`}>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800">Identificador</th>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800">Nombre Categoría</th>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800">Enlace Slug Web</th>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800">Descripción Ampliada</th>
              <th className="p-4 border-b border-neutral-200 dark:border-zinc-800 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800">
            {categories.map(c => (
              <tr key={c.id} className="hover:bg-neutral-50/50 dark:hover:bg-zinc-800/10">
                <td className="p-4 font-mono text-zinc-400 font-bold">{c.id}</td>
                <td className="p-4 font-bold text-neutral-800 dark:text-zinc-100">{c.name}</td>
                <td className="p-4 font-mono text-amber-600">/{c.slug}</td>
                <td className="p-4 text-zinc-500 dark:text-zinc-400 max-w-sm line-clamp-2 truncate">{c.description || 'Sin explicación'}</td>
                <td className="p-4 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleEditOpen(c)}
                      className="p-1 text-emerald-600 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="p-1 text-red-600 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`max-w-sm w-full p-6 rounded-2xl shadow-xl ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-sm text-amber-600 flex items-center gap-1.5"><FolderPlus className="w-4 h-4" /> Agregar Categoría</h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 hover:bg-zinc-850 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nombre Categoría:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Calzado Étnico, Suéteres"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-bold"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Descripción ampliada para la Colección:</label>
                <textarea
                  rows={3}
                  placeholder="Sacos e hilos finos..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-3 py-1.5 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white font-bold rounded">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`max-w-sm w-full p-6 rounded-2xl shadow-xl ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-sm text-emerald-600 flex items-center gap-1.5"><FolderPlus className="w-4 h-4" /> Editar Categoría</h3>
              <button onClick={() => { setIsEditOpen(false); setSelectedCategory(null); }} className="p-1 hover:bg-zinc-850 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nombre Categoría:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700 font-bold"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Descripción de la Categoría:</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded bg-neutral-50 dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => { setIsEditOpen(false); setSelectedCategory(null); }} className="px-3 py-1.5 border rounded animate-none">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded animate-pulse">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
