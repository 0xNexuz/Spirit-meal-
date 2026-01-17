
import React, { useState, useEffect } from 'react';
import { DevotionalEntry, ThemeMode } from '../types';
import { getDailyReflections } from '../services/geminiService';

interface Props {
  entry: DevotionalEntry;
  theme: ThemeMode;
  fontSize: string;
}

const DevotionalCard: React.FC<Props> = ({ entry, theme, fontSize }) => {
  const [reflections, setReflections] = useState<string[]>([]);
  const [loadingReflections, setLoadingReflections] = useState(false);

  useEffect(() => {
    const fetchReflections = async () => {
      setLoadingReflections(true);
      const res = await getDailyReflections(entry.content);
      setReflections(res);
      setLoadingReflections(false);
    };
    fetchReflections();
  }, [entry.id, entry.content]);

  const fontSizeClass = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }[fontSize as 'sm' | 'base' | 'lg' | 'xl'] || 'text-base';

  return (
    <div className="py-8 animate-in fade-in duration-700">
      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800/60 block mb-2">
          {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
        <h2 className={`text-3xl md:text-4xl font-bold leading-tight serif-font ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
          {entry.title}
        </h2>
      </div>

      {entry.imageUrl && (
        <img 
          src={entry.imageUrl} 
          alt={entry.title} 
          className="w-full h-56 object-cover rounded-3xl shadow-xl shadow-stone-900/5 mb-8"
        />
      )}

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
        <div className={`p-8 rounded-3xl border text-center mb-12 ${
          theme === 'dark' ? 'border-stone-800 bg-stone-800/40' : 'border-amber-100 bg-white shadow-sm'
        }`}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-4">A Moment of Prayer</h3>
          <p className="text-lg italic serif-font text-stone-500">"{entry.prayer}"</p>
        </div>
      )}

      {entry.meditation && (
        <div className="border-t border-stone-200 pt-8 mb-12 text-center">
          <p className="text-amber-800/70 font-medium tracking-wide">DAILY MEDITATION</p>
          <p className="text-2xl font-light italic mt-2 serif-font">{entry.meditation}</p>
        </div>
      )}

      <section className={`p-8 rounded-3xl ${theme === 'dark' ? 'bg-stone-800/50' : 'bg-stone-100'}`}>
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          Spirit Reflections
        </h3>
        {loadingReflections ? (
          <div className="space-y-4">
            <div className="h-4 bg-stone-200 animate-pulse rounded-full w-full"></div>
            <div className="h-4 bg-stone-200 animate-pulse rounded-full w-3/4"></div>
            <div className="h-4 bg-stone-200 animate-pulse rounded-full w-5/6"></div>
          </div>
        ) : (
          <ul className="space-y-6">
            {reflections.map((q, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </span>
                <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-stone-300' : 'text-stone-600'}`}>
                  {q}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default DevotionalCard;
