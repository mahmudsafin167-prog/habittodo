'use client';

import { useEffect, useState } from 'react';
import { useCategoryStore, Category } from '@/store/categoryStore';
import { Plus, Trash2, Edit2, Tag } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9'];

export default function CategoriesPage() {
  const { categories, isLoading, fetchCategories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [type, setType] = useState<'task' | 'habit' | 'both'>('both');
  
  const [catToDelete, setCatToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openModal = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setName(cat.name);
      setColor(cat.color);
      setType(cat.type);
    } else {
      setEditingCat(null);
      setName('');
      setColor(COLORS[0]);
      setType('both');
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return alert("Name is required");
    try {
      if (editingCat) {
        await updateCategory(editingCat.id, { name, color, type });
      } else {
        await addCategory({ name, color, type });
      }
      setIsModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Categories</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Organize your tasks and habits.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">New Category</span>
        </button>
      </header>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
           {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>)}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl py-16 text-center flex flex-col items-center">
           <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
             <Tag className="w-8 h-8 text-gray-400" />
           </div>
           <h3 className="text-xl font-medium text-gray-900 dark:text-white">No categories yet</h3>
           <p className="text-gray-500 dark:text-gray-400 mt-2">Create categories to group related items together.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-32">
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
                   <h3 className="font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{cat.type === 'both' ? 'Tasks & Habits' : cat.type}</span>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => openModal(cat)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setCatToDelete(cat.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCat ? "Edit Category" : "New Category"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" placeholder="e.g. Work, Health" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full flex items-center justify-center ${color === c ? 'ring-2 ring-offset-2 ring-gray-900' : ''}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Applies To</label>
             <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                <option value="both">Tasks & Habits</option>
                <option value="task">Tasks Only</option>
                <option value="habit">Habits Only</option>
             </select>
          </div>
          <button onClick={handleSave} className="w-full bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700">
            Save Category
          </button>
        </div>
      </Modal>

      <ConfirmDialog 
        isOpen={!!catToDelete}
        onClose={() => setCatToDelete(null)}
        onConfirm={async () => {
          if (catToDelete) {
            await deleteCategory(catToDelete);
            setCatToDelete(null);
          }
        }}
        title="Delete Category"
        message="Are you sure? Tasks and habits currently using this category will lose the category label, but they will not be deleted."
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
}
