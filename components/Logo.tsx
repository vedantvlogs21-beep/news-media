
import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="bg-[#E31E24] h-[60px] md:h-[75px] w-full md:w-auto md:min-w-[400px] text-white flex items-center shadow-2xl relative overflow-hidden group transition-all hover:brightness-110">
      {/* Glossy Overlay for a professional broadcast look */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"></div>
      
      {/* Left Signal Section */}
      <div className="flex items-center justify-center px-3 md:px-6 bg-black/10 h-full">
        <div className="flex gap-[2px] md:gap-[3px] items-center relative">
          <span className="text-lg md:text-2xl font-black opacity-40 animate-pulse">(</span>
          <span className="text-lg md:text-2xl font-black opacity-70 animate-pulse delay-75">(</span>
          <span className="text-lg md:text-2xl font-black animate-pulse delay-150">(</span>
        </div>
      </div>

      {/* Main Text Section */}
      <div className="flex items-center px-3 md:px-6 gap-3 md:gap-6 h-full flex-grow">
        <span className="text-[22px] md:text-[36px] font-black uppercase tracking-tighter leading-none italic drop-shadow-md whitespace-nowrap">
          कानोसा
        </span>
        
        {/* Vertical Divider */}
        <div className="w-[1px] h-1/2 bg-white/30"></div>
        
        {/* Tagline Section */}
        <div className="flex flex-col justify-center overflow-hidden">
          <div className="text-[9px] md:text-[13px] font-black tracking-[0.05em] md:tracking-[0.15em] uppercase whitespace-nowrap italic opacity-90 leading-tight">
            वऱ्हाडी मनाचा..!!
          </div>
          <div className="text-[7px] md:text-[8px] font-bold tracking-[0.2em] md:tracking-[0.3em] uppercase opacity-50 hidden sm:block">
            BROADCASTING LIVE
          </div>
        </div>
      </div>
      
      {/* Right Accent - News Ribbons Style */}
      <div className="absolute right-0 top-0 h-full w-1 md:w-2 bg-white/10"></div>
    </div>
  );
};

export default Logo;
