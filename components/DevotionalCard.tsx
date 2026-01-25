
import React, { useState, useEffect } from 'react';
import { DevotionalEntry, ThemeMode } from '../types';
import { getDailyReflections } from '../services/geminiService';
import { storage } from '../services/storageService';
import { ICONS } from '../constants';

interface Props {
  entry: DevotionalEntry;
  theme: ThemeMode;
  fontSize: string;
}

const DevotionalCard: React.FC<Props> = ({ entry, theme, fontSize }) => {
  const [reflections, setReflections] = useState<string[]>([]);
  const [loadingReflections, setLoadingReflections] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);

  useEffect(() => {
    const bookmarks = storage.getBookmarks();
    setIsBookmarked(bookmarks.includes(entry.id));

    const fetchReflections = async () => {
      setLoadingReflections(true);
      const res = await getDailyReflections(entry.content);
      setReflections(res);
      setLoadingReflections(false);
    };
    fetchReflections();
  }, [entry.id, entry.content]);

  const toggleBookmark = () => {
    const newState = storage.toggleBookmark(entry.id);
    setIsBookmarked(newState);
  };

  const handleShare = async () => {
    const shareData = {
      title: `Spirit Meal: ${entry.title}`,
      text: `${entry.title}\n\n"${entry.scripture}"\n\nRead more at Spirit Meal.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        setShowCopyFeedback(true);
        setTimeout(() => setShowCopyFeedback(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  const fontSizeClass = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }[fontSize as 'sm' | 'base' | 'lg' | 'xl'] || 'text-base';

  return (
    <div className="py-8 animate-in fade-in duration-700 relative">
      {/* Hero Image Section */}
      {entry.imageUrl && (
        <div className="mb-8 rounded-3xl overflow-hidden shadow-xl shadow-stone-200/50 border border-stone-100 aspect-video group">
          <img 
            src={entry.imageUrl} 
            alt={entry.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800/60 block mb-2">
            {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <h2 className={`text-3xl md:text-4xl font-bold leading-tight serif-font pr-8 ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
            {entry.title}
          </h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleShare}
            className={`p-3 rounded-full transition-all duration-300 active:scale-90 relative ${
              theme === 'dark' ? 'text-stone-400 hover:text-stone-200 bg-stone-800' : 'text-stone-400 hover:text-stone-600 bg-stone-100'
            }`}
            title="Share Devotional"
          >
            <ICONS.Share />
            {showCopyFeedback && (
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-black text-white text-[10px] rounded-md animate-in fade-in slide-in-from-bottom-2 whitespace-nowrap font-bold uppercase tracking-widest">
                Copied!
              </span>
            )}
          </button>
          <button 
            onClick={toggleBookmark}
            className={`p-3 rounded-full transition-all duration-300 active:scale-90 ${
              isBookmarked 
                ? 'bg-amber-100 text-amber-600 shadow-sm' 
                : theme === 'dark' ? 'text-stone-400 hover:text-stone-200 bg-stone-800' : 'text-stone-400 hover:text-stone-600 bg-stone-100'
            }`}
            title={isBookmarked ? "Remove from Sanctuary" : "Save to Sanctuary"}
          >
            {isBookmarked ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            ) : (
              <ICONS.Bookmark />
            )}
          </button>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border-l-4 border-amber-600 mb-8 italic ${
        theme === 'dark' ? 'bg-stone-800 text-stone-300' : 'bg-amber-50 text-amber-900'
      }`}>
        <p className="font-medium">{entry.scripture}</p>
      </div>

      <article className={`serif-font leading-relaxed ${fontSizeClass} mb-12 ${
        theme === 'dark' ? 'text-stone-300' : 'text-stone-700'
      }`}>
        {entry.content.split('\n').map((para, i) => (
          <p key={i} className="mb-4">{para}</p>
        ))}
      </article>

      {entry.prayer && (
        <div className="p-8 rounded-3xl border border-amber-100 bg-white shadow-sm text-center mb-12">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-4">A Moment of Prayer</h3>
          <p className="text-lg italic serif-font text-stone-500">"{entry.prayer}"</p>
        </div>
      )}

      <section className={`p-8 rounded-3xl ${theme === 'dark' ? 'bg-stone-800/50' : 'bg-stone-100'}`}>
        <div className="flex items-center gap-2 mb-6">
          <ICONS.Sparkles />
          <h3 className="text-lg font-semibold">
            Spirit Reflections
          </h3>
        </div>
        {loadingReflections ? (
          <div className="space-y-4">
            <div className="h-4 bg-stone-200 animate-pulse rounded-full w-full"></div>
            <div className="h-4 bg-stone-200 animate-pulse rounded-full w-3/4"></div>
          </div>
        ) : (
          <ul className="space-y-6">
            {reflections.map((q, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed">{q}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default DevotionalCard;
