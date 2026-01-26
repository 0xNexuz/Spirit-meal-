
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
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
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  useEffect(() => {
    const handleSync = () => {
      setBookmarks(storage.getBookmarks());
      setPrefs(storage.getPreferences());
      setIsAdmin(storage.getAdminMode());
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
          new Notification("Spirit Meal", { body: "Your daily spiritual meal is ready." });
        }
      }
    }, 15000);
    return () => clearInterval(intervalId);
  }, [prefs.notificationsEnabled, prefs.notificationTime]);

  const updatePrefs = (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...prefs, ...newPrefs };
    setPrefs(updated);
    storage.savePreferences(updated);
  };

  const handleNotificationToggle = async () => {
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert("Please allow notifications in your browser settings first.");
        return;
      }
    }
    updatePrefs({ notificationsEnabled: !prefs.notificationsEnabled });
  };

  return (
    <Router>
      <Layout theme={prefs.theme} isAdmin={isAdmin}>
        <Routes>
          <Route path="/" element={devotionals[0] ? <DevotionalCard entry={devotionals[0]} theme={prefs.theme} fontSize={prefs.fontSize} /> : <p className="p-20 text-center opacity-40">Preparing the meal...</p>} />
          <Route path="/archive" element={<ArchiveView devotionals={devotionals} theme={prefs.theme} />} />
          <Route path="/lessons" element={<LessonsView lessons={sundayLessons} />} />
          <Route path="/lesson/:id" element={<SundaySchoolDetail lessons={sundayLessons} theme={prefs.theme} fontSize={prefs.fontSize} />} />
          <Route path="/devotional/:id" element={<DevotionalDetail devotionals={devotionals} theme={prefs.theme} fontSize={prefs.fontSize} />} />
          <Route path="/bookmarks" element={<BookmarksView devotionals={devotionals} bookmarks={bookmarks} />} />
          <Route path="/admin" element={isAdmin ? <AdminPanel onEntryAdded={() => { setDevotionals(storage.getDevotionals()); setSundayLessons(storage.getSundaySchool()); }} /> : <p className="p-10">Restricted</p>} />
          <Route path="/settings" element={
            <div className="pt-6 space-y-8 pb-20">
              <h2 className="text-2xl font-bold serif-font">Settings</h2>
              
              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Reminders</h3>
                <div className="p-5 rounded-3xl bg-white border border-stone-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="font-bold">Daily Notifications</p>
                      <p className="text-xs text-stone-500">Alerts for your morning meal</p>
                    </div>
                    <button onClick={handleNotificationToggle} className={`w-12 h-6 rounded-full relative transition-colors ${prefs.notificationsEnabled ? 'bg-amber-600' : 'bg-stone-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${prefs.notificationsEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  {prefs.notificationsEnabled && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <input type="time" value={prefs.notificationTime} onChange={e => updatePrefs({ notificationTime: e.target.value })} className="w-full p-4 rounded-xl border bg-stone-50 font-bold text-center text-xl" />
                      
                      {!isStandalone && (
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-[11px] leading-relaxed text-amber-900">
                          <p className="font-bold uppercase mb-2">📲 Important for Phone Alerts:</p>
                          Mobile browsers block notifications while in the background. To get alerts on your phone:
                          <ol className="list-decimal ml-4 mt-2 space-y-1">
                            <li>Tap the <strong>Share</strong> button in your browser.</li>
                            <li>Choose <strong>'Add to Home Screen'</strong>.</li>
                            <li>Open the <strong>Spirit Meal</strong> app from your home screen and enable alerts here.</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Theme</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'sepia', 'dark'] as const).map(m => (
                    <button key={m} onClick={() => updatePrefs({ theme: m })} className={`py-3 rounded-xl border-2 capitalize text-sm font-bold ${prefs.theme === m ? 'border-amber-600 bg-amber-50' : 'border-stone-100 bg-white'}`}>{m}</button>
                  ))}
                </div>
              </section>

              <button onClick={() => {
                if (isAdmin) { storage.setAdminMode(false); setIsAdmin(false); }
                else { const k = prompt("Admin Key:"); if (k === ADMIN_SECRET_KEY) { storage.setAdminMode(true); setIsAdmin(true); } }
              }} className="w-full py-4 border-2 border-dashed border-stone-200 text-stone-400 text-xs font-bold uppercase tracking-widest rounded-xl">
                {isAdmin ? 'Logout' : 'Admin Access'}
              </button>
            </div>
          } />
        </Routes>
      </Layout>
    </Router>
  );
};

// Sub-components to keep code clean
const ArchiveView = ({ devotionals, theme }: any) => (
  <div className="pt-6 space-y-4">
    <h2 className="text-2xl font-bold serif-font mb-4">Library</h2>
    {devotionals.map((d: any) => (
      <Link key={d.id} to={`/devotional/${d.id}`} className={`block p-4 rounded-2xl border transition-all hover:translate-x-1 ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-100 shadow-sm'}`}>
        <span className="text-[10px] font-bold text-amber-700 uppercase">{new Date(d.date).toLocaleDateString()}</span>
        <h3 className="font-bold text-lg serif-font">{d.title}</h3>
      </Link>
    ))}
  </div>
);

const LessonsView = ({ lessons }: any) => (
  <div className="pt-6 space-y-4">
    <h2 className="text-2xl font-bold serif-font mb-4">Sunday School</h2>
    {lessons.map((l: any) => (
      <Link key={l.id} to={`/lesson/${l.id}`} className="block p-5 rounded-2xl bg-white border border-indigo-100 shadow-sm transition-all hover:translate-x-1">
        <span className="text-[10px] font-bold text-indigo-700 uppercase">{l.topic}</span>
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
      {list.length === 0 ? <p className="text-center py-20 opacity-40">No saved meals yet.</p> : list.map((d: any) => (
        <Link key={d.id} to={`/devotional/${d.id}`} className="block p-4 rounded-2xl bg-white border border-amber-100 shadow-sm flex justify-between items-center">
          <h3 className="font-bold serif-font">{d.title}</h3>
          <ICONS.Bookmark />
        </Link>
      ))}
    </div>
  );
};

const DevotionalDetail = ({ devotionals, theme, fontSize }: any) => {
  const { id } = useParams();
  const entry = devotionals.find((d: any) => d.id === id);
  if (!entry) return <p className="p-20 text-center">Not found</p>;
  return <DevotionalCard entry={entry} theme={theme} fontSize={fontSize} />;
};

const SundaySchoolDetail = ({ lessons, theme, fontSize }: any) => {
  const { id } = useParams();
  const lesson = lessons.find((l: any) => l.id === id);
  if (!lesson) return <p className="p-20 text-center">Not found</p>;
  const sizeClass = { sm: 'text-sm', base: 'text-base', lg: 'text-lg', xl: 'text-xl' }[fontSize as any] || 'text-base';
  return (
    <div className="py-8 animate-in fade-in">
      <h2 className="text-3xl font-bold serif-font mb-6">{lesson.title}</h2>
      <div className={`serif-font leading-relaxed ${sizeClass} ${theme === 'dark' ? 'text-stone-300' : 'text-stone-700'}`}>
        {lesson.content.split('\n').map((p: string, i: number) => <p key={i} className="mb-4">{p}</p>)}
      </div>
    </div>
  );
};

export default App;
