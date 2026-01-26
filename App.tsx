
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { DevotionalEntry, SundaySchoolLesson, UserPreferences, ThemeMode } from './types.ts';
import { storage } from './services/storageService.ts';
import { ADMIN_SECRET_KEY, ICONS } from './constants.tsx';
import Layout from './components/Layout.tsx';
import DevotionalCard from './components/DevotionalCard.tsx';
import AdminPanel from './components/AdminPanel.tsx';

// Helper to get local YYYY-MM-DD string
const getLocalTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const App: React.FC = () => {
  const [devotionals, setDevotionals] = useState<DevotionalEntry[]>([]);
  const [sundayLessons, setSundayLessons] = useState<SundaySchoolLesson[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>(storage.getBookmarks());
  const [prefs, setPrefs] = useState<UserPreferences>(storage.getPreferences());
  const [isAdmin, setIsAdmin] = useState(storage.getAdminMode());
  const [isStandalone, setIsStandalone] = useState(false);
  const lastReminderRef = useRef<string | null>(null);

  useEffect(() => {
    setDevotionals(storage.getDevotionals());
    setSundayLessons(storage.getSundaySchool());
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone);
  }, []);

  useEffect(() => {
    const handleSync = () => {
      setBookmarks(storage.getBookmarks());
      setPrefs(storage.getPreferences());
      setIsAdmin(storage.getAdminMode());
      setDevotionals(storage.getDevotionals());
      setSundayLessons(storage.getSundaySchool());
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener(storage.SYNC_EVENT, handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener(storage.SYNC_EVENT, handleSync);
    };
  }, []);

  // Reminder Logic
  useEffect(() => {
    if (!prefs.notificationsEnabled) return;
    const intervalId = setInterval(() => {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (time === prefs.notificationTime && lastReminderRef.current !== time) {
        lastReminderRef.current = time;
        if (Notification.permission === 'granted') {
          new Notification("Spirit Meal", { 
            body: "Your daily spiritual meal is ready. Take a moment to feed your soul.",
            icon: '/icon-192.png'
          });
        }
      }
    }, 30000);
    return () => clearInterval(intervalId);
  }, [prefs.notificationsEnabled, prefs.notificationTime]);

  const todaysDevotional = useMemo(() => {
    if (devotionals.length === 0) return null;
    const todayStr = getLocalTodayString();
    
    // 1. Try exact match for today
    const exact = devotionals.find(d => d.date === todayStr);
    if (exact) return exact;

    // 2. Fallback: Most recent devotional that isn't in the future
    const pastAndPresent = devotionals
      .filter(d => d.date <= todayStr)
      .sort((a, b) => b.date.localeCompare(a.date));
    
    if (pastAndPresent.length > 0) return pastAndPresent[0];

    // 3. Last fallback: Just the first one in the list (most recent overall)
    return devotionals[0];
  }, [devotionals]);

  const updatePrefs = (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...prefs, ...newPrefs };
    setPrefs(updated);
    storage.savePreferences(updated);
  };

  const refreshData = () => {
    setDevotionals(storage.getDevotionals());
    setSundayLessons(storage.getSundaySchool());
  };

  return (
    <Router>
      <Layout theme={prefs.theme} isAdmin={isAdmin}>
        <Routes>
          <Route path="/" element={todaysDevotional ? <DevotionalCard entry={todaysDevotional} theme={prefs.theme} fontSize={prefs.fontSize} /> : <p className="p-20 text-center opacity-40">Spirit Meal is preparing...</p>} />
          <Route path="/archive" element={<ArchiveView devotionals={devotionals} theme={prefs.theme} />} />
          <Route path="/lessons" element={<LessonsView lessons={sundayLessons} />} />
          <Route path="/lesson/:id" element={<SundaySchoolDetail lessons={sundayLessons} theme={prefs.theme} fontSize={prefs.fontSize} />} />
          <Route path="/devotional/:id" element={<DevotionalDetail devotionals={devotionals} theme={prefs.theme} fontSize={prefs.fontSize} />} />
          <Route path="/bookmarks" element={<BookmarksView devotionals={devotionals} bookmarks={bookmarks} />} />
          <Route path="/login" element={<LoginView onLogin={(success) => setIsAdmin(success)} />} />
          <Route path="/admin" element={isAdmin ? <AdminRoute isAdmin={isAdmin} refreshData={refreshData} /> : <Navigate to="/login" />} />
          <Route path="/settings" element={<SettingsView prefs={prefs} updatePrefs={updatePrefs} isAdmin={isAdmin} setIsAdmin={setIsAdmin} isStandalone={isStandalone} />} />
        </Routes>
      </Layout>
    </Router>
  );
};

// --- SUB-COMPONENTS ---

const LoginView = ({ onLogin }: { onLogin: (s: boolean) => void }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (key === ADMIN_SECRET_KEY) {
      storage.setAdminMode(true);
      onLogin(true);
      navigate('/admin');
    } else {
      setError(true);
      setKey('');
    }
  };

  return (
    <div className="pt-20 px-6 max-w-sm mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold serif-font">Admin Studio</h2>
        <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Entry Restricted</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-2">Master Access Key</label>
          <input 
            type="password" 
            autoFocus
            value={key}
            onChange={(e) => {setKey(e.target.value); setError(false);}}
            placeholder="••••••••••••"
            className={`w-full p-5 rounded-3xl border-2 bg-stone-50 outline-none transition-all text-center tracking-[0.5em] font-black ${error ? 'border-red-200 focus:border-red-400' : 'border-stone-100 focus:border-amber-700/30'}`}
          />
        </div>
        {error && <p className="text-center text-red-500 text-[10px] font-bold uppercase animate-bounce">Access Denied</p>}
        <button type="submit" className="w-full py-5 bg-amber-800 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-900/20 active:scale-95 transition-all">
          Unlock Studio
        </button>
      </form>
      <p className="text-center text-[10px] text-stone-300 italic">Access is reserved for authorized ministry administrators only.</p>
    </div>
  );
};

const SettingsView = ({ prefs, updatePrefs, isAdmin, setIsAdmin, isStandalone }: any) => {
  const navigate = useNavigate();
  return (
    <div className="pt-6 space-y-8 pb-20">
      <h2 className="text-2xl font-bold serif-font">Settings</h2>
      
      <section className="space-y-4">
        <div className="flex items-center gap-2">
           <ICONS.Settings />
           <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Daily Reminders</h3>
        </div>
        <div className="p-6 rounded-3xl bg-white border border-stone-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Enable Alerts</p>
              <p className="text-xs text-stone-500">Nudge me for my morning meal</p>
            </div>
            <button onClick={() => updatePrefs({ notificationsEnabled: !prefs.notificationsEnabled })} className={`w-14 h-7 rounded-full relative transition-all shadow-inner ${prefs.notificationsEnabled ? 'bg-amber-600' : 'bg-stone-200'}`}>
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${prefs.notificationsEnabled ? 'left-8' : 'left-1'}`} />
            </button>
          </div>

          {prefs.notificationsEnabled && (
            <div className="space-y-6">
              <input type="time" value={prefs.notificationTime} onChange={e => updatePrefs({ notificationTime: e.target.value })} className="w-full p-4 rounded-2xl border bg-stone-50 font-bold text-center text-2xl" />
              {!isStandalone && <p className="p-4 bg-amber-50 rounded-2xl text-[10px] text-amber-900 italic">Note: For persistent alerts on mobile, use 'Add to Home Screen'.</p>}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-black">Aa</div>
           <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Text Selection</h3>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {(['sm', 'base', 'lg', 'xl'] as const).map(sz => (
            <button key={sz} onClick={() => updatePrefs({ fontSize: sz })} className={`py-4 rounded-2xl border-2 uppercase text-[10px] font-black tracking-widest ${prefs.fontSize === sz ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-md' : 'border-stone-100 bg-white text-stone-300'}`}>
              {sz}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 rounded-full bg-stone-200" />
           <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Theme</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['light', 'sepia', 'dark'] as const).map(m => (
            <button key={m} onClick={() => updatePrefs({ theme: m })} className={`py-4 rounded-2xl border-2 capitalize text-sm font-bold ${prefs.theme === m ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-md' : 'border-stone-100 bg-white text-stone-500'}`}>
              {m}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t border-stone-100">
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Advanced</h3>
        <button 
          onClick={() => { if(confirm("This will restore the app to the Master version. Your local drafts will be lost. Continue?")) { storage.resetToMaster(); alert("App Restored!"); window.location.reload(); } }}
          className="w-full p-4 border-2 border-stone-100 text-stone-500 font-bold text-[10px] uppercase rounded-2xl hover:bg-stone-50"
        >
          Restore Master Content
        </button>
      </section>

      {isAdmin ? (
        <div className="space-y-3 pt-6">
          <button onClick={() => navigate('/admin')} className="w-full py-5 bg-stone-800 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs">
            Open Admin Studio
          </button>
          <button onClick={() => { if(confirm("Logout from Admin?")) { storage.setAdminMode(false); setIsAdmin(false); navigate('/'); } }} className="w-full py-5 border-2 border-stone-200 text-stone-400 font-bold uppercase tracking-widest text-[10px] rounded-[1.5rem]">
            Logout Administrator
          </button>
        </div>
      ) : (
        <button onClick={() => navigate('/login')} className="w-full py-5 border-2 border-dashed border-stone-200 text-stone-400 text-xs font-bold uppercase tracking-[0.2em] rounded-2xl hover:border-amber-300 hover:text-amber-800 transition-all">
          Admin Portal Access
        </button>
      )}
    </div>
  );
};

const AdminRoute = ({ refreshData }: { isAdmin: boolean, refreshData: () => void }) => {
  const location = useLocation();
  const editId = location.state?.editId;
  return <AdminPanel onEntryAdded={refreshData} editId={editId} />;
};

const ArchiveView = ({ devotionals, theme }: any) => {
  const sorted = [...devotionals].sort((a, b) => b.date.localeCompare(a.date));
  const todayStr = getLocalTodayString();
  
  return (
    <div className="pt-6 space-y-4">
      <h2 className="text-2xl font-bold serif-font mb-4">Library</h2>
      {sorted.length === 0 ? <p className="text-center py-10 opacity-40 italic">Library is empty</p> : sorted.map((d: any) => (
        <Link key={d.id} to={`/devotional/${d.id}`} className={`block p-4 rounded-2xl border transition-all hover:translate-x-1 relative overflow-hidden ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-100 shadow-sm'}`}>
          {d.date === todayStr && (
            <div className="absolute top-0 right-0 bg-amber-600 text-white text-[8px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-widest">Today's Meal</div>
          )}
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">{d.date}</span>
          <h3 className="font-bold text-lg serif-font">{d.title}</h3>
        </Link>
      ))}
    </div>
  );
};

const LessonsView = ({ lessons }: any) => {
  const sorted = [...lessons].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="pt-6 space-y-4">
      <h2 className="text-2xl font-bold serif-font mb-4">Sunday School</h2>
      {sorted.length === 0 ? <p className="text-center py-10 opacity-40 italic">No lessons found</p> : sorted.map((l: any) => (
        <Link key={l.id} to={`/lesson/${l.id}`} className="block p-5 rounded-3xl bg-white border border-indigo-100 shadow-sm transition-all hover:translate-x-1">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">{l.topic}</span>
          <h3 className="font-bold text-lg serif-font text-indigo-950">{l.title}</h3>
        </Link>
      ))}
    </div>
  );
};

const BookmarksView = ({ devotionals, bookmarks }: any) => {
  const list = devotionals.filter((d: any) => bookmarks.includes(d.id));
  return (
    <div className="pt-6 space-y-4">
      <h2 className="text-2xl font-bold serif-font mb-4">Saved Meals</h2>
      {list.length === 0 ? <p className="text-center py-20 opacity-40 italic">No saved meals found</p> : list.map((d: any) => (
        <Link key={d.id} to={`/devotional/${d.id}`} className="block p-5 rounded-3xl bg-white border border-amber-100 shadow-sm flex justify-between items-center group">
          <h3 className="font-bold serif-font group-hover:text-amber-800 transition-colors">{d.title}</h3>
          <ICONS.Bookmark />
        </Link>
      ))}
    </div>
  );
};

const DevotionalDetail = ({ devotionals, theme, fontSize }: any) => {
  const { id } = useParams();
  const entry = devotionals.find((d: any) => d.id === id);
  if (!entry) return <p className="p-20 text-center opacity-40">Entry not found</p>;
  return <DevotionalCard entry={entry} theme={theme} fontSize={fontSize} />;
};

const SundaySchoolDetail = ({ lessons, theme, fontSize }: any) => {
  const { id } = useParams();
  const lesson = lessons.find((l: any) => l.id === id);
  if (!lesson) return <p className="p-20 text-center opacity-40">Lesson not found</p>;
  const sizeClass = { sm: 'text-sm', base: 'text-base', lg: 'text-lg', xl: 'text-xl' }[fontSize as any] || 'text-base';
  return (
    <div className="py-8 animate-in fade-in slide-in-from-bottom-2">
      <span className="text-xs font-bold uppercase tracking-widest text-indigo-700 mb-2 block">{lesson.topic}</span>
      <h2 className="text-3xl md:text-4xl font-bold serif-font mb-6 leading-tight">{lesson.title}</h2>
      {lesson.imageUrl && (
        <div className="mb-8 rounded-3xl overflow-hidden shadow-lg aspect-video">
          <img src={lesson.imageUrl} alt={lesson.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-6 rounded-2xl bg-indigo-50 border-l-4 border-indigo-600 mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-800 mb-1">Memory Verse</p>
        <p className="serif-font italic text-lg text-indigo-900">"{lesson.memoryVerse}"</p>
      </div>
      <div className={`serif-font leading-relaxed ${sizeClass} ${theme === 'dark' ? 'text-stone-300' : 'text-stone-700'} mb-12`}>
        {lesson.content.split('\n').map((p: string, i: number) => <p key={i} className="mb-4">{p}</p>)}
      </div>
      
      {lesson.discussionQuestions && lesson.discussionQuestions.length > 0 && (
        <section className={`p-8 rounded-3xl ${theme === 'dark' ? 'bg-stone-800/50' : 'bg-stone-100'}`}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-700 mb-6">Study Questions</h3>
          <ul className="space-y-6">
            {lesson.discussionQuestions.map((q, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center font-bold text-sm">{i + 1}</span>
                <p className="text-sm leading-relaxed">{q}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default App;
