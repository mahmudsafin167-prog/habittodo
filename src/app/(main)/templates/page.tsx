'use client';

import { PREDEFINED_TEMPLATES, RoutineTemplate } from '@/lib/templates';
import { useTaskStore } from '@/store/taskStore';
import { useHabitStore } from '@/store/habitStore';
import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<RoutineTemplate | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const { addTask } = useTaskStore();
  const { addHabit } = useHabitStore();
  const router = useRouter();

  const handleApplyTemplate = async (template: RoutineTemplate) => {
    setIsApplying(true);
    try {
      // Apply all items in the template concurrently
      await Promise.all(
        template.items.map(async (item) => {
          if (item.type === 'task') {
            await addTask({
              title: item.title,
              description: item.description,
              priority: item.priority || 'medium',
              status: 'pending',
            });
          } else if (item.type === 'habit') {
            await addHabit({
              title: item.title,
              goal: item.goal,
              reminder_time: item.reminder_time,
              target_days: item.target_days,
            });
          }
        })
      );
      
      // Navigate to dashboard after success
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to apply template:', error);
      alert('Failed to apply template. Please try again.');
    } finally {
      setIsApplying(false);
      setSelectedTemplate(null);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Routine Templates</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Jumpstart your productivity with curated habits and tasks.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PREDEFINED_TEMPLATES.map((template) => (
          <div 
            key={template.id}
            onClick={() => setSelectedTemplate(template)}
            className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 cursor-pointer hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${template.color}`}>
              {template.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{template.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{template.description}</p>
            
            <div className="flex flex-wrap gap-2 mt-auto">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded text-xs font-medium">
                {template.items.filter(i => i.type === 'habit').length} Habits
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded text-xs font-medium">
                {template.items.filter(i => i.type === 'task').length} Tasks
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Template Details */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-6 ${selectedTemplate.color} flex flex-col items-center text-center`}>
              <div className="text-5xl mb-4">{selectedTemplate.icon}</div>
              <h2 className="text-2xl font-bold">{selectedTemplate.name}</h2>
              <p className="text-sm mt-2 opacity-90">{selectedTemplate.description}</p>
            </div>
            
            <div className="p-6">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">What&apos;s included</h4>
              <ul className="space-y-4 max-h-60 overflow-y-auto">
                {selectedTemplate.items.map((item, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="mt-0.5">
                      {item.type === 'habit' ? (
                        <div className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">H</div>
                      ) : (
                        <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">T</div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                      {(item.description || item.goal) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description || item.goal}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setSelectedTemplate(null)}
                  disabled={isApplying}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleApplyTemplate(selectedTemplate)}
                  disabled={isApplying}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70"
                >
                  {isApplying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  {isApplying ? 'Applying...' : 'Apply Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
