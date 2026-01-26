
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
  const [aiInput, setAiInput] = useState('');

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
        id, date, title: '', scripture: '', content: '', prayer: '', meditation: '', tags: []
      } as DevotionalEntry);
    } else {
      setEditingItem({
        id, date, title: '', topic: '', memoryVerse: '', content: '', discussionQuestions: []
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
    alert("Saved Locally! To make this visible to other readers, use the 'Publish Globally' section below.");
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
      exportWindow.document.write(`
        <html>
          <head><title>Master Export</title></head>
          <body style="font-family:-apple-system, sans-serif; padding:40px; background:#fdfbf7; color:#444; line-height:1.6;">
            <div style="max-width:800px; margin:0 auto;">
              <h1 style="color:#78350f;">Spirit Meal: Master Export</h1>
              <p style="background:#fef3c7; padding:15px; border-radius:10px; border-left:5px solid #d97706; font-size:14px;">
                <strong>INSTRUCTIONS:</strong> Select all the text in the box below, copy it, and send it to your developer. 
                They will use this to update the app for all readers worldwide.
              </p>
              <textarea readonly style="width:100%; height:500px; margin-top:20px; padding:20px; font-family:monospace; font-size:12px; border:2px solid #e5e7eb; border-radius:15px; box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1); background:white;">${json}</textarea>
              <p style="margin-top:20px; text-align:center; font-size:12px; color:#999;">Generated on ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `);
    } else {
      alert("Pop-up blocked! Please allow pop-ups to view the export file.");
    }
  };

  return (
    <div className="pt-6 pb-24 animate-in fade-in">
      {!editingItem && (
        <div className={`p-6 rounded-[2.5rem] mb-10 border transition-all ${isLocalOnly ? 'bg-amber-50 border-amber-200' : 'bg-stone-50 border-stone-100'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${isLocalOnly ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
            <h3 className="font-black text-xs uppercase tracking-widest text-stone-600">
              {isLocalOnly ? 'Local Changes Pending Publication' : 'In Sync with Master App'}
            </h3>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-stone-500 leading-relaxed max-w-md">
              Your edits are currently stored <span className="font-bold text-amber-900">only on this device</span>. 
              To sync your work with all readers globally, export the Master File and provide it to your technical team.
            </p>
            <button 
              onClick={handleExportData} 
              className="w-full md:w-auto px-8 py-4 bg-amber-800 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-900/20 active:scale-95 transition-all"
            >
              PUBLISH GLOBALLY
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold serif-font text-stone-800">Admin Studio</h2>
          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-800/60 font-black">Content Management</p>
        </div>
        {!editingItem && (
          <button onClick={handleCreateNew} className="bg-stone-800 text-white px-6 py-4 rounded-[1.2rem] text-sm font-black shadow-xl active:scale-95 transition-all">
            + NEW ENTRY
          </button>
        )}
      </div>

      <div className="flex gap-4 border-b border-stone-200 mb-8 overflow-x-auto no-scrollbar pb-1">
        <button onClick={() => { setActiveTab('devotionals'); setEditingItem(null); }} className={`pb-4 px-2 text-xs font-black tracking-widest uppercase transition-all border-b-4 ${activeTab === 'devotionals' ? 'border-amber-700 text-amber-700' : 'border-transparent text-stone-300'}`}>Devotionals</button>
        <button onClick={() => { setActiveTab('lessons'); setEditingItem(null); }} className={`pb-4 px-2 text-xs font-black tracking-widest uppercase transition-all border-b-4 ${activeTab === 'lessons' ? 'border-indigo-700 text-indigo-700' : 'border-transparent text-stone-300'}`}>Sunday School</button>
      </div>

      {editingItem ? (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-stone-100 space-y-8 animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-start">
            <h3 className="font-black text-2xl text-stone-800 serif-font">MANUAL EDITOR</h3>
            <button onClick={() => setEditingItem(null)} className="p-3 bg-stone-100 rounded-full text-stone-400">✕</button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Title</label>
                <input type="text" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} className="w-full p-5 rounded-3xl border-2 border-stone-100 bg-stone-50 outline-none font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Date</label>
                <input type="date" value={editingItem.date} onChange={e => setEditingItem({...editingItem, date: e.target.value})} className="w-full p-5 rounded-3xl border-2 border-stone-100 bg-stone-50 outline-none font-bold" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Content Body</label>
              <textarea value={editingItem.content} onChange={e => setEditingItem({...editingItem, content: e.target.value})} className="w-full h-80 p-6 rounded-[2rem] border-2 border-stone-100 bg-stone-50 outline-none serif-font text-lg leading-relaxed shadow-inner" />
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <button onClick={handleSave} className="w-full py-6 bg-amber-800 text-white font-black uppercase tracking-[0.3em] rounded-[1.5rem] shadow-2xl active:scale-95 transition-all">SAVE DRAFT</button>
              <button onClick={() => setEditingItem(null)} className="w-full py-4 text-stone-400 font-bold text-xs uppercase tracking-widest">Cancel Editing</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {(activeTab === 'devotionals' ? devotionals : lessons).map((item) => (
            <div key={item.id} className="p-6 bg-white border border-stone-100 rounded-[2rem] flex items-center justify-between group shadow-sm hover:shadow-md transition-all">
              <div className="flex-1">
                <span className="text-[9px] font-black text-stone-300 uppercase tracking-widest block mb-1">{item.date}</span>
                <h4 className="font-bold serif-font text-lg text-stone-800">{item.title}</h4>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(item)} className="px-5 py-3 bg-amber-50 text-amber-800 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-colors">EDIT</button>
                <button onClick={() => handleDelete(item.id)} className="p-3 text-red-200 hover:text-red-500 transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </button>
              </div>
            </div>
          ))}
          {(activeTab === 'devotionals' ? devotionals : lessons).length === 0 && (
            <div className="py-20 text-center text-stone-300 border-2 border-dashed border-stone-100 rounded-[2.5rem]">
              <p className="font-bold italic serif-font">No records found locally.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
