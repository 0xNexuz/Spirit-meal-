
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ICONS } from '../constants';
import { ThemeMode } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  theme: ThemeMode;
  isAdmin: boolean;
}

// Custom SVG Logo Component to recreate the Ministry Seal
const MinistryLogo: React.FC<{ size?: number }> = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-sm">
    <defs>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#fcd34d', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#b45309', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    
    {/* Outer Gold Ring */}
    <circle cx="50" cy="50" r="48" fill="url(#goldGradient)" />
    <circle cx="50" cy="50" r="45" fill="white" />
    <circle cx="50" cy="50" r="38" fill="url(#goldGradient)" />
    
    {/* Top Text Arc */}
    <path id="topTextPath" d="M 15,50 A 35,35 0 1,1 85,50" fill="none" />
    <text className="font-bold uppercase" style={{ fontSize: '5.5px', fill: '#000' }}>
      <textPath href="#topTextPath" startOffset="50%" textAnchor="middle">
        THE LIVING CHRIST GOSPEL MINISTRIES
      </textPath>
    </text>

    {/* Bottom Text Arc */}
    <path id="bottomTextPath" d="M 15,50 A 35,35 0 0,0 85,50" fill="none" />
    <text className="font-bold uppercase" style={{ fontSize: '6px', fill: '#000' }}>
      <textPath href="#bottomTextPath" startOffset="50%" textAnchor="middle">
        ★ I AM ALIVE FOR EVER MORE ★
      </textPath>
    </text>

    {/* Inner Shield / Dark Background */}
    <circle cx="50" cy="50" r="34" fill="#2d2218" />
    
    {/* Central Elements (Symbols) */}
    {/* Open Bible */}
    <path d="M35 55 Q40 52 50 55 Q60 52 65 55 L65 65 Q60 62 50 65 Q40 62 35 65 Z" fill="#fff" />
    <line x1="50" y1="55" x2="50" y2="65" stroke="#ccc" strokeWidth="0.5" />
    
    {/* Golden Cross */}
    <rect x="48" y="38" width="4" height="18" fill="url(#goldGradient)" rx="0.5" />
    <rect x="42" y="44" width="16" height="4" fill="url(#goldGradient)" rx="0.5" />
    
    {/* Holy Spirit Dove */}
    <path d="M62 38 Q65 35 70 38 Q72 42 68 45 Q65 48 62 44 L58 46 Q60 42 62 38Z" fill="#fff" />
  </svg>
);

const Layout: React.FC<LayoutProps> = ({ children, theme, isAdmin }) => {
  const location = useLocation();

  const themeClasses = {
    light: 'bg-stone-50 text-stone-900',
    sepia: 'bg-[#f4ecd8] text-[#5b4636]',
    dark: 'bg-stone-900 text-stone-100'
  };

  const navItem = (path: string, label: string, Icon: React.FC) => {
    const isActive = location.pathname === path;
    const isIndigo = label === 'Lessons';
    
    return (
      <Link 
        to={path} 
        className={`flex flex-col items-center justify-center space-y-1 transition-all ${
          isActive 
            ? (isIndigo ? 'text-indigo-700 scale-110' : 'text-amber-700 scale-110') 
            : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        <Icon />
        <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
      </Link>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col ${themeClasses[theme]} transition-colors duration-300`}>
      <header className={`sticky top-0 z-50 px-6 py-3 border-b ${
        theme === 'dark' ? 'border-stone-800 bg-stone-900/90' : 'border-stone-200 bg-white/90'
      } backdrop-blur-md flex justify-between items-center`}>
        <Link to="/" className="flex items-center gap-3 group">
          <MinistryLogo />
          <div className="flex flex-col">
            <span className="text-[7px] uppercase tracking-[0.1em] text-stone-400 font-black mb-0.5 whitespace-nowrap">The Living Christ Gospel Ministries</span>
            <h1 className="text-xl font-bold tracking-tight text-amber-800 serif-font leading-none">Spirit Meal</h1>
          </div>
        </Link>
        {isAdmin && (
           <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-amber-200 shadow-sm">
              Admin
            </span>
        )}
      </header>

      <main className="flex-1 pb-24 max-w-2xl mx-auto w-full px-4 sm:px-6">
        {children}
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 z-20 px-6 py-3 border-t ${
        theme === 'dark' ? 'bg-stone-900/95 border-stone-800' : 'bg-white/95 border-stone-200'
      } backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.03)]`}>
        <div className="max-w-md mx-auto flex justify-between items-center px-2">
          {navItem('/', 'Today', ICONS.Home)}
          {navItem('/lessons', 'Lessons', ICONS.Lessons)}
          {navItem('/archive', 'Library', ICONS.Archive)}
          {navItem('/bookmarks', 'Saved', ICONS.Bookmark)}
          {isAdmin && navItem('/admin', 'Edit', ICONS.Admin)}
          {navItem('/settings', 'Set', ICONS.Settings)}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
