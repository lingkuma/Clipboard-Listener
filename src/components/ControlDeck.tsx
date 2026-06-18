import React, { useState } from 'react';
import { 
  Type, Sliders, Play, Square, Clipboard, 
  Trash2, RefreshCw, Sun, Moon, HelpCircle
} from 'lucide-react';
import { ReaderSettings, FontStyle } from '../types';

interface ControlDeckProps {
  settings: ReaderSettings;
  onChangeSettings: (settings: Partial<ReaderSettings>) => void;
  onClearHistory: () => void;
  onForceFetch: () => void;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
  onManualPaste: (text: string) => void;
}

export default function ControlDeck({
  settings,
  onChangeSettings,
  onClearHistory,
  onForceFetch,
  isOpenMobile,
  onToggleMobile,
  onManualPaste,
}: ControlDeckProps) {
  const [showTester, setShowTester] = useState(false);
  const [testText, setTestText] = useState('');

  const fontSizes = [
    { label: 'A-', size: Math.max(14, settings.fontSize - 2) },
    { label: 'Normal', size: 18 },
    { label: 'A+', size: Math.min(38, settings.fontSize + 2) }
  ];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeSettings({ fontSize: parseInt(e.target.value) });
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (testText.trim()) {
      onManualPaste(testText.trim());
      setTestText('');
      setShowTester(false);
    }
  };

  const handlePresetSelect = (size: number) => {
    onChangeSettings({ fontSize: size });
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* 🟢 LISTENER STATUS BUTTONS */}
      <div className="bg-stone-100/60 dark:bg-stone-900/60 p-4 rounded-xl border border-stone-200/50 dark:border-stone-800/50 backdrop-blur-sm transition-colors">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-stone-400 dark:text-stone-500 mb-3 flex items-center justify-between">
          <span>监听状态</span>
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${settings.isListening ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${settings.isListening ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
        </h3>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => onChangeSettings({ isListening: true })}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              settings.isListening
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            自动监听
          </button>
          <button
            onClick={() => onChangeSettings({ isListening: false })}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              !settings.isListening
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            暂停监听
          </button>
        </div>

        <button
          onClick={onForceFetch}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs bg-stone-800 hover:bg-stone-900 dark:bg-stone-200 dark:hover:bg-stone-100 text-white dark:text-stone-900 rounded-lg font-medium cursor-pointer transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
          立即获取一次
        </button>

        <div className="mt-3 flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500">
          <span>间隔：</span>
          <div className="flex space-x-1.5">
            {[1000, 3000, 5000].map((ms) => (
              <button
                key={ms}
                onClick={() => onChangeSettings({ intervalMs: ms })}
                className={`px-1.5 py-0.5 rounded transition ${
                  settings.intervalMs === ms
                    ? 'bg-stone-300 dark:bg-stone-700 font-semibold text-stone-700 dark:text-stone-200'
                    : 'hover:text-stone-700 dark:hover:text-stone-300 cursor-pointer'
                }`}
              >
                {ms / 1000}秒
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ✍️ TYPOGRAPHY SECTION */}
      <div className="bg-stone-100/60 dark:bg-stone-900/60 p-4 rounded-xl border border-stone-200/50 dark:border-stone-800/50 backdrop-blur-sm transition-colors">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-stone-400 dark:text-stone-500 mb-3 flex items-center gap-1.5">
          <Type className="w-4 h-4" />
          <span>字体风格</span>
        </h3>

        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {(['serif', 'sans', 'mono'] as FontStyle[]).map((font) => (
            <button
              key={font}
              onClick={() => onChangeSettings({ fontStyle: font })}
              className={`py-1.5 px-2 rounded-lg text-xs capitalize transition-all cursor-pointer ${
                settings.fontStyle === font
                  ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 font-medium'
                  : 'bg-stone-200/50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
              }`}
            >
              {font === 'serif' ? '优雅衬线' : font === 'sans' ? '极简无衬' : '等宽代码'}
            </button>
          ))}
        </div>

        {/* 📐 FONT SIZE ADJUSTMENT */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1.5">
            <span>字号大小</span>
            <span className="font-mono font-medium">{settings.fontSize}px</span>
          </div>

          <div className="flex items-center space-x-2 mb-2">
            <input
              type="range"
              min="14"
              max="40"
              value={settings.fontSize}
              onChange={handleSliderChange}
              className="w-full h-1 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-stone-700 dark:accent-stone-300"
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {fontSizes.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetSelect(item.size)}
                className="py-1 px-1.5 text-[11px] bg-stone-200/50 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-md text-center transition cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 📋 LINE SPACING */}
        <div>
          <span className="block text-xs text-stone-500 dark:text-stone-400 mb-1.5">行高间距</span>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'normal', label: '紧凑' },
              { id: 'relaxed', label: '舒适' },
              { id: 'loose', label: '宽松' }
            ].map((lh) => (
              <button
                key={lh.id}
                onClick={() => onChangeSettings({ lineHeight: lh.id as any })}
                className={`py-1 px-1.5 text-xs rounded-md transition-all cursor-pointer ${
                  settings.lineHeight === lh.id
                    ? 'bg-stone-300 dark:bg-stone-700 text-stone-800 dark:text-stone-100 font-medium'
                    : 'bg-stone-200/30 dark:bg-stone-800/30 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
                }`}
              >
                {lh.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ⚠️ MANUAL PASTER FOR IFRAME / TESTING */}
      <div className="bg-stone-100/60 dark:bg-stone-900/60 p-4 rounded-xl border border-stone-200/50 dark:border-stone-800/50 backdrop-blur-sm transition-colors">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
            <Clipboard className="w-4 h-4" />
            <span>测试剪切板</span>
          </h3>
          <button 
            type="button"
            onClick={() => setShowTester(!showTester)}
            className="text-[11px] text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 font-medium cursor-pointer underline"
          >
            {showTester ? '收起' : '手动贴入'}
          </button>
        </div>

        {showTester ? (
          <form onSubmit={handlePasteSubmit} className="space-y-2 mt-2">
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="如果您处于 iframe 内部导致浏览器拒绝自动授权，可在此手动贴入一些文字测试..."
              rows={3}
              className="w-full p-2 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-600 font-sans"
            />
            <button
              type="submit"
              disabled={!testText.trim()}
              className="w-full py-1.5 px-3 bg-stone-800 hover:bg-stone-900 dark:bg-stone-200 dark:hover:bg-stone-100 text-white dark:text-stone-900 font-medium text-xs rounded-lg transition disabled:opacity-40 cursor-pointer"
            >
              模拟复制输入
            </button>
          </form>
        ) : (
          <p className="text-[11px] leading-relaxed text-stone-400 dark:text-stone-500">
            由于浏览器安全策略限制，部分环境下可能需允许网站访问剪贴板，或通过本窗口完成一次点击激活。
          </p>
        )}
      </div>

      {/* 🗑️ EXTRA ACTIONS */}
      <div className="pt-2">
        <button
          onClick={onClearHistory}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs bg-red-50/50 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/40 rounded-xl font-medium transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          清除所有历史记录
        </button>
      </div>
    </div>
  );
}
