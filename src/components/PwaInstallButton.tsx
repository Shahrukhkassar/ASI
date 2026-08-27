import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Check, X, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaInstallButtonProps {
  variant?: 'navbar' | 'hero' | 'floating' | 'banner';
  className?: string;
}

export const PwaInstallButton: React.FC<PwaInstallButtonProps> = ({
  variant = 'navbar',
  className = ''
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    // Check if app is already running as standalone PWA
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    // Check for iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) return;

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Fallback: show instructions or prompt
      setShowIOSModal(true);
    }
  };

  if (isInstalled && variant !== 'navbar') {
    return null;
  }

  // Variant 1: Navbar Compact Button
  if (variant === 'navbar') {
    return (
      <>
        <button
          id="pwa-install-nav-btn"
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs cursor-pointer ${
            isInstalled 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent hover:from-violet-700 hover:to-indigo-700 hover:shadow-violet-600/30'
          } ${className}`}
          title={isInstalled ? "ASI App Installed" : "Install ASI CBT Mobile App"}
        >
          {isInstalled ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">App Installed</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 animate-bounce" />
              <span>Install App</span>
            </>
          )}
        </button>

        {/* iOS / Fallback Guide Modal */}
        {showIOSModal && (
          <IOSInstallGuideModal onClose={() => setShowIOSModal(false)} />
        )}
      </>
    );
  }

  // Variant 2: Hero CTA Button
  if (variant === 'hero') {
    return (
      <>
        <button
          id="pwa-install-hero-btn"
          onClick={handleInstallClick}
          className={`px-5 py-3 rounded-xl text-sm font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
            isInstalled
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:scale-[1.02] border-slate-800'
          } ${className}`}
        >
          <Smartphone className="w-4 h-4 text-violet-400" />
          <span>{isInstalled ? 'App Ready on Device' : '📱 Install ASI Android / iOS App'}</span>
        </button>

        {showIOSModal && (
          <IOSInstallGuideModal onClose={() => setShowIOSModal(false)} />
        )}
      </>
    );
  }

  // Variant 3: Floating Bottom Install Banner
  if (variant === 'floating') {
    if (isInstalled || !showBanner) return null;

    return (
      <>
        <aside
          id="pwa-floating-banner"
          aria-label="Install ASI CBT App"
          className="fixed bottom-4 right-4 z-40 max-w-sm bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-violet-500/30 backdrop-blur-md animate-in slide-in-from-bottom-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src="/icons/icon-192x192.png" alt="ASI" className="w-10 h-10 rounded-xl shadow-md shrink-0 object-contain bg-violet-600 p-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Install ASI NEET App</h4>
                <p className="text-xs text-slate-300">Fast CBT practice, offline mode &amp; rank alerts.</p>
              </div>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              id="pwa-floating-install-action"
              onClick={handleInstallClick}
              className="flex-1 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Free Now</span>
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
            >
              Later
            </button>
          </div>
        </aside>

        {showIOSModal && (
          <IOSInstallGuideModal onClose={() => setShowIOSModal(false)} />
        )}
      </>
    );
  }

  return null;
};

const IOSInstallGuideModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-violet-100 text-slate-900 space-y-4 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <img src="/icons/icon-192x192.png" alt="ASI" className="w-10 h-10 rounded-xl shadow-md shrink-0 object-contain bg-violet-600 p-0.5" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Install ASI CBT App</h3>
              <p className="text-xs text-slate-500">Add to your Home Screen for instant access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-700">
          <div className="flex items-start gap-3 p-3 bg-violet-50/70 rounded-xl border border-violet-100">
            <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              1
            </div>
            <div>
              <p className="font-semibold text-slate-900">On iPhone / iPad (Safari):</p>
              <p className="text-slate-600 mt-0.5">
                Tap the <span className="font-bold inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-300"><Share className="w-3 h-3" /> Share</span> button at the bottom of your browser.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-violet-50/70 rounded-xl border border-violet-100">
            <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              2
            </div>
            <div>
              <p className="font-semibold text-slate-900">Choose Add to Home Screen:</p>
              <p className="text-slate-600 mt-0.5">
                Scroll down and tap <span className="font-bold inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-300"><PlusSquare className="w-3 h-3" /> Add to Home Screen</span>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              3
            </div>
            <div>
              <p className="font-semibold text-emerald-900">On Android / Chrome:</p>
              <p className="text-emerald-700 mt-0.5">
                Tap the 3 dots in Chrome and select <span className="font-bold">Install app</span> or <span className="font-bold">Add to Home Screen</span>.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl shadow-md cursor-pointer transition-colors"
        >
          Got it, Close
        </button>
      </div>
    </div>
  );
};
