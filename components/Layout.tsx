
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ICONS } from '../constants';
import { ThemeMode } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  theme: ThemeMode;
  isAdmin: boolean;
}

// Recreating the official Ministry Seal as a high-fidelity SVG component
const MinistryLogo: React.FC<{ size?: number }> = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-sm">
    <defs>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#fcd34d', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#b45309', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
      </linearGradient>
      <radialGradient id="innerBg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style={{ stopColor: '#4a3728', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#1a1410', stopOpacity: 1 }} />
      </radialGradient>
    </defs>
    
    {/* Outer Gold Rings */}
    <circle cx="50" cy="50" r="49" fill="url(#goldGradient)" />
    <circle cx="50" cy="50" r="46" fill="white" />
    <circle cx="50" cy="50" r="39" fill="url(#goldGradient)" />
    
    {/* Text Tracks */}
    <path id="topTextPath" d="M 12,50 A 38,38 0 1,1 88,50" fill="none" />
    <path id="bottomTextPath" d="M 15,50 A 35,35 0 0,0 85,50" fill="none" />

    {/* Top Text Arc */}
    <text className="font-bold uppercase" style={{ fontSize: '4.8px', fill: '#000', letterSpacing: '0.05em' }}>
      <textPath href="#topTextPath" startOffset="50%" textAnchor="middle">
        THE LIVING CHRIST GOSPEL MINISTRIES WORLDWIDE
      </textPath>
    </text>

    {/* Bottom Text Arc */}
    <text className="font-bold uppercase" style={{ fontSize: '5.5px', fill: '#000' }}>
      <textPath href="#bottomTextPath" startOffset="50%" textAnchor="middle">
        ★ I AM ALIVE FOR EVER MORE ★
      </textPath>
    </text>

    {/* Inner Shield Background */}
    <circle cx="50" cy="50" r="35" fill="url(#innerBg)" />
    
    {/* Central Elements */}
    {/* Open Bible */}
    <path d="M32 62 Q40 58 50 62 Q60 58 68 62 L68 72 Q60 68 50 72 Q40 68 32 72 Z" fill="#fff" />
    <line x1="50" y1="62" x2="50" y2="72" stroke="#d6d3d1" strokeWidth="0.4" />
    
    {/* Golden Cross */}
    <rect x="52" y="42" width="4" height="24" fill="url(#goldGradient)" rx="0.5" />
    <rect x="45" y="50" width="18" height="4" fill="url(#goldGradient)" rx="0.5" />
    
    {/* Holy Spirit Dove */}
    <path d="M68 32 Q72 28 78 32 Q80 38 74 42 Q70 46 66 40 L60 42 Q64 36 68 32Z" fill="#fff" />
    
    {/* Light Ray effect from Cross/Dove */}
    <path d="M50 45 L70 35" stroke="rgba(252, 211, 77, 0.3)" strokeWidth="8" strokeLinecap="round" style={{ filter: 'blur(4px)' }} />
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
