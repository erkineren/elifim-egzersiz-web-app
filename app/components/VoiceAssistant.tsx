'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Motivasyon cümleleri
const MOTIVATION_PHRASES = [
  "Harika gidiyorsun!",
  "Devam et, yapabilirsin!",
  "Çok iyi!",
  "Muhteşem!",
  "Enerji dolu!",
  "Güçleniyorsun!",
  "Aferin!",
  "Harikasın!",
];

// Egzersiz geçiş cümleleri
const TRANSITION_PHRASES = [
  "Sonraki egzersize geçiyoruz",
  "Hazır mısın? Yeni hareket",
  "Süpersin! Şimdi sırada",
];

// Timer uyarı cümleleri
const TIMER_ALERTS: Record<number, string> = {
  60: "Bir dakika kaldı!",
  30: "Son otuz saniye!",
  10: "Son on saniye!",
  5: "Beş!",
  3: "Üç!",
  2: "İki!",
  1: "Bir!",
  0: "Süre doldu!",
};

interface VoiceAssistantProps {
  enabled: boolean;
  onReady?: () => void;
}

// Audio cache to avoid re-generating same phrases
const audioCache = new Map<string, string>();

export function useVoiceAssistant({ enabled, onReady }: VoiceAssistantProps) {
  const [isSupported, setIsSupported] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(1);
  const [useElevenLabs, setUseElevenLabs] = useState(true);
  
  // Music state
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMusicLoading, setIsMusicLoading] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.3); // Lower volume for background
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const lastTimerAlertRef = useRef<number>(-1);

  // Initialize
  useEffect(() => {
    // Create audio elements
    audioRef.current = new Audio();
    audioRef.current.onended = () => setIsSpeaking(false);
    audioRef.current.onerror = () => setIsSpeaking(false);
    
    musicRef.current = new Audio();
    musicRef.current.loop = true;
    musicRef.current.volume = musicVolume;
    musicRef.current.onplay = () => setIsMusicPlaying(true);
    musicRef.current.onpause = () => setIsMusicPlaying(false);
    musicRef.current.onerror = () => {
      setIsMusicPlaying(false);
      setIsMusicLoading(false);
    };
    
    // Initialize browser TTS as fallback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;

      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || [];
        const turkishVoice = voices.find(v => v.lang.startsWith('tr'));
        voiceRef.current = turkishVoice || voices[0] || null;
      };

      loadVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }

    setIsSupported(true);
    if (onReady) onReady();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
    };
  }, [onReady]);

  // Update audio volumes
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (musicRef.current) musicRef.current.volume = musicVolume;
  }, [musicVolume]);

  // ElevenLabs TTS
  const speakWithElevenLabs = useCallback(async (text: string): Promise<boolean> => {
    try {
      const cacheKey = text.toLowerCase().trim();
      let audioData = audioCache.get(cacheKey);

      if (!audioData) {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        const data = await response.json();

        if (data.fallback || data.error) {
          return false;
        }

        audioData = `data:${data.contentType};base64,${data.audio}`;
        
        if (audioCache.size > 50) {
          const firstKey = audioCache.keys().next().value;
          if (firstKey) audioCache.delete(firstKey);
        }
        audioCache.set(cacheKey, audioData);
      }

      if (audioRef.current) {
        // Lower music volume while speaking
        if (musicRef.current && isMusicPlaying) {
          musicRef.current.volume = musicVolume * 0.3;
        }
        
        audioRef.current.src = audioData;
        audioRef.current.volume = volume;
        setIsSpeaking(true);
        
        await audioRef.current.play();
        
        // Wait for audio to finish
        await new Promise<void>((resolve) => {
          if (audioRef.current) {
            audioRef.current.onended = () => {
              setIsSpeaking(false);
              // Restore music volume
              if (musicRef.current) {
                musicRef.current.volume = musicVolume;
              }
              resolve();
            };
          } else {
            resolve();
          }
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      return false;
    }
  }, [volume, musicVolume, isMusicPlaying]);

  // Browser TTS fallback
  const speakWithBrowser = useCallback((text: string, rate: number = 1, pitch: number = 1): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current) {
        resolve();
        return;
      }

      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voiceRef.current;
      utterance.lang = 'tr-TR';
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Lower music volume while speaking
      if (musicRef.current && isMusicPlaying) {
        musicRef.current.volume = musicVolume * 0.3;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (musicRef.current) musicRef.current.volume = musicVolume;
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        if (musicRef.current) musicRef.current.volume = musicVolume;
        resolve();
      };

      synthRef.current.speak(utterance);
    });
  }, [volume, musicVolume, isMusicPlaying]);

  // Main speak function
  const speak = useCallback(async (text: string, rate: number = 1, pitch: number = 1): Promise<void> => {
    if (!enabled || !isSupported) return;

    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }

    // Try ElevenLabs first
    if (useElevenLabs) {
      const success = await speakWithElevenLabs(text);
      if (success) return;
    }

    // Fallback to browser TTS
    await speakWithBrowser(text, rate, pitch);
  }, [enabled, isSupported, useElevenLabs, speakWithElevenLabs, speakWithBrowser]);

  // Count down (3, 2, 1, Başla!)
  const countDown = useCallback(async (from: number = 3): Promise<void> => {
    if (!enabled || !isSupported) return;

    for (let count = from; count > 0; count--) {
      await speak(count.toString());
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    await speak("Başla!");
    await new Promise(resolve => setTimeout(resolve, 600));
  }, [enabled, isSupported, speak]);

  // Count reps
  const countRep = useCallback((repNumber: number) => {
    speak(repNumber.toString());
  }, [speak]);

  // Timer alert - call this in timer useEffect
  const checkTimerAlert = useCallback((remainingSeconds: number) => {
    if (!enabled) return;
    
    const alertText = TIMER_ALERTS[remainingSeconds];
    if (alertText && lastTimerAlertRef.current !== remainingSeconds) {
      lastTimerAlertRef.current = remainingSeconds;
      speak(alertText);
    }
  }, [enabled, speak]);

  // Reset timer alert tracking
  const resetTimerAlerts = useCallback(() => {
    lastTimerAlertRef.current = -1;
  }, []);

  // Announce exercise
  const announceExercise = useCallback((exerciseName: string, isFirst: boolean = false) => {
    if (isFirst) {
      speak(`İlk egzersiz: ${exerciseName}`);
    } else {
      const phrase = TRANSITION_PHRASES[Math.floor(Math.random() * TRANSITION_PHRASES.length)];
      speak(`${phrase}: ${exerciseName}`);
    }
  }, [speak]);

  // Random motivation
  const motivate = useCallback(() => {
    const phrase = MOTIVATION_PHRASES[Math.floor(Math.random() * MOTIVATION_PHRASES.length)];
    speak(phrase);
  }, [speak]);

  // Announce completion
  const announceCompletion = useCallback(() => {
    speak("Tebrikler! Antrenmanı tamamladın. Harika bir iş çıkardın!");
  }, [speak]);

  // Announce rest
  const announceRest = useCallback((seconds: number) => {
    speak(`${seconds} saniye dinlen`);
  }, [speak]);

  // Stop speaking
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // ===== MUSIC FUNCTIONS =====
  
  // Start background music (streaming)
  const startMusic = useCallback(async (type: 'warmup' | 'workout' | 'cooldown' | 'motivation' = 'workout') => {
    if (!musicRef.current || isMusicLoading) return;

    setIsMusicLoading(true);
    
    try {
      const response = await fetch('/api/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, durationMs: 60000 }), // 1 minute for faster generation
      });

      if (!response.ok) {
        console.error('Music generation failed:', response.statusText);
        setIsMusicLoading(false);
        return;
      }

      // Create blob URL from stream for immediate playback
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      musicRef.current.src = audioUrl;
      musicRef.current.volume = musicVolume;
      
      // Clean up old blob URL when audio ends or on new music
      const currentUrl = audioUrl;
      musicRef.current.onended = () => {
        URL.revokeObjectURL(currentUrl);
        // Loop by regenerating
        if (isMusicPlaying) {
          startMusic(type);
        }
      };
      
      await musicRef.current.play();
      setIsMusicLoading(false);
    } catch (error) {
      console.error('Music error:', error);
      setIsMusicLoading(false);
    }
  }, [musicVolume, isMusicLoading, isMusicPlaying]);

  // Stop music
  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
      setIsMusicPlaying(false);
    }
  }, []);

  // Toggle music
  const toggleMusic = useCallback(() => {
    if (!musicRef.current) return;
    
    if (isMusicPlaying) {
      musicRef.current.pause();
    } else if (musicRef.current.src) {
      musicRef.current.play();
    } else {
      startMusic('workout');
    }
  }, [isMusicPlaying, startMusic]);

  return {
    isSupported,
    isSpeaking,
    volume,
    setVolume,
    useElevenLabs,
    setUseElevenLabs,
    speak,
    countDown,
    countRep,
    checkTimerAlert,
    resetTimerAlerts,
    announceExercise,
    motivate,
    announceCompletion,
    announceRest,
    stop,
    // Music
    isMusicPlaying,
    isMusicLoading,
    musicVolume,
    setMusicVolume,
    startMusic,
    stopMusic,
    toggleMusic,
  };
}

// Voice Assistant Control Panel Component
interface VoiceControlPanelProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  isSupported: boolean;
  isMusicPlaying?: boolean;
  isMusicLoading?: boolean;
  onMusicToggle?: () => void;
  musicVolume?: number;
  onMusicVolumeChange?: (volume: number) => void;
}

export function VoiceControlPanel({
  enabled,
  onToggle,
  volume,
  onVolumeChange,
  isSupported,
  isMusicPlaying = false,
  isMusicLoading = false,
  onMusicToggle,
  musicVolume = 0.3,
  onMusicVolumeChange,
}: VoiceControlPanelProps) {
  if (!isSupported) {
    return (
      <div className="text-xs text-stone-400 flex items-center gap-1">
        <i className="fa-solid fa-volume-xmark"></i>
        <span>Sesli asistan desteklenmiyor</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 bg-stone-100 rounded-lg px-3 py-2">
      {/* Voice Toggle */}
      <button
        onClick={() => onToggle(!enabled)}
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
          enabled ? 'text-orange-500' : 'text-stone-500'
        }`}
      >
        <i className={`fa-solid ${enabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
        <span className="hidden sm:inline">{enabled ? 'Ses' : 'Sessiz'}</span>
      </button>
      
      {enabled && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-14 h-1 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-orange-400"
        />
      )}

      {/* Music Toggle */}
      {onMusicToggle && (
        <>
          <div className="w-px h-4 bg-stone-300"></div>
          <button
            onClick={onMusicToggle}
            disabled={isMusicLoading}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
              isMusicPlaying ? 'text-green-500' : 'text-stone-500'
            } ${isMusicLoading ? 'opacity-50' : ''}`}
          >
            {isMusicLoading ? (
              <span className="inline-block w-3 h-3 border-2 border-current border-r-transparent rounded-full animate-spin"></span>
            ) : (
              <i className={`fa-solid ${isMusicPlaying ? 'fa-music' : 'fa-music'}`}></i>
            )}
            <span className="hidden sm:inline">{isMusicPlaying ? 'Müzik' : 'Müzik'}</span>
          </button>
          
          {isMusicPlaying && onMusicVolumeChange && (
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={musicVolume}
              onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
              className="w-14 h-1 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-green-400"
            />
          )}
        </>
      )}
    </div>
  );
}
