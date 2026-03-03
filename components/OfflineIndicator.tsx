import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showRestored, setShowRestored] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowRestored(true);
            setTimeout(() => setShowRestored(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowRestored(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline && !showRestored) return null;

    return (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl transition-all duration-500 ${!isOnline ? 'bg-slate-900 text-white translate-y-0' : 'bg-green-500 text-white translate-y-0 animate-in slide-in-from-bottom-5'
            }`}>
            {!isOnline ? (
                <>
                    <WifiOff size={18} className="animate-pulse" />
                    <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-widest">Offline Mode</span>
                        <span className="text-[9px] font-bold opacity-70">Changes will sync when reconnected</span>
                    </div>
                </>
            ) : (
                <>
                    <Wifi size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Connection Restored</span>
                </>
            )}
        </div>
    );
};
