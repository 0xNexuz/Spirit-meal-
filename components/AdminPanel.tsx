
import React, { useState, useEffect } from 'react';
import { extractDevotionalStructure } from '../services/geminiService.ts';
import { DevotionalEntry, SundaySchoolLesson } from '../types.ts';
import { storage } from '../services/storageService.ts';
import { ICONS } from '../constants.tsx';

const AdminPanel: React.FC<{ onEntryAdded: () => void }> = ({ onEntryAdded }) => {
  const [activeTab, setActiveTab] = useState<'devotionals' | 'lessons'>('devotionals');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiInput, setAiInput] = useState('');

  const [devotionals, setDevotionals] = useState<DevotionalEntry[]>(storage.getDevotionals());
  const [lessons, setLessons] = useState<SundaySchoolLesson[]>(storage.getSundaySchool());

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
    if (window.confirm('Are you sure you want to remove this entry forever?')) {
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
      alert("Please provide at least a title and content.");
      return;
    }

    if (activeTab === 'devotionals') {
      const current = storage.getDevotionals();
      const index = current.findIndex(d => d.id === editingItem.id);
      if (index > -1) {
        current[index] = editingItem;
      } else {
        current.unshift(editingItem);
      }
      storage.saveDevotionals(current);
      setDevotionals(current);
    } else {
      const current = storage.getSundaySchool();
      const index = current.findIndex(l => l.id === editingItem.id);
      if (index > -1) {
        current[index] = editingItem;
      } else {
        current.unshift(editingItem);
      }
      storage.saveSundaySchool(current);
      setLessons(current);
    }

    setEditingItem(null);
    onEntryAdded();
    alert("Saved successfully.");
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
      } else {
        alert("AI couldn't parse that text. Try a clearer sample.");
      }
    } catch (err) {
      console.error(err);
      alert("AI Tool error. Manual entry recommended.");
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
          className="bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-amber-800 transition-all flex items-center gap-2"
        >
          <span className="text-xl">+</span> Add New
        </button>
      </div>

      <div className="flex gap-4 border-b border-stone-200 mb-6">
        <button 
          onClick={() => { setActiveTab('devotionals'); setEditingItem(null); }}
          className={`pb-2 px-1 text-sm font-bold tracking-widest uppercase transition-all border-b-2 ${activeTab === 'devotionals' ? 'border-amber-700 text-amber-700' : 'border-transparent text-stone-400'}`}
        >
          Devotionals
        </button>
        <button 
          onClick={() => { setActiveTab('lessons'); setEditingItem(null); }}
          className={`pb-2 px-1 text-sm font-bold tracking-widest uppercase transition-all border-b-2 ${activeTab === 'lessons' ? 'border-indigo-700 text-indigo-700' : 'border-transparent text-stone-400'}`}
        >
          Sunday School
        </button>
      </div>

      {editingItem ? (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-6 animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">Edit {activeTab === 'devotionals' ? 'Meal' : 'Lesson'}</h3>
            <button onClick={() => setEditingItem(null)} className="text-stone-400 hover:text-stone-600">✕</button>
          </div>

          {activeTab === 'devotionals' && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-3">
              <label className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">AI Extraction Tool</label>
              <textarea 
                placeholder="Paste the raw book text here to automatically fill the fields below..."
                className="w-full h-24 p-3 text-xs rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
              />
              <button 
                disabled={isAIProcessing || !aiInput}
                onClick={handleAIExtract}
                className="w-full py-2 bg-amber-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest disabled:opacity-50"
              >
                {isAIProcessing ? 'Processing Spiritually...' : 'Extract with AI'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Title</label>
              <input 
                type="text" 
                value={editingItem.title}
                onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                className="w-full p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Date</label>
                  <input type="date" value={editingItem.date} onChange={e => setEditingItem({...editingItem, date: e.target.value})} className="w-full p-3 rounded-xl border border-stone-200" />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">{activeTab === 'devotionals' ? 'Tags (csv)' : 'Topic'}</label>
                  <input 
                    type="text" 
                    value={activeTab === 'devotionals' ? editingItem.tags?.join(', ') : editingItem.topic} 
                    onChange={e => activeTab === 'devotionals' 
                      ? setEditingItem({...editingItem, tags: e.target.value.split(',').map(s => s.trim())}) 
                      : setEditingItem({...editingItem, topic: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-stone-200" 
                  />
               </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">{activeTab === 'devotionals' ? 'Scripture' : 'Memory Verse'}</label>
              <input 
                type="text" 
                value={activeTab === 'devotionals' ? editingItem.scripture : editingItem.memoryVerse}
                onChange={e => activeTab === 'devotionals' ? setEditingItem({...editingItem, scripture: e.target.value}) : setEditingItem({...editingItem, memoryVerse: e.target.value})}
                className="w-full p-3 rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Content</label>
              <textarea 
                value={editingItem.content}
                onChange={e => setEditingItem({...editingItem, content: e.target.value})}
                className="w-full h-40 p-3 rounded-xl border border-stone-200 serif-font text-sm leading-relaxed"
              />
            </div>

            {activeTab === 'devotionals' ? (
              <>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Prayer</label>
                  <input type="text" value={editingItem.prayer || ''} onChange={e => setEditingItem({...editingItem, prayer: e.target.value})} className="w-full p-3 rounded-xl border border-stone-200 text-sm italic" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Meditation</label>
                  <input type="text" value={editingItem.meditation || ''} onChange={e => setEditingItem({...editingItem, meditation: e.target.value})} className="w-full p-3 rounded-xl border border-stone-200 text-sm italic" />
                </div>
              </>
            ) : (
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Discussion (one per line)</label>
                <textarea 
                  value={editingItem.discussionQuestions?.join('\n')}
                  onChange={e => setEditingItem({...editingItem, discussionQuestions: e.target.value.split('\n').filter(q => q.trim())})}
                  className="w-full h-24 p-3 rounded-xl border border-stone-200 text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-stone-100">
            <button onClick={handleSave} className="flex-1 py-4 bg-amber-700 text-white font-bold rounded-2xl shadow-lg hover:bg-amber-800 transition-all active:scale-95">Save Update</button>
            <button onClick={() => setEditingItem(null)} className="flex-1 py-4 bg-stone-100 text-stone-600 font-bold rounded-2xl border border-stone-200 transition-all active:scale-95">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {(activeTab === 'devotionals' ? devotionals : lessons).length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed border-stone-200 rounded-3xl text-stone-400">
              No entries found. Create your first one above.
            </div>
          ) : (
            (activeTab === 'devotionals' ? devotionals : lessons).map((item) => (
              <div key={item.id} className="p-4 bg-white border border-stone-100 rounded-2xl flex justify-between items-center group shadow-sm">
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">{item.date}</span>
                  <h4 className="font-bold serif-font text-lg">{item.title}</h4>
                  <p className="text-xs text-stone-400 line-clamp-1">{activeTab === 'devotionals' ? item.scripture : item.topic}</p>
                </div>
                <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(item)} className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-amber-100 hover:text-amber-700"><ICONS.Pencil /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 bg-stone-100 text-red-600 rounded-lg hover:bg-red-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <p className="text-center opacity-30 text-[10px] uppercase font-bold tracking-[0.4em] mt-12">Faithful Administration</p>
    </div>
  );
}

export default AdminPanel;
