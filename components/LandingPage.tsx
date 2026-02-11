
import React, { useState, useEffect } from 'react';
import { Moon, Sun, ArrowRight, CheckCircle2, Users, Smartphone, Watch, Zap, Calendar } from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const [isDark, setIsDark] = useState(false);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // SVG Helper for Arcs
  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  // Custom Logo Component
  const TodoyLogo = ({ className = "" }: { className?: string }) => (
    <span className={`font-black tracking-tight inline-flex items-baseline ${className}`} style={{ fontFamily: '"Rounded Mplus 1c", "Varela Round", sans-serif' }}>
      <span className="text-[#6366f1]">t</span>
      <span className="text-[#818cf8]">o</span>
      <span className="text-[#facc15]">d</span>
      <span className="text-[#f43f5e]">o</span>
      <span className="text-[#a78bfa]">y</span>
    </span>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
      
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div className="flex items-center gap-2 select-none cursor-pointer" onClick={onEnterApp}>
          <TodoyLogo className="text-3xl" />
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDark(!isDark)}
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-yellow-300' : 'hover:bg-slate-100 text-slate-400'}`}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={onEnterApp}
            className={`hidden sm:block px-6 py-2 rounded-full font-bold transition-transform hover:scale-105 ${isDark ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}
          >
            Open 2026 Planner
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative w-full px-6 pt-16 pb-24 sm:pt-32 sm:pb-40 flex flex-col items-center text-center overflow-hidden">
        
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10">
           <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <circle cx="10" cy="20" r="30" fill="#6366f1" filter="url(#blur)" />
             <circle cx="90" cy="80" r="40" fill="#a78bfa" filter="url(#blur)" />
             <circle cx="50" cy="50" r="20" fill="#facc15" filter="url(#blur)" />
             <defs>
               <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
                 <feGaussianBlur in="SourceGraphic" stdDeviation="15" />
               </filter>
             </defs>
           </svg>
        </div>

        <div className="relative z-10 max-w-4xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-sm">
            <Calendar size={16} />
            Family Year Planner 2026
          </div>

          <div className="mb-8 transform hover:scale-105 transition-transform duration-500 cursor-default select-none">
            <TodoyLogo className="text-[8rem] sm:text-[10rem] md:text-[12rem] leading-none drop-shadow-sm" />
          </div>

          <p className={`text-xl sm:text-2xl mb-12 max-w-2xl font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
            Plan your entire 2026 with ease. <br/>
            Visual rhythms for your family's biggest goals.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
            <button 
              onClick={onEnterApp}
              className="px-8 py-4 rounded-full text-lg font-bold shadow-xl transition-all hover:scale-105 hover:shadow-2xl bg-indigo-600 text-white flex items-center justify-center gap-3"
            >
              Start Planning 2026 <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Dials Showcase */}
      <section id="features" className={`py-24 ${isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Every month, visualized.</h2>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} max-w-xl mx-auto`}>
              Move through 2026 with confidence. Use AI to scaffold your projects and track progress visually.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-16 md:gap-8">
            <div className="flex flex-col items-center group">
              <div className="relative w-64 h-64 mb-8 transition-transform group-hover:scale-105 duration-500">
                 <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity bg-indigo-400`}></div>
                 <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl relative z-10">
                    <circle cx="100" cy="100" r="90" fill={isDark ? "#1e293b" : "white"} />
                    <circle cx="100" cy="100" r="80" fill="none" stroke={isDark ? "#334155" : "#f1f5f9"} strokeWidth="12" />
                    <path d={describeArc(100, 100, 80, 0, 90)} stroke="#6366f1" strokeWidth="12" fill="none" strokeLinecap="round" className="animate-pulse" />
                    <text x="100" y="105" textAnchor="middle" dominantBaseline="middle" className={`text-2xl font-bold ${isDark ? 'fill-white' : 'fill-slate-800'}`}>09:00</text>
                 </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <span className="text-indigo-600">1.</span> Goals
              </h3>
              <p className={`text-center px-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Define your family projects for 2026. Health, home, or hobby.
              </p>
            </div>

            <div className="flex flex-col items-center group">
              <div className="relative w-64 h-64 mb-8 transition-transform group-hover:scale-105 duration-500">
                 <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity bg-purple-400`}></div>
                 <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl relative z-10">
                    <circle cx="100" cy="100" r="90" fill={isDark ? "#1e293b" : "white"} />
                    <circle cx="100" cy="100" r="80" fill="none" stroke={isDark ? "#334155" : "#f1f5f9"} strokeWidth="12" />
                    <path d={describeArc(100, 100, 80, 180, 300)} stroke="#a78bfa" strokeWidth="12" fill="none" strokeLinecap="round" />
                    <line x1="100" y1="100" x2="60" y2="140" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="100" cy="100" r="6" fill="#f43f5e" />
                 </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <span className="text-[#a78bfa]">2.</span> AI Helper
              </h3>
              <p className={`text-center px-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Let Gemini build your schedule. It understands your constraints and family needs.
              </p>
            </div>

            <div className="flex flex-col items-center group">
              <div className="relative w-64 h-64 mb-8 transition-transform group-hover:scale-105 duration-500">
                 <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity bg-green-400`}></div>
                 <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl relative z-10">
                    <circle cx="100" cy="100" r="90" fill={isDark ? "#1e293b" : "white"} />
                    <path d={describeArc(100, 100, 80, 0, 360)} stroke="#34d399" strokeWidth="8" fill="none" strokeLinecap="round" className="opacity-20" />
                    <CheckCircle2 size={64} className="text-[#34d399] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                 </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <span className="text-[#34d399]">3.</span> Yearly Flow
              </h3>
              <p className={`text-center px-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Track your progress month by month. See your year come to life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-center">
         <div className="flex justify-center mb-8">
            <TodoyLogo className="text-4xl" />
         </div>
         <p className={`text-sm mb-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
           Your 2026 Year Planner. Designed for Families.
         </p>
      </footer>
    </div>
  );
};
