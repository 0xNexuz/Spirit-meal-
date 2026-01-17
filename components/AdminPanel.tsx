
import React, { useState } from 'react';
import { extractDevotionalStructure } from '../services/geminiService';
import { DevotionalEntry } from '../types';
import { storage } from '../services/storageService';
import { ICONS } from '../constants';

const AdminPanel: React.FC<{ onEntryAdded: () => void }> = ({ onEntryAdded }) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<Partial<DevotionalEntry> | null>(null);
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    
    if (mode === 'ai') {
      setLoading(true);
      const extracted = await extractDevotionalStructure(inputText);
      if (extracted) {
        setEntry({
          ...extracted,
          date: new Date().toISOString().split('T')[0],
          id: Math.random().toString(36).substr(2, 9),
          imageUrl: `https://picsum.photos/seed/${Math.random()}/800/450`
        });
      }
      setLoading(false);
    } else {
      // Manual mode just puts the whole thing in the content box
      setEntry({
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

  const handlePublish = () => {
    if (!entry || !entry.title || !entry.content) {
      alert('Please fill in at least the title and content.');
      return;
    }
    const current = storage.getDevotionals();
    storage.saveDevotionals([entry as DevotionalEntry, ...current]);
    setEntry(null);
    setInputText('');
    onEntryAdded();
    alert('Devotional Published Successfully!');
  };

  return (
    <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-top-4">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 serif-font">
            <ICONS.Admin /> Creator Studio
          </h2>
          <div className="flex bg-stone-100 p-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <button 
              onClick={() => setMode('ai')}
              className={`px-3 py-1.5 rounded-full transition-all ${mode === 'ai' ? 'bg-white shadow-sm text-amber-800' : 'text-stone-400'}`}
            >
              AI Structure
            </button>
            <button 
              onClick={() => setMode('manual')}
              className={`px-3 py-1.5 rounded-full transition-all ${mode === 'manual' ? 'bg-white shadow-sm text-amber-800' : 'text-stone-400'}`}
            >
              Pure Manual
            </button>
          </div>
        </div>

        <p className="text-stone-500 text-sm mb-4">
          {mode === 'ai' 
            ? "Paste your text below. AI will separate the title, scripture, and body without changing your words."
            : "Paste your text below. You will manually assign it to the correct fields."}
        </p>

        <textarea
          className="w-full h-64 p-5 rounded-2xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-none text-stone-800 text-sm leading-relaxed"
          placeholder="Paste the daily Spirit Meal text here..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />

        <button
          onClick={handleProcess}
          disabled={loading || !inputText}
          className="mt-4 w-full bg-stone-900 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? (
            <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            mode === 'ai' ? <ICONS.Sparkles /> : null
          )}
          {mode === 'ai' ? 'Extract & Organize' : 'Prepare for Manual Layout'}
        </button>
      </div>

      {entry && (
        <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 animate-in fade-in slide-in-from-bottom-4 shadow-xl shadow-amber-900/5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800/60 mb-6 flex items-center justify-between">
            Final Curation Review
            <button onClick={() => setEntry(null)} className="text-stone-400 hover:text-stone-600">Cancel</button>
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-amber-800/40 uppercase tracking-wider">Title</label>
              <input 
                className="w-full bg-transparent border-b border-amber-200/50 py-2 text-2xl font-bold serif-font text-stone-800 focus:border-amber-500 outline-none transition-all" 
                value={entry.title} 
                onChange={e => setEntry({...entry, title: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-amber-800/40 uppercase tracking-wider">Scripture Reference</label>
              <input 
                className="w-full bg-transparent border-b border-amber-200/50 py-2 text-sm font-medium italic text-amber-900 focus:border-amber-500 outline-none transition-all" 
                value={entry.scripture} 
                onChange={e => setEntry({...entry, scripture: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-amber-800/40 uppercase tracking-wider">Original Content Body</label>
              <textarea 
                className="w-full bg-white/50 p-4 rounded-xl border border-amber-200/50 text-sm leading-relaxed text-stone-700 h-64 focus:border-amber-500 outline-none resize-none transition-all" 
                value={entry.content} 
                onChange={e => setEntry({...entry, content: e.target.value})}
              />
              <p className="text-[10px] text-amber-700/60 italic">This field contains your original text exactly as pasted.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-amber-800/40 uppercase tracking-wider">Closing Prayer</label>
                <textarea 
                  className="w-full bg-white/50 p-3 rounded-xl border border-amber-200/50 text-xs text-stone-600 h-24 focus:border-amber-500 outline-none resize-none transition-all" 
                  value={entry.prayer} 
                  onChange={e => setEntry({...entry, prayer: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-amber-800/40 uppercase tracking-wider">Short Meditation</label>
                <textarea 
                  className="w-full bg-white/50 p-3 rounded-xl border border-amber-200/50 text-xs text-stone-600 h-24 focus:border-amber-500 outline-none resize-none transition-all" 
                  value={entry.meditation} 
                  onChange={e => setEntry({...entry, meditation: e.target.value})}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handlePublish}
            className="w-full mt-8 bg-amber-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-amber-900/20 hover:bg-amber-800 active:scale-[0.99] transition-all"
          >
            Publish to Spirit Meal
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
