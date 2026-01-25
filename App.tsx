
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import { DevotionalEntry, SundaySchoolLesson, UserPreferences, ThemeMode } from './types';
import { storage } from './services/storageService';
import { ADMIN_SECRET_KEY, ICONS } from './constants';
import Layout from './components/Layout';
import DevotionalCard from './components/DevotionalCard';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
  const [devotionals, setDevotionals] = useState<DevotionalEntry[]>([]);
  const [sundayLessons, setSundayLessons] = useState<SundaySchoolLesson[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>(storage.getBookmarks());
  const [prefs, setPrefs] = useState<UserPreferences>(storage.getPreferences());
  const [isAdmin, setIsAdmin] = useState(storage.getAdminMode());
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    setDevotionals(storage.getDevotionals());
    setSundayLessons(storage.getSundaySchool());
  }, []);

  useEffect(() => {
    const handleSync = () => {
      setBookmarks(storage.getBookmarks());
      setPrefs(storage.getPreferences());
      setIsAdmin(storage.getAdminMode());
    };

    // Standard cross-tab sync
    window.addEventListener('storage', handleSync);
    // Same-window custom sync
    window.addEventListener(storage.SYNC_EVENT, handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener(storage.SYNC_EVENT, handleSync);
    };
  }, []);

  const updatePrefs = (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...prefs, ...newPrefs };
    setPrefs(updated);
    storage.savePreferences(updated);
  };

  const handleNotificationToggle = async () => {
    if (typeof Notification === 'undefined') {
      alert("This browser does not support notifications.");
      return;
    }
    
    if (!prefs.notificationsEnabled) {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission === 'granted') {
        updatePrefs({ notificationsEnabled: true });
      } else {
        alert("Please enable notifications in your browser settings to receive reminders.");
      }
    } else {
      updatePrefs({ notificationsEnabled: false });
    }
  };

  const handleAdminAuth = () => {
    if (isAdmin) {
      if (window.confirm("Do you want to sign out of Admin Mode?")) {
        setIsAdmin(false);
        storage.setAdminMode(false);
      }
      return;
    }
    const key = window.prompt("Enter the Master Access Key to enable Admin Mode:");
    if (key === ADMIN_SECRET_KEY) {
      setIsAdmin(true);
      storage.setAdminMode(true);
      alert("Access Granted. Creator tools enabled.");
    } else if (key !== null) {
      alert("Invalid Access Key.");
    }
  };

  const refreshData = () => {
    setDevotionals(storage.getDevotionals());
    setSundayLessons(storage.getSundaySchool());
  };

  const bookmarkedDevotionals = devotionals.filter(d => bookmarks.includes(d.id));

  return (
    <Router>
      <Layout theme={prefs.theme} isAdmin={isAdmin}>
        <Routes>
          <Route path="/" element={
            devotionals.length > 0 ? (
              <DevotionalCard entry={devotionals[0]} theme={prefs.theme} fontSize={prefs.fontSize} />
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-stone-400">
                <p>Waiting for the morning meal...</p>
              </div>
            )
          } />

          <Route path="/archive" element={
            <div className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold serif-font mb-6">Spiritual Library</h2>
              {devotionals.map((entry) => (
                <Link 
                  key={entry.id} 
                  to={`/devotional/${entry.id}`}
                  className={`block p-4 rounded-2xl border transition-all hover:translate-x-1 ${
                    prefs.theme === 'dark' ? 'border-stone-800 bg-stone-800/30' : 'border-stone-100 bg-white shadow-sm'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-widest text-amber-700 font-bold">{new Date(entry.date).toLocaleDateString()}</span>
                  <h3 className="font-semibold text-lg serif-font">{entry.title}</h3>
                  <p className="text-sm text-stone-500 line-clamp-1">{entry.scripture}</p>
                </Link>
              ))}
            </div>
          } />

          <Route path="/lessons" element={
            <div className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold serif-font mb-6">Sunday School</h2>
              {sundayLessons.length === 0 ? (
                <p className="text-stone-400 italic">No lessons available yet.</p>
              ) : (
                sundayLessons.map((lesson) => (
                  <Link 
                    key={lesson.id} 
                    to={`/lesson/${lesson.id}`}
                    className={`block p-5 rounded-2xl border transition-all hover:translate-x-1 border-indigo-100 bg-white shadow-sm`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase tracking-widest text-indigo-700 font-bold">{lesson.topic}</span>
                      <span className="text-[10px] text-stone-400">{new Date(lesson.date).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-semibold text-lg serif-font text-indigo-900">{lesson.title}</h3>
                    <p className="text-sm text-stone-500 line-clamp-1 italic">Memory Verse: {lesson.memoryVerse.split('-')[0]}</p>
                  </Link>
                ))
              )}
            </div>
          } />

          <Route path="/lesson/:id" element={<SundaySchoolDetail lessons={sundayLessons} theme={prefs.theme} fontSize={prefs.fontSize} />} />

          <Route path="/bookmarks" element={
            <div className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold serif-font mb-6">My Sanctuary</h2>
              {bookmarkedDevotionals.length === 0 ? (
                <div className="text-center py-20 text-stone-400">Your sanctuary is quiet. Save devotionals to find them here.</div>
              ) : (
                bookmarkedDevotionals.map((entry) => (
                  <Link key={entry.id} to={`/devotional/${entry.id}`} className="block p-4 rounded-2xl border border-amber-100 bg-white shadow-sm">
                    <h3 className="font-semibold text-lg serif-font">{entry.title}</h3>
                  </Link>
                ))
              )}
            </div>
          } />

          <Route path="/devotional/:id" element={<DevotionalDetail devotionals={devotionals} theme={prefs.theme} fontSize={prefs.fontSize} />} />
          
          <Route path="/admin" element={isAdmin ? <AdminPanel onEntryAdded={refreshData} /> : <div className="p-10 text-center">Access Denied</div>} />

          <Route path="/settings" element={
            <div className="pt-6 space-y-8 pb-20">
              <h2 className="text-2xl font-bold serif-font">Settings</h2>
              
              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Appearance</h3>
                <div className="grid grid-cols-3 gap-3">
                  {(['light', 'sepia', 'dark'] as const).map(mode => (
                    <button 
                      key={mode} 
                      onClick={() => updatePrefs({ theme: mode })} 
                      className={`py-3 rounded-xl border-2 transition-all capitalize text-sm font-medium ${prefs.theme === mode ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-sm' : 'border-stone-200'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Typography</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'sm', label: 'Small' },
                    { id: 'base', label: 'Standard' },
                    { id: 'lg', label: 'Large' },
                    { id: 'xl', label: 'Extra Large' }
                  ].map(size => (
                    <button 
                      key={size.id} 
                      onClick={() => updatePrefs({ fontSize: size.id as any })} 
                      className={`py-3 rounded-xl border-2 transition-all text-sm font-medium ${prefs.fontSize === size.id ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-sm' : 'border-stone-200'}`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Notifications</h3>
                 <div className={`p-5 rounded-2xl border transition-all ${prefs.notificationsEnabled ? 'bg-amber-50 border-amber-100' : 'bg-white border-stone-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${prefs.notificationsEnabled ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-400'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-sm">Daily Reminders</p>
                          <p className="text-xs text-stone-500">Get nudged to read your meal</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleNotificationToggle}
                        className={`w-12 h-6 rounded-full transition-colors relative ${prefs.notificationsEnabled ? 'bg-amber-600' : 'bg-stone-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${prefs.notificationsEnabled ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    {prefs.notificationsEnabled && (
                      <div className="mt-4 pt-4 border-t border-amber-200/50 animate-in fade-in slide-in-from-top-2">
                        <label className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block mb-2">Preferred Reminder Time</label>
                        <input 
                          type="time" 
                          value={prefs.notificationTime}
                          onChange={(e) => updatePrefs({ notificationTime: e.target.value })}
                          className="w-full p-3 rounded-xl border border-amber-200 bg-white text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                        <p className="text-[10px] text-amber-700/60 mt-2 text-center">Reminders will be sent even if the app is closed.</p>
                      </div>
                    )}
                 </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Offline Access</h3>
                <div className="bg-stone-100 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M2 9.5A3.5 3.5 0 005.5 13H9v2.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 15.586V13h2.5a4.5 4.5 0 10-.616-8.958 4.002 4.002 0 10-7.753 1.977A3.5 3.5 0 002 9.5zm9 3.5H9V8a1 1 0 012 0v5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-xs text-stone-600">App automatically works offline once loaded. Your devotionals are stored locally.</p>
                </div>
              </section>

              <button onClick={handleAdminAuth} className="w-full py-4 rounded-xl border-2 border-dashed border-stone-200 text-stone-400 hover:border-amber-300 hover:text-amber-800 transition-all font-bold text-xs uppercase tracking-widest">
                {isAdmin ? 'Sign out of Admin' : 'Admin Login'}
              </button>
            </div>
          } />
        </Routes>
      </Layout>
    </Router>
  );
};

const DevotionalDetail: React.FC<{ devotionals: DevotionalEntry[], theme: ThemeMode, fontSize: string }> = ({ devotionals, theme, fontSize }) => {
  const { id } = useParams();
  const entry = devotionals.find(d => d.id === id);
  if (!entry) return <div className="p-8 text-center">Not found</div>;
  return <DevotionalCard entry={entry} theme={theme} fontSize={fontSize} />;
};

const SundaySchoolDetail: React.FC<{ lessons: SundaySchoolLesson[], theme: ThemeMode, fontSize: string }> = ({ lessons, theme, fontSize }) => {
  const { id } = useParams();
  const lesson = lessons.find(l => l.id === id);
  if (!lesson) return <div className="p-8 text-center">Lesson not found</div>;

  const fontSizeClass = { sm: 'text-sm', base: 'text-base', lg: 'text-lg', xl: 'text-xl' }[fontSize as any] || 'text-base';

  return (
    <div className="py-8 animate-in fade-in duration-500">
      {lesson.imageUrl && (
        <div className="mb-8 rounded-3xl overflow-hidden shadow-xl shadow-indigo-100/50 border border-indigo-50 aspect-video">
          <img 
            src={lesson.imageUrl} 
            alt={lesson.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-700 block mb-2">{lesson.topic}</span>
        <h2 className={`text-3xl md:text-4xl font-bold leading-tight serif-font ${theme === 'dark' ? 'text-white' : 'text-indigo-950'}`}>{lesson.title}</h2>
        <p className="text-xs text-stone-400 mt-2">{new Date(lesson.date).toLocaleDateString()}</p>
      </div>

      <div className={`p-6 rounded-2xl border-l-4 border-indigo-600 mb-8 bg-indigo-50/50 italic ${theme === 'dark' ? 'text-indigo-200' : 'text-indigo-900'}`}>
        <p className="font-bold mb-1 uppercase text-[10px] tracking-widest opacity-60">Memory Verse</p>
        <p className="text-lg serif-font">"{lesson.memoryVerse}"</p>
      </div>

      <article className={`serif-font leading-relaxed ${fontSizeClass} mb-12 ${theme === 'dark' ? 'text-stone-300' : 'text-stone-700'}`}>
        {lesson.content.split('\n').map((p, i) => <p key={i} className="mb-4">{p}</p>)}
      </article>

      {lesson.discussionQuestions && lesson.discussionQuestions.length > 0 && (
        <section className={`p-8 rounded-3xl ${theme === 'dark' ? 'bg-stone-800' : 'bg-indigo-50/30 border border-indigo-100'}`}>
          <h3 className="text-lg font-bold mb-6 text-indigo-800 serif-font">Discussion Questions</h3>
          <ul className="space-y-4">
            {lesson.discussionQuestions.map((q, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center font-bold text-xs">{i + 1}</span>
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
