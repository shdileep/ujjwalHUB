import React, { useEffect, useState } from 'react';

interface Props {
    userName?: string;
}

export const Splash: React.FC<Props> = ({ userName }) => {
    const [showText, setShowText] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowText(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center overflow-hidden z-50">
            <style>{`
        /* --- Truck Movement (Slow & Controlled) --- */
        @keyframes slow-drive {
          0% { transform: translateX(-120vw); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(120vw); opacity: 0; }
        }
        .animate-slow-drive {
          animation: slow-drive 3.5s linear forwards; /* 0.5s delay + 3.5s duration = 4s total timeline approx */
          animation-delay: 0.5s;
        }
        
        /* --- Wheel Hyper Spin --- */
        @keyframes hyper-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-hyper-spin {
          animation: hyper-spin 0.2s linear infinite; /* Extremely fast */
        }
        
        /* --- Flame Pulse (Dual Tone) --- */
        @keyframes flame-pulse-orange {
          0% { transform: scale(1) skewX(0deg); opacity: 0.8; }
          50% { transform: scale(1.2) skewX(-10deg); opacity: 1; }
          100% { transform: scale(0.9) skewX(5deg); opacity: 0.9; }
        }
         @keyframes flame-pulse-blue {
          0% { transform: scale(1) skewX(0deg); opacity: 0.6; }
          50% { transform: scale(1.3) skewX(-15deg); opacity: 0.9; }
          100% { transform: scale(0.95) skewX(5deg); opacity: 0.7; }
        }
        .animate-flame-orange { animation: flame-pulse-orange 0.1s infinite alternate; transform-origin: right center; }
        .animate-flame-blue { animation: flame-pulse-blue 0.15s infinite alternate-reverse; transform-origin: right center; }

        /* --- Sparks --- */
         @keyframes spark-fly {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-40px, -20px) scale(0); opacity: 0; }
        }
        .animate-spark {
            animation: spark-fly 0.5s linear infinite;
        }

        /* --- Background Pulse --- */
        @keyframes bg-pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.5; }
        }
        .animate-bg-pulse {
            animation: bg-pulse 4s ease-in-out infinite;
        }
      `}</style>

            {/* Background - Deep Dark Gradient (Navy -> Black) */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0f172a] to-black"></div>

            {/* Subtle City Silhouette / Horizon Glow */}
            <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none"></div>
            <div className="absolute bottom-[20%] left-0 w-full h-[1px] bg-blue-500/20 box-shadow-[0_0_20px_rgba(59,130,246,0.2)]"></div>

            {/* Content Container */}
            <div className={`relative z-10 flex flex-col items-center text-center transition-all duration-1000 ease-out transform ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

                <h1 className="text-6xl md:text-8xl font-black tracking-tight text-white mb-2 drop-shadow-[0_0_25px_rgba(255,100,0,0.3)] uppercase font-sans">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-red-500 to-orange-600">Ujjwal</span>
                    <span className="text-slate-200">Hub</span>
                </h1>

                {userName ? (
                    <div className="space-y-2">
                        <p className="text-sm md:text-md font-black text-white tracking-[0.2em] uppercase">
                            DEAR <span className="text-orange-500">{userName}</span>, PLEASE WAIT...
                        </p>
                        <p className="text-[10px] font-bold text-blue-400 tracking-[0.4em] uppercase animate-pulse">
                            ALMOST THERE, SYNCING YOUR DASHBOARD
                        </p>
                    </div>
                ) : (
                    <p className="text-xs md:text-sm font-bold text-blue-400 tracking-[0.5em] uppercase shadow-black drop-shadow-md animate-pulse">
                        Smart Waste Architecture
                    </p>
                )}
            </div>

            {/* Truck Animation Container */}
            <div className="absolute bottom-[15%] left-0 w-full flex items-center h-48 pointer-events-none overflow-visible z-20">

                <div className="absolute left-0 animate-slow-drive w-[320px] h-[140px] will-change-transform">

                    {/* Dual-Tone Flame Trails (Rear) */}
                    <div className="absolute top-[40px] left-[-60px] z-0 flex flex-col gap-1 mix-blend-screen">
                        {/* Exhaust Flames */}
                        <Flame color="#3b82f6" className="w-32 h-10 animate-flame-blue opacity-90 blur-[1px]" />
                        <Flame color="#f97316" className="w-40 h-12 -mt-6 animate-flame-orange opacity-80 blur-[2px]" />
                    </div>

                    {/* The Truck SVG */}
                    <svg viewBox="0 0 320 140" className="w-full h-full drop-shadow-2xl">

                        {/* Motion Lines (Speed Effect) */}
                        <path d="M20,20 L-100,20" stroke="rgba(59,130,246,0.3)" strokeWidth="1" />
                        <path d="M40,120 L-80,120" stroke="rgba(249,115,22,0.3)" strokeWidth="2" />

                        {/* Chassis */}
                        <path d="M50,90 L270,90 L270,105 L50,105 Z" fill="#0f172a" />

                        {/* Compactor Unit (Main Body) - Dark Metallic Green/Blue */}
                        <path d="M40,40 L220,40 L220,90 L40,90 L30,65 Z" fill="#064e3b" stroke="#065f46" strokeWidth="1" />
                        <path d="M45,45 L215,45 L215,85 L45,85 Z" fill="url(#compactorGrad)" opacity="0.9" />

                        {/* Tech Highlights / Glow Lines */}
                        <path d="M55,50 L110,50" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
                        <path d="M55,60 L90,60" stroke="#4ade80" strokeWidth="1" opacity="0.5" />
                        <circle cx="200" cy="55" r="3" fill="#ef4444" className="animate-ping" />

                        {/* Cab - Futuristic Silver/White */}
                        <path d="M220,90 L290,90 L300,70 L280,35 L220,35 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />

                        {/* Window - Electric Blue Tint */}
                        <path d="M230,45 L270,45 L285,70 L230,70 Z" fill="#3b82f6" opacity="0.6" />

                        {/* Wheels Assembly (Group for Spin) */}
                        <g>
                            {/* Front Wheel */}
                            <foreignObject x="235" y="85" width="50" height="50">
                                <div className="w-[40px] h-[40px] rounded-full border-[3px] border-slate-700 bg-slate-900 relative flex items-center justify-center animate-hyper-spin overflow-hidden shadow-[0_0_15px_rgba(249,115,22,0.6)]">
                                    <div className="absolute inset-0 border-[2px] border-orange-500/50 rounded-full animate-ping"></div>
                                    <div className="w-full h-[2px] bg-slate-500 absolute top-1/2 left-0 -translate-y-1/2"></div>
                                    <div className="h-full w-[2px] bg-slate-500 absolute left-1/2 top-0 -translate-x-1/2"></div>
                                    <div className="w-3 h-3 bg-slate-400 rounded-full z-10"></div>
                                </div>
                            </foreignObject>

                            {/* Rear Wheel */}
                            <foreignObject x="80" y="85" width="50" height="50">
                                <div className="w-[40px] h-[40px] rounded-full border-[3px] border-slate-700 bg-slate-900 relative flex items-center justify-center animate-hyper-spin overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                                    <div className="absolute inset-0 border-[2px] border-blue-500/50 rounded-full animate-ping"></div>
                                    <div className="w-full h-[2px] bg-slate-500 absolute top-1/2 left-0 -translate-y-1/2"></div>
                                    <div className="h-full w-[2px] bg-slate-500 absolute left-1/2 top-0 -translate-x-1/2"></div>
                                    <div className="w-3 h-3 bg-slate-400 rounded-full z-10"></div>
                                </div>
                            </foreignObject>
                        </g>

                        {/* Ground Reflection */}
                        <ellipse cx="100" cy="130" rx="30" ry="4" fill="#3b82f6" opacity="0.4" filter="blur(4px)" />
                        <ellipse cx="255" cy="130" rx="30" ry="4" fill="#f97316" opacity="0.4" filter="blur(4px)" />

                        <defs>
                            <linearGradient id="compactorGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#065f46" />
                                <stop offset="50%" stopColor="#0f766e" />
                                <stop offset="100%" stopColor="#115e59" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Sparks Particles - Front Wheel */}
                    <div className="absolute bottom-[10px] left-[255px] z-30">
                        {[...Array(5)].map((_, i) => (
                            <div key={`spark-f-${i}`} className="absolute w-[2px] h-[2px] bg-white rounded-full animate-spark" style={{ animationDelay: `${Math.random() * 0.5}s`, left: `${Math.random() * 10}px`, top: `${Math.random() * 5}px` }}></div>
                        ))}
                    </div>

                    {/* Sparks Particles - Rear Wheel */}
                    <div className="absolute bottom-[10px] left-[100px] z-30">
                        {[...Array(5)].map((_, i) => (
                            <div key={`spark-r-${i}`} className="absolute w-[2px] h-[2px] bg-orange-200 rounded-full animate-spark" style={{ animationDelay: `${Math.random() * 0.5}s`, left: `${Math.random() * 10}px`, top: `${Math.random() * 5}px` }}></div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

const Flame = ({ className, color }: { className?: string; color: string }) => (
    <svg viewBox="0 0 100 60" className={className} preserveAspectRatio="none">
        <path d="M100,30 Q80,10 50,20 T10,30 T50,40 T90,30 Z" fill={color} style={{ filter: 'blur(4px)' }} opacity="0.6" />
        <path d="M90,30 Q70,20 50,25 T20,30 T50,35 T80,30 Z" fill={color} opacity="0.9" style={{ filter: 'blur(1px)' }} />
    </svg>
);
