
import React, { useState, useEffect } from 'react';
import { extractDevotionalStructure } from '../services/geminiService';
import { DevotionalEntry, SundaySchoolLesson } from '../types';
import { storage } from '../services/storageService';
import { ICONS } from '../constants';

const AdminPanel: React.FC<{ onEntryAdded: () => void }> = ({ onEntryAdded }) => {
  const [contentType, setContentType] = useState<'devotional' | 'sunday-school'>('devotional');
  const [mode, setMode] = useState<'ai' | 'manual' | 'edit'>('ai');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Lists for management
  const [existingDevotionals, setExistingDevotionals] = useState<DevotionalEntry[]>([]);
  const [existingLessons, setExistingLessons] = useState<SundaySchoolLesson[]>([]);

  // Devotional states
  const [inputText, setInputText] = useState('');
  const [devotionalEntry, setDevotionalEntry] = useState<Partial<DevotionalEntry> | null>(null);

  // Sunday School states
  const [ssTitle, setSsTitle] = useState('');
  const [ssTopic, setSsTopic] = useState('');
  const [ssVerse, setSsVerse] = useState('');
  const [ssContent, setSsContent] = useState('');
  const [ssQuestions, setSsQuestions] = useState('');

  useEffect(() => {
    setExistingDevotionals(storage.getDevotionals());
    setExistingLessons(storage.getSundaySchool());
  }, []);

  const refreshLists = () => {
    const d = storage.getDevotionals();
    const s = storage.getSundaySchool();
    setExistingDevotionals(d);
    setExistingLessons(s);
    onEntryAdded();
  };

  const handleProcessDevotional = async () => {
    if (!inputText.trim()) return;
    
    if (mode === 'ai') {
      setLoading(true);
      const extracted = await extractDevotionalStructure(inputText);
      if (extracted) {
        setDevotionalEntry({
          ...extracted,
          date: new Date().toISOString().split('T')[0],
          id: Math.random().toString(36).substr(2, 9),
          imageUrl: `https://picsum.photos/seed/${Math.random()}/800/450`
        });
      }
      setLoading(false);
    } else {
      setDevotionalEntry({
        title: 'Untitled Entry',
        scripture: 'Add scripture here...',
        content: inputText,
        prayer: 'Add prayer here...',
        meditation: 'Add meditation here...',
        tags: [],
        date: new Date().toISOString().split('T')[0],
        id: Math.random().toString(36).substr(2, 9),
        imageUrl: `https://picsum.photos/seed/${Math.random()}/800/450`
      });
    }
  };

  const handlePublishDevotional = () => {
    if (!devotionalEntry || !devotionalEntry.title || !devotionalEntry.content) {
      alert('Please fill in at least the title and content.');
      return;
    }
    
    const current = storage.getDevotionals();
    if (editingId) {
        const updated = current.map(item => item.id === editingId ? (devotionalEntry as DevotionalEntry) : item);
        storage.saveDevotionals(updated);
        alert('Devotional Updated Successfully!');
    } else {
        storage.saveDevotionals([devotionalEntry as DevotionalEntry, ...current]);
        alert('Devotional Published Successfully!');
    }
    
    setDevotionalEntry(null);
    setInputText('');
    setEditingId(null);
    setMode('ai');
    refreshLists();
  };

  const handlePublishSundaySchool = () => {
    if (!ssTitle || !ssContent) {
      alert('Please provide a title and lesson content.');
      return;
    }
    
    const current = storage.getSundaySchool();
    
    if (editingId) {
        const updated = current.map(item => item.id === editingId ? {
            ...item,
            title: ssTitle,
            topic: ssTopic,
            memoryVerse: ssVerse,
            content: ssContent,
            discussionQuestions: ssQuestions.split('\n').filter(q => q.trim().length > 0)
        } : item);
        storage.saveSundaySchool(updated);
        alert('Sunday School Lesson Updated!');
    } else {
        const newLesson: SundaySchoolLesson = {
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString().split('T')[0],
          title: ssTitle,
          topic: ssTopic || 'General Study',
          memoryVerse: ssVerse,
          content: ssContent,
          discussionQuestions: ssQuestions.split('\n').filter(q => q.trim().length > 0),
          imageUrl: `https://picsum.photos/seed/${Math.random()}/800/450`
        };
        storage.saveSundaySchool([newLesson, ...current]);
        alert('Sunday School Lesson Published!');
    }
    
    // Reset form
    setSsTitle('');
    setSsTopic('');
    setSsVerse('');
    setSsContent('');
    setSsQuestions('');
    setEditingId(null);
    refreshLists();
  };

  const startEditDevotional = (entry: DevotionalEntry) => {
    setContentType('devotional');
    setMode('edit');
    setEditingId(entry.id);
    setDevotionalEntry(entry);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEditLesson = (lesson: SundaySchoolLesson) => {
    setContentType('sunday-school');
    setMode('edit');
    setEditingId(lesson.id);
    setSsTitle(lesson.title);
    setSsTopic(lesson.topic);
    setSsVerse(lesson.memoryVerse);
    setSsContent(lesson.content);
    setSsQuestions(lesson.discussionQuestions.join('\n'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteDevotional = (id: string) => {
    if (window.confirm("Are you sure you want to remove this devotional?")) {
        const filtered = existingDevotionals.filter(d => d.id !== id);
        storage.saveDevotionals(filtered);
        refreshLists();
    }
  };

  const deleteLesson = (id: string) => {
    if (window.confirm("Are you sure you want to remove this lesson?")) {
        const filtered = existingLessons.filter(l => l.id !== id);
        storage.saveSundaySchool(filtered);
        refreshLists();
    }
  };

  return (
    <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-top-4 pb-20">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
        <h2 className="text-xl font-bold flex items-center gap-2 serif-font mb-6">
          <ICONS.Admin /> {editingId ? 'Editor Studio' : 'Creator Studio'}
        </h2>

        {/* Content Type Selector */}
        <div className="mb-8">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">Content focus</label>
          <div className="flex bg-stone-100 p-1 rounded-2xl w-full">
            <button 
              onClick={() => { setContentType('devotional'); setEditingId(null); setDevotionalEntry(null); setMode('ai'); }}
              className={`flex-1 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${contentType === 'devotional' ? 'bg-white shadow-sm text-amber-800' : 'text-stone-400'}`}
            >
              Daily Devotional
            </button>
            <button 
              onClick={() => { setContentType('sunday-school'); setEditingId(null); setMode('manual'); }}
              className={`flex-1 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${contentType === 'sunday-school' ? 'bg-white shadow-sm text-indigo-800' : 'text-stone-400'}`}
            >
              Sunday School Lesson
            </button>
          </div>
        </div>

        {/* Devotional Input Area */}
        {contentType === 'devotional' && (
          <div className="space-y-6">
            {!editingId && (
                <div className="flex bg-stone-100 p-1 rounded-full w-fit">
                  <button 
                    onClick={() => setMode('ai')}
                    className={`px-4 py-1.5 rounded-full transition-all text-[10px] font-bold uppercase tracking-wider ${mode === 'ai' ? 'bg-white shadow-sm text-amber-800' : 'text-stone-400'}`}
                  >
                    AI Structuring
                  </button>
                  <button 
                    onClick={() => setMode('manual')}
                    className={`px-4 py-1.5 rounded-full transition-all text-[10px] font-bold uppercase tracking-wider ${mode === 'manual' ? 'bg-white shadow-sm text-amber-800' : 'text-stone-400'}`}
                  >
                    Manual Entry
                  </button>
                </div>
            )}

            {!editingId && (
                <>
                    <textarea
                      className="w-full h-64 p-5 rounded-2xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-none text-stone-800 text-sm leading-relaxed"
                      placeholder="Paste the devotional text here..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />

                    <button
                      onClick={handleProcessDevotional}
                      disabled={loading || !inputText}
                      className="w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 bg-amber-800 text-white hover:bg-amber-700 disabled:opacity-50 transition-all shadow-lg shadow-amber-900/10"
                    >
                      {loading ? <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" /> : (mode === 'ai' ? <ICONS.Sparkles /> : null)}
                      {mode === 'ai' ? 'Extract with Spirit AI' : 'Open Manual Layout'}
                    </button>
                </>
            )}

            {(devotionalEntry || editingId) && (
              <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-amber-900 serif-font">{editingId ? 'Edit Devotional' : 'Draft Review'}</h3>
                  <button onClick={() => { setDevotionalEntry(null); setEditingId(null); setMode('ai'); }} className="text-stone-400 hover:text-stone-600 text-xs font-bold uppercase tracking-widest">Cancel</button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-amber-800 uppercase tracking-widest ml-1">Title</label>
                    <input 
                        placeholder="Title" 
                        className="w-full bg-white px-4 py-3 rounded-xl border border-amber-200 text-lg font-bold serif-font" 
                        value={devotionalEntry?.title || ''} 
                        onChange={e => setDevotionalEntry({...devotionalEntry, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-amber-800 uppercase tracking-widest ml-1">Scripture</label>
                    <input 
                        placeholder="Scripture" 
                        className="w-full bg-white px-4 py-3 rounded-xl border border-amber-200 text-sm italic" 
                        value={devotionalEntry?.scripture || ''} 
                        onChange={e => setDevotionalEntry({...devotionalEntry, scripture: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-amber-800 uppercase tracking-widest ml-1">Message Content</label>
                    <textarea 
                        placeholder="Content" 
                        className="w-full bg-white px-4 py-3 rounded-xl border border-amber-200 text-sm h-64 resize-none leading-relaxed" 
                        value={devotionalEntry?.content || ''} 
                        onChange={e => setDevotionalEntry({...devotionalEntry, content: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-amber-800 uppercase tracking-widest ml-1">Prayer</label>
                    <textarea 
                        placeholder="Prayer" 
                        className="w-full bg-white px-4 py-3 rounded-xl border border-amber-200 text-sm h-24 resize-none italic" 
                        value={devotionalEntry?.prayer || ''} 
                        onChange={e => setDevotionalEntry({...devotionalEntry, prayer: e.target.value})}
                    />
                  </div>
                  <button onClick={handlePublishDevotional} className="w-full py-4 bg-amber-800 text-white rounded-xl font-bold shadow-md hover:bg-amber-900 transition-all">
                    {editingId ? 'Save Changes' : 'Publish to Library'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sunday School Form */}
        {contentType === 'sunday-school' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
             {editingId && (
                <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-2xl mb-2">
                   <h3 className="text-sm font-bold text-indigo-900">Editing Lesson</h3>
                   <button onClick={() => { setEditingId(null); setSsTitle(''); setSsTopic(''); setSsVerse(''); setSsContent(''); setSsQuestions(''); }} className="text-stone-400 hover:text-stone-600 text-xs font-bold uppercase tracking-widest">Cancel</button>
                </div>
             )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Lesson Title</label>
                <input 
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:border-indigo-500 outline-none transition-all font-semibold" 
                  placeholder="e.g. Walking in the Light"
                  value={ssTitle}
                  onChange={e => setSsTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Topic / Theme</label>
                <input 
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:border-indigo-500 outline-none transition-all" 
                  placeholder="e.g. Sanctification"
                  value={ssTopic}
                  onChange={e => setSsTopic(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Memory Verse</label>
              <input 
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:border-indigo-500 outline-none transition-all italic" 
                placeholder='e.g. John 8:12 - "I am the light of the world..."'
                value={ssVerse}
                onChange={e => setSsVerse(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Lesson Body</label>
              <textarea 
                className="w-full h-64 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:border-indigo-500 outline-none transition-all text-sm leading-relaxed" 
                placeholder="Write the full lesson content here..."
                value={ssContent}
                onChange={e => setSsContent(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest ml-1">Discussion Questions (One per line)</label>
              <textarea 
                className="w-full h-32 px-4 py-3 rounded-xl border border-indigo-100 bg-indigo-50/30 focus:border-indigo-500 outline-none transition-all text-sm" 
                placeholder="What does it mean to walk in light?&#10;How can we help others find the light?&#10;What are the shadows in our lives?"
                value={ssQuestions}
                onChange={e => setSsQuestions(e.target.value)}
              />
            </div>

            <button
              onClick={handlePublishSundaySchool}
              className="w-full py-5 rounded-2xl font-bold bg-indigo-800 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20 active:scale-[0.98]"
            >
              {editingId ? 'Save Lesson Changes' : 'Publish to Sunday School'}
            </button>
          </div>
        )}
      </div>

      {/* Management Section */}
      {!editingId && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 space-y-6">
            <h2 className="text-xl font-bold serif-font flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Manage Existing Content
            </h2>

            <div className="space-y-8">
                {/* Devotionals List */}
                <section>
                    <h3 className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-4 border-b border-amber-100 pb-2 flex justify-between items-center">
                        Devotionals
                        <span className="bg-amber-100 px-2 py-0.5 rounded text-amber-900">{existingDevotionals.length}</span>
                    </h3>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {existingDevotionals.map(d => (
                            <div key={d.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate serif-font">{d.title}</p>
                                    <p className="text-[10px] text-stone-400">{new Date(d.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => startEditDevotional(d)}
                                        className="p-2 text-stone-400 hover:text-amber-800 transition-colors"
                                        title="Edit"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={() => deleteDevotional(d.id)}
                                        className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                                        title="Delete"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Lessons List */}
                <section>
                    <h3 className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest mb-4 border-b border-indigo-100 pb-2 flex justify-between items-center">
                        Sunday School Lessons
                        <span className="bg-indigo-100 px-2 py-0.5 rounded text-indigo-900">{existingLessons.length}</span>
                    </h3>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {existingLessons.map(l => (
                            <div key={l.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate serif-font">{l.title}</p>
                                    <p className="text-[10px] text-stone-400">{new Date(l.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => startEditLesson(l)}
                                        className="p-2 text-stone-400 hover:text-indigo-800 transition-colors"
                                        title="Edit"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={() => deleteLesson(l.id)}
                                        className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                                        title="Delete"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
          </div>
      )}
    </div>
  );
};

export default AdminPanel;
