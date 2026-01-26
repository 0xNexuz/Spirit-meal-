
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams, useLocation } from 'react-router-dom';
import { DevotionalEntry, SundaySchoolLesson, UserPreferences, ThemeMode } from './types.ts';
import { storage } from './services/storageService.ts';
import { ADMIN_SECRET_KEY, ICONS } from './constants.tsx';
import Layout from './components/Layout.tsx';
import DevotionalCard from './components/DevotionalCard.tsx';
import AdminPanel from './components/AdminPanel.tsx';

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
    }, 30000); // Check every 30s
    return () => clearInterval(intervalId);
  }, [prefs.notificationsEnabled, prefs.notificationTime]);

  const updatePrefs = (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...prefs, ...newPrefs };
    setPrefs(updated);
    storage.savePreferences(updated);
  };

  const handleNotificationToggle = async () => {
    if (typeof Notification === 'undefined') {
      alert("Notifications not supported in this browser.");
      return;
    }

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert("Please enable alerts in your device settings.");
        return;
      }
    }
    updatePrefs({ notificationsEnabled: !prefs.notificationsEnabled });
  };

  const refreshData = () => {
    setDevotionals(storage.getDevotionals());
    setSundayLessons(storage.getSundaySchool());
  };

  return (
    <Router>
      <Layout theme={prefs.theme} isAdmin={isAdmin}>
        <Routes>
          <Route path="/" element={devotionals[0] ? <DevotionalCard entry={devotionals[0]} theme={prefs.theme} fontSize={prefs.fontSize} /> : <p className="p-20 text-center opacity-40">Spirit Meal is preparing...</p>} />
          <Route path="/archive" element={<ArchiveView devotionals={devotionals} theme={prefs.theme} />} />
          <Route path="/lessons" element={<LessonsView lessons={sundayLessons} />} />
          <Route path="/lesson/:id" element={<SundaySchoolDetail lessons={sundayLessons} theme={prefs.theme} fontSize={prefs.fontSize} />} />
          <Route path="/devotional/:id" element={<DevotionalDetail devotionals={devotionals} theme={prefs.theme} fontSize={prefs.fontSize} />} />
          <Route path="/bookmarks" element={<BookmarksView devotionals={devotionals} bookmarks={bookmarks} />} />
          <Route path="/admin" element={<AdminRoute isAdmin={isAdmin} refreshData={refreshData} />} />
          <Route path="/settings" element={
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
                    <button onClick={handleNotificationToggle} className={`w-14 h-7 rounded-full relative transition-all shadow-inner ${prefs.notificationsEnabled ? 'bg-amber-600' : 'bg-stone-200'}`}>
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${prefs.notificationsEnabled ? 'left-8' : 'left-1'}`} />
                    </button>
                  </div>

                  {prefs.notificationsEnabled && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <label className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block mb-2">Preferred Time</label>
                        <input 
                          type="time" 
                          value={prefs.notificationTime} 
                          onChange={e => updatePrefs({ notificationTime: e.target.value })} 
                          className="w-full p-4 rounded-2xl border bg-stone-50 font-bold text-center text-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500/10" 
                        />
                      </div>
                      
                      {!isStandalone && (
                        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 text-[11px] leading-relaxed text-amber-900 shadow-sm">
                          <p className="font-bold uppercase mb-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                            Fix Phone Notifications
                          </p>
                          Standard mobile browsers (Chrome/Safari) block alerts for security. To get notifications:
                          <ol className="list-decimal ml-5 mt-3 space-y-2">
                            <li>Tap the <strong>Share</strong> icon (bottom center on iPhone, top right on Android).</li>
                            <li>Select <strong>'Add to Home Screen'</strong>.</li>
                            <li>Open the <strong>Spirit Meal</strong> icon that appears on your phone's home screen.</li>
                            <li>Re-enable this switch inside the new app!</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded bg-stone-200" />
                   <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Appearance</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'sepia', 'dark'] as const).map(m => (
                    <button 
                      key={m} 
                      onClick={() => updatePrefs({ theme: m })} 
                      className={`py-4 rounded-2xl border-2 capitalize text-sm font-bold transition-all ${prefs.theme === m ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-md' : 'border-stone-100 bg-white text-stone-500'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </section>

              <button onClick={() => {
                if (isAdmin) { 
                  if(confirm("Logout from Admin Studio?")) {
                    storage.setAdminMode(false); 
                    setIsAdmin(false); 
                  }
                }
                else { 
                  const k = prompt("Master Access Key:"); 
                  if (k === ADMIN_SECRET_KEY) { storage.setAdminMode(true); setIsAdmin(true); } 
                  else if(k !== null) alert("Access Denied.");
                }
              }} className="w-full py-5 border-2 border-dashed border-stone-200 text-stone-400 text-xs font-bold uppercase tracking-[0.2em] rounded-2xl hover:border-amber-300 hover:text-amber-800 transition-all">
                {isAdmin ? 'Logout Admin' : 'Admin Access'}
              </button>
            </div>
          } />
        </Routes>
      </Layout>
    </Router>
  );
};

// Component to handle route state for editing
const AdminRoute = ({ isAdmin, refreshData }: { isAdmin: boolean, refreshData: () => void }) => {
  const location = useLocation();
  const editId = location.state?.editId;
  
  if (!isAdmin) return <p className="p-10 text-center opacity-40">Restricted Area</p>;
  return <AdminPanel onEntryAdded={refreshData} editId={editId} />;
};

// Sub-components to keep code clean
const ArchiveView = ({ devotionals, theme }: any) => (
  <div className="pt-6 space-y-4">
    <h2 className="text-2xl font-bold serif-font mb-4">Library</h2>
    {devotionals.length === 0 ? <p className="text-center py-10 opacity-40 italic">Library is empty</p> : devotionals.map((d: any) => (
      <Link key={d.id} to={`/devotional/${d.id}`} className={`block p-4 rounded-2xl border transition-all hover:translate-x-1 ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-100 shadow-sm'}`}>
        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">{d.date}</span>
        <h3 className="font-bold text-lg serif-font">{d.title}</h3>
      </Link>
    ))}
  </div>
);

const LessonsView = ({ lessons }: any) => (
  <div className="pt-6 space-y-4">
    <h2 className="text-2xl font-bold serif-font mb-4">Sunday School</h2>
    {lessons.length === 0 ? <p className="text-center py-10 opacity-40 italic">No lessons found</p> : lessons.map((l: any) => (
      <Link key={l.id} to={`/lesson/${l.id}`} className="block p-5 rounded-3xl bg-white border border-indigo-100 shadow-sm transition-all hover:translate-x-1">
        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">{l.topic}</span>
        <h3 className="font-bold text-lg serif-font text-indigo-950">{l.title}</h3>
      </Link>
    ))}
  </div>
);

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
      
      <div className="p-6 rounded-2xl bg-indigo-50 border-l-4 border-indigo-600 mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-800 mb-1">Memory Verse</p>
        <p className="serif-font italic text-lg text-indigo-900">"{lesson.memoryVerse}"</p>
      </div>

      <div className={`serif-font leading-relaxed ${sizeClass} ${theme === 'dark' ? 'text-stone-300' : 'text-stone-700'} mb-12`}>
        {lesson.content.split('\n').map((p: string, i: number) => <p key={i} className="mb-4">{p}</p>)}
      </div>

      {lesson.discussionQuestions && lesson.discussionQuestions.length > 0 && (
        <section className="p-8 rounded-3xl bg-stone-100/50 space-y-4">
          <h3 className="font-bold uppercase tracking-widest text-xs text-stone-400">Discussion Points</h3>
          <ul className="space-y-4">
            {lesson.discussionQuestions.map((q: string, i: number) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i+1}</span>
                <p className="text-sm">{q}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default App;
