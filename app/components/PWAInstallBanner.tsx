'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (PWA)
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Don't show banner if in standalone mode
    if (isStandalone) return;

    // Check if user dismissed banner before
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      // Don't show for 7 days after dismissal
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS doesn't fire beforeinstallprompt, show manual instructions
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    if (isIOS && !isStandalone) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  // Don't render if in standalone mode or banner shouldn't show
  if (isStandalone || !showBanner) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl p-4 border border-orange-100 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="bg-orange-400 text-white p-3 rounded-xl flex-shrink-0">
            <i className="fa-solid fa-mobile-screen-button text-xl"></i>
          </div>
          <div className="flex-grow">
            <h3 className="font-bold text-stone-800 mb-1">
              Uygulamayı Yükle
            </h3>
            <p className="text-sm text-stone-500">
              {isIOS 
                ? "Safari'de paylaş butonuna tıklayıp 'Ana Ekrana Ekle' seçeneğini kullan."
                : "Hızlı erişim için ana ekranına ekle!"
              }
            </p>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-stone-400 hover:text-stone-600 p-1"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="w-full mt-3 bg-orange-400 text-white py-2.5 rounded-xl font-semibold hover:bg-orange-500 transition-colors flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-download"></i>
            Şimdi Yükle
          </button>
        )}
        
        {isIOS && (
          <div className="mt-3 bg-stone-50 rounded-xl p-3 text-sm text-stone-600">
            <div className="flex items-center gap-2 mb-1">
              <i className="fa-solid fa-arrow-up-from-bracket text-orange-400"></i>
              <span>Paylaş</span>
              <i className="fa-solid fa-arrow-right text-stone-400"></i>
              <i className="fa-solid fa-plus-square text-orange-400"></i>
              <span>Ana Ekrana Ekle</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
