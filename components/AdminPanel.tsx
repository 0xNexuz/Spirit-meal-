
import React, { useState, useEffect } from 'react';
import { extractDevotionalStructure } from '../services/geminiService.ts';
import { DevotionalEntry, SundaySchoolLesson } from '../types.ts';
import { storage } from '../services/storageService.ts';
import { ICONS } from '../constants.tsx';

const AdminPanel: React.FC<{ onEntryAdded: () => void, editId?: string | null }> = ({ onEntryAdded, editId }) => {
  const [activeTab, setActiveTab] = useState<'devotionals' | 'lessons'>('devotionals');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiInput, setAiInput] = useState('');

  const [devotionals, setDevotionals] = useState<DevotionalEntry[]>(storage.getDevotionals());
  const [lessons, setLessons] = useState<SundaySchoolLesson[]>(storage.getSundaySchool());

  // Handle direct edit request from other parts of the app
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
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Remove this entry? This cannot be undone.')) {
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
    if (!editingItem.title || !editingItem.content) {
      alert("Title and Content are required.");
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
  };

  const handleAIExtract = async () => {
    if (!aiInput.trim()) return;
    setIsAIProcessing(true);
    try {
      const result = await extractDevotionalStructure(aiInput);
      if (result) {
        setEditingItem({
          ...editingItem,
          ...result,
          id: editingItem.id || Date.now().toString(),
          date: editingItem.date || new Date().toISOString().split('T')[0]
        });
        setAiInput('');
      }
    } catch (err) {
      alert("AI Tool error. Please enter details manually.");
    } finally {
      setIsAIProcessing(false);
    }
  };

  return (
    <div className="pt-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold serif-font">Admin Studio</h2>
        <button 
          onClick={handleCreateNew}
          className="bg-amber-700 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="text-xl">+</span> New Entry
        </button>
      </div>

      <div className="flex gap-6 border-b border-stone-200 mb-8 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => { setActiveTab('devotionals'); setEditingItem(null); }}
          className={`pb-3 px-2 text-sm font-black tracking-widest uppercase transition-all border-b-4 whitespace-nowrap ${activeTab === 'devotionals' ? 'border-amber-700 text-amber-700' : 'border-transparent text-stone-300'}`}
        >
          Devotionals
        </button>
        <button 
          onClick={() => { setActiveTab('lessons'); setEditingItem(null); }}
          className={`pb-3 px-2 text-sm font-black tracking-widest uppercase transition-all border-b-4 whitespace-nowrap ${activeTab === 'lessons' ? 'border-indigo-700 text-indigo-700' : 'border-transparent text-stone-300'}`}
        >
          Sunday School
        </button>
      </div>

      {editingItem ? (
        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100 space-y-8 animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center border-b border-stone-50 pb-4">
            <h3 className="font-bold text-xl text-stone-800">
              Editing: {editingItem.title || 'New Entry'}
            </h3>
            <button onClick={() => setEditingItem(null)} className="p-2 bg-stone-50 rounded-full text-stone-400">✕</button>
          </div>

          {activeTab === 'devotionals' && !editingItem.content && (
            <div className="p-5 bg-amber-50 rounded-3xl border border-amber-100 space-y-4">
              <label className="text-[10px] font-black text-amber-800 uppercase tracking-widest block">AI SPIRIT HELPER</label>
              <textarea 
                placeholder="Paste book text here to auto-fill fields..."
                className="w-full h-24 p-4 text-xs rounded-2xl border border-amber-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition-all"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
              />
              <button 
                disabled={isAIProcessing || !aiInput}
                onClick={handleAIExtract}
                className="w-full py-3 bg-amber-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-md disabled:opacity-30 active:scale-[0.98] transition-all"
              >
                {isAIProcessing ? 'Processing...' : 'Magic Extract'}
              </button>
            </div>
          )}

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Title</label>
                <input 
                  type="text" 
                  value={editingItem.title}
                  onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                  placeholder="The morning message title"
                  className="w-full p-4 rounded-2xl border border-stone-100 bg-stone-50 focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all outline-none text-lg font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Date</label>
                <input type="date" value={editingItem.date} onChange={e => setEditingItem({...editingItem, date: e.target.value})} className="w-full p-4 rounded-2xl border border-stone-100 bg-stone-50 outline-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">{activeTab === 'devotionals' ? 'Scripture Reference' : 'Memory Verse'}</label>
              <input 
                type="text" 
                value={activeTab === 'devotionals' ? editingItem.scripture : editingItem.memoryVerse}
                onChange={e => activeTab === 'devotionals' ? setEditingItem({...editingItem, scripture: e.target.value}) : setEditingItem({...editingItem, memoryVerse: e.target.value})}
                placeholder="e.g. John 3:16"
                className="w-full p-4 rounded-2xl border border-stone-100 bg-stone-50 italic"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Message Body</label>
              <textarea 
                value={editingItem.content}
                onChange={e => setEditingItem({...editingItem, content: e.target.value})}
                placeholder="Type the full message here..."
                className="w-full h-64 p-5 rounded-3xl border border-stone-100 bg-stone-50 focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all outline-none serif-font text-base leading-relaxed"
              />
            </div>

            {activeTab === 'devotionals' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Closing Prayer</label>
                  <textarea value={editingItem.prayer || ''} onChange={e => setEditingItem({...editingItem, prayer: e.target.value})} className="w-full p-4 rounded-2xl border border-stone-100 bg-stone-50 text-sm italic h-24" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Meditation Word</label>
                  <textarea value={editingItem.meditation || ''} onChange={e => setEditingItem({...editingItem, meditation: e.target.value})} className="w-full p-4 rounded-2xl border border-stone-100 bg-stone-50 text-sm italic h-24" />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Discussion Questions (one per line)</label>
                <textarea 
                  value={editingItem.discussionQuestions?.join('\n')}
                  onChange={e => setEditingItem({...editingItem, discussionQuestions: e.target.value.split('\n').filter(q => q.trim())})}
                  className="w-full h-32 p-4 rounded-2xl border border-stone-100 bg-stone-50 text-sm"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 sticky bottom-4">
            <button onClick={handleSave} className="flex-1 py-5 bg-amber-700 text-white font-black uppercase tracking-widest text-sm rounded-[1.5rem] shadow-xl shadow-amber-900/10 active:scale-95 transition-all">
              Save Entry
            </button>
            <button onClick={() => setEditingItem(null)} className="flex-1 py-5 bg-stone-50 text-stone-400 font-bold uppercase tracking-widest text-xs rounded-[1.5rem] border border-stone-100 active:scale-95 transition-all">
              Discard Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {(activeTab === 'devotionals' ? devotionals : lessons).length === 0 ? (
            <div className="p-16 text-center border-4 border-dashed border-stone-100 rounded-[3rem] text-stone-300">
              <p className="font-bold serif-font italic text-xl">Empty for now...</p>
            </div>
          ) : (
            (activeTab === 'devotionals' ? devotionals : lessons).map((item) => (
              <div key={item.id} className="p-6 bg-white border border-stone-100 rounded-[2rem] flex items-center gap-4 group shadow-sm hover:shadow-md transition-all">
                <div className="flex-1">
                  <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest block mb-1">{item.date}</span>
                  <h4 className="font-bold serif-font text-lg text-stone-800">{item.title}</h4>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(item)} className="p-3 bg-amber-50 text-amber-700 rounded-2xl hover:bg-amber-100 active:scale-90 transition-all">
                    <ICONS.Pencil />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 active:scale-90 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <p className="text-center opacity-20 text-[9px] uppercase font-black tracking-[0.5em] mt-20">LIVING CHRIST GOSPEL MINISTRIES</p>
    </div>
  );
}

export default AdminPanel;
