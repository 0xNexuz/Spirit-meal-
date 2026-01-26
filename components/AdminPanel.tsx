
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
  
  const [devotionals, setDevotionals] = useState<DevotionalEntry[]>(storage.getDevotionals());
  const [lessons, setLessons] = useState<SundaySchoolLesson[]>(storage.getSundaySchool());

  const isLocalOnly = devotionals.length !== INITIAL_DEVOTIONALS.length || 
                      JSON.stringify(devotionals) !== JSON.stringify(INITIAL_DEVOTIONALS);

  useEffect(() => {
    if (editId) {
      const dev = devotionals.find(d => d.id === editId);
      if (dev) {
        setActiveTab('devotionals');
        // Convert tags array to string for editing
        setEditingItem({ ...dev, tagsString: dev.tags?.join(', ') || '' });
        return;
      }
      const lesson = lessons.find(l => l.id === editId);
      if (lesson) {
        setActiveTab('lessons');
        // Convert questions array to newline string for editing
        setEditingItem({ ...lesson, questionsString: lesson.discussionQuestions?.join('\n') || '' });
      }
    }
  }, [editId, devotionals, lessons]);

  const handleCreateNew = () => {
    const id = Date.now().toString();
    const date = new Date().toISOString().split('T')[0];
    
    if (activeTab === 'devotionals') {
      setEditingItem({
        id, date, title: '', scripture: '', content: '', prayer: '', meditation: '', imageUrl: '', tags: [], tagsString: ''
      });
    } else {
      setEditingItem({
        id, date, title: '', topic: '', memoryVerse: '', content: '', imageUrl: '', discussionQuestions: [], questionsString: ''
      });
    }
  };

  const handleEdit = (item: any) => {
    if (activeTab === 'devotionals') {
      setEditingItem({ ...item, tagsString: item.tags?.join(', ') || '' });
    } else {
      setEditingItem({ ...item, questionsString: item.discussionQuestions?.join('\n') || '' });
    }
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

    const itemToSave = { ...editingItem };
    
    if (activeTab === 'devotionals') {
      // Clean up tags
      itemToSave.tags = itemToSave.tagsString
        ? itemToSave.tagsString.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
      delete itemToSave.tagsString;

      const current = storage.getDevotionals();
      const index = current.findIndex(d => d.id === itemToSave.id);
      if (index > -1) current[index] = itemToSave;
      else current.unshift(itemToSave);
      storage.saveDevotionals(current);
      setDevotionals(current);
    } else {
      // Clean up questions
      itemToSave.discussionQuestions = itemToSave.questionsString
        ? itemToSave.questionsString.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : [];
      delete itemToSave.questionsString;

      const current = storage.getSundaySchool();
      const index = current.findIndex(l => l.id === itemToSave.id);
      if (index > -1) current[index] = itemToSave;
      else current.unshift(itemToSave);
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
      exportWindow.document.write(`<html><body style="padding:40px;font-family:sans-serif;background:#fafaf9;"><h1>Master Export</h1><p>Copy this text and send it to your developer to update the global version of the app.</p><textarea style="width:100%;height:70vh;padding:20px;border-radius:12px;border:1px solid #e7e5e4;font-family:monospace;font-size:12px;">${json}</textarea></body></html>`);
    }
  };

  return (
    <div className="pt-6 pb-24 animate-in fade-in">
      {!editingItem && (
        <div className={`p-6 rounded-[2.5rem] mb-10 border transition-all ${isLocalOnly ? 'bg-amber-50 border-amber-200 shadow-lg' : 'bg-stone-50 border-stone-100'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${isLocalOnly ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
            <h3 className="font-black text-xs uppercase tracking-widest text-stone-600">
              {isLocalOnly ? 'Unpublished Changes' : 'Synced with Global Master'}
            </h3>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-stone-500 max-w-md">Your edits are saved only on this device. Click publish to generate a data file for the global update.</p>
            <button onClick={handleExportData} className="w-full md:w-auto px-8 py-4 bg-amber-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-amber-900 transition-colors">PUBLISH DATA</button>
          </div>
        </div>
      )}

      {editingItem ? (
        <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl space-y-10 border border-stone-100">
          <div className="flex justify-between items-center border-b border-stone-50 pb-6">
            <div>
              <h3 className="font-black text-2xl serif-font text-stone-800">Editing {activeTab === 'devotionals' ? 'Spirit Meal' : 'Sunday Lesson'}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1">ID: {editingItem.id}</p>
            </div>
            <button onClick={() => setEditingItem(null)} className="p-3 bg-stone-50 rounded-full text-stone-400 hover:text-stone-600 transition-colors">✕</button>
          </div>

          <div className="space-y-10">
            {/* SECTION 1: CORE DETAILS */}
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-700">Primary Content</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Title</label>
                  <input type="text" placeholder="Entry Title" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-stone-100 bg-stone-50 font-bold focus:border-amber-200 outline-none transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Publication Date</label>
                  <input type="date" value={editingItem.date} onChange={e => setEditingItem({...editingItem, date: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-stone-100 bg-stone-50 font-bold focus:border-amber-200 outline-none transition-all" />
                </div>
              </div>

              {activeTab === 'lessons' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Topic / Category</label>
                  <input type="text" placeholder="e.g. Divine Provision" value={editingItem.topic} onChange={e => setEditingItem({...editingItem, topic: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-stone-100 bg-stone-50 font-bold focus:border-amber-200 outline-none transition-all" />
                </div>
              )}
            </div>

            {/* SECTION 2: SCRIPTURE & VISUALS */}
            <div className="space-y-6 pt-6 border-t border-stone-50">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-700">Scriptural Foundation</h4>
               <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-400 ml-2">{activeTab === 'devotionals' ? 'Scripture Reference' : 'Memory Verse'}</label>
                  <input 
                    type="text" 
                    placeholder={activeTab === 'devotionals' ? "e.g. Acts 21:8-10" : "e.g. Hebrews 11:1"} 
                    value={activeTab === 'devotionals' ? editingItem.scripture : editingItem.memoryVerse} 
                    onChange={e => setEditingItem(activeTab === 'devotionals' ? {...editingItem, scripture: e.target.value} : {...editingItem, memoryVerse: e.target.value})} 
                    className="w-full p-4 rounded-2xl border-2 border-stone-100 bg-stone-50 font-medium italic serif-font text-lg focus:border-amber-200 outline-none transition-all" 
                  />
               </div>

               <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Cover Image URL</label>
                <input type="text" placeholder="https://picsum.photos/..." value={editingItem.imageUrl} onChange={e => setEditingItem({...editingItem, imageUrl: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-stone-100 bg-stone-50 text-sm focus:border-amber-200 outline-none transition-all" />
                {editingItem.imageUrl && (
                  <div className="mt-2 rounded-2xl overflow-hidden aspect-video border-2 border-stone-100 shadow-inner bg-stone-100">
                    <img src={editingItem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: BODY CONTENT */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Message Body</label>
              <textarea placeholder="The heart of the message..." value={editingItem.content} onChange={e => setEditingItem({...editingItem, content: e.target.value})} className="w-full h-80 p-6 rounded-[2rem] border-2 border-stone-100 bg-stone-50 serif-font text-lg leading-relaxed focus:border-amber-200 outline-none transition-all" />
            </div>

            {/* SECTION 4: EXTRAS */}
            <div className="space-y-6 pt-6 border-t border-stone-50">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-700">Reflection & Prayer</h4>
              
              {activeTab === 'devotionals' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Moment of Prayer</label>
                    <textarea placeholder="Prayer points..." value={editingItem.prayer} onChange={e => setEditingItem({...editingItem, prayer: e.target.value})} className="w-full h-32 p-4 rounded-2xl border-2 border-stone-100 bg-stone-50 italic focus:border-amber-200 outline-none transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Daily Meditation</label>
                    <textarea placeholder="Meditation text..." value={editingItem.meditation} onChange={e => setEditingItem({...editingItem, meditation: e.target.value})} className="w-full h-24 p-4 rounded-2xl border-2 border-stone-100 bg-stone-50 focus:border-amber-200 outline-none transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Tags (Comma separated)</label>
                    <input type="text" placeholder="Family, Faith, Growth" value={editingItem.tagsString} onChange={e => setEditingItem({...editingItem, tagsString: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-stone-100 bg-stone-50 text-xs font-bold uppercase tracking-widest focus:border-amber-200 outline-none transition-all" />
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Discussion Questions (One per line)</label>
                  <textarea 
                    placeholder="Question 1&#10;Question 2&#10;Question 3" 
                    value={editingItem.questionsString} 
                    onChange={e => setEditingItem({...editingItem, questionsString: e.target.value})} 
                    className="w-full h-40 p-4 rounded-2xl border-2 border-stone-100 bg-stone-50 focus:border-amber-200 outline-none transition-all" 
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 pt-10">
              <button onClick={handleSave} className="w-full py-6 bg-amber-800 text-white font-black uppercase rounded-[1.5rem] shadow-2xl hover:bg-amber-900 active:scale-95 transition-all tracking-widest">SAVE TO LOCAL DATABASE</button>
              <button onClick={() => setEditingItem(null)} className="w-full py-4 text-stone-400 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-stone-600 transition-colors">Discard Changes</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-3xl font-bold serif-font text-stone-800">Ministry Library</h2>
             <button onClick={handleCreateNew} className="bg-stone-800 text-white px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-stone-900 transition-all">+ ADD NEW ENTRY</button>
          </div>
          
          <div className="flex gap-4 border-b border-stone-100 mb-8 overflow-x-auto scrollbar-hide">
             <button onClick={() => setActiveTab('devotionals')} className={`pb-4 px-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all flex-shrink-0 ${activeTab === 'devotionals' ? 'border-b-4 border-amber-700 text-amber-800' : 'text-stone-300'}`}>Spirit Meals</button>
             <button onClick={() => setActiveTab('lessons')} className={`pb-4 px-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all flex-shrink-0 ${activeTab === 'lessons' ? 'border-b-4 border-indigo-700 text-indigo-800' : 'text-stone-300'}`}>Sunday School</button>
          </div>

          {(activeTab === 'devotionals' ? devotionals : lessons).map((item) => (
            <div key={item.id} className="p-6 bg-white border border-stone-100 rounded-[2.5rem] flex items-center justify-between group shadow-sm hover:shadow-md transition-all">
              <div className="flex-1 min-w-0 pr-4">
                <span className="text-[9px] font-black text-amber-700/50 uppercase tracking-widest block mb-1">{item.date}</span>
                <h4 className="font-bold serif-font text-xl text-stone-800 truncate">{item.title}</h4>
                {activeTab === 'lessons' && <p className="text-[10px] text-stone-400 font-bold uppercase mt-1">{(item as SundaySchoolLesson).topic}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(item)} className="px-6 py-4 bg-stone-50 text-stone-800 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-50 hover:text-amber-900 transition-all">EDIT</button>
                <button onClick={() => handleDelete(item.id)} className="p-4 text-stone-200 hover:text-red-500 transition-colors">✕</button>
              </div>
            </div>
          ))}

          { (activeTab === 'devotionals' ? devotionals : lessons).length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-stone-100 rounded-[3rem]">
              <p className="text-stone-400 serif-font italic">Your {activeTab === 'devotionals' ? 'Spirit Meal' : 'Sunday Lesson'} library is empty.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
