
import React, { useState } from 'react';
import { extractDevotionalStructure } from '../services/geminiService';
import { DevotionalEntry, SundaySchoolLesson } from '../types';
import { storage } from '../services/storageService';
import { ICONS } from '../constants';

const AdminPanel: React.FC<{ onEntryAdded: () => void }> = ({ onEntryAdded }) => {
  const [contentType, setContentType] = useState<'devotional' | 'sunday-school'>('devotional');
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [loading, setLoading] = useState(false);

  // Devotional states
  const [inputText, setInputText] = useState('');
  const [devotionalEntry, setDevotionalEntry] = useState<Partial<DevotionalEntry> | null>(null);

  // Sunday School states
  const [ssTitle, setSsTitle] = useState('');
  const [ssTopic, setSsTopic] = useState('');
  const [ssVerse, setSsVerse] = useState('');
  const [ssContent, setSsContent] = useState('');
  const [ssQuestions, setSsQuestions] = useState('');

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
    storage.saveDevotionals([devotionalEntry as DevotionalEntry, ...current]);
    setDevotionalEntry(null);
    setInputText('');
    onEntryAdded();
    alert('Devotional Published Successfully!');
  };

  const handlePublishSundaySchool = () => {
    if (!ssTitle || !ssContent) {
      alert('Please provide a title and lesson content.');
      return;
    }
    
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

    const current = storage.getSundaySchool();
    storage.saveSundaySchool([newLesson, ...current]);
    
    // Reset form
    setSsTitle('');
    setSsTopic('');
    setSsVerse('');
    setSsContent('');
    setSsQuestions('');
    
    onEntryAdded();
    alert('Sunday School Lesson Published!');
  };

  return (
    <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-top-4 pb-20">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
        <h2 className="text-xl font-bold flex items-center gap-2 serif-font mb-6">
          <ICONS.Admin /> Creator Studio
        </h2>

        {/* Content Type Selector */}
        <div className="mb-8">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">I am creating a...</label>
          <div className="flex bg-stone-100 p-1 rounded-2xl w-full">
            <button 
              onClick={() => setContentType('devotional')}
              className={`flex-1 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${contentType === 'devotional' ? 'bg-white shadow-sm text-amber-800' : 'text-stone-400'}`}
            >
              Daily Devotional
            </button>
            <button 
              onClick={() => setContentType('sunday-school')}
              className={`flex-1 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${contentType === 'sunday-school' ? 'bg-white shadow-sm text-indigo-800' : 'text-stone-400'}`}
            >
              Sunday School Lesson
            </button>
          </div>
        </div>

        {/* Devotional Input Area */}
        {contentType === 'devotional' && (
          <div className="space-y-6">
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

            {devotionalEntry && (
              <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-amber-900 serif-font">Draft Review</h3>
                  <button onClick={() => setDevotionalEntry(null)} className="text-stone-400 hover:text-stone-600 text-xs">Clear</button>
                </div>
                <div className="space-y-4">
                  <input 
                    placeholder="Title" 
                    className="w-full bg-white px-4 py-3 rounded-xl border border-amber-200 text-lg font-bold serif-font" 
                    value={devotionalEntry.title} 
                    onChange={e => setDevotionalEntry({...devotionalEntry, title: e.target.value})}
                  />
                  <input 
                    placeholder="Scripture" 
                    className="w-full bg-white px-4 py-3 rounded-xl border border-amber-200 text-sm italic" 
                    value={devotionalEntry.scripture} 
                    onChange={e => setDevotionalEntry({...devotionalEntry, scripture: e.target.value})}
                  />
                  <textarea 
                    placeholder="Content" 
                    className="w-full bg-white px-4 py-3 rounded-xl border border-amber-200 text-sm h-48 resize-none" 
                    value={devotionalEntry.content} 
                    onChange={e => setDevotionalEntry({...devotionalEntry, content: e.target.value})}
                  />
                  <button onClick={handlePublishDevotional} className="w-full py-4 bg-amber-800 text-white rounded-xl font-bold">Publish to Library</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sunday School Form */}
        {contentType === 'sunday-school' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
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
              Publish to Sunday School
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
