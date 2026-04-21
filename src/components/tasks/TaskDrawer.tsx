import { useEffect, useState } from 'react';
import { X, Calendar, Edit3, Trash2, CheckCircle2, Circle, Plus, Archive, Play, Target } from 'lucide-react';
import { Task, useTaskStore } from '@/store/taskStore';

interface TaskDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDrawer({ task, isOpen, onClose }: TaskDrawerProps) {
  const [notesInput, setNotesInput] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; is_completed: boolean }[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const updateTask = useTaskStore(s => s.updateTask);

  useEffect(() => {
    if (!isOpen || !task) return;
    setTimeout(() => {
      setNotesInput(task.notes || "");
      setIsEditingNotes(false);
      setSubtasks(task.subtasks ? [...task.subtasks] : []);
    }, 0);
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const handleSaveNotes = async () => {
    try {
      await updateTask(task.id, { notes: notesInput || null });
      setIsEditingNotes(false);
    } catch {
      alert("Failed to save notes");
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    
    const newSubtask = {
      id: `temp-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      is_completed: false
    };

    const newSubtasks = [...subtasks, newSubtask];
    setSubtasks(newSubtasks);
    setNewSubtaskTitle("");

    try {
      await updateTask(task.id, { subtasks: newSubtasks });
    } catch {
      // Revert if API fails
      setSubtasks(subtasks);
      alert("Failed to save subtask. Please check your connection.");
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    const newSubtasks = subtasks.map(st => 
      st.id === subtaskId ? { ...st, is_completed: !st.is_completed } : st
    );
    setSubtasks(newSubtasks);

    try {
      await updateTask(task.id, { subtasks: newSubtasks });
    } catch {
      setSubtasks(subtasks); // revert
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    const newSubtasks = subtasks.filter(st => st.id !== subtaskId);
    setSubtasks(newSubtasks);

    try {
      await updateTask(task.id, { subtasks: newSubtasks });
    } catch {
      setSubtasks(subtasks); // revert
    }
  };

  const handleStatusChange = async (status: 'pending' | 'completed' | 'archived') => {
    try {
      await updateTask(task.id, { status });
    } catch {
      alert("Failed to update status");
    }
  };

  const completedCount = subtasks.filter(st => st.is_completed).length;
  const progressPercent = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
          <div className="pr-4">
            <h2 className={`text-xl font-bold leading-tight ${task.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
              {task.title}
            </h2>
            <div className="flex gap-2 mt-2">
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                 ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                   task.status === 'archived' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                   'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                 }
               `}>
                 {task.status}
               </span>
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border
                 ${task.priority === 'urgent' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50' :
                   task.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50' :
                   task.priority === 'low' ? 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700' :
                   'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50'
                 }
               `}>
                 {task.priority}
               </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">

          {/* Subtasks / Checklist */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4" /> Checklist
              </h3>
              {subtasks.length > 0 && (
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {completedCount} / {subtasks.length} ({progressPercent}%)
                </span>
              )}
            </div>

            {subtasks.length > 0 && (
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-4">
                <div className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all duration-500 ease-out shadow-sm" style={{ width: `${progressPercent}%` }}></div>
              </div>
            )}

            <ul className="space-y-2 mb-4">
              {subtasks.map(st => (
                <li key={st.id} className="flex items-start gap-3 group">
                  <button onClick={() => handleToggleSubtask(st.id)} className="mt-0.5 flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {st.is_completed ? (
                      <CheckCircle2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <span className={`flex-1 text-sm ${st.is_completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                    {st.title}
                  </span>
                  <button onClick={() => handleDeleteSubtask(st.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>

            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input 
                type="text" 
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                placeholder="Add a subtask..."
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
              />
              <button type="submit" disabled={!newSubtaskTitle.trim()} className="bg-indigo-600 disabled:bg-indigo-400 text-white p-2 rounded-lg transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Details & Notes */}
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                 <Edit3 className="w-4 h-4" /> Notes & Details
               </h3>
               {!isEditingNotes && (
                 <button onClick={() => setIsEditingNotes(true)} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
                   Edit
                 </button>
               )}
            </div>
            
            {isEditingNotes ? (
              <div className="space-y-4">
                <div>
                  <textarea 
                    value={notesInput} 
                    onChange={e => setNotesInput(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" 
                    rows={4} 
                    placeholder="Add task details, links, or notes..."
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveNotes} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Save</button>
                  <button onClick={() => {
                    setIsEditingNotes(false);
                    setNotesInput(task.notes || "");
                  }} className="text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{task.notes || <span className="italic text-gray-400 dark:text-gray-500">No notes added.</span>}</p>
                </div>
                {task.due_date && (
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Due Date</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500"/> 
                      {new Date(task.due_date).toLocaleDateString()} {task.due_time && `at ${task.due_time}`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-8 border-t border-gray-100 dark:border-gray-800 space-y-3">
             <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Management</h3>
             
             {task.status !== 'completed' && (
               <button onClick={() => handleStatusChange('completed')} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl font-medium transition-colors">
                 <CheckCircle2 className="w-4 h-4" /> Mark as Completed
               </button>
             )}
             
             {task.status === 'completed' && (
               <button onClick={() => handleStatusChange('pending')} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl font-medium transition-colors">
                 <Play className="w-4 h-4" /> Reopen Task
               </button>
             )}

             {task.status !== 'archived' && (
               <button onClick={() => handleStatusChange('archived')} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl font-medium transition-colors shadow-sm">
                 <Archive className="w-4 h-4" /> Archive Task
               </button>
             )}
          </div>
        </div>
      </div>
    </>
  );
}
