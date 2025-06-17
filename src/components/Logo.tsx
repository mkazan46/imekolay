import React from 'react';

const Logo = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg relative overflow-hidden group transition-all duration-300 hover:shadow-primary/30 hover:scale-105">
        {/* Arka plan deseni */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-shimmer"></div>
        </div>
        
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-14 h-14 text-white relative z-10 transform group-hover:scale-110 transition-transform duration-300"
        >
          {/* Ana bina yapısı */}
          <path d="M2,21 H22" strokeWidth="2" className="stroke-white" />
          <path d="M4,21 V12 H20 V21" strokeWidth="2" className="stroke-white" />
          
          {/* Çatı */}
          <path d="M3,12 L12,4 L21,12" strokeWidth="2" className="stroke-white" />
          
          {/* Bayrak direği */}
          <path d="M12,2 V4" strokeWidth="2" className="stroke-white" />
          <path d="M11,3 L13,3 L13,2 L11,2 Z" className="fill-white" />
          
          {/* Pencereler */}
          <rect x="7" y="14" width="4" height="3" className="stroke-white fill-white/20" strokeWidth="1" />
          <rect x="13" y="14" width="4" height="3" className="stroke-white fill-white/20" strokeWidth="1" />
          
          {/* Kapı */}
          <path d="M10,21 V17 H14 V21" strokeWidth="2" className="stroke-white" />
          <circle cx="13" cy="19" r="0.5" className="fill-white" />
          
          {/* MESEM Yazısı */}
          <path d="M7,8 L17,8" strokeWidth="2" className="stroke-white" />
          <path d="M8,6 L16,6" strokeWidth="2" className="stroke-white" />
          
          {/* Merdiven basamakları */}
          <path d="M8,21 H16" strokeWidth="1.5" className="stroke-white" />
          <path d="M9,20 H15" strokeWidth="1.5" className="stroke-white" />
        </svg>
        
        {/* Işık efekti */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
    </div>
  );
};

export default Logo;
