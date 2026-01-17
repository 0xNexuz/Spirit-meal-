
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import { DevotionalEntry, UserPreferences, ThemeMode } from './types';
import { storage } from './services/storageService';
import { ADMIN_SECRET_KEY } from './constants';
import Layout from './components/Layout';
import DevotionalCard from './components/DevotionalCard';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
  const [devotionals, setDevotionals] = useState<DevotionalEntry[]>([]);
  const [prefs, setPrefs] = useState<UserPreferences>(storage.getPreferences());
  const [isAdmin, setIsAdmin] = useState(storage.getAdminMode());
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    setDevotionals(storage.getDevotionals());
  }, []);

  // Check for daily notification
  useEffect(() => {
    if (prefs.notificationsEnabled && notificationStatus === 'granted' && devotionals.length > 0) {
      const lastNotified = localStorage.getItem('last_notified_date');
      const today = new Date().toDateString();
      
      if (lastNotified !== today) {
        const latest = devotionals[0];
        try {
          new Notification("Daily Spirit Meal", {
            body: `Today's Word: ${latest.title}\n"${latest.scripture.split('-')[0].trim()}"`,
            icon: 'https://cdn-icons-png.flaticon.com/512/3389/3389152.png'
          });
          localStorage.setItem('last_notified_date', today);
        } catch (e) {
          console.error("Notification failed", e);
        }
      }
    }
  }, [prefs.notificationsEnabled, notificationStatus, devotionals]);

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
        alert("Permission denied. Please enable notifications in your browser settings.");
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

  const refreshDevotionals = () => {
    setDevotionals(storage.getDevotionals());
  };

  return (
    <Router>
      <Layout theme={prefs.theme} isAdmin={isAdmin}>
        <Routes>
          <Route path="/" element={
            devotionals.length > 0 ? (
              <DevotionalCard 
                entry={devotionals[0]} 
                theme={prefs.theme} 
                fontSize={prefs.fontSize} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-stone-400">
                <p>Waiting for the morning meal...</p>
              </div>
            )
          } />

          <Route path="/archive" element={
            <div className="pt-6 space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold serif-font">Spiritual Library</h2>
              </div>
              {devotionals.map((entry) => (
                <Link 
                  key={entry.id} 
                  to={`/devotional/${entry.id}`}
                  className={`block p-4 rounded-2xl border transition-all hover:translate-x-1 ${
                    prefs.theme === 'dark' ? 'border-stone-800 bg-stone-800/30 hover:bg-stone-800/60' : 'border-stone-100 bg-white hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-amber-700 font-bold">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                      <h3 className="font-semibold text-lg mt-1 serif-font">{entry.title}</h3>
                      <p className="text-sm text-stone-500 line-clamp-1 mt-1">{entry.scripture}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          } />

          <Route path="/devotional/:id" element={
            <DevotionalDetail 
              devotionals={devotionals} 
              theme={prefs.theme} 
              fontSize={prefs.fontSize} 
            />
          } />

          <Route path="/admin" element={
            isAdmin ? (
              <AdminPanel onEntryAdded={refreshDevotionals} />
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-stone-400">
                <p className="mb-4">You do not have permission to access the Creator Studio.</p>
                <Link to="/settings" className="text-amber-800 font-bold underline">Go to Settings</Link>
              </div>
            )
          } />

          <Route path="/settings" element={
            <div className="pt-6 space-y-8">
              <h2 className="text-2xl font-bold serif-font">Preferences</h2>
              
              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Reading Mode</h3>
                <div className="grid grid-cols-3 gap-3">
                  {(['light', 'sepia', 'dark'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => updatePrefs({ theme: mode })}
                      className={`py-3 px-4 rounded-xl border-2 transition-all capitalize font-medium ${
                        prefs.theme === mode 
                          ? 'border-amber-600 bg-amber-50 text-amber-900' 
                          : 'border-stone-200 text-stone-500'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Push Notifications</h3>
                <div className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${
                  prefs.notificationsEnabled ? 'border-amber-200 bg-amber-50' : 'border-stone-100 bg-stone-50'
                }`}>
                  <div>
                    <h4 className="font-semibold text-stone-800">Daily Bread Reminder</h4>
                    <p className="text-xs text-stone-500">Get a notification when the new devotional is ready.</p>
                  </div>
                  <button 
                    onClick={handleNotificationToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      prefs.notificationsEnabled ? 'bg-amber-600' : 'bg-stone-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        prefs.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Text Size</h3>
                <div className="grid grid-cols-4 gap-2">
                  {(['sm', 'base', 'lg', 'xl'] as const).map(size => (
                    <button
                      key={size}
                      onClick={() => updatePrefs({ fontSize: size })}
                      className={`py-2 rounded-xl border transition-all ${
                        prefs.fontSize === size 
                          ? 'bg-stone-900 text-white border-stone-900' 
                          : 'bg-white text-stone-500 border-stone-200'
                      }`}
                    >
                      {size.toUpperCase()}
                    </button>
                  ))}
                </div>
              </section>

              <section className="pt-8 border-t border-stone-200">
                <button
                  onClick={handleAdminAuth}
                  className={`w-full py-4 px-6 rounded-2xl border font-medium transition-all flex items-center justify-center gap-3 ${
                    isAdmin 
                      ? 'bg-amber-100 border-amber-300 text-amber-900' 
                      : 'bg-white border-stone-300 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-amber-600 animate-pulse' : 'bg-stone-300'}`}></div>
                  {isAdmin ? 'Signed in as Admin' : 'Creator / Admin Access'}
                </button>
              </section>

              <div className="text-center text-xs text-stone-400 py-8">
                Spirit Meal v1.2.0
                <br />
                Crafted for intentional devotion.
              </div>
            </div>
          } />
        </Routes>
      </Layout>
    </Router>
  );
};

const DevotionalDetail: React.FC<{ 
  devotionals: DevotionalEntry[], 
  theme: ThemeMode, 
  fontSize: 'sm' | 'base' | 'lg' | 'xl'
}> = ({ devotionals, theme, fontSize }) => {
  const { id } = useParams<{ id: string }>();
  const entry = devotionals.find(d => d.id === id);
  
  if (!entry) return <div className="p-8 text-center">Devotional not found</div>;
  
  return <DevotionalCard entry={entry} theme={theme} fontSize={fontSize} />;
};

export default App;
