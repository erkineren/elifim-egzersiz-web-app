'use client';

import { useState, useEffect, ReactNode } from 'react';

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setError(data.error || 'Giriş başarısız');
      }
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-400 rounded-full mx-auto flex items-center justify-center mb-4 animate-pulse">
            <i className="fa-solid fa-person-running text-2xl text-white"></i>
          </div>
          <p className="text-stone-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-orange-400 rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg">
              <i className="fa-solid fa-person-running text-3xl text-white"></i>
            </div>
            <h1 className="text-2xl font-bold text-stone-800">Elif Eren</h1>
            <p className="text-stone-500 text-sm">Kişisel Egzersiz Programı</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                <i className="fa-solid fa-lock mr-2"></i>Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifrenizi girin"
                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-stone-800 text-white py-3 rounded-xl font-semibold hover:bg-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-r-transparent rounded-full animate-spin"></span>
                  Giriş yapılıyor...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket"></i>
                  Giriş Yap
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-stone-400">
            <i className="fa-solid fa-shield-halved mr-1"></i>
            Güvenli bağlantı
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show children
  return <>{children}</>;
}
