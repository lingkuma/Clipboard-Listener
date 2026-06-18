import React, { useState } from 'react';
import { Clock, Copy, Check, Trash2, ArrowUpRight } from 'lucide-react';
import { ClipboardClip } from '../types';
import { translations } from '../translations';
import { motion, AnimatePresence } from 'motion/react';

interface ClipHistoryProps {
  history: ClipboardClip[];
  activeId: string | null;
  onSelectClip: (clip: ClipboardClip) => void;
  onDeleteClip: (id: string) => void;
  language: 'zh' | 'en';
}

export default function ClipHistory({
  history,
  activeId,
  onSelectClip,
  onDeleteClip,
  language
}: ClipHistoryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const t = translations[language] || translations.zh;

  const handleCopy = async (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation(); // Avoid triggering selection
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const secs = Math.floor(diff / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    
    if (language === 'en') {
      if (secs < 10) return 'Just now';
      if (secs < 60) return `${secs} ${t.secAgo}`;
      if (mins < 60) return `${mins} ${t.minAgo}`;
      if (hours < 24) return `${hours} ${t.hourAgo}`;
    } else {
      if (secs < 10) return '刚刚';
      if (secs < 60) return `${secs} 秒前`;
      if (mins < 60) return `${mins} 分钟前`;
      if (hours < 24) return `${hours} 小时前`;
    }
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Truncate text for summary preview
  const truncateText = (text: string, limit = 180) => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + '...';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-stone-200/50 dark:border-stone-800/50 pb-2">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-stone-400 dark:text-stone-500 font-sans">
          {t.archiveTitle} ({history.length})
        </h2>
        <span className="text-xs text-stone-400 dark:text-stone-500 font-mono">
          {t.archiveSub}
        </span>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl">
          <p className="text-stone-400 dark:text-stone-500 text-sm">
            {t.noHistory}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 focus:outline-none">
          <AnimatePresence initial={false}>
            {history.map((clip, index) => {
              const isActive = clip.id === activeId;
              return (
                <motion.div
                  layout
                  key={clip.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  onClick={() => onSelectClip(clip)}
                  className={`group relative p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer overflow-hidden ${
                    isActive
                      ? 'bg-stone-100 dark:bg-stone-900 border-stone-400 dark:border-stone-700 shadow-sm ring-1 ring-stone-400/20 dark:ring-stone-700/20'
                      : 'bg-[#faf9f6] dark:bg-[#151515] hover:bg-stone-100/60 dark:hover:bg-stone-900/40 border-stone-200 dark:border-stone-800/60'
                  }`}
                >
                  {/* Top Header line inside Card */}
                  <div className="flex items-center justify-between text-xs text-stone-400 dark:text-stone-500 mb-2.5 font-mono">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{getRelativeTime(clip.timestamp)}</span>
                    </div>
                    
                    {/* Action buttons display */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => handleCopy(e, clip.text, clip.id)}
                        className="p-1 px-1.5 rounded bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition cursor-pointer flex items-center space-x-1"
                        title={t.copy}
                      >
                        {copiedId === clip.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{t.copiedStatus}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[10px]">{t.copy}</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClip(clip.id);
                        }}
                        className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-950/40 text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Snippet Line */}
                  <div className="relative">
                    <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed font-sans line-clamp-3 overflow-hidden whitespace-pre-line">
                      {truncateText(clip.text)}
                    </p>
                    
                    {/* Character/Word details */}
                    <div className="mt-3.5 pt-2 border-t border-stone-200/40 dark:border-stone-800/40 flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500 font-mono">
                      <span>
                        {clip.text.length} {t.charUnit} · {clip.text.split(/\s+/).filter(Boolean).length} {t.wordUnit}
                      </span>
                      {isActive && (
                        <span className="text-[10px] bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-sans font-medium">
                          {t.activeReading}
                          <ArrowUpRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
