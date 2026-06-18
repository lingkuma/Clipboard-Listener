import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Clipboard, Moon, Sun, Play, Square, RefreshCw, 
  Trash2, Type, Sliders, Settings, Check, Copy, 
  ExternalLink, Sparkles, BookOpen, AlertCircle, Edit3, Save, X
} from 'lucide-react';
import { ClipboardClip, ReaderSettings, FontStyle } from './types';
import ControlDeck from './components/ControlDeck';
import ClipHistory from './components/ClipHistory';

export default function App() {
  // --- 1. SETTINGS & APP STATE DEFAULTS ---
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    try {
      const saved = localStorage.getItem('clipboard_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed reading settings', e);
    }
    return {
      fontSize: 20, // comfortable preset size
      fontStyle: 'serif', // elegant default
      lineHeight: 'relaxed',
      isListening: true,
      intervalMs: 3000,
      theme: 'light',
    };
  });

  // --- 2. THEME INITIATOR ---
  useEffect(() => {
    // Sync settings to localStorage
    localStorage.setItem('clipboard_settings', JSON.stringify(settings));
    
    // Apply styling to html tag
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  // --- 3. HISTORICAL STACK INITIALIZATION ---
  const [history, setHistory] = useState<ClipboardClip[]>(() => {
    try {
      const saved = localStorage.getItem('clipboard_history');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed restoring history', e);
    }
    return [];
  });

  // Unique state variables to drive UI
  const [activeClipId, setActiveClipId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('clipboard_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          return parsed[0].id;
        }
      }
    } catch (e) {}
    return null;
  });

  // DOM node key to force complete HTML reconstruction (React destroy and remount)
  const [elementKey, setElementKey] = useState<string>(() => Date.now().toString());
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [clipboardWarning, setClipboardWarning] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  
  // In-place edits supporting reading
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editText, setEditText] = useState<string>('');
  
  // Track last fetched clip value to avoid duplicate insertions
  const lastFetchedTextRef = useRef<string>('');

  const activeClip = history.find(c => c.id === activeClipId);

  // Sync history changes in localStorage
  const saveHistoryToStorage = (newHistory: ClipboardClip[]) => {
    setHistory(newHistory);
    localStorage.setItem('clipboard_history', JSON.stringify(newHistory));
  };

  // Helper trigger to show custom elegant notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2500);
  };

  // --- 4. CORE FUNCTION: ADDING INCOMING TEXT ---
  const handleNewTextEntered = useCallback((text: string) => {
    const cleaned = text.trim();
    if (!cleaned) return;

    if (cleaned === lastFetchedTextRef.current) {
      return; // Deduplicate
    }

    lastFetchedTextRef.current = cleaned;

    const newClip: ClipboardClip = {
      id: `clip-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`,
      text: cleaned,
      timestamp: Date.now()
    };

    saveHistoryToStorage([newClip, ...history].slice(0, 50));
    setActiveClipId(newClip.id);
    
    // 🔥 ESSENTIAL DESTRUCTION-RECREATION TRIGGER 🔥
    // Assigning a brand new random string forces React to fully unmount
    // the previous text element and mount a new one. This triggers the extension!
    setElementKey(`rect-${Date.now()}-${Math.random()}`);
    triggerToast('📋 检测到新剪纸，已重新构建 DOM 结构！');
  }, [history]);

  // --- 5. CLIPBOARD READING LOOP ---
  const performClipboardCheck = useCallback(async () => {
    if (!settings.isListening) return;

    // Check secure context
    if (!navigator.clipboard) {
      setClipboardWarning('浏览器拒绝了当前上下文环境中的剪切板读取，请确保使用 HTTPS。如果处于 preview 的 iframe 中，请点击下方的按钮，在新窗口中打开此网页。');
      return;
    }

    try {
      // Prioritize checking focus to prevent console warnings
      if (!document.hasFocus()) {
        setClipboardWarning('当前窗口处于未激活状态。请点击页面任意处激活焦点以恢复后台监听。');
        return;
      }

      const text = await navigator.clipboard.readText();
      if (text && text.trim() !== '') {
        setClipboardWarning(null);
        handleNewTextEntered(text);
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setClipboardWarning('剪贴板读取请求被拒绝。请在上方地址栏为本站点击 允许剪贴板读取，或者通过下面的“贴入”输入手动导入。');
      } else if (err.message && err.message.includes('document is not focused')) {
        setClipboardWarning('当前窗口处于失焦状态。点击页面任意位置重新授权读取。');
      } else {
        setClipboardWarning(`获取失败: ${err.message || '未知异常'}`);
      }
    }
  }, [settings.isListening, handleNewTextEntered]);

  // Handle periodic intervals
  useEffect(() => {
    let timer: any = null;
    if (settings.isListening) {
      // First check immediately
      performClipboardCheck();
      timer = setInterval(performClipboardCheck, settings.intervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [settings.isListening, settings.intervalMs, performClipboardCheck]);

  // Listen to window focus events to instantly snap read when tab comes alive
  useEffect(() => {
    const handleFocus = () => {
      if (settings.isListening) {
        performClipboardCheck();
      }
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('click', handleFocus); // Any click re-authorizes loop
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('click', handleFocus);
    };
  }, [settings.isListening, performClipboardCheck]);

  // --- 6. USER HANDLERS ---
  const handleSelectClip = (clip: ClipboardClip) => {
    setActiveClipId(clip.id);
    lastFetchedTextRef.current = clip.text;
    
    // 🔥 Trigger full DOM elements recreation on manual historic loading
    setElementKey(`load-${clip.id}-${Date.now()}`);
    setIsEditing(false);
    triggerToast('📖 已载入选定便签，重构文本 DOM。');
  };

  const handleDeleteClip = (id: string) => {
    const nextHistory = history.filter(c => c.id !== id);
    saveHistoryToStorage(nextHistory);
    
    if (activeClipId === id) {
      if (nextHistory.length > 0) {
        setActiveClipId(nextHistory[0].id);
        setElementKey(`load-${nextHistory[0].id}-${Date.now()}`);
      } else {
        setActiveClipId(null);
      }
    }
    triggerToast('🗑️ 便签已成功删除');
  };

  const clearAllHistory = () => {
    if (window.confirm('您确定要清除所有的剪切板记录吗？这将无法恢复。')) {
      saveHistoryToStorage([]);
      setActiveClipId(null);
      lastFetchedTextRef.current = '';
      triggerToast('🧹 历史便签已清空');
    }
  };

  const forceCopyText = async () => {
    if (!activeClip) return;
    try {
      await navigator.clipboard.writeText(activeClip.text);
      setIsCopied(true);
      triggerToast('✨ 全文已重新写入您的剪切板');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      triggerToast('❌ 无法写入剪贴板，请手动选定文本复制');
    }
  };

  const updateSettings = (updates: Partial<ReaderSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  // Turn on manual editing
  const handleStartEdit = () => {
    if (!activeClip) return;
    setEditText(activeClip.text);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!activeClip) return;
    const cleanText = editText.trim();
    if (!cleanText) return;

    const updatedHistory = history.map(clip => {
      if (clip.id === activeClip.id) {
        return { ...clip, text: cleanText };
      }
      return clip;
    });

    saveHistoryToStorage(updatedHistory);
    setIsEditing(false);
    
    // 🔥 Rebuild DOM elements immediately for edits
    setElementKey(`edit-${activeClip.id}-${Date.now()}`);
    triggerToast('💾 修改已保存，正在重新组装 DOM...');
  };

  // --- 7. HELPFUL IFRAME CONSTANT INQUIRER ---
  const isIframe = () => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  };

  // Font styling dynamic classes
  const getFontFamilyClass = () => {
    switch (settings.fontStyle) {
      case 'serif':
        return 'font-serif';
      case 'mono':
        return 'font-mono';
      case 'sans':
      default:
        return 'font-sans';
    }
  };

  const getLineHeightClass = () => {
    switch (settings.lineHeight) {
      case 'loose':
        return 'leading-loose';
      case 'relaxed':
        return 'leading-relaxed';
      case 'normal':
      default:
        return 'leading-normal';
    }
  };

  return (
    <div className={`min-h-screen pb-20 transition-all duration-300 ${
      settings.theme === 'dark' 
        ? 'dark bg-[#0a0a0a] text-stone-100' 
        : 'bg-[#fafaf7] text-stone-950'
    } ${getFontFamilyClass()}`}>
      
      {/* 🚀 FLOAT REBUILD TOAST PANEL */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 py-2.5 px-5 rounded-full shadow-lg text-xs font-medium animate-fade-in border border-stone-800 dark:border-stone-200">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 🌟 PREMIUM GRAPHITE HEADER */}
      <header className="border-b border-stone-200/60 dark:border-stone-900/60 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo Brand with pulse indicator */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-stone-900 dark:bg-stone-100 flex items-center justify-center transition-transform hover:rotate-6">
              <Clipboard className="w-4 h-4 text-stone-50 dark:text-stone-950" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide font-sans">
                Clipboard Listener
              </h1>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono flex items-center gap-1 leading-none">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${settings.isListening ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
                {settings.isListening ? '监听服务保持直连' : '服务已暂停'}
              </p>
            </div>
          </div>

          {/* Quick-toggle Header Bar */}
          <div className="flex items-center space-x-4">
            
            {/* Iframe detection notice */}
            {isIframe() && (
              <a 
                href={window.location.href}
                target="_blank" 
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1 text-[11px] bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 px-2.5 py-1 rounded-lg text-stone-500 dark:text-stone-400 transition"
              >
                <ExternalLink className="w-3 h-3" />
                新窗口打开 (防限制)
              </a>
            )}

            {/* Light / Dark Mode Toggle */}
            <button
              id="theme-toggler"
              onClick={() => updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' })}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100/50 dark:hover:bg-stone-900/50 cursor-pointer transition"
              title="切换主题颜色"
            >
              {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* 📖 LAYOUT CONTAINER: Centered for comfortable reading with 70%-80% width */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* WARNING BAR IN IFRAME */}
        {clipboardWarning && (
          <div className="max-w-4xl mx-auto mb-6 p-4 rounded-xl bg-amber-50 hover:bg-amber-100/60 dark:bg-amber-950/20 dark:hover:bg-amber-950/30 border border-amber-200/50 dark:border-amber-950/40 text-amber-800 dark:text-amber-400 text-xs transition duration-200 flex items-start gap-2.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{clipboardWarning}</span>
              {isIframe() && (
                <div className="mt-1.5 flex items-center gap-3">
                  <a 
                    href={window.location.href}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-bold underline flex items-center gap-0.5 hover:text-amber-900 dark:hover:text-amber-200"
                  >
                    新贴页打开解锁
                    <ExternalLink className="w-3 h-3 inline" />
                  </a>
                  <button 
                    onClick={() => performClipboardCheck()}
                    className="font-bold underline text-stone-700 dark:text-stone-300 hover:text-stone-950"
                  >
                    重试检测
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ========================================================= */}
          {/* Left Column (Main text content & past archive items - occupying 75% width on desk) */}
          {/* ========================================================= */}
          <section className="lg:col-span-8 space-y-8">
            
            {/* Telegram-style Minimal Microblog Core Board */}
            <div className="bg-white dark:bg-[#111111] border border-stone-200/60 dark:border-stone-900/60 rounded-3xl p-6 md:p-10 shadow-sm transition-colors">
              
              {/* Dynamic Reading Board Area */}
              {activeClip ? (
                <>
                  {/* Article Stats & Actions */}
                  <div className="flex flex-wrap items-center justify-between border-b border-stone-200/50 dark:border-stone-800/50 pb-4 mb-6 gap-2">
                    <div className="flex items-center space-x-2 text-xs text-stone-400 dark:text-stone-500 font-mono">
                      <span>{new Date(activeClip.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} 捕获</span>
                      <span>•</span>
                      <span>{activeClip.text.length} 字符</span>
                      <span>•</span>
                      <span>{activeClip.text.split(/\s+/).filter(Boolean).length} 词</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-1.5 px-3 rounded-lg transition shadow-sm cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            保存 DOM
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="flex items-center gap-1 text-xs bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-600 dark:text-stone-300 py-1.5 px-2.5 rounded-lg transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            取消
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline-block text-[10px] text-emerald-600 dark:text-emerald-400/80 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded font-sans font-medium">
                            🌿 DOM 重构触发防护中
                          </span>
                          <button
                            onClick={handleStartEdit}
                            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-[#ffffff] pr-2 font-medium cursor-pointer"
                            title="修改文本内容"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">微调</span>
                          </button>
                          <button
                            onClick={forceCopyText}
                            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-[#ffffff] font-medium cursor-pointer"
                            title="一键写入剪切板"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? '已复制' : '复制'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 📝 THE READING CANVAS */}
                  {/* Inside, the core components destroy and recreate perfectly via elementsKey */}
                  <div className="relative">
                    {isEditing ? (
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full min-h-[350px] p-4 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-stone-800 dark:text-stone-100 focus:outline-none leading-relaxed focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-600"
                        style={{ fontSize: `${settings.fontSize}px` }}
                      />
                    ) : (
                      // 🔥 THIS COMPONENT DYNAMICALLY DESTRUCTS & MOUNTS FROM SCRATCH WITH KEY CHANGES 🔥
                      <div 
                        key={elementKey} 
                        id="microblog-telegraph-article"
                        className={`text-stone-850 dark:text-stone-200 ${getLineHeightClass()} transition-opacity animate-fade-in`}
                        style={{ fontSize: `${settings.fontSize}px` }}
                        onDoubleClick={forceCopyText}
                        title="双击直接复制全文内容"
                      >
                        {activeClip.text.split('\n').map((paragraph, idx) => {
                          const isLineEmpty = !paragraph.trim();
                          return (
                            <p 
                              key={idx} 
                              id={`art-p-${idx}`}
                              className={`${isLineEmpty ? 'h-4' : 'mb-5 md:mb-6'} break-words whitespace-pre-wrap select-text`}
                            >
                              {paragraph}
                            </p>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Empty placeholder state structured like Telegraph template creator */
                <div className="text-center py-20 px-4">
                  <div className="h-16 w-16 mx-auto bg-stone-100 dark:bg-stone-900 border border-stone-200/50 dark:border-stone-800 rounded-3xl flex items-center justify-center mb-6 text-stone-400 dark:text-stone-500">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-2 font-sans">
                    准备开始捕获并阅读记录
                  </h2>
                  <p className="max-w-md mx-auto text-xs leading-relaxed text-stone-400 dark:text-stone-500 mb-8 font-sans">
                    目前网页剪切板自动监测服务为 <b>每隔 {settings.intervalMs / 1000} 秒</b> 获取一次。
                    只需在微信、浏览器或其他应用中选中文字进行<b>“复制”</b>，本站将秒级自动响应重构新 DOM 并更新呈现。
                  </p>
                  
                  {/* Starter button */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => handleNewTextEntered('Here is the first piece of text for reading. The English plugin has a neat translation popover if you double-click or click on single words inside this container.\n\nNow, go ahead and copy any sentence or text from other windows, and you will see actual magic here!')}
                      className="inline-flex items-center gap-1.5 py-2.5 px-5 bg-stone-800 hover:bg-stone-950 dark:bg-stone-100 dark:hover:bg-[#ffffff] text-stone-50 dark:text-stone-900 text-xs font-semibold rounded-xl cursor-pointer transition shadow-sm"
                    >
                      💡 导入测试英文段落
                    </button>
                    {isIframe() && (
                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 py-2.5 px-4 bg-stone-200 hover:bg-stone-300 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium rounded-xl transition"
                      >
                        在新标签页打开
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Past Clips Stream History (Centering content for clean reading) */}
            <div className="bg-white/40 dark:bg-[#111111]/30 border border-stone-200/50 dark:border-stone-900/45 rounded-3xl p-5 md:p-8 transition-colors">
              <ClipHistory 
                history={history}
                activeId={activeClipId}
                onSelectClip={handleSelectClip}
                onDeleteClip={handleDeleteClip}
              />
            </div>
          </section>

          {/* ========================================================= */}
          {/* Right Column: Setting Deck (occupying 25% width on desktop) */}
          {/* ========================================================= */}
          <section className="lg:col-span-4 lg:sticky lg:top-8">
            <div className="space-y-6">
              
              {/* Core Control Board Title */}
              <div className="hidden lg:block pb-2 border-b border-stone-200/50 dark:border-stone-800/50">
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-sans flex items-center gap-1.5">
                  <Settings className="w-4 h-4" />
                  控制台设定
                </h2>
              </div>

              <ControlDeck 
                settings={settings}
                onChangeSettings={updateSettings}
                onClearHistory={clearAllHistory}
                onForceFetch={performClipboardCheck}
                isOpenMobile={false}
                onToggleMobile={() => {}}
                onManualPaste={handleNewTextEntered}
              />

              {/* Minimalist instructions card */}
              <div className="p-5 rounded-2xl bg-[#faf9f6] dark:bg-[#151515] text-stone-400 dark:text-stone-500 border border-stone-200/50 dark:border-stone-800 text-[11px] leading-relaxed space-y-2 font-sans">
                <span className="font-semibold block text-stone-600 dark:text-stone-400 flex items-center gap-1.5 font-sans justify-between">
                  <span>DOM 深度重构说明</span>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-mono leading-none">ENABLED</span>
                </span>
                <p>
                  每次加载新的复制内容时，本页面不会仅仅重写文字内容。相反，<b>整个阅读框的 DOM 节点会被彻底销毁重建</b>（通过更新 React key 强制重现）。
                </p>
                <p>
                  这一设定完美兼容您的<b>高亮、词典与生词翻译翻译浏览器插件</b>，强制其在新装载的词句中重新扫描，从而在您进行新复制阅读时能够实现点击即查，省去手动重新翻译或刷新页面的繁琐。
                </p>
                <div className="pt-1.5 border-t border-stone-200/60 dark:border-stone-800/40 text-[10px] text-stone-400 dark:text-stone-500 flex items-center justify-between font-mono">
                  <span>框架引擎: React 19 / Tailwind 4</span>
                  <span>版本: 1.2.0</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer copyright */}
      <footer className="mt-20 py-8 border-t border-stone-200/50 dark:border-stone-900/50 text-center text-xs text-stone-400 dark:text-stone-500 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <p>© 2026 Clipboard Listener. 一款面向阅读、精细翻译、专为词典插件打造的极简微博客监听工具。</p>
        </div>
      </footer>

    </div>
  );
}
