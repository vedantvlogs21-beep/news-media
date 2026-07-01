
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Category, NewsItem, ViewState, LOCATIONS } from './types';
import { Icons } from './constants';
import Logo from './components/Logo';
import NewsCard from './components/NewsCard';
import SidebarDrawer from './components/SidebarDrawer';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { GeminiService } from './services/geminiService';
import ApiService from './services/apiService';

const INITIAL_VISIBLE_COUNT = 6;
const LOAD_MORE_STEP = 4;

const App: React.FC = () => {
  // Global News State
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Navigation & View State
  const [viewState, setViewState] = useState<ViewState>('USER');
  const [activeCategory, setActiveCategory] = useState<Category>(Category.HOME);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  // UI State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [tickerText, setTickerText] = useState('लोड होत आहे...');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Pagination State
  const [visibleNewsCount, setVisibleNewsCount] = useState(INITIAL_VISIBLE_COUNT);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initial Data Fetch
  useEffect(() => {
    const loadNews = async () => {
      try {
        const news = await ApiService.fetchNews();
        setAllNews(news);
      } catch (err) {
        console.error("Failed to load news:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadNews();
  }, []);

  // Check Auth State on mount
  useEffect(() => {
    const token = localStorage.getItem('kanosa_auth_token');
    if (token) {
      setViewState('ADMIN_DASHBOARD');
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchTicker = async () => {
      const summary = await GeminiService.getTrendingTopicSummary("महाराष्ट्र चालू घडामोडी");
      setTickerText(summary || "महाराष्ट्र चालू घडामोडींचे विश्वसनीय व्यासपीठ - कानोसा न्यूज पोर्टलवर आपले स्वागत आहे!");
    };
    fetchTicker();
  }, []);

  useEffect(() => {
    setVisibleNewsCount(INITIAL_VISIBLE_COUNT);
  }, [activeCategory, searchQuery]);

  const fullCategoryNews = useMemo(() => {
    let results = allNews;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.excerpt.toLowerCase().includes(query)
      );
    } else if (activeCategory !== Category.HOME) {
      results = results.filter(n => n.category === activeCategory);
    }

    if (selectedLocation) {
      results = results.filter(n => n.location === selectedLocation);
    }

    return results;
  }, [activeCategory, searchQuery, allNews, selectedLocation]);

  const categoryNewsSlice = useMemo(() => {
    return fullCategoryNews.slice(0, visibleNewsCount);
  }, [fullCategoryNews, visibleNewsCount]);

  // Categories to display on Home page sections - MOVED RECENT TO TOP
  const homepageCategories = [
    Category.RECENT, // High priority section
    Category.TRENDING,
    Category.MAHARASHTRA,
    Category.OUR_DISTRICT,
    Category.AGRICULTURE,
    Category.POLITICAL,
    Category.CRIME,
    Category.WORLD
  ];

  const handleNewsClick = async (news: NewsItem) => {
    setSelectedNews(news);
    setAiSummary(null);
    setIsSummarizing(true);
    const summary = await GeminiService.generateNewsSummary(news.content || news.excerpt);
    setAiSummary(summary);
    setIsSummarizing(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategorySelect = (cat: Category) => {
    setActiveCategory(cat);
    setSelectedNews(null);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadMore = () => {
    setVisibleNewsCount(prev => prev + LOAD_MORE_STEP);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleAdminLogin = () => {
    // This is now handled within the AdminLogin component which will set the token
    setViewState('ADMIN_DASHBOARD');
  };

  const handleLogout = () => {
    localStorage.removeItem('kanosa_auth_token');
    localStorage.removeItem('kanosa_admin');
    setViewState('USER');
  };

  const handleUpdateNews = (updatedNews: NewsItem[]) => {
    setAllNews(updatedNews);
  };

  const currentDateFormatted = new Date().toLocaleDateString('mr-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '.');

  // Conditional Rendering for Admin Panel
  if (viewState === 'ADMIN_DASHBOARD') {
    return <AdminDashboard onLogout={handleLogout} newsData={allNews} onUpdateNews={handleUpdateNews} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">
      {/* Admin Login Modal Overlay */}
      {viewState === 'ADMIN_LOGIN' && (
        <AdminLogin
          onLoginSuccess={handleAdminLogin}
          onCancel={() => setViewState('USER')}
        />
      )}

      {/* Header */}
      <header className="bg-white sticky top-0 z-[80] shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 md:py-6">
          <div className="flex items-center justify-between gap-4 md:gap-12">
            <div className="flex items-center">
              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className={`p-2 md:p-3 transition-all rounded-sm group ${isDrawerOpen ? 'bg-[#E31E24] text-white shadow-lg' : 'bg-gray-50 hover:bg-[#E31E24] hover:text-white'}`}
                aria-label={isDrawerOpen ? "Close menu" : "Open menu"}
              >
                {isDrawerOpen ? <Icons.Close /> : <Icons.Menu />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-sm py-2 px-3 text-[11px] font-black uppercase tracking-wider outline-none focus:border-[#E31E24] transition-all cursor-pointer text-gray-700"
              >
                <option value="">सर्व लोकेशन</option>
                {LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div className="flex-grow md:flex-grow-0 cursor-pointer" onClick={() => handleCategorySelect(Category.HOME)}>
              <Logo />
            </div>

            <div className="hidden md:flex flex-grow max-w-xl">
              <div className="relative w-full group">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="बातमी, जिल्हा किंवा विषय शोधा..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-sm py-3 px-5 pl-12 text-sm font-bold outline-none focus:border-[#E31E24] focus:bg-white transition-all tracking-wide"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#E31E24] transition-colors">
                  <Icons.Search />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="md:hidden">
                <button onClick={() => setIsDrawerOpen(true)} className="text-gray-900 p-2"><Icons.Search /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 bg-white overflow-x-auto no-scrollbar">
          <div className="max-w-screen-2xl mx-auto px-4">
            <nav className="flex lg:flex items-center justify-start gap-x-6 md:gap-x-8 h-[45px] md:h-[50px] whitespace-nowrap">
              <button
                onClick={() => handleCategorySelect(Category.HOME)}
                className={`h-full flex items-center text-[12px] md:text-[13px] font-black uppercase transition-all relative group ${activeCategory === Category.HOME ? 'text-[#E31E24]' : 'text-gray-600 hover:text-[#E31E24]'}`}
              >
                Home
                {activeCategory === Category.HOME && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#E31E24]"></span>}
              </button>

              {[Category.POLITICAL, Category.AGRICULTURE, Category.OUR_DISTRICT, Category.MAHARASHTRA, Category.CRIME, Category.WORLD, Category.TRENDING, Category.RECENT].map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`h-full flex items-center gap-1.5 text-[12px] md:text-[13px] font-black uppercase transition-all relative group ${activeCategory === cat ? 'text-[#E31E24]' : 'text-gray-600 hover:text-[#E31E24]'}`}
                >
                  {cat}
                  <Icons.ChevronDown />
                  {activeCategory === cat && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#E31E24]"></span>}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="bg-black text-white h-[40px] md:h-[45px] w-full flex items-center border-t border-gray-800 overflow-hidden">
          <div className="max-w-screen-2xl mx-auto w-full px-4 flex items-center h-full">
            <div className="text-[10px] font-bold text-gray-400 mr-4 md:mr-8 whitespace-nowrap hidden lg:block uppercase tracking-widest">
              {currentDateFormatted}
            </div>
            <div className="bg-[#E31E24] h-full flex items-center px-4 md:px-6 text-[11px] md:text-[13px] font-black uppercase italic tracking-wide shrink-0">
              ब्रेकिंग
            </div>
            <div className="flex-grow overflow-hidden relative mx-3 md:mx-6 flex items-center">
              <div className="ticker-animate text-[12px] md:text-[13px] font-bold text-white">
                {tickerText}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-gray-400 shrink-0 border-l border-white/10 pl-6">
              <a href="#" className="hover:text-white transition-all transform hover:scale-110"><Icons.Facebook /></a>
              <a href="#" className="hover:text-white transition-all transform hover:scale-110"><Icons.Twitter /></a>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-screen-2xl mx-auto w-full px-4 py-6 md:py-12">
        {selectedNews ? (
          <div className="flex flex-col lg:flex-row-reverse gap-8">
            <div className="lg:w-2/3 bg-white p-5 md:p-12 shadow-sm border border-gray-100 rounded-sm">
              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase mb-4">
                <span className="cursor-pointer hover:text-[#E31E24]" onClick={() => handleCategorySelect(Category.HOME)}>Home</span>
                <span className="opacity-30">/</span>
                <span className="cursor-pointer hover:text-[#E31E24]" onClick={() => handleCategorySelect(selectedNews.category as Category)}>{selectedNews.category}</span>
              </div>
              <h1 className="text-2xl md:text-5xl font-black mb-6 leading-tight text-gray-900 tracking-tight">{selectedNews.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-[10px] md:text-[11px] text-gray-500 font-black uppercase mb-8 border-y border-gray-50 py-4 tracking-wider">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-red-600 rounded-full flex items-center justify-center text-[10px] text-white font-black shadow-md">
                    {selectedNews.author[0]}
                  </div>
                  <span>BY {selectedNews.author.toUpperCase()}</span>
                </div>
                <span className="opacity-20 hidden xs:block">|</span>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{selectedNews.date}</span>
                </div>
              </div>
              <div className="mb-8 md:mb-12 overflow-hidden rounded-sm shadow-xl relative group">
                {selectedNews.videoUrl ? (
                  selectedNews.videoUrl.includes('youtube.com') || selectedNews.videoUrl.includes('youtu.be') ? (
                    <div className="relative aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${selectedNews.videoUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11})(?:[?&]|$)/)?.[1] || ''}`}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                      <a
                        href={selectedNews.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-4 right-4 bg-red-600 text-white p-3 rounded-full shadow-2xl hover:bg-black transition-all flex items-center gap-2 group/yt z-10"
                        title="Watch on YouTube"
                      >
                        <Icons.Youtube />
                        <span className="max-w-0 overflow-hidden group-hover/yt:max-w-xs transition-all duration-300 text-[10px] font-black uppercase whitespace-nowrap">
                          YouTube वर पहा
                        </span>
                      </a>
                    </div>
                  ) : (
                    <video
                      src={ApiService.resolveMediaUrl(selectedNews.videoUrl)}
                      className="w-full aspect-video bg-black"
                      controls
                      autoPlay
                      poster={ApiService.resolveMediaUrl(selectedNews.imageUrl)}
                    />
                  )
                ) : (
                  <img src={ApiService.resolveMediaUrl(selectedNews.imageUrl)} className="w-full object-cover max-h-[500px] md:max-h-[600px]" alt={selectedNews.title} />
                )}
              </div>
              <div className="bg-red-50/50 p-5 md:p-10 mb-8 md:mb-12 border-l-[4px] md:border-l-[6px] border-[#E31E24] rounded-r">
                <h4 className="text-[#E31E24] font-black text-[10px] md:text-xs uppercase mb-3 italic tracking-widest flex items-center gap-2">
                  <span className="animate-bounce">✨</span> AI बातमी सारांश
                </h4>
                <div className="italic text-gray-800 leading-relaxed font-bold text-lg md:text-2xl tracking-tight">
                  {isSummarizing ? (
                    <span className="flex items-center gap-3 opacity-60">
                      <span className="w-2 h-2 bg-[#E31E24] rounded-full animate-ping"></span>
                      मराठी सारांश तयार होत आहे...
                    </span>
                  ) : (aiSummary || "संक्षिप्त सारांश उपलब्ध नाही.")}
                </div>
              </div>
              <div className="prose prose-sm md:prose-xl max-w-none text-gray-700 mb-10 whitespace-pre-wrap leading-relaxed font-medium">
                {selectedNews.content || selectedNews.excerpt}
              </div>
              <button onClick={() => setSelectedNews(null)} className="group flex items-center gap-3 px-8 py-3 bg-black text-white font-black uppercase text-[10px] md:text-xs hover:bg-[#E31E24] transition-all rounded-sm shadow-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                मागे जा
              </button>
            </div>
            <aside className="lg:w-1/3 space-y-8">
              <div className="bg-white p-5 shadow-sm border border-gray-100 rounded-sm">
                <h4 className="text-xs font-black uppercase border-b-[2px] border-black pb-3 mb-6 tracking-widest italic">इतर ताज्या बातम्या</h4>
                <div className="space-y-4">
                  {allNews.filter(n => n.id !== selectedNews.id).slice(0, 8).map(n => (
                    <NewsCard key={n.id} news={n} viewMode="minimal" onClick={handleNewsClick} />
                  ))}
                </div>
              </div>
            </aside>
          </div>
        ) : activeCategory === Category.HOME && !searchQuery ? (
          <div className="space-y-16">
            {/* Iterating through categories to create a homepage layout */}
            {homepageCategories.map((cat) => {
              const categoryArticles = allNews.filter(n => n.category === cat);
              if (categoryArticles.length === 0) return null;

              // Different layout for RECENT (Highlight it)
              const isRecent = cat === Category.RECENT;

              return (
                <section key={cat} className={`${isRecent ? 'bg-red-50/30' : 'bg-white'} p-4 md:p-10 shadow-sm border border-gray-100 rounded-sm transition-all`}>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-8">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-6 md:h-8 ${isRecent ? 'bg-[#E31E24] animate-pulse' : 'bg-[#E31E24]'}`}></div>
                      <h2 className={`text-xl md:text-3xl font-black tracking-tight uppercase italic ${isRecent ? 'text-[#E31E24]' : ''}`}>{cat}</h2>
                      {isRecent && <span className="bg-[#E31E24] text-white text-[8px] md:text-[10px] px-2 py-0.5 font-black uppercase rounded-full animate-bounce">LATEST</span>}
                    </div>
                    <button
                      onClick={() => handleCategorySelect(cat)}
                      className="text-[10px] md:text-[12px] font-black uppercase tracking-widest text-gray-400 hover:text-[#E31E24] transition-colors flex items-center gap-2"
                    >
                      सर्व पहा <span>→</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                    {categoryArticles.slice(0, 6).map(news => (
                      <NewsCard key={news.id} news={news} onClick={handleNewsClick} />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* If there are any other categories not covered in homepageCategories */}
            <section className="bg-gray-50 p-10 rounded-sm border border-gray-100">
              <h3 className="text-center text-sm font-black uppercase text-gray-400 tracking-[0.3em] mb-4 italic">आणखी बातम्या उपलब्ध आहेत</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {Object.values(Category).filter(c => c !== Category.HOME && !homepageCategories.includes(c)).map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    className="px-6 py-2 bg-white border border-gray-200 text-[10px] font-black uppercase rounded-full hover:bg-[#E31E24] hover:text-white transition-all shadow-sm"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row-reverse gap-8 md:gap-12">
            <div className="lg:w-2/3 bg-white p-5 md:p-10 shadow-sm border border-gray-100 rounded-sm">
              <div className="border-b-[2px] border-gray-50 pb-6 mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-[#E31E24]"></div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-gray-900 italic">
                    {searchQuery ? `Search: "${searchQuery}"` : activeCategory}
                  </h2>
                </div>
              </div>

              {categoryNewsSlice.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12 mb-12">
                  {categoryNewsSlice.map(news => (
                    <NewsCard key={news.id} news={news} onClick={handleNewsClick} searchQuery={searchQuery} />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-100 mb-12">
                  <div className="text-4xl mb-4">📰</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">अद्याप कोणतीही बातमी उपलब्ध नाही</h3>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">कानोसा न्यूज पोर्टलवर लवकरच ताज्या बातम्या प्रसिद्ध केल्या जातील. कृपया थोड्या वेळाने पुन्हा भेट द्या.</p>
                </div>
              )}

              {fullCategoryNews.length > visibleNewsCount && (
                <div className="flex justify-center py-6 border-t border-gray-50">
                  <button onClick={handleLoadMore} className="px-10 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#E31E24] transition-all rounded-sm shadow-lg active:scale-95">
                    आणखी बातम्या लोड करा
                  </button>
                </div>
              )}
            </div>
            <aside className="lg:w-1/3 space-y-8">
              <div className="bg-white p-6 shadow-sm border border-gray-100 rounded-sm">
                <h4 className="text-xs font-black uppercase border-b-[2px] border-black pb-3 mb-6 tracking-widest italic">इतर श्रेणी</h4>
                <div className="flex flex-col gap-1">
                  {Object.values(Category).filter(c => c !== Category.HOME).map(cat => (
                    <button
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      className={`text-left py-3 px-4 text-[10px] font-black uppercase transition-all flex items-center justify-between rounded-sm ${activeCategory === cat ? 'bg-[#E31E24] text-white shadow-md' : 'hover:bg-gray-50 text-gray-600 border-b border-gray-50'}`}
                    >
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Back to Top */}
      {showScrollTop && (
        <button onClick={scrollToTop} className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-[#E31E24] text-white p-3 md:p-4 rounded shadow-2xl hover:bg-black transition-all z-50 group">
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" /></svg>
        </button>
      )}

      {/* FOOTER */}
      <footer className="bg-[#080808] text-white pt-16 md:pt-24 pb-12 mt-12 md:mt-20 border-t-8 border-[#E31E24]">
        <div className="max-w-screen-2xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] gap-10 md:gap-16 items-start">

          <div className="space-y-6 md:space-y-10">
            <div className="max-w-[280px]">
              <Logo />
            </div>
            <p className="text-gray-400 text-[14px] md:text-[15px] leading-relaxed font-medium italic pr-0 md:pr-4 opacity-90">
              कानोसा न्यूज पोर्टल हे महाराष्ट्रातील विशेषतः वऱ्हाड पट्ट्यातील ताज्या घडामोडींचे विश्वसनीय व्यासपीठ आहे. आम्ही सत्यता आणि वेळेत बातमी पोहोचवण्यासाठी कटिबद्ध आहोत.
            </p>
          </div>

          <div className="hidden sm:block">
            <h4 className="text-[13px] md:text-[14px] font-black uppercase mb-6 md:mb-10 tracking-widest border-b border-white/10 pb-4 italic text-white flex items-center gap-3">
              <span className="w-2 h-2 bg-[#E31E24]"></span>
              महत्वाचे दुवे
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              {[Category.POLITICAL, Category.AGRICULTURE, Category.OUR_DISTRICT, Category.MAHARASHTRA, Category.CRIME, Category.WORLD].map(c => (
                <button key={c} onClick={() => handleCategorySelect(c)} className="text-left text-[10px] md:text-[11px] text-gray-400 font-black uppercase tracking-widest hover:text-[#E31E24] transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-gray-800 group-hover:bg-[#E31E24] shrink-0"></span>
                  <span className="truncate">{c}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8 md:space-y-10">
            <h4 className="text-[13px] md:text-[14px] font-black uppercase mb-6 md:mb-10 tracking-widest border-b border-white/10 pb-4 italic text-[#E31E24] flex items-center gap-3">
              <span className="w-2 h-2 bg-white"></span>
              संपर्क
            </h4>
            <div className="space-y-6">
              <div className="flex gap-3">
                <span className="text-[#E31E24] shrink-0">📍</span>
                <p className="text-[10px] md:text-[11px] text-gray-400 font-black uppercase leading-relaxed italic tracking-wider">
                  बार्शीटाकळी, जि. अकोला, महाराष्ट्र ४४४४०१.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-[#E31E24] shrink-0">📧</span>
                <p className="text-[10px] md:text-[11px] text-gray-400 font-black tracking-wider italic uppercase">
                  CONTACT@KANOSA.IN
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <a href="#" className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-[#E31E24] transition-all rounded shadow-lg"><Icons.Facebook /></a>
                <a href="#" className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-[#E31E24] transition-all rounded shadow-lg"><Icons.Twitter /></a>
                <a href="#" className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-[#E31E24] transition-all rounded shadow-lg"><Icons.Youtube /></a>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-screen-2xl mx-auto px-4 mt-16 md:mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[8px] md:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em] italic text-center md:text-left">
            © 2026 KANOSA BROADCASTING - वऱ्हाडी मनाचा..!! | ALL RIGHTS RESERVED.
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-[8px] md:text-[9px] text-gray-600 font-black uppercase tracking-widest opacity-40 italic">
              <p>Powered by Gemini AI</p>
            </div>
          </div>
        </div>
      </footer>

      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onCategorySelect={handleCategorySelect}
        onAdminClick={() => {
          setIsDrawerOpen(false);
          setViewState('ADMIN_LOGIN');
        }}
        activeCategory={activeCategory}
      />
    </div>
  );
};

export default App;
