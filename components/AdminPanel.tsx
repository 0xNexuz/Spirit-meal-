
import React, { useState, useEffect } from 'react';
import { extractDevotionalStructure } from '../services/geminiService.ts';
import { DevotionalEntry, SundaySchoolLesson } from '../types.ts';
import { storage } from '../services/storageService.ts';
import { ICONS, INITIAL_DEVOTIONALS } from '../constants.tsx';

interface AdminPanelProps {
  onEntryAdded: () => void;
  editId?: string | null;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onEntryAdded, editId }) => {
  const [activeTab, setActiveTab] = useState<'devotionals' | 'lessons'>('devotionals');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  
  const [devotionals, setDevotionals] = useState<DevotionalEntry[]>(storage.getDevotionals());
  const [lessons, setLessons] = useState<SundaySchoolLesson[]>(storage.getSundaySchool());

  const isLocalOnly = devotionals.length !== INITIAL_DEVOTIONALS.length || 
                      JSON.stringify(devotionals) !== JSON.stringify(INITIAL_DEVOTIONALS);

  useEffect(() => {
    if (editId) {
      const dev = devotionals.find(d => d.id === editId);
      if (dev) {
        setActiveTab('devotionals');
        setEditingItem({ ...dev });
        return;
      }
      const lesson = lessons.find(l => l.id === editId);
      if (lesson) {
        setActiveTab('lessons');
        setEditingItem({ ...lesson });
      }
    }
  }, [editId, devotionals, lessons]);

  const handleCreateNew = () => {
    const id = Date.now().toString();
    const date = new Date().toISOString().split('T')[0];
    
    if (activeTab === 'devotionals') {
      setEditingItem({
        id, date, title: '', scripture: '', content: '', prayer: '', meditation: '', imageUrl: '', tags: []
      } as DevotionalEntry);
    } else {
      setEditingItem({
        id, date, title: '', topic: '', memoryVerse: '', content: '', imageUrl: '', discussionQuestions: []
      } as SundaySchoolLesson);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem({ ...item });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this entry permanently?')) {
      if (activeTab === 'devotionals') {
        storage.deleteDevotional(id);
        setDevotionals(storage.getDevotionals());
      } else {
        storage.deleteSundaySchool(id);
        setLessons(storage.getSundaySchool());
      }
      onEntryAdded();
    }
  };

  const handleSave = () => {
    if (!editingItem.title?.trim() || !editingItem.content?.trim()) {
      alert("A Title and Content are required.");
      return;
    }

    if (activeTab === 'devotionals') {
      const current = storage.getDevotionals();
      const index = current.findIndex(d => d.id === editingItem.id);
      if (index > -1) current[index] = editingItem;
      else current.unshift(editingItem);
      storage.saveDevotionals(current);
      setDevotionals(current);
    } else {
      const current = storage.getSundaySchool();
      const index = current.findIndex(l => l.id === editingItem.id);
      if (index > -1) current[index] = editingItem;
      else current.unshift(editingItem);
      storage.saveSundaySchool(current);
      setLessons(current);
    }

    setEditingItem(null);
    onEntryAdded();
    alert("Saved Locally! To update globally, export and send to developer.");
  };

  const handleExportData = () => {
    const data = {
      devotionals: storage.getDevotionals(),
      lessons: storage.getSundaySchool(),
      timestamp: new Date().toISOString()
    };
    const json = JSON.stringify(data, null, 2);
    const exportWindow = window.open("", "_blank");
    if (exportWindow) {
      exportWindow.document.write(`<html><body style="padding:40px;font-family:sans-serif;"><h1>Master Export</h1><textarea style="width:100%;height:80vh;">${json}</textarea></body></html>`);
    }
  };

  return (
    <div className="pt-6 pb-24 animate-in fade-in">
      {!editingItem && (
        <div className={`p-6 rounded-[2.5rem] mb-10 border transition-all ${isLocalOnly ? 'bg-amber-50 border-amber-200' : 'bg-stone-50 border-stone-100'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${isLocalOnly ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
            <h3 className="font-black text-xs uppercase tracking-widest text-stone-600">
              {isLocalOnly ? 'Local Changes Pending' : 'In Sync with Master'}
            </h3>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-stone-500 max-w-md">Your work is saved locally. Export to publish globally.</p>
            <button onClick={handleExportData} className="w-full md:w-auto px-8 py-4 bg-amber-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">PUBLISH GLOBALLY</button>
          </div>
        </div>
      )}

      {editingItem ? (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-2xl serif-font">Editing {activeTab === 'devotionals' ? 'Meal' : 'Lesson'}</h3>
            <button onClick={() => setEditingItem(null)} className="text-stone-400">✕</button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" placeholder="Title" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-stone-100 bg-stone-50 font-bold" />
              <input type="date" value={editingItem.date} onChange={e => setEditingItem({...editingItem, date: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-stone-100 bg-stone-50" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Image URL (Unsplash or direct link)</label>
              <input type="text" placeholder="https://images.unsplash.com/..." value={editingItem.imageUrl} onChange={e => setEditingItem({...editingItem, imageUrl: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-stone-100 bg-stone-50 text-sm" />
              {editingItem.imageUrl && (
                <div className="mt-2 rounded-xl overflow-hidden aspect-video border-2 border-stone-100">
                  <img src={editingItem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <textarea placeholder="Content Body" value={editingItem.content} onChange={e => setEditingItem({...editingItem, content: e.target.value})} className="w-full h-64 p-6 rounded-3xl border-2 border-stone-100 bg-stone-50 serif-font text-lg leading-relaxed" />

            <div className="flex flex-col gap-4">
              <button onClick={handleSave} className="w-full py-6 bg-amber-800 text-white font-black uppercase rounded-[1.5rem] shadow-2xl">SAVE CHANGES</button>
              <button onClick={() => setEditingItem(null)} className="w-full py-4 text-stone-400 font-bold text-xs uppercase">Cancel</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-3xl font-bold serif-font">Content List</h2>
             <button onClick={handleCreateNew} className="bg-stone-800 text-white px-6 py-4 rounded-2xl text-xs font-black">+ NEW</button>
          </div>
          <div className="flex gap-4 border-b border-stone-100 mb-6">
             <button onClick={() => setActiveTab('devotionals')} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest ${activeTab === 'devotionals' ? 'border-b-4 border-amber-700 text-amber-700' : 'text-stone-300'}`}>Meals</button>
             <button onClick={() => setActiveTab('lessons')} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest ${activeTab === 'lessons' ? 'border-b-4 border-indigo-700 text-indigo-700' : 'text-stone-300'}`}>Lessons</button>
          </div>
          {(activeTab === 'devotionals' ? devotionals : lessons).map((item) => (
            <div key={item.id} className="p-6 bg-white border border-stone-100 rounded-[2rem] flex items-center justify-between group shadow-sm">
              <div>
                <span className="text-[9px] font-black text-stone-300 uppercase block mb-1">{item.date}</span>
                <h4 className="font-bold serif-font text-lg">{item.title}</h4>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(item)} className="px-5 py-3 bg-amber-50 text-amber-800 rounded-2xl font-black text-[10px] uppercase">EDIT</button>
                <button onClick={() => handleDelete(item.id)} className="p-3 text-red-200 hover:text-red-500 transition-colors">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
