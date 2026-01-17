
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ICONS } from '../constants';
import { ThemeMode } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  theme: ThemeMode;
  isAdmin: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, theme, isAdmin }) => {
  const location = useLocation();

  const themeClasses = {
    light: 'bg-stone-50 text-stone-900',
    sepia: 'bg-[#f4ecd8] text-[#5b4636]',
    dark: 'bg-stone-900 text-stone-100'
  };

  const navItem = (path: string, label: string, Icon: React.FC) => {
    const isActive = location.pathname === path;
    return (
      <Link 
        to={path} 
        className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
          isActive ? 'text-amber-700' : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        <Icon />
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </Link>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col ${themeClasses[theme]} transition-colors duration-300`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 px-6 py-4 border-b ${
        theme === 'dark' ? 'border-stone-800 bg-stone-900/90' : 'border-stone-200 bg-white/80'
      } backdrop-blur-md flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-amber-800 serif-font">Spirit Meal</h1>
          {isAdmin && (
            <div className="animate-pulse bg-amber-500 w-1.5 h-1.5 rounded-full"></div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {isAdmin && (
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-amber-200 shadow-sm">
              Creator Mode
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24 max-w-2xl mx-auto w-full px-4 sm:px-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 z-20 px-6 py-3 border-t ${
        theme === 'dark' ? 'bg-stone-900/95 border-stone-800' : 'bg-white/95 border-stone-200'
      } backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.03)]`}>
        <div className="max-w-md mx-auto flex justify-between items-center px-4">
          {navItem('/', 'Today', ICONS.Home)}
          {navItem('/archive', 'Archive', ICONS.Archive)}
          {isAdmin && navItem('/admin', 'Create', ICONS.Admin)}
          {navItem('/settings', 'Settings', ICONS.Settings)}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
