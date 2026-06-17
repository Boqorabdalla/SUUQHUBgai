/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Check, Laptop, Smartphone, Download, Loader2, Sparkles, Pin } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName: string;
  deferredPrompt?: any;
  setDeferredPrompt?: (prompt: any) => void;
  isInIframe?: boolean;
}

export default function PwaInstallModal({ 
  isOpen, 
  onClose, 
  appName,
  deferredPrompt,
  setDeferredPrompt,
  isInIframe = false
}: PwaInstallModalProps) {
  const [step, setStep] = useState<'confirm' | 'installing' | 'success'>('confirm');
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop');
  const [statusText, setStatusText] = useState('Initializing installation package...');

  useEffect(() => {
    if (!isOpen) {
      // Reset states on close
      setStep('confirm');
      setProgress(0);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (step !== 'installing') return;

    setProgress(0);
    const intervals = [
      { p: 15, text: 'Downloading Progressive Web Manifest asset files...' },
      { p: 35, text: 'Binding offline Service Workers caching engines...' },
      { p: 60, text: 'Replicating localized multi-merchant catalog schemas...' },
      { p: 85, text: 'Saving Somaliland mobile eDahab & Zaad wallet tokens...' },
      { p: 100, text: 'Pinning desktop app launch icon onto dashboard...' },
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const target = intervals[currentIdx]?.p || 100;
        if (prev >= 100) {
          clearInterval(interval);
          setStep('success');
          return 100;
        }

        const stepText = intervals[currentIdx]?.text || 'Finalizing offline installation...';
        setStatusText(stepText);

        if (prev >= target && currentIdx < intervals.length - 1) {
          currentIdx++;
        }

        return Math.min(100, prev + 5);
      });
    }, 80);

    return () => clearInterval(interval);
  }, [step]);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setStep('installing');
          if (setDeferredPrompt) setDeferredPrompt(null);
        } else {
          // User dismissed
          alert('Installation request dismissed. You can install anytime via search bar or Safari share menus!');
        }
      } catch (err) {
        console.error('Error starting native PWA prompt:', err);
        setStep('installing'); // Fallback simulation
      }
    } else {
      // No prompt trigger available (custom browser or nested frame)
      setStep('installing');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div 
        id="pwa-install-dialog" 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-left relative animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 text-white flex justify-between items-center relative">
          <div className="flex items-center gap-2.5">
            <Download className="w-5 h-5 animate-pulse text-indigo-100" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">PWA Web-App Installation</h3>
              <p className="text-[10px] text-slate-100 font-mono mt-0.5">SuuqHub Browser Service</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="flex gap-4 items-start bg-slate-50 border border-slate-150 p-4 rounded-xl">
                {/* Simulated App Icon */}
                <div className="w-12 h-12 bg-white rounded-xl border border-indigo-150 flex items-center justify-center p-1 shadow-xs shrink-0 select-none">
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path d="M12 20 L23 42 C24 44 21 47 18 47 C15 47 12 44 13 42 L12 20 Z" fill="#0f5132" />
                    <path d="M30 20 L33 42 C34 44 31 47 28 47 C25 47 22 44 23 42 L30 20 Z" fill="#7ebd24" />
                    <path d="M48 20 L44 42 C43 44 40 47 37 47 C34 47 32 44 33 42 L41 20 Z" fill="#0f5132" />
                    <path d="M50 40 C38 40 33 48 33 58 C33 71 50 87 50 87 C50 87 67 71 67 58 C67 48 62 40 50 40 Z" fill="#7ebd24" />
                    <circle cx="50" cy="54" r="5" fill="#ffffff" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{appName}</h4>
                  <p className="text-[11px] text-indigo-600 font-bold mt-1">Publisher: SuuqHub Softwares Inc.</p>
                  <p className="text-[10.5px] text-slate-500 leading-normal mt-1">
                    Install SuuqHub directly onto your desktop or mobile device. Run it offline with instantaneous loading speeds and deep device layout integration.
                  </p>
                </div>
              </div>

              {/* Sandbox Limitation Warning Alert */}
              {isInIframe && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1.5 text-left text-amber-850">
                  <span className="text-[10px] uppercase font-bold tracking-wider font-mono flex items-center gap-1">
                    ⚠️ Sandboxed Preview Frame Active
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Browsers **strictly block direct PWA triggers** inside third-party sandbox frames. To successfully download and install the app to your home screen/PC:
                  </p>
                  <ol className="text-[10px] list-decimal list-inside space-y-1 font-medium text-slate-700">
                    <li>Click the <b className="text-indigo-700 font-semibold">"Open App in New Tab"</b> icon at the top right header of the sandbox.</li>
                    <li>Inside the new tab, click <b className="text-indigo-705">"Download Web-App"</b> to open this installer.</li>
                    <li>Click <b className="text-indigo-705">"Install Web-App Now"</b> below to prompt the actual native browser install window!</li>
                  </ol>
                </div>
              )}

              {/* Manual browser instructions guidelines panel */}
              <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50 p-3 space-y-2 text-xs">
                <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider font-mono block">Alternative Manual Installation Steps:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10px] leading-snug">
                  <div className="bg-white border rounded p-2.5 space-y-1">
                    <span className="font-bold text-slate-755 uppercase font-mono text-[8px] flex items-center gap-1">💻 PC (Chrome/Edge)</span>
                    <p className="text-slate-500">Look at your address URL bar and click the small **Monitor/Download** icon, or tap the <span className="font-bold">three dots menu &rarr; Save and Share &rarr; Install App</span>.</p>
                  </div>
                  <div className="bg-white border rounded p-2.5 space-y-1">
                    <span className="font-bold text-slate-755 uppercase font-mono text-[8px] flex items-center gap-1">🤖 Android (Chrome)</span>
                    <p className="text-slate-500">Tap the <span className="font-bold">three vertical dots menu button</span> in the top right and select <span className="font-bold">"Add to Home Screen"</span> or <span className="font-bold">"Install App"</span>.</p>
                  </div>
                  <div className="bg-white border rounded p-2.5 space-y-1">
                    <span className="font-bold text-slate-755 uppercase font-mono text-[8px] flex items-center gap-1">🍎 iOS iPhone (Safari)</span>
                    <p className="text-slate-500">Tap the Safari <span className="font-bold">"Share"</span> button at the bottom navigation panel, then select <span className="font-bold">"Add to Home Screen"</span>.</p>
                  </div>
                </div>
              </div>

              {/* Requirements ticks */}
              <div className="space-y-1 bg-indigo-50/25 border border-indigo-100/60 p-3.5 rounded-xl text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-755 font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-[9px]">✓</span>
                    <span className="text-[10px]">Desktop Shortcut Link</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-[9px]">✓</span>
                    <span className="text-[10px]">Frameless App Frame</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-[9px]">✓</span>
                    <span className="text-[10px]">Full offline persistence</span>
                  </div>
                </div>
              </div>

              <div className="pt-1 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 hover:text-slate-900 border border-slate-250 rounded-lg text-xs font-bold cursor-pointer transition text-center"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition text-center shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  {deferredPrompt ? 'Install Web-App Now' : 'Simulate Installer Package'}
                </button>
              </div>
            </div>
          )}

          {step === 'installing' && (
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-indigo-700">
                  {progress}%
                </span>
              </div>
              <div className="space-y-1 w-full max-w-xs">
                <p className="text-xs font-bold text-slate-800 tracking-wide">Installing package bundle...</p>
                <p className="text-[10px] text-slate-450 italic leading-snug h-8 block">{statusText}</p>
              </div>
              {/* Progress track */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-100 ease-out" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-5 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-3xs">
                <Check className="w-6 h-6 stroke-3" />
              </div>
              
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-800">Installation Successful!</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  SuuqHub (Smart Market Place) is now pinned to your device home screen.
                </p>
              </div>

              {/* Selector Tabs for Desktop / Mobile layout demo */}
              <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50 p-2.5 space-y-3">
                <div className="flex gap-1.5 border-b border-slate-200/60 pb-2">
                  <button
                    onClick={() => setActiveTab('desktop')}
                    className={`flex-1 py-1 px-3 rounded text-[10px] uppercase font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${activeTab === 'desktop' ? 'bg-white text-indigo-700 border border-slate-200 shadow-3xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <Laptop className="w-3.5 h-3.5" /> Desktop view
                  </button>
                  <button
                    onClick={() => setActiveTab('mobile')}
                    className={`flex-1 py-1 px-3 rounded text-[10px] uppercase font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${activeTab === 'mobile' ? 'bg-white text-indigo-700 border border-slate-200 shadow-3xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Mobile view
                  </button>
                </div>

                {activeTab === 'desktop' ? (
                  <div className="p-4 bg-slate-900 text-slate-400 rounded-lg text-left font-mono text-[9px] relative ring-1 ring-slate-850 shadow-inner h-28 flex flex-col justify-between">
                    <span className="text-[8px] uppercase text-indigo-400 tracking-wider font-bold">🖥️ PC Desktop Shortcut Terminal:</span>
                    <div className="flex gap-4 items-center">
                      <div className="w-9 h-9 bg-white rounded border border-indigo-150 flex items-center justify-center p-0.5 shadow-md">
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                          <path d="M12 20 L23 42 C24 44 21 47 18 47 L12 20 Z" fill="#0f5132" />
                          <path d="M30 20 L33 42 C34 44 31 47 28 47 L30 20 Z" fill="#7ebd24" />
                          <circle cx="50" cy="54" r="5" fill="#ffffff" />
                        </svg>
                      </div>
                      <div className="leading-tight text-white">
                        <p className="font-bold text-xs">SuuqHub (Smart Market Place)</p>
                        <p className="text-[9px] text-slate-450 mt-0.5">App status: Ready (Offline-Capable)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[8.5px] text-emerald-400 font-bold">
                      <Pin className="w-2.5 h-2.5" /> Pinned successfully to explorer dash.
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900 text-slate-400 rounded-lg text-left font-mono text-[9px] relative ring-1 ring-slate-850 shadow-inner h-28 flex flex-col justify-between">
                    <span className="text-[8px] uppercase text-indigo-400 tracking-wider font-bold">📱 Mobile launcher splash:</span>
                    <div className="flex gap-4 items-center">
                      <div className="w-9 h-9 bg-white rounded h-10 w-10 flex items-center justify-center p-0.5 transform rotate-3 shadow-md">
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-1/2 h-1/2">
                          <circle cx="50" cy="50" r="40" fill="#7ebd24" />
                        </svg>
                      </div>
                      <div className="leading-tight text-white">
                        <p className="font-bold">SuuqHub launch</p>
                        <p className="text-[8.5px] text-slate-400 mt-0.5">Cached files: 25.4 MB stored</p>
                      </div>
                    </div>
                    <div className="text-emerald-400 font-bold text-[8px] flex items-center gap-1 uppercase tracking-wide">
                      <Sparkles className="w-2.5 h-2.5" /> standalone sandbox operational.
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-sm"
              >
                Close & Launch PWA
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
