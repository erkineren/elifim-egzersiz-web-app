'use client';

import { useState, useEffect, useCallback } from 'react';
import { marked } from 'marked';
import AuthWrapper from './components/AuthWrapper';
import PWAInstallBanner from './components/PWAInstallBanner';

// --- TYPES ---
interface Exercise {
  id: number;
  name: string;
  category: string;
  icon: string;
  desc: string;
  tip: string;
  duration?: string;
  reps?: string;
}

// --- DATA ---
const exercises: Exercise[] = [
  // Isınma
  {
    id: 1,
    name: "Omuz Daireleri",
    category: "Isınma",
    icon: "fa-solid fa-arrows-spin",
    desc: "Ayakta dik durun. Omuzlarınızı kulaklarınıza doğru yukarı çekin, geriye doğru geniş bir daire çizerek kürek kemiklerinizi birbirine yaklaştırın ve indirin.",
    tip: "Sadece omuzlarınız hareket etsin, gövdeniz sabit kalsın.",
    duration: "1 Dakika (30sn Geri / 30sn İleri)"
  },
  {
    id: 2,
    name: "Olduğun Yerde Yürüyüş",
    category: "Isınma",
    icon: "fa-solid fa-person-walking",
    desc: "Olduğunuz yerde ritmik bir şekilde yürüyün. Kollarınızı dirseklerden bükerek yürüyüşünüze eşlik ettirin.",
    tip: "Dizlerinizi çok yukarı çekmenize gerek yok, seri ve tempolu olmanız yeterli.",
    duration: "2 Dakika"
  },
  // Kollar & Sırt
  {
    id: 3,
    name: "Duvarda Şınav",
    category: "Kollar & Sırt",
    icon: "fa-solid fa-person-praying",
    desc: "Yüzünüz duvara dönük, bir adım uzakta durun. Elleri duvara dayayıp göğsünüzü duvara yaklaştırın ve itin.",
    tip: "Kendinizi iterken kalçanızı dışarı çıkarmayın, karnınızı hafifçe sıkın. Vücut tahta gibi düz olsun.",
    reps: "3 Set x 15 Tekrar"
  },
  {
    id: 4,
    name: "Kol Makası",
    category: "Kollar & Sırt",
    icon: "fa-solid fa-scissors",
    desc: "Kollar yanlarda T harfi gibi açık. Dirsekleri bükmeden kolları göğüs hizasında çapraz yapıp (makas) tekrar açın.",
    tip: "Kollarınızı savurmayın, kontrolü yapın. Kollar hep omuz hizasında kalsın.",
    reps: "3 Set x 40 Saniye"
  },
  {
    id: 5,
    name: "Arka Kol İtiş",
    category: "Kollar & Sırt",
    icon: "fa-solid fa-hand-back-fist",
    desc: "Gövde hafif öne eğik. Kollar geride dümdüz. Avuç içleri tavanı gösterirken kolları yukarı küçük küçük itin.",
    tip: "Kolları vücuda yapışık tutun. Arka koldaki yanmayı hissedin.",
    reps: "3 Set x 20 Sıkıştırma"
  },
  // Bel & Simit
  {
    id: 6,
    name: "Ayakta Yana Süzülme",
    category: "Bel & Simit",
    icon: "fa-solid fa-child-reaching",
    desc: "Ayakta dik, eller salık. Sağa eğilip elinizle dizinize kadar süzülün. Sonra sola.",
    tip: "Öne veya arkaya eğilmeyin, iki duvar arasındaymış gibi sadece yana eğilin.",
    reps: "3 Set x 15 (Her Yön)"
  },
  {
    id: 7,
    name: "Topuklara Dokunma",
    category: "Bel & Simit",
    icon: "fa-solid fa-shoe-prints",
    desc: "Sırt üstü, dizler bükülü. Omuzlar hafif kalkık. Sağa sola kıvrılıp topuklara dokunun.",
    tip: "Boynunuzu göğsünüze gömmeyin. Çene ile göğüs arasında portakal var gibi düşünün.",
    reps: "3 Set x 20 (Toplam)"
  },
  {
    id: 8,
    name: "Ters Kol Ters Bacak",
    category: "Bel & Simit",
    icon: "fa-solid fa-dog",
    desc: "Yerde masa pozisyonu. Sağ kol öne, sol bacak geriye uzanır. 2 sn bekle, değiş.",
    tip: "Belinizi çukurlaştırmayın. Denge için karnınızı sıkın.",
    reps: "3 Set x 12 (Her Yön)"
  },
  // Basen & Bacak
  {
    id: 9,
    name: "Sumo Squat",
    category: "Basen & Bacak",
    icon: "fa-solid fa-person-arrow-down-to-line",
    desc: "Ayaklar omuzdan geniş, parmak uçları dışa dönük. Dik çöküp kalkın.",
    tip: "Dizlerin içe çökmesine izin vermeyin, dışa itin. Kalkarken iç bacağı sıkın.",
    reps: "3 Set x 15 Tekrar"
  },
  {
    id: 10,
    name: "Yana Yatarak Daire",
    category: "Basen & Bacak",
    icon: "fa-solid fa-circle-notch",
    desc: "Yan yatın. Üstteki bacakla havada futbol topu büyüklüğünde daireler çizin.",
    tip: "Gövdeyi sallamadan, sadece kalça ekleminden çevirin.",
    reps: "3 Set x 12 Daire (Her Yön)"
  },
  {
    id: 11,
    name: "Yatarak İç Bacak Kaldırma",
    category: "Basen & Bacak",
    icon: "fa-solid fa-arrow-up-from-bracket",
    desc: "Yan yatın. Üst bacağı öne basın. Alttaki bacağı dümdüz yukarı kaldırıp indirin.",
    tip: "Topuğu iterek yaparsanız iç bacak kasını daha çok hissedersiniz.",
    reps: "3 Set x 15 (Her Bacak)"
  },
  // Soğuma
  {
    id: 12,
    name: "Çocuk Pozu",
    category: "Soğuma",
    icon: "fa-solid fa-child",
    desc: "Dizler üzerine oturun, öne kapanın, alnı yere koyun. Derin nefesle gevşeyin.",
    tip: "Sırtınızı ve belinizi tamamen serbest bırakın.",
    duration: "1 Dakika Dinlenme"
  }
];

const categories = ['all', 'Isınma', 'Kollar & Sırt', 'Bel & Simit', 'Basen & Bacak', 'Soğuma'];

export default function Home() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'library' | 'workout'>('dashboard');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showSafetyModal, setShowSafetyModal] = useState(true);
  const [libraryFilter, setLibraryFilter] = useState('all');
  
  // Timer state
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // AI state
  const [moodInput, setMoodInput] = useState('');
  const [aiMotivation, setAiMotivation] = useState('');
  const [isLoadingMotivation, setIsLoadingMotivation] = useState(false);
  const [aiTips, setAiTips] = useState<Record<string, string>>({});
  const [loadingTips, setLoadingTips] = useState<Record<string, boolean>>({});

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setSeconds(0);
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${s}`;
  };

  // API calls
  const callGemini = async (prompt: string): Promise<string> => {
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API Error');
      }
      
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Şu anda bağlantı kurulamadı. Lütfen tekrar deneyin.";
    }
  };

  const getAIMotivation = async () => {
    if (!moodInput.trim()) return;
    
    setIsLoadingMotivation(true);
    
    const prompt = `
      Sen kişisel bir spor koçusun. Kullanıcın adı Elif. Kendisi bir kadın, daha önce sezaryen ve rahim ameliyatı geçirdi, bu yüzden güvenli ve düşük etkili egzersizler yapıyor.
      
      Kullanıcı bugün şöyle hissediyor: "${moodInput}".
      
      Ona çok kısa (maksimum 2 cümle), samimi, Türkçe ve motive edici bir cevap ver. 
      Eğer yorgunsa dinlenmenin önemini vurgula ama harekete geçmeye teşvik et. 
      Eğer enerjikse bu enerjiyi doğru kullanmasını söyle.
      Sadece cevabı yaz.
    `;
    
    const response = await callGemini(prompt);
    setAiMotivation(response);
    setIsLoadingMotivation(false);
  };

  const getExerciseTip = async (exerciseName: string) => {
    setLoadingTips(prev => ({ ...prev, [exerciseName]: true }));
    
    const prompt = `
      "${exerciseName}" egzersizi için çok kısa, ilginç ve faydalı bir "Püf Noktası" ver.
      Bu egzersizi yapan kişi ameliyat geçmişi olan bir kadın (Elif).
      Güvenlik odaklı olsun.
      Maddeler halinde değil, tek bir akıcı paragraf olsun. Maksimum 30 kelime.
      Türkçe cevap ver.
    `;
    
    const response = await callGemini(prompt);
    setAiTips(prev => ({ ...prev, [exerciseName]: response }));
    setLoadingTips(prev => ({ ...prev, [exerciseName]: false }));
  };

  const switchTab = (tab: 'dashboard' | 'library' | 'workout') => {
    setCurrentTab(tab);
    if (tab === 'workout') {
      resetTimer();
    }
    window.scrollTo(0, 0);
  };

  const nextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      resetTimer();
    } else {
      alert("Tebrikler Elif! Antrenmanı tamamladın. Harika bir iş çıkardın!");
      setCurrentExerciseIndex(0);
      switchTab('dashboard');
    }
  };

  const prevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      resetTimer();
    }
  };

  const filteredExercises = libraryFilter === 'all' 
    ? exercises 
    : exercises.filter(e => e.category === libraryFilter);

  const currentExercise = exercises[currentExerciseIndex];
  const progress = ((currentExerciseIndex + 1) / exercises.length) * 100;

  return (
    <AuthWrapper>
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-800 font-sans">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 shadow-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-orange-400 text-white p-2 rounded-lg">
            <i className="fa-solid fa-person-running"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-stone-800">ELİF EREN</h1>
            <p className="text-xs text-stone-500 uppercase tracking-widest">Kişisel Egzersiz Planı</p>
          </div>
        </div>
        <button onClick={() => setShowSafetyModal(true)} className="text-stone-500 hover:text-orange-400 transition-colors">
          <i className="fa-solid fa-circle-info text-xl"></i>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6 max-w-5xl">
        
        {/* DASHBOARD VIEW */}
        {currentTab === 'dashboard' && (
          <section className="space-y-8 animate-fade-in">
            {/* Welcome Section */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-orange-400">
              <h2 className="text-2xl font-semibold mb-2">Hoş geldin, Elif!</h2>
              <p className="text-stone-500 leading-relaxed mb-4">
                Senin için özel olarak hazırlanan bu program; karın içi basıncı dengede tutarak, kol sıkılaşması, bel inceltme ve basen şekillendirme hedeflerine odaklanır.
              </p>
              
              {/* AI Mood Check-in */}
              <div className="bg-stone-50 rounded-xl p-4 mt-4 border border-stone-100">
                <label className="block text-sm font-bold text-stone-800 mb-2">Bugün nasıl hissediyorsun?</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={moodInput}
                    onChange={(e) => setMoodInput(e.target.value)}
                    placeholder="Örn: Biraz yorgunum, enerjik hissediyorum..." 
                    className="flex-grow p-3 rounded-lg border border-stone-200 focus:outline-none focus:border-orange-400 text-sm"
                  />
                  <button 
                    onClick={getAIMotivation} 
                    disabled={isLoadingMotivation}
                    className="bg-stone-800 text-white px-4 py-2 rounded-lg hover:bg-orange-400 transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                  >
                    <span>{isLoadingMotivation ? 'Yazıyor...' : 'Motive Et'}</span>
                    <i className="fa-solid fa-wand-magic-sparkles text-yellow-400"></i>
                  </button>
                </div>
                {aiMotivation && (
                  <div 
                    className="mt-3 text-sm text-stone-800 italic bg-white p-3 rounded-lg border border-stone-100"
                    dangerouslySetInnerHTML={{ __html: marked(aiMotivation) as string }}
                  />
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Focus Distribution */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Program Odak Dağılımı</h3>
                <p className="text-sm text-stone-500 mb-4">Bu program vücut bölgelerine göre dengeli dağılım sağlar.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-stone-100 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-400">3</div>
                    <div className="text-xs text-stone-600">Kollar & Sırt</div>
                  </div>
                  <div className="bg-stone-100 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-400">3</div>
                    <div className="text-xs text-stone-600">Bel & Simit</div>
                  </div>
                  <div className="bg-stone-100 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-400">3</div>
                    <div className="text-xs text-stone-600">Basen & Bacak</div>
                  </div>
                  <div className="bg-stone-100 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-stone-500">3</div>
                    <div className="text-xs text-stone-600">Isınma/Soğuma</div>
                  </div>
                </div>
              </div>

              {/* Weekly Goal */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Haftalık Tutarlılık Hedefi</h3>
                <p className="text-sm text-stone-500 mb-4">Haftada 3-4 gün hedefine odaklan.</p>
                <div className="flex justify-between items-end h-32">
                  {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, i) => (
                    <div key={day} className="flex flex-col items-center gap-1">
                      <div 
                        className={`w-8 rounded-t ${[0, 2, 4].includes(i) ? 'bg-orange-400 h-20' : 'bg-stone-200 h-4'}`}
                      ></div>
                      <span className="text-xs text-stone-600">{day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => switchTab('workout')} 
                className="bg-stone-800 text-white p-6 rounded-2xl shadow-lg hover:bg-orange-400 transition-all transform hover:-translate-y-1 flex items-center justify-between group"
              >
                <div>
                  <h3 className="text-xl font-bold">Antrenmana Başla</h3>
                  <p className="text-sm opacity-80 mt-1">Rehberli moda geç</p>
                </div>
                <i className="fa-solid fa-play text-2xl group-hover:scale-125 transition-transform"></i>
              </button>
              <button 
                onClick={() => switchTab('library')} 
                className="bg-white text-stone-800 p-6 rounded-2xl shadow-lg hover:bg-stone-50 transition-all border border-stone-200 flex items-center justify-between"
              >
                <div>
                  <h3 className="text-xl font-bold">Hareket Kütüphanesi</h3>
                  <p className="text-sm text-stone-500 mt-1">Detayları incele</p>
                </div>
                <i className="fa-solid fa-book-open text-2xl text-orange-400"></i>
              </button>
            </div>
          </section>
        )}

        {/* LIBRARY VIEW */}
        {currentTab === 'library' && (
          <section className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-2">Hareket Kütüphanesi</h2>
              <p className="text-stone-500">Tüm hareketlerin doğru formlarını, püf noktalarını ve hedeflerini buradan inceleyebilirsiniz.</p>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-2 mt-4">
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setLibraryFilter(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      libraryFilter === cat 
                        ? 'bg-stone-800 text-white' 
                        : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
                    }`}
                  >
                    {cat === 'all' ? 'Tümü' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredExercises.map(ex => (
                <div 
                  key={ex.id}
                  className="bg-white p-5 rounded-2xl shadow-lg border border-stone-50 hover:border-stone-200 transition-all cursor-pointer"
                  onClick={() => alert(`PÜF NOKTA: ${ex.tip}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-stone-50 text-stone-800 p-3 rounded-xl">
                      <i className={`${ex.icon} text-xl`}></i>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-stone-100 text-stone-800 rounded-lg">{ex.category}</span>
                  </div>
                  <h3 className="font-bold text-lg text-stone-800 mb-2">{ex.name}</h3>
                  <p className="text-sm text-stone-500 mb-3 line-clamp-2">{ex.desc}</p>
                  <div className="text-xs font-semibold text-orange-400">
                    {ex.reps || ex.duration}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* WORKOUT VIEW */}
        {currentTab === 'workout' && (
          <section className="h-full flex flex-col">
            {/* Progress Bar */}
            <div className="w-full bg-stone-200 rounded-full h-2.5 mb-6">
              <div className="bg-orange-400 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>

            {/* Active Card */}
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-10 flex-grow flex flex-col justify-between relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="bg-stone-100 text-stone-800 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                  {currentExercise.category}
                </span>
                <span className="text-stone-400 text-sm font-mono">
                  {currentExerciseIndex + 1} / {exercises.length}
                </span>
              </div>

              <div className="text-center my-6">
                <div className="w-24 h-24 bg-stone-50 rounded-full mx-auto flex items-center justify-center mb-4 text-orange-400 shadow-inner">
                  <i className={`${currentExercise.icon} text-4xl`}></i>
                </div>
                <h2 className="text-3xl font-bold text-stone-800 mb-2">{currentExercise.name}</h2>
                <div className="text-xl font-medium text-stone-500">{currentExercise.reps || currentExercise.duration}</div>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                <h4 className="font-bold text-sm text-stone-800 mb-1">
                  <i className="fa-solid fa-list-ul mr-1"></i> Nasıl Yapılır?
                </h4>
                <p className="text-sm text-stone-600 leading-snug">{currentExercise.desc}</p>
              </div>

              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mt-3 relative">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-sm text-orange-600">
                    <i className="fa-solid fa-lightbulb mr-1"></i> Püf Nokta
                  </h4>
                  <button 
                    onClick={() => getExerciseTip(currentExercise.name)}
                    disabled={loadingTips[currentExercise.name]}
                    className="text-xs bg-white text-orange-500 border border-orange-200 px-2 py-1 rounded-md hover:bg-orange-100 transition-colors shadow-sm"
                  >
                    <span className="flex items-center gap-1 font-bold">
                      {loadingTips[currentExercise.name] ? (
                        <span className="inline-block w-3 h-3 border-2 border-current border-r-transparent rounded-full animate-spin"></span>
                      ) : (
                        '✨ AI İpucu'
                      )}
                    </span>
                  </button>
                </div>
                <p className="text-sm text-orange-800 leading-snug">{currentExercise.tip}</p>
                
                {aiTips[currentExercise.name] && (
                  <div 
                    className="mt-3 pt-3 border-t border-orange-200 text-sm text-orange-900"
                    dangerouslySetInnerHTML={{ __html: `<strong class="text-orange-400">✨ AI İpucu:</strong> ${marked(aiTips[currentExercise.name])}` }}
                  />
                )}
              </div>

              {/* Timer */}
              <div className="mt-4 flex justify-center items-center gap-4">
                <div className="text-3xl font-mono text-stone-800 font-bold">{formatTime(seconds)}</div>
                <button 
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="w-10 h-10 rounded-full bg-stone-800 text-white flex items-center justify-center hover:bg-orange-400"
                >
                  <i className="fa-solid fa-stopwatch"></i>
                </button>
                <button 
                  onClick={resetTimer}
                  className="w-10 h-10 rounded-full bg-stone-200 text-stone-800 flex items-center justify-center hover:bg-stone-300"
                >
                  <i className="fa-solid fa-rotate-left"></i>
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button 
                onClick={prevExercise}
                className="bg-white text-stone-800 py-4 rounded-xl font-bold shadow-lg hover:bg-stone-50"
              >
                <i className="fa-solid fa-chevron-left mr-2"></i> Önceki
              </button>
              <button 
                onClick={nextExercise}
                className="bg-stone-800 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-orange-400 transition-colors"
              >
                Sonraki <i className="fa-solid fa-chevron-right ml-2"></i>
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-stone-200 sticky bottom-0 z-40">
        <div className="flex justify-around items-center h-16">
          <button 
            onClick={() => switchTab('dashboard')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              currentTab === 'dashboard' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-stone-500'
            }`}
          >
            <i className="fa-solid fa-chart-pie text-lg"></i>
            <span className="text-xs font-medium">Özet</span>
          </button>
          <button 
            onClick={() => switchTab('workout')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              currentTab === 'workout' ? 'text-orange-400' : 'text-stone-500'
            }`}
          >
            <div className="bg-orange-400 text-white rounded-full p-3 -mt-6 shadow-lg border-4 border-white">
              <i className="fa-solid fa-play ml-0.5"></i>
            </div>
          </button>
          <button 
            onClick={() => switchTab('library')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              currentTab === 'library' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-stone-500'
            }`}
          >
            <i className="fa-solid fa-list-check text-lg"></i>
            <span className="text-xs font-medium">Hareketler</span>
          </button>
        </div>
      </nav>

      {/* Safety Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-lg animate-bounce-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-500">
                <i className="fa-solid fa-triangle-exclamation mr-2"></i>Güvenlik Kuralları
              </h3>
              <button onClick={() => setShowSafetyModal(false)} className="text-stone-500 hover:text-stone-800">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div className="space-y-4 text-stone-800">
              <div className="flex items-start gap-3">
                <div className="bg-red-100 text-red-500 p-2 rounded-lg mt-1">
                  <i className="fa-solid fa-lungs"></i>
                </div>
                <div>
                  <h4 className="font-bold">Nefes Kontrolü</h4>
                  <p className="text-sm">Asla nefesinizi tutmayın. Zorlanırken nefes verin, gevşerken alın.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-red-100 text-red-500 p-2 rounded-lg mt-1">
                  <i className="fa-solid fa-hand-holding-medical"></i>
                </div>
                <div>
                  <h4 className="font-bold">Ağrı Kontrolü</h4>
                  <p className="text-sm">Kas yanması hedeftir ancak dikiş bölgelerinde keskin acı hissederseniz DURUN.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-red-100 text-red-500 p-2 rounded-lg mt-1">
                  <i className="fa-solid fa-gauge"></i>
                </div>
                <div>
                  <h4 className="font-bold">Tempo</h4>
                  <p className="text-sm">Hız değil, kontrol önemlidir. Hareketi hissederek yapın.</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowSafetyModal(false)}
              className="w-full mt-6 bg-stone-800 text-white py-3 rounded-xl font-bold hover:bg-orange-400 transition-colors"
            >
              Anlaşıldı
            </button>
          </div>
        </div>
      )}

      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </div>
    </AuthWrapper>
  );
}
