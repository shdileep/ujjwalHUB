
import React from 'react';

export const DynamicLogo: React.FC<{ className?: string; size?: number; animated?: boolean }> = ({ 
  className = "", 
  size = 100,
  animated = true 
}) => {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl overflow-visible">
        <defs>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>
          <linearGradient id="hillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Circular Scenic Background */}
        <circle cx="60" cy="60" r="48" fill="url(#skyGrad)" stroke="#f1f5f9" strokeWidth="2" />
        
        {/* Stylized Hills */}
        <path 
          d="M12,75 Q35,55 60,70 T108,65 L108,108 L12,108 Z" 
          fill="url(#hillGrad)" 
          opacity="0.8"
        />
        <path 
          d="M20,85 Q45,70 70,85 T100,80 L100,108 L20,108 Z" 
          fill="#064e3b" 
          opacity="0.4"
        />

        {/* 2. Trash Bags (Overflowing) */}
        <g className={animated ? "animate-bounce" : ""}>
          <path d="M40,55 Q45,35 55,45 Q65,25 75,40 Q85,30 90,45" fill="none" stroke="#94a3b8" strokeWidth="12" strokeLinecap="round" opacity="0.6" />
          <path d="M42,50 Q50,40 58,50" fill="#e2e8f0" />
          <path d="M60,45 Q68,30 76,45" fill="#f8fafc" />
          <path d="M78,48 Q85,35 92,48" fill="#cbd5e1" />
        </g>

        {/* 3. The Garbage Truck */}
        <g transform="translate(15, 45) scale(0.7)" filter="url(#shadow)">
          {/* Main Chassis */}
          <rect x="25" y="55" width="105" height="8" rx="2" fill="#1e293b" />
          
          {/* Green Compactor (Back) */}
          <path 
            d="M25,25 Q25,15 35,15 L105,15 Q115,15 115,25 L115,60 L25,60 Z" 
            fill="#166534" 
            stroke="#064e3b" 
            strokeWidth="1.5"
          />
          <path 
            d="M25,20 L115,20" 
            fill="none" 
            stroke="#15803d" 
            strokeWidth="3" 
            opacity="0.5"
          />

          {/* White Cab (Front) */}
          <path 
            d="M110,60 L145,60 L145,45 L135,25 L110,25 Z" 
            fill="white" 
            stroke="#334155" 
            strokeWidth="1"
          />
          {/* Cab Window */}
          <path d="M125,30 L138,30 L142,45 L125,45 Z" fill="#94a3b8" opacity="0.3" />
          {/* Cab Details */}
          <rect x="140" y="48" width="5" height="1.5" fill="#334155" />
          <rect x="140" y="52" width="5" height="1.5" fill="#334155" />
          
          {/* Recycling Symbol on Compactor */}
          <g transform="translate(60, 25) scale(0.18)" fill="white">
            <path d="M50,0 L65,25 L35,25 Z M85,60 L100,85 L70,85 Z M15,60 L30,85 L0,85 Z" opacity="0.9" />
            <path d="M45,30 L75,30 L60,55 Z" opacity="0.5" />
          </g>

          {/* Wheels */}
          <circle cx="45" cy="65" r="9" fill="#1e293b" />
          <circle cx="45" cy="65" r="4" fill="#64748b" />
          
          <circle cx="85" cy="65" r="9" fill="#1e293b" />
          <circle cx="85" cy="65" r="4" fill="#64748b" />
          
          <circle cx="125" cy="65" r="9" fill="#1e293b" />
          <circle cx="125" cy="65" r="4" fill="#64748b" />
          
          {/* Headlight */}
          <rect x="143" y="48" width="2" height="4" rx="1" fill="#fbbf24" className={animated ? "animate-pulse" : ""} />
        </g>

        {/* 4. Foliage Accents (Foreground) */}
        <path d="M5,100 Q15,85 25,100" fill="#065f46" />
        <path d="M100,95 Q110,80 120,95" fill="#065f46" />
      </svg>
    </div>
  );
};
