import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Activity, Check, CheckCircle2, Clock, Compass, MapPin, Minus, Navigation, Plus, Truck, Zap } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import { AREA_COMPONENT_MAPPING } from '../../constants/areas';
import { KANDIGAI_BINS, KANDIGAI_TRAFFIC_SIGNALS, MSW_DUMP_YARD } from '../../constants/kandigaiData'; // v35 Import
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import { databaseService } from '../../services/database.service';
import { AppState, Bin } from '../../types';
import { getSpecialAreaBins } from '../../utils/binRandomizer';
import { performKMeans } from '../../utils/clustering';

// Traffic Signal Locations (VIT -> Chrompet) - Precise GST Coordinates (On Road)
const TRAFFIC_SIGNALS = [
  { id: 'sig_1', name: 'Vandalur Junction', coords: { lat: 12.8925, lng: 80.0820 }, wait: '~120s' }, // Corrected: Exact GST/Vandalur Rd Junction
  { id: 'sig_5', name: 'Vandalur Zoo Ent.', coords: { lat: 12.8875, lng: 80.0830 }, wait: '~30s' },  // Corrected: Zoo Entry Main Gate
  { id: 'sig_2', name: 'Irumbuliyur Cross', coords: { lat: 12.9195, lng: 80.1110 }, wait: '~60s' },  // Corrected: Bypass Junction
  { id: 'sig_3', name: 'Tambaram Main Sig', coords: { lat: 12.9255, lng: 80.1165 }, wait: '~90s' },  // Corrected: Near Hindu Mission
  { id: 'sig_4', name: 'Chrompet MIT/Pond', coords: { lat: 12.9530, lng: 80.1415 }, wait: '~40s' },  // Corrected: Near MIT Bridge
];

interface Props {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

// -- LEAFLET ICON FIXES --
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

const DEFAULT_CENTER = { lat: 12.835, lng: 80.170 }; // KANDIGAI HUB (Fixed)
const CHENNAI_OFFICE = { lat: 13.0827, lng: 80.2707, label: "Municipal Office" };

const buildingIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2942/2942944.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});



const DUMP_YARD_TAMBARAM = {
  lat: 12.9229,
  lng: 80.1274,
  label: "Tambaram Dump Yard"
};

const DUMP_YARD_PORUR = {
  lat: 13.0335,
  lng: 80.1578,
  label: "Porur Dump Yard"
};

// --- MAP VIEW FOLLOWER (Ensures live GPS tracking) ---
const MapFollower = ({ center, active }: { center: { lat: number; lng: number }; active: boolean }) => {
  const map = useMap();
  useEffect(() => {
    if (active) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, active, map]);
  return null;
};

const KANDIGAI_START_POINT = { lat: 12.8350, lng: 80.1700 };

const truckIcon = new L.DivIcon({
  className: 'truck-marker',
  html: `<div class="w-10 h-10 bg-indigo-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center relative z-50">
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
           <div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const getTrafficStatus = () => {
  const r = Math.random();
  if (r > 0.7) return { label: 'Heavy', color: 'text-rose-500' };
  if (r > 0.4) return { label: 'Moderate', color: 'text-amber-500' };
  return { label: 'Light', color: 'text-emerald-500' };
};

const getBinIconSvg = (status: Bin['status'], isFlagged: boolean = false, size: number = 32) => {
  let bgColor = '#065f46'; // Fully Dark Green for Empty
  if (status === 'Full') bgColor = '#991b1b'; // Dark Red
  if (status === 'Half Full' || status === 'Half-Full') bgColor = '#f97316'; // Orange
  if (status === 'Completed') bgColor = '#3b82f6'; // Blue
  if (isFlagged) bgColor = '#ef4444'; // Red Flag override

  // CLASSIC BIN ICON (White Icon on Colored Circle)
  return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
    </filter>

    <!-- Colored Background Circle -->
    <circle cx="16" cy="16" r="14" fill="${bgColor}" stroke="white" stroke-width="2" filter="url(#shadow)" />

    <!-- White Trash Icon -->
    <g transform="translate(6, 6) scale(0.8)">
      <path d="M3 6H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M19 6V20C19 21 18 22 17 22H7C6 22 5 21 5 20V6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 6V4C8 3 9 2 10 2H14C15 2 16 3 16 4V6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="10" y1="11" x2="10" y2="17" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <line x1="14" y1="11" x2="14" y2="17" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </g>
  </svg>`;
};
// Custom Unique Recycle Icon for Dump Yard
const getDumpYardIconSvg = (size: number = 48) => {
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
    '<linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">' +
    '<stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />' +
    '<stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />' +
    '</linearGradient>' +
    '<filter id="shadow_dump">' +
    '<feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.5"/>' +
    '</filter>' +
    '</defs>' +
    '<rect x="10" y="10" width="80" height="80" rx="20" fill="url(#grad1)" filter="url(#shadow_dump)" stroke="white" stroke-width="2"/>' +
    '<g transform="translate(50, 50) scale(1.8) translate(-12, -12)">' +
    '<path d="M 12 2 L 15 8 L 9 8 Z M 16 8 L 22 19 L 19 19 L 14 9 Z M 8 8 L 13 19 L 10 19 L 2 19 L 5 13 Z M 10 20 L 14 20 L 12 24 Z" fill="#4ade80" stroke="none" />' +
    '<path d="M12 3 L14 7 H10 M15.5 8 L20 18 H17 L13 9 M8.5 8 L4 18 H7 L11 9 M11 19 L13 19 L12 21" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />' +
    '<path d="M8 8 L4 16 M16 8 L20 16 M12 20 L12 23" stroke="#22c55e" stroke-width="2" stroke-linecap="round" />' +
    '</g>' +
    '</svg>';
};

const dumpYardIcon = new L.DivIcon({
  className: 'dump-yard-marker',
  html: `<div class="hover:scale-110 transition-all duration-300">
          <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" fill="#0f172a" stroke="#4ade80" stroke-width="4"/>
            <path d="M50 25L58 41H42L50 25Z" fill="#4ade80"/>
            <path d="M58 45L66 61H50L58 45Z" fill="#4ade80"/>
            <path d="M42 45L50 61H34L42 45Z" fill="#4ade80"/>
            <path d="M50 65L58 81H42L50 65Z" fill="#4ade80"/>
            <path d="M30 35H70M30 65H70" stroke="#4ade80" stroke-width="2" stroke-dasharray="4 4"/>
          </svg>
        </div>`,
  iconSize: [60, 60],
  iconAnchor: [30, 60],
  popupAnchor: [0, -60]
});

const signalIcon = new L.DivIcon({
  className: 'bg-transparent border-0',
  html: `<div class="w-12 h-24 flex items-center justify-center animate-in fade-in duration-500 drop-shadow-2xl hover:scale-105 transition-transform" style="background: transparent;">
           <svg viewBox="0 0 100 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
             <!-- Pole -->
             <rect x="42" y="160" width="16" height="70" fill="#334155" />
             <!-- Main Box -->
             <rect x="25" y="10" width="50" height="150" rx="15" fill="#1e293b" stroke="#0f172a" stroke-width="4"/>
             <!-- Hoods -->
             <path d="M 20 45 Q 50 15 80 45" fill="none" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
             <path d="M 20 90 Q 50 60 80 90" fill="none" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
             <path d="M 20 135 Q 50 105 80 135" fill="none" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
             <!-- Lights -->
             <circle cx="50" cy="45" r="14" fill="#ef4444" />
             <circle cx="50" cy="90" r="14" fill="#f59e0b" />
             <circle cx="50" cy="135" r="14" fill="#22c55e" />
             <!-- Light Glare (Glass Effect) -->
             <circle cx="46" cy="41" r="4" fill="#ffffff" fill-opacity="0.5" />
             <circle cx="46" cy="86" r="4" fill="#ffffff" fill-opacity="0.5" />
             <circle cx="46" cy="131" r="4" fill="#ffffff" fill-opacity="0.5" />
           </svg>
         </div>`,
  iconSize: [48, 96],
  iconAnchor: [24, 96]
});

// Custom Unique Recycle Icon for Dump Yard
const recycleIcon = new L.DivIcon({
  className: 'recycle-marker',
  html: `<div class="w-16 h-16 bg-white border-2 border-slate-200 rounded-full shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 overflow-hidden">
           <img src="/new-recycle-sign.png" class="w-full h-full object-cover" alt="Dump Yard" />
         </div>`,
  iconSize: [64, 64],
  iconAnchor: [32, 32],
  popupAnchor: [0, -32]
});

// -- HELPER COMPONENTS --

const MapInvalidator = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);
  return null;
};

const RecenterMap = ({ center, zoom }: { center: { lat: number, lng: number }, zoom?: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom || map.getZoom());
  }, [center, zoom, map]);
  return null;
};

const LiveAutoCenter = ({ center, active }: { center: { lat: number, lng: number }, active: boolean }) => {
  const map = useMap();
  useEffect(() => {
    if (active) {
      map.panTo(new L.LatLng(center.lat, center.lng), { animate: true });
    }
  }, [center.lat, center.lng, active, map]);
  return null;
};

const MapActionControls = () => {
  const map = useMap();
  return (
    <div className="absolute left-4 bottom-4 z-[1000] flex flex-col items-center p-1 bg-white/90 backdrop-blur-md rounded-xl border border-white/20 shadow-xl gap-2">
      <button
        onClick={(e) => { e.stopPropagation(); map.zoomIn(); }}
        className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-95"
      >
        <Plus size={16} strokeWidth={3} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          // Reset North functionality placeholder
        }}
        className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all active:scale-95"
      >
        <Compass size={16} strokeWidth={3} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); map.zoomOut(); }}
        className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-95"
      >
        <Minus size={16} strokeWidth={3} />
      </button>
    </div>
  );
};

export const DriverTasks: React.FC<Props> = ({ state, updateState }) => {
  console.log("DriverTasks Component Rendering...", state);

  // Dynamic Dump Yard Logic
  const dumpYard = useMemo(() => {
    if (state.user?.location === 'Adambakkam') {
      return { ...DUMP_YARD_PORUR, label: "PORUR DUMP YARD" };
    }
    // SMART ROUTING: Both Kandigai and West Chengalpattu (since they are adjacent) should go to the local MSW Tambaram Dump Yard
    if (state.user?.location === 'Kandigai' || state.user?.location === 'West Chengalpattu') {
      return { ...MSW_DUMP_YARD.coordinates, label: "MSW dump yard, Tambaram Municipality" };
    }
    return { ...DUMP_YARD_TAMBARAM, label: "Tambaram dump yard" };
  }, [state.user?.location]);

  const [showRoute, setShowRoute] = useState(false);
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  const [splashActive, setSplashActive] = useState(false);
  const [countDown, setCountDown] = useState(5);
  const [driverLocation, setDriverLocation] = useState(DEFAULT_CENTER);
  const [hasGPS, setHasGPS] = useState(false);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [pendingConfirmId, setPendingConfirmId] = useState<string | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [assessmentActive, setAssessmentActive] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [bearing, setBearing] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null); // New: User-facing GPS errors
  const [trafficSegments, setTrafficSegments] = useState<{ path: [number, number][], color: string }[]>([]);

  // Load assessment state
  useEffect(() => {
    const loadAssessment = async () => {
      if (state.user?.location) {
        const settings = await databaseService.getAreaSettings(state.user.location);
        setAssessmentActive(settings.assessmentActive || false);
      }
    };
    loadAssessment();
    const interval = setInterval(loadAssessment, 5000); // Poll every 5s for real-time toggle
    return () => clearInterval(interval);
  }, [state.user?.location]);
  // --- REBUILT double-tap refs (simple & reliable) ---
  const firstTapRef = useRef<Record<string, number>>({}); // binId -> timestamp of first tap
  const firstTapTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({}); // binId -> reset timer
  const completingRef = useRef<Set<string>>(new Set()); // prevents re-entry
  const hasShownSplash = useRef(false);

  const currentUserEmployeeId = state.user?.employeeId;

  // Derived Data: ALL BINS
  const allBins = useMemo(() => {
    const locRaw = (state.user?.location || '').trim();
    const locLower = locRaw.toLowerCase();

    if (locLower === 'kandigai') {
      const baseBins = KANDIGAI_BINS
        .map(b => {
          const liveBin = state.bins?.find(lb => lb.id === b.id);
          return liveBin ? { ...b, ...liveBin } : b;
        });

      if (assessmentActive) return baseBins;

      // GEOGRAPHIC SPLITTING: Divide 46 hubs among drivers geographically
      // Priority check: state.driversHub (Online) -> state.drivers (All)
      const primaryDrivers = state.driversHub
        .filter(h => (h.personnelIdentity?.location || '').toLowerCase().includes('kandigai'))
        .map(h => h.driverId);

      const allKandigaiDriversFromGlobal = state.drivers
        ?.filter(d => (d.location || '').toLowerCase().includes('kandigai'))
        .map(d => d.driverId) || [];

      // Merge and deduplicate to ensure we catch ALL active drivers in the hub
      const areaDrivers = Array.from(new Set([...primaryDrivers, ...allKandigaiDriversFromGlobal]))
        .sort((a, b) => a.localeCompare(b));

      const userId = state.user?.employeeId || '';
      // If there are 2+ drivers (Global or Hub level), perform the split
      if (areaDrivers.length >= 2) {
        const actualDrivers = areaDrivers.includes(userId) ? areaDrivers : [...areaDrivers, userId].sort();
        const driverIdx = actualDrivers.indexOf(userId);
        const clusters = performKMeans(baseBins, actualDrivers.length);
        return clusters.get(driverIdx) || baseBins;
      }

      return baseBins;
    }

    const bins = state.bins && state.bins.length > 0 ? state.bins : [];

    if (!locRaw || locLower === 'total' || locLower === 'chennai' || locLower === 'all') {
      // For 'Total' view, we must include all live bins + all static Kandigai bins (merged)
      const mergedKandigai = KANDIGAI_BINS.map(b => {
        const liveBin = bins.find(lb => lb.id === b.id);
        return liveBin ? { ...b, ...liveBin } : b;
      });

      // Filter out Kandigai IDs from the main bins list to avoid duplicates, then combine
      const kandigaiIds = new Set(KANDIGAI_BINS.map(b => b.id));
      const otherBins = bins.filter(b => !kandigaiIds.has(b.id));

      return [...mergedKandigai, ...otherBins];
    }

    // Resolve components
    let allowedComponents = AREA_COMPONENT_MAPPING[locRaw];
    if (!allowedComponents) {
      const key = Object.keys(AREA_COMPONENT_MAPPING).find(k => k.toLowerCase() === locLower);
      if (key) allowedComponents = AREA_COMPONENT_MAPPING[key];
    }
    allowedComponents = (allowedComponents || []).map(c => c.toLowerCase());

    const filtered = bins.filter(b => {
      // STRICT FILTER: Only show bins assigned to THIS driver (unless Assessment ON)
      if (!assessmentActive && b.assignedDriverId && b.assignedDriverId !== state.user?.employeeId) {
        return false;
      }

      const bArea = (b.areaName || '').trim().toLowerCase();
      const bLoc = (b.locationName || '').trim().toLowerCase();

      // 1. Direct Match
      if (bArea === locLower || bLoc === locLower) return true;

      // 2. Special Grouping: West Chengalpattu
      if (locLower === 'west chengalpattu') {
        const WCP_SUB_AREAS = ['kandigai', 'nallambakkam', 'kolapakkam', 'unamancheri', 'melakottaiyur', 'west chengalpattu'];
        return WCP_SUB_AREAS.some(sa => bLoc.includes(sa) || bArea.includes(sa));
      }

      // 3. Component Match
      if (allowedComponents.length > 0) {
        return allowedComponents.some(c => bArea === c || bLoc === c || bLoc.includes(c));
      }

      return false;
    });

    const isSpecialArea = locLower === 'adambakkam' || locLower === 'west chengalpattu' || locLower === 'kandigai' || locLower === 'total' || locLower === 'chennai' || locLower === 'all';
    let finalBins = filtered;

    if (!isSpecialArea && filtered.length > 0) {
      finalBins = getSpecialAreaBins(filtered, locRaw);
    }

    // 4. Final filter by assignedDriverId (Multi-driver Support)
    const filteredByAssignment = finalBins.filter(b => {
      if (assessmentActive) return true;
      // If the bin has an assigned driver, it MUST match the current user
      if (b.assignedDriverId) {
        return b.assignedDriverId === currentUserEmployeeId;
      }
      return true;
    });

    return filteredByAssignment;
  }, [state.bins, state.user?.location, currentUserEmployeeId, assessmentActive]);

  const isKandigaiArea = useMemo(() => {
    const locLower = (state.user?.location || '').trim().toLowerCase();
    return locLower === 'kandigai' || locLower === 'west chengalpattu';
  }, [state.user?.location]);

  // State for Optimized Route Order
  const [optimizedRouteIds, setOptimizedRouteIds] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false); // New Traffic Toggle
  const [trafficFeaturesVisible, setTrafficFeaturesVisible] = useState(false); // Master visibility (timed)
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [signalCountdown, setSignalCountdown] = useState(60);

  // Live Countdown Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setSignalCountdown(prev => prev > 1 ? prev - 1 : 60);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper: Sequential ID-based order (K_01 to K_46)
  const getSequentialOrder = (bins: Bin[]) => {
    return [...bins].sort((a, b) => {
      const idA = parseInt(a.id.split('_')[1] || '0');
      const idB = parseInt(b.id.split('_')[1] || '0');
      return idA - idB;
    });
  };

  // Helper: Nearest Neighbor TSP Solver (Fallback)
  const solveTSP = (startLat: number, startLng: number, tasks: Bin[]) => {
    let currentLat = startLat;
    let currentLng = startLng;
    const remaining = [...tasks];
    const pathIds: string[] = [];

    while (remaining.length > 0) {
      // Find nearest to current position
      let nearestIndex = -1;
      let minDist = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const bin = remaining[i];
        const dist = getDistance(currentLat, currentLng, bin.coordinates.lat, bin.coordinates.lng);
        // Pure geographic distance: NO artificial weighting
        // This guarantees a perfectly systematic, non-backtracking physical route.
        const effectiveDist = dist;

        if (effectiveDist < minDist) {
          minDist = effectiveDist;
          nearestIndex = i;
        }
      }

      if (nearestIndex !== -1) {
        const nextBin = remaining[nearestIndex];
        pathIds.push(nextBin.id);
        currentLat = nextBin.coordinates.lat;
        currentLng = nextBin.coordinates.lng;
        remaining.splice(nearestIndex, 1);
      } else {
        break;
      }
    }
    return pathIds;
  };

  // Sort: STRICT SEQUENTIAL ORDER
  const allSortedTasks = useMemo(() => {
    //  SINGLE STRAIGHT ROUTE based on the predefined list order.
    // Ensure  filter valid coordinates first
    const validBins = allBins
      .filter(b => b.coordinates && (b.coordinates.lat !== 0 || b.coordinates.lng !== 0));

    // Grouping Sort: Full/Half-Full (To-Do) > Empty > Completed
    const sorted = [...validBins].sort((a, b) => {
      // 1. Primary Status Priority
      const getPriority = (status: string) => {
        if (status === 'Full' || status === 'Half Full' || status === 'Half-Full') return 1;
        if (status === 'Empty' || !status) return 2;
        if (status === 'Completed') return 3;
        return 4;
      };

      const priorityA = getPriority(a.status);
      const priorityB = getPriority(b.status);

      if (priorityA !== priorityB) return priorityA - priorityB;

      // 2. Secondary Numeric Sort by ID
      const idA = parseInt(a.id.replace(/\D/g, '')) || 9999;
      const idB = parseInt(b.id.replace(/\D/g, '')) || 9999;
      return idA - idB;
    });

    return sorted;
  }, [allBins]);

  // Logic: Next Pending Task
  const nextTask = useMemo(() => {
    return allSortedTasks.find(t => t.status !== 'Completed' && t.status !== 'Empty');
  }, [allSortedTasks]);

  // Effect: Trigger Optimization - ENABLED for Smartest Route
  useEffect(() => {
    // When route is enabled, we WANT optimization (Smartest Route).
    if (showRoute && allBins.length > 0) {
      // Filter pending tasks
      const pending = allSortedTasks.filter(t => t.status !== 'Completed' && t.status !== 'Empty');
      // We will let the OSRM fetcher handle the sorting using solveTSP or just use OSRM response if it optimizes.
      // But to ensure the UI list reflects "Smart" order if we wanted, we could update optimizedRouteIds.

    }
  }, [showRoute, allBins]);

  const stats = useMemo(() => {
    const total = allBins.length;
    const completed = allBins.filter(b => (b.status || '').toUpperCase() === 'COMPLETED').length;
    const pending = total - completed; // Standardized: Total assigned minus completed
    return { total, completed, pending };
  }, [allBins]);

  // Traffic Status (Mock for now, replacing random every render)
  const [trafficStatus, setTrafficStatus] = useState({ label: 'Moderate', color: 'text-amber-500' });
  useEffect(() => {
    setTrafficStatus(getTrafficStatus());
  }, []);

  // Effect: Ujjwal Route Toggle
  // Shift & Analytics State
  const [shiftStartTime, setShiftStartTime] = useState<number | null>(null);
  const [shiftEnded, setShiftEnded] = useState(false);
  const [accumulatedDistance, setAccumulatedDistance] = useState(0); // in km
  const [tatStartTimes, setTatStartTimes] = useState<Record<string, number>>({}); // binId -> startTimestamp
  const [completedTatStats, setCompletedTatStats] = useState<{ id: string, duration: number }[]>([]);
  const previousLocation = useRef<{ lat: number, lng: number } | null>(null);
  const lastGpsInfoRef = useRef<{ lat: number, lng: number, time: number } | null>(null);
  // Stable ref for driver location — used by OSRM effect to avoid re-triggering on every GPS tick
  const driverLocationRef = useRef<{ lat: number; lng: number }>(DEFAULT_CENTER);

  // Helper: Haversine Distance (km)
  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return isNaN(distance) ? 0 : distance; // Return 0 if distance is NaN (e.g., invalid coords)
  };

  // derived metrics
  const sessionDuration = shiftStartTime ? Math.floor((Date.now() - shiftStartTime) / 1000 / 60) : 0; // mins
  const averageTat = useMemo(() => {
    if (completedTatStats.length === 0) return 0;
    const total = completedTatStats.reduce((acc, curr) => acc + curr.duration, 0);
    return Math.round(total / completedTatStats.length / 1000 / 60); // mins
  }, [completedTatStats]);

  // Effect: Start "Shift" when Route Active
  // Effect: Start "Shift" when Route Active
  const { speak } = useVoiceAssistant();

  useEffect(() => {
    if (showRoute && !shiftStartTime) {
      setShiftStartTime(Date.now());
      setShiftEnded(false);
      speak('Efficiency Mode Active.Calculation optimal path for ' + allSortedTasks.filter(t => t.status !== 'Completed' && t.status !== 'Empty').length + ' tasks.');
    }
  }, [showRoute]);

  // Effect: Live TAT Tracking & Distance Accumulation
  useEffect(() => {
    if (!hasGPS || !driverLocation) return;

    const { lat, lng } = driverLocation;

    if (previousLocation.current) {
      const dist = getDistance(previousLocation.current.lat, previousLocation.current.lng, lat, lng);
      if (dist > 0.005) {
        const dy = lat - previousLocation.current.lat;
        const dx = Math.cos(Math.PI / 180 * previousLocation.current.lat) * (lng - previousLocation.current.lng);
        const angle = Math.atan2(dx, dy) * (180 / Math.PI);
        setBearing(angle);
        setAccumulatedDistance(prev => prev + dist);
        previousLocation.current = { lat, lng };
      }
    } else {
      previousLocation.current = { lat, lng };
    }

    // 2. Geofence Check for TAT
    allSortedTasks.forEach(task => {
      if (task.status !== 'Completed') {
        const distToBin = getDistance(lat, lng, task.coordinates.lat, task.coordinates.lng);
        if (distToBin < 0.1) {
          if (!tatStartTimes[task.id]) {
            setTatStartTimes(prev => ({ ...prev, [task.id]: Date.now() }));
            speak(`Arrived at ${task.locationName}. Bin status is ${task.status}.`);
          }
        }
      }
    });
  }, [driverLocation, hasGPS, allSortedTasks, tatStartTimes]);

  // Effect: Continuous GPS Tracking (Watch Mode)
  useEffect(() => {
    if (showRoute && hasGPS) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lng, heading, speed, accuracy } = pos.coords;

          // SMART GPS: If accuracy > 5km, browser is guessing via IP (desktop = China/Korea).
          // Real phone GPS is typically < 100m accurate.
          if (accuracy > 5000) {
            setGpsError(`⚠️ Low GPS accuracy (${Math.round(accuracy/1000)}km). Using work area. Open on phone for real GPS.`);
            return; // Don't update location with inaccurate IP-based guess
          }

          setGpsError(null);
          if (heading !== null) setBearing(heading);
          setDriverLocation({ lat, lng });

          if (speed !== null && speed > 0) setCurrentSpeed(Math.round(speed * 3.6));
          lastGpsInfoRef.current = { lat, lng, time: Date.now() };
        },
        (err) => setGpsError("⚠️ GPS Signal Searching..."),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(id);
    }
  }, [showRoute, hasGPS]);

  // Force Hub Recalibration
  const handleHubReset = () => {
    setDriverLocation({ lat: 12.835, lng: 80.170 });
    setGpsError(null);
    setHasGPS(true);
  };

  // Force GPS Access from User Action (Button Click)
  const handleRouteOn = () => {
    if (navigator.geolocation) {
      setGpsError("⚠️ Requesting Live Location access...");

      // Requesting IMMEDIATE position to satisfy browser user-gesture requirements
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;

          // SMART GPS: If accuracy > 5km, browser is using IP geolocation (gives China/Korea on desktop).
          // Real phone GPS gives < 100m accuracy.
          if (accuracy > 5000) {
            setGpsError(`⚠️ Low GPS accuracy (${Math.round(accuracy/1000)}km). Desktop detected. Using work area.`);
            // Use Kandigai work area since browser IP location is unreliable
            setDriverLocation({ lat: 12.835, lng: 80.170 });
          } else {
            // REAL GPS from phone — use exact coordinates
            setDriverLocation({ lat: latitude, lng: longitude });
            setGpsError(null);
          }

          setHasGPS(true);
          setShowRoute(true);
        },
        (err) => {
          console.error("GPS Access Error:", err);
          let msg = "⚠️ Location Denied! Go to Browser Settings to Allow.";
          if (err.code === 2) msg = "⚠️ GPS Signal Lost.";
          if (err.code === 3) msg = "⚠️ GPS Request Timeout.";
          setGpsError(msg);
          setShowRoute(false);
          setHasGPS(false);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    } else {
      alert("GPS not supported on this device.");
    }
  };

  // Effect: Traffic Features Visibility & Animation
  // Effect: Traffic Features Visibility & Animation
  useEffect(() => {
    // Disabled auto-show to prevent clutter ("snowflake" confusion)
    // Traffic features can be enabled manually if needed, or we keep them hidden for now.
    /*
    if (showRoute && !splashActive) {
      const timer = setTimeout(() => {
        setTrafficFeaturesVisible(true);
        setShowTraffic(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
    */
  }, [showRoute, splashActive]);

  // State: Realtime Route Metrics from OSRM
  const [realtimeMetrics, setRealtimeMetrics] = useState<Record<string, { dist: number, time: number }>>({});
  const [routeTotals, setRouteTotals] = useState<{ dist: number, time: number }>({ dist: 0, time: 0 });
  const lastFetchedLocation = useRef<{ lat: number; lng: number } | null>(null);

  // API: Fetch OSRM Road-Following Route — Recalculates when driver moves or tasks change
  useEffect(() => {
    if (!showRoute) {
      setRoutePath([]);
      setRouteTotals({ dist: 0, time: 0 });
      setRealtimeMetrics({});
      setTrafficSegments([]);
      if (lastFetchedLocation.current) lastFetchedLocation.current = null;
      return;
    }

    const fetchRoadRoute = async () => {
      if (!driverLocation || !showRoute) return;
      const { lat, lng } = driverLocation;

      const pendingTasks = allSortedTasks.filter(t => t.status !== 'Completed' && t.status !== 'Empty' && !completingIds.has(t.id));
      if (pendingTasks.length === 0) { setRoutePath([]); setTrafficSegments([]); return; }

      const optimizedIds = solveTSP(lat, lng, pendingTasks);
      const sorted = optimizedIds.map(id => pendingTasks.find(t => t.id === id)!);

      // --- HIGH-PRECISION ROAD MAPPING (NO STRAIGHT LINES) ---
      const waypoints = [[lng, lat], ...sorted.map(b => [b.coordinates.lng, b.coordinates.lat]), [dumpYard.lng, dumpYard.lat]];

      try {
        const finalPath: [number, number][] = [];
        let totalDist = 0;
        let totalTime = 0;

        // Chunking Strategy (8 stops per batch) for 100% road coverage
        for (let i = 0; i < waypoints.length - 1; i += 7) {
          const chunk = waypoints.slice(i, i + 8);
          if (chunk.length < 2) break;
          const url = `https://router.project-osrm.org/route/v1/driving/${chunk.map(w => w.join(',')).join(';')}?overview=full&geometries=geojson&steps=true`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.code === 'Ok' && data.routes[0]) {
            const r = data.routes[0];
            finalPath.push(...r.geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]));
            totalDist += r.distance;
            totalTime += r.duration;
          }
        }

        if (finalPath.length > 0) {
          setRoutePath(finalPath);
          setTrafficSegments([{ path: finalPath, color: '#2563eb' }]);
          setRouteTotals({ dist: totalDist / 1000, time: totalTime / 60 });
          lastFetchedLocation.current = { lat, lng };
          return;
        }
        throw new Error("Geom Fail");
      } catch (err) {
        console.warn("Road mapping fail. Fallback to direct.", err);
        const fb: [number, number][] = [[lat, lng], ...sorted.map(b => [b.coordinates.lat, b.coordinates.lng] as [number, number]), [dumpYard.lat, dumpYard.lng]];
        setRoutePath(fb);
        setTrafficSegments([{ path: fb, color: '#2563eb' }]);
        setRouteTotals({ dist: fb.length * 0.8, time: fb.length * 3.5 });
      }
    };

    const timer = setTimeout(fetchRoadRoute, 450);
    return () => clearTimeout(timer);
  }, [showRoute, allSortedTasks, dumpYard, driverLocation, completingIds]);


  // Effect: Splash Countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (splashActive && countDown > 0) {
      timer = setTimeout(() => setCountDown(c => c - 1), 1000);
    } else if (splashActive && countDown === 0) {
      setSplashActive(false);
    }
    return () => clearTimeout(timer);
  }, [splashActive, countDown]);

  // Handlers
  const handleCardClick = (binId: string) => {
    setSelectedBinId(binId);
    setSelectedSignalId(null);
    setSelectedDriverId(null);
  };

  const handleCompleteAction = async (binId: string, e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();

    // Already in progress? Ignore.
    if (completingRef.current.has(binId)) return;

    const now = Date.now();
    const DOUBLE_TAP_WINDOW = 2500; // 2.5 seconds to confirm

    const firstTapTime = firstTapRef.current[binId];
    const isSecondTap = firstTapTime !== undefined && (now - firstTapTime) < DOUBLE_TAP_WINDOW;

    if (isSecondTap) {
      // ── SECOND TAP: complete the task ──
      console.log('✅ DOUBLE TAP confirmed for', binId);

      // Clear the pending first-tap state
      clearTimeout(firstTapTimerRef.current[binId]);
      delete firstTapRef.current[binId];
      delete firstTapTimerRef.current[binId];
      setPendingConfirmId(null);

      // Lock to prevent re-entry
      completingRef.current.add(binId);
      setCompletingIds(prev => new Set(prev).add(binId));

      try {
        await handleComplete(binId);
      } catch (err) {
        console.error('Completion failed:', err);
        // Roll back lock so user can retry
        completingRef.current.delete(binId);
        setCompletingIds(prev => { const s = new Set(prev); s.delete(binId); return s; });
        setPendingConfirmId(binId); // restore pending hint
      }
    } else {
      // ── FIRST TAP: arm the double-tap window ──
      console.log('☝️ FIRST TAP for', binId);

      // Cancel any previously armed timer for a different bin
      Object.keys(firstTapTimerRef.current).forEach(id => {
        if (id !== binId) {
          clearTimeout(firstTapTimerRef.current[id]);
          delete firstTapRef.current[id];
          delete firstTapTimerRef.current[id];
        }
      });
      // Clear old pending UI for any other bin
      setPendingConfirmId(binId);

      firstTapRef.current[binId] = now;
      firstTapTimerRef.current[binId] = setTimeout(() => {
        // Window expired – reset
        delete firstTapRef.current[binId];
        delete firstTapTimerRef.current[binId];
        setPendingConfirmId(prev => (prev === binId ? null : prev));
      }, DOUBLE_TAP_WINDOW);
    }
  };

  const handleEndShift = () => {
    setShowRoute(false);
    setShiftEnded(true);
  };

  const calculateTatDisplay = (id: string) => {
    const start = tatStartTimes[id];
    if (!start) return null;
    const mins = Math.floor((Date.now() - start) / 1000 / 60);
    return `${mins}m Live`;
  };

  // Helper: Calculate ETA (mins) based on distance (km) and speed (km/h)
  const calculateETA = (distKm: number) => {
    const speed = 30; // Average city speed for truck
    const timeHours = distKm / speed;
    return Math.round(timeHours * 60);
  };

  const handleComplete = async (binId: string) => {
    const driverId = state.user?.employeeId;
    const bin = allBins.find(b => b.id === binId);
    if (!bin || bin.status === 'Completed') return;

    // ── OPTIMISTIC UPDATE: Update local state immediately so UI reacts now ──
    // This makes the task move to the bottom and turn blue without waiting for Firebase.
    const completedBin = { ...bin, status: 'Completed' as const };
    const existsInState = state.bins.some(b => b.id === binId);
    const updatedBins = existsInState
      ? state.bins.map(b => b.id === binId ? completedBin : b)
      : [...state.bins, completedBin]; // upsert for Kandigai static-only bins
    updateState({ bins: updatedBins });


    // Capture TAT
    const start = tatStartTimes[binId];
    if (start) {
      const duration = Date.now() - start;
      setCompletedTatStats(prev => [...prev, { id: binId, duration }]);
      const newTimers = { ...tatStartTimes };
      delete newTimers[binId];
      setTatStartTimes(newTimers);
    }

    // ── FIREBASE WRITES (background, non-blocking for UI) ──
    try {
      await databaseService.updateBin(binId, { status: 'Completed' }, driverId);
    } catch (err) {
      console.error('Firebase updateBin failed:', err);
      // Roll back optimistic update on failure
      updateState({ bins: state.bins });
      throw err; // Let handleCompleteAction roll back completingIds
    }

    // Increment Driver's lifetime/hub task count
    if (driverId) {
      databaseService.incrementDriverTaskCount(driverId).catch(console.error);
    }

    // Sync task completion to the unified 'leave' node (Daily Audit)
    const today = new Date().toISOString().split('T')[0];
    if (driverId) {
      const currentTasks = allBins.filter(b => b.status === 'Completed').length + 1;
      databaseService.updateDailyRecord({
        driverId,
        driverName: state.user?.username || 'Unknown',
        date: today,
        tasksCompleted: currentTasks,
        leaveStatus: 'Present'
      }).catch(console.error);
    }

    // Clean up completingIds after success (Firebase will confirm shortly)
    setCompletingIds(prev => { const s = new Set(prev); s.delete(binId); return s; });
    completingRef.current.delete(binId);
  };


  // Re-declare to use new logic
  const handleGPSNavigate = (lat: number, lng: number, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  return (
    <div className="space-y-8 pb-24 px-6 md:px-12 pt-4 max-w-7xl mx-auto w-full relative animate-in fade-in duration-500">

      {/* 0. PAGE TITLE & ASSESSMENT INDICATOR */}
      <div className="flex flex-col gap-1 mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{state.user?.location || 'Tasks'}</h1>
        </div>
      </div>

      {/* 1. TOP HEADER (STATS GRID - Admin Style) */}
      <div className="grid grid-cols-3 gap-4 md:gap-8">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="text-indigo-600 mb-2"><Truck size={20} /></div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">HUBS</p>
          <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="text-emerald-600 mb-2"><CheckCircle2 size={20} /></div>
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Completed</p>
          <p className="text-xl font-black text-emerald-600 leading-none">{stats.completed}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="text-amber-600 mb-2"><Clock size={20} /></div>
          <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">
            Tasks
          </p>
          <p className="text-xl font-black text-amber-600 leading-none">
            {allBins.filter(b => {
              const s = (b.status || '').toLowerCase();
              return s === 'full' || s === 'half full' || s === 'half-full';
            }).length}
          </p>
        </div>
      </div>

      {/* 2. EMERGENCY DATA FIX BUTTON REMOVED AS REQUESTED */}

      {/* 2. UJJWAL ROUTE TOGGLE */}
      <div className="bg-[#0f172a] rounded-[2.5rem] p-5 flex items-center justify-between shadow-xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${showRoute ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
            <Zap size={28} className={showRoute ? 'fill-current' : ''} />
          </div>
          <div>
            <h3 className="text-white font-black text-xl tracking-tight">Ujjwal Route</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              {showRoute ? 'OPTIMIZED SINGLE PATH ACTIVE' : 'TAP TO ACTIVATE ROUTE'}
            </p>
          </div>
        </div>
        <button
          onClick={() => showRoute ? handleEndShift() : handleRouteOn()}
          className={`w-16 h-9 rounded-full relative transition-all duration-300 ${showRoute ? 'bg-emerald-500' : 'bg-slate-700'}`}
        >
          <div className={`absolute top-1 w-7 h-7 bg-white rounded-full transition-all duration-300 shadow-lg flex items-center justify-center ${showRoute ? 'left-8' : 'left-1'}`}>
            {showRoute && <Activity size={14} className="text-emerald-600 animate-pulse" />}
          </div>
        </button>
      </div>

      {/* 3. MAP CARD - HIGH CAPACITY VISIBILITY (23 HUBS) */}
      <div className="h-[450px] w-full bg-slate-100 rounded-[3rem] overflow-hidden relative shadow-2xl border-4 border-white isolate">

        {/* GPS AUTHORIZATION PROMPT OVERLAY - USING REQUESTED TRUCK ICON */}
        {showRoute && !hasGPS && (
            <div className="absolute inset-0 z-[1001] bg-slate-900/98 backdrop-blur-2xl flex flex-col items-center justify-center text-white px-8 animate-in fade-in duration-500">
              <div className="w-28 h-28 flex items-center justify-center mb-8">
                <img src="/garbage-truck_11414365.png" style={{ width: '112px', height: '112px', filter: 'drop-shadow(0 0 20px rgba(255,100,50,0.6))' }} />
              </div>
              <h2 className="text-3xl font-black text-center tracking-tighter mb-4 uppercase leading-none">AUTHORIZE REAL-TIME<br />TRUCK TRACKING</h2>
              <p className="text-slate-400 text-center text-[10px] font-bold max-w-xs mb-8 uppercase tracking-[0.2em] leading-relaxed">
                Ujjwal requires LIVE GPS access to <br />prevent location jumps to other countries.
              </p>
              <button
                onClick={handleRouteOn}
                className="w-full max-w-[280px] py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl hover:bg-indigo-700 transition-all shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] active:scale-95 flex items-center justify-center gap-3"
              >
                ENABLE REAL GPS NOW
              </button>
            </div>
          )}

          {gpsError?.includes('outside India') && (
            <button
               onClick={handleHubReset}
               className="absolute top-24 left-1/2 -translate-x-1/2 z-[1002] bg-slate-900/90 backdrop-blur-md text-white px-8 py-4 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl border-2 border-slate-700/50 hover:bg-slate-900 transition-all active:scale-95"
            >
               Recalibrate To Kandigai Hub
            </button>
          )}

        {splashActive && (
          <div className="absolute inset-0 z-[1000] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
            <Truck size={64} className="text-blue-400 mb-6 animate-bounce" />
            <h2 className="text-2xl font-black text-center tracking-tight mb-2">UJJWAL ROUTE<br />ACTIVATED</h2>
            <div className="text-[5rem] font-black text-white/20 tabular-nums animate-pulse mt-4">
              {countDown}
            </div>
          </div>
        )}

        <MapContainer center={[12.835, 80.170]} zoom={14} className="h-full w-full bg-slate-50" zoomControl={false}>
          <MapInvalidator />
          <MapActionControls />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

          {/* TRAFFIC LAYER (TomTom Flow Tiles) - Visible Only after Delay */}
          {trafficFeaturesVisible && showTraffic && (
            <TileLayer
              url="https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=f761563f-3665-4f32-8438-662363189069"
              opacity={0.7}
              maxZoom={22}
              className="animate-in fade-in duration-1000 slide-in-from-bottom-10"
            />
          )}

          {/* HIGH-VISIBILITY UJJWAL ROUTE LINE (Segmented Traffic View) */}
          {showRoute && trafficSegments.length > 0 && (
            <>
              {/* Outer Glow / White Outline */}
              <Polyline
                positions={routePath}
                pathOptions={{
                  color: '#ffffff',
                  weight: 12,
                  opacity: 0.5,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
              {/* Core Path Line — Rendered in Multi-Colored Traffic Segments */}
              {trafficSegments.map((seg, i) => (
                <Polyline
                  key={`seg-${i}`}
                  positions={seg.path}
                  pathOptions={{
                    color: seg.color, // Dynamically set (Blue/Yellow/Red)
                    weight: 7,
                    opacity: 1,
                    lineCap: 'round',
                    lineJoin: 'round',
                    dashArray: '1, 2',
                  }}
                />
              ))}
            </>
          )}

          {/* View Follower Component — Ensures map follows live GPS */}
          <MapFollower center={driverLocation} active={showRoute} />
          {hasGPS && (
            <Marker
              position={driverLocation}
              icon={L.divIcon({
                className: 'driver-location-marker',
                html: `<div style="transition: transform 0.4s ease-out;">
                  <img src="/garbage-truck_11414365.png" style="width: 72px; height: 72px; filter: drop-shadow(2px 6px 12px rgba(0,0,0,0.5));" />
                </div>`,
                iconSize: [72, 72],
                iconAnchor: [36, 36]
              })}
              zIndexOffset={100}
              eventHandlers={{ click: () => { setSelectedDriverId('DRIVER'); setSelectedBinId(null); setSelectedSignalId(null); } }}
            />
          )}

          {/* Precision Diagnostic: Shows Live Coordinates on Map for Verification */}
          {showRoute && hasGPS && (
            <div className="absolute bottom-24 left-6 z-[900] bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl flex flex-col text-[8px] font-black text-white uppercase tracking-widest leading-none drop-shadow-xl">
              <span className="mb-1 opacity-50">Precision GPS Feed</span>
              <span>LAT: {driverLocation.lat.toFixed(5)}</span>
              <span className="mt-0.5">LNG: {driverLocation.lng.toFixed(5)}</span>
            </div>
          )}

          {showRoute && isKandigaiArea && KANDIGAI_TRAFFIC_SIGNALS.map(signal => (
            <Marker
              key={`signal-${signal.id}`}
              position={[signal.lat, signal.lng]}
              icon={signalIcon}
              eventHandlers={{ click: () => { setSelectedSignalId(signal.id.toString()); setSelectedBinId(null); setSelectedDriverId(null); } }}
            >
            </Marker>
          ))}

          {showRoute && isKandigaiArea && (
            <Marker position={[dumpYard.lat, dumpYard.lng]} icon={recycleIcon} eventHandlers={{ click: () => { setSelectedBinId('DUMP_YARD'); setSelectedSignalId(null); setSelectedDriverId(null); } }}>
            </Marker>
          )}

          {/* BINS LAYER */}
          {allBins.map(bin => {
            const statusLower = (bin.status || '').toLowerCase();
            const isCompleted = statusLower === 'completed';
            const opacity = isCompleted ? 0.6 : 1.0;
            // Omission removed as requested - user wants to see all 23 bins

            const pendingTasks = allSortedTasks.filter(t => t.status !== 'Completed' && t.status !== 'Empty');
            const isFirstPending = pendingTasks.length > 0 && pendingTasks[0].id === bin.id;
            const isLastBin = pendingTasks.length > 0 && pendingTasks[pendingTasks.length - 1].id === bin.id;
            const isGlowing = showRoute && !isCompleted && (isFirstPending || isLastBin);
            const glowClass = isFirstPending
              ? 'drop-shadow-[0_0_15px_rgba(16,185,129,0.9)] scale-110 z-[50]'
              : isLastBin
                ? 'drop-shadow-[0_0_25px_rgba(244,63,94,1)] scale-125 z-[49] border-2 border-rose-500 rounded-full'
                : '';

            return (
              <Marker
                key={bin.id}
                position={[bin.coordinates.lat, bin.coordinates.lng]}
                opacity={opacity}
                icon={L.divIcon({
                  className: `custom-bin-icon ${isGlowing ? glowClass : ''}`,
                  html: getBinIconSvg(bin.status, false, 32),
                  iconSize: [32, 32],
                  iconAnchor: [16, 16]
                })}
                eventHandlers={{ click: () => setSelectedBinId(bin.id) }}
              />
            );
          })}

          {selectedBinId && (() => {
            const b = allBins.find(bin => bin.id === selectedBinId);
            return b ? <RecenterMap center={b.coordinates} zoom={16} /> : null;
          })()}

          {/* LIVE MOVE: Auto-recenter smoothly on driver when route is active */}
          <LiveAutoCenter center={driverLocation} active={showRoute && hasGPS} />
        </MapContainer>

        {/* 4. CIRCULAR SPEEDOMETER (Bottom Right) - Only when showRoute is ON */}
        {showRoute && (
          <div className="absolute bottom-6 right-6 z-[900] animate-in zoom-in slide-in-from-bottom-4 duration-500">
            <div className="w-24 h-24 bg-white/90 backdrop-blur-xl rounded-full shadow-2xl border-4 border-indigo-600 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors"></div>

              {/* Pulsing indicator */}
              <div className="absolute top-2 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>

              <div className="relative z-10 flex flex-col items-center">
                <p className="text-3xl font-black text-slate-900 leading-none">{currentSpeed}</p>
                <div className="flex flex-col items-center -mt-0.5">
                  <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">km/h</p>
                  <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tight">Speed</p>
                </div>
              </div>

              {/* Decorative Arc */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="4"
                  strokeDasharray="276"
                  strokeDashoffset="69"
                  strokeLinecap="round"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="4"
                  strokeDasharray="276"
                  strokeDashoffset={276 - (Math.min(currentSpeed, 60) / 60) * 207} // Caps viz at 60km/h for city safety
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
            </div>
          </div>
        )}

        {/* STATS CARD (Top Right) */}
        {showRoute && (
          <div className="absolute top-4 right-4 z-[900] bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 w-48 animate-in slide-in-from-right duration-500 pointer-events-auto">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Live Shift Meter</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <Zap size={14} />
                  <span className="text-xs font-bold uppercase">Distance</span>
                </div>
                <span className="text-sm font-black text-slate-800">{routeTotals.dist.toFixed(1)} km</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <Truck size={14} />
                  <span className="text-xs font-bold uppercase">Traffic</span>
                </div>
                {(() => {
                  const avgDelay = trafficSegments.length > 0
                    ? trafficSegments.reduce((acc, s) => acc + (s.color === '#dc2626' ? 2 : s.color === '#fbbf24' ? 1 : 0), 0) / trafficSegments.length
                    : 0;
                  const label = avgDelay > 1 ? 'Heavy' : avgDelay > 0.4 ? 'Moderate' : 'Light';
                  const color = avgDelay > 1 ? 'text-rose-500' : avgDelay > 0.4 ? 'text-amber-500' : 'text-emerald-500';
                  const bg = avgDelay > 1 ? 'bg-rose-50' : avgDelay > 0.4 ? 'bg-amber-50' : 'bg-emerald-50';
                  return (
                    <span className={`text-xs font-black px-2 py-0.5 rounded-md uppercase ${bg} ${color}`}>
                      {label}
                    </span>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock size={14} />
                  <span className="text-xs font-bold uppercase">Est. Time</span>
                </div>
                <span className="text-sm font-black text-indigo-600">{Math.ceil(routeTotals.time)} min</span>
              </div>
            </div>
          </div>
        )}

        {/* SELECTED BIN DETAIL CARD (GLASSMORPHISM) */}
        {selectedBinId && (() => {
          // SPECIAL CASE: DUMP YARD CARD
          if (selectedBinId === 'DUMP_YARD') {
            return (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] animate-in zoom-in-95 duration-300">
                <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-6 shadow-2xl border border-white/20 w-72 flex flex-col items-center text-center relative overflow-hidden group">
                  <button
                    onClick={() => setSelectedBinId(null)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900/10 text-slate-800 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all backdrop-blur-sm z-20"
                  >
                    <div className="text-xl leading-none">&times;</div>
                  </button>

                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-lg mb-4 p-2 border border-emerald-100">
                    <img src="/recycle-sign.png" className="w-full h-full object-contain drop-shadow-md" alt="Recycle" />
                  </div>

                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1">{dumpYard.label}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Final Dump Area</p>
                  </div>

                  <div className="flex items-center justify-center gap-3 w-full">
                    <div className="bg-emerald-50/80 px-4 py-2 rounded-xl backdrop-blur-sm border border-emerald-100 flex-1">
                      <p className="text-[9px] font-black uppercase text-emerald-500 mb-1">Total Distance</p>
                      <p className="text-lg font-black text-emerald-700">{routeTotals.dist.toFixed(1)} km</p>
                    </div>
                    <div className="bg-indigo-50/80 px-4 py-2 rounded-xl backdrop-blur-sm border border-indigo-100 flex-1">
                      <p className="text-[9px] font-black uppercase text-indigo-400 mb-1">Est. Time</p>
                      <p className="text-lg font-black text-indigo-700">{Math.ceil(routeTotals.time)} min</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleGPSNavigate(dumpYard.lat, dumpYard.lng, e)}
                    className="w-full mt-5 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Navigation size={16} /> Navigate
                  </button>
                </div>
              </div>
            );
          }

          const selectedBin = allBins.find(b => b.id === selectedBinId);
          if (!selectedBin) return null;

          return (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] animate-in zoom-in-95 duration-300">
              <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-6 shadow-2xl border border-white/20 w-72 flex flex-col items-center text-center relative overflow-hidden group">
                {/* Close Button */}
                <button
                  onClick={() => setSelectedBinId(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900/10 text-slate-800 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all backdrop-blur-sm z-20"
                >
                  <div className="text-xl leading-none">&times;</div>
                </button>

                {/* Bin ID Badge - New Addition */}
                <div className="absolute top-4 left-4 px-3 py-1 bg-slate-900/80 text-white rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-sm shadow-sm">
                  #{selectedBin.id}
                </div>




                {/* Details */}
                <div className="w-full mb-5 space-y-2">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate drop-shadow-sm leading-none">{selectedBin.locationName}</h3>
                  {/* Distance & ETA (Only if Route is ON) */}
                  {showRoute && (() => {
                    const metrics = realtimeMetrics[selectedBin.id];
                    // Use OSRM metrics if available, else fallback to local Calc
                    const d = metrics ? metrics.dist : getDistance(driverLocation.lat, driverLocation.lng, selectedBin.coordinates.lat, selectedBin.coordinates.lng);
                    const t = metrics ? Math.ceil(metrics.time) : calculateETA(d);

                    return (
                      <div className="flex items-center justify-center gap-3 my-2 animate-in fade-in zoom-in duration-300">
                        <div className="bg-indigo-50/80 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-indigo-100">
                          <p className="text-[8px] font-black uppercase text-indigo-400">Real Dist</p>
                          <p className="text-sm font-black text-indigo-700">{d.toFixed(1)} km</p>
                        </div>
                        <div className="bg-emerald-50/80 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-emerald-100">
                          <p className="text-[8px] font-black uppercase text-emerald-500">Real Time</p>
                          <p className="text-sm font-black text-emerald-700">{t} min</p>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Status Badge - New Addition */}
                  <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border backdrop-blur-sm shadow-sm ${selectedBin.status === 'Full' ? 'bg-rose-500/20 text-rose-800 border-rose-500/20' :
                    selectedBin.status === 'Half Full' ? 'bg-amber-500/20 text-amber-800 border-amber-500/20' :
                      'bg-emerald-500/20 text-emerald-800 border-emerald-500/20'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedBin.status === 'Full' ? 'bg-rose-600 animate-pulse' : selectedBin.status === 'Half Full' ? 'bg-amber-600' : 'bg-emerald-600'}`} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">{selectedBin.status}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 w-full mt-4">
                  <button
                    onClick={(e) => handleGPSNavigate(selectedBin.coordinates.lat, selectedBin.coordinates.lng, e)}
                    className="flex-1 py-4 bg-slate-900/90 text-white rounded-2xl flex items-center justify-center shadow-xl hover:bg-slate-900 transition-all active:scale-95 backdrop-blur-sm group/btn"
                    title="Start Navigation"
                  >
                    <Navigation size={16} className="group-hover/btn:scale-110 transition-transform" />
                  </button>
                  {!selectedBin.status.includes('Completed') && (
                    <button
                      onPointerDown={(e) => handleCompleteAction(selectedBin.id, e)}
                      style={{ touchAction: 'none' }}
                      className={`flex-1 py-4 text-white rounded-2xl flex items-center justify-center border border-white/20 shadow-lg transition-all active:scale-95 backdrop-blur-sm group/btn
                                  ${(pendingConfirmId === selectedBin.id || completingIds.has(selectedBin.id)) ? 'bg-amber-500' : 'bg-emerald-600/90 hover:bg-emerald-600'}
                                  ${completingIds.has(selectedBin.id) ? 'pointer-events-none opacity-50' : ''}`}
                      title={pendingConfirmId === selectedBin.id ? "Confirm Completion" : "Complete Task"}
                    >
                      {(pendingConfirmId === selectedBin.id || completingIds.has(selectedBin.id)) ? <Check size={24} strokeWidth={6} /> : <Check size={24} strokeWidth={4} className="group-hover/btn:scale-110 transition-transform" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* SELECTED SIGNAL DETAIL CARD (GLASSMORPHISM) */}
        {selectedSignalId && (() => {
          const signal = KANDIGAI_TRAFFIC_SIGNALS.find(s => s.id.toString() === selectedSignalId);
          if (!signal) return null;

          const isRed = (signal.id % 2 === 0);
          const signalBgClass = isRed ? 'bg-rose-50/80 border-rose-200' : 'bg-emerald-50/80 border-emerald-200';
          const signalTitleClass = isRed ? 'text-rose-500' : 'text-emerald-500';
          const signalTextClass = isRed ? 'text-rose-700' : 'text-emerald-700';
          const signalDotClass = isRed ? 'bg-rose-500' : 'bg-emerald-500';
          const signalText = isRed ? 'RED (STOP)' : 'GREEN (GO)';

          const isHeavy = (signal.id % 3 === 0);
          const trafficBgClass = isHeavy ? 'bg-rose-50/80 border-rose-200' : 'bg-emerald-50/80 border-emerald-200';
          const trafficTitleClass = isHeavy ? 'text-rose-500' : 'text-emerald-500';
          const trafficTextClass = isHeavy ? 'text-rose-700' : 'text-emerald-700';
          const trafficText = isHeavy ? 'HEAVY' : 'LIGHT';

          return (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] animate-in zoom-in-95 duration-300">
              <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-6 shadow-2xl border border-white/20 w-72 flex flex-col items-center text-center relative overflow-hidden group">
                <button
                  onClick={() => setSelectedSignalId(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900/10 text-slate-800 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all backdrop-blur-sm z-20"
                >
                  <div className="text-xl leading-none">&times;</div>
                </button>

                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg mb-4 p-2">
                  <img src="/custom-traffic.png" className="w-full h-full object-contain" />
                </div>

                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1">{signal.area} Signal</h3>

                <div className="flex flex-col gap-3 w-full mt-4">
                  <div className={`px-4 py-3 rounded-xl backdrop-blur-sm border flex items-center justify-between ${signalBgClass}`}>
                    <p className={`text-[10px] font-black uppercase ${signalTitleClass}`}>Status</p>
                    <div className="flex items-center gap-2">
                      <div className={`text-xl font-black tabular-nums mr-2 ${signalTextClass}`}>{signalCountdown}s</div>
                      <div className={`w-2 h-2 rounded-full animate-pulse ${signalDotClass}`}></div>
                      <p className={`text-sm font-black ${signalTextClass}`}>{signalText}</p>
                    </div>
                  </div>

                  <div className={`px-4 py-3 rounded-xl backdrop-blur-sm border flex items-center justify-between ${trafficBgClass}`}>
                    <p className={`text-[10px] font-black uppercase ${trafficTitleClass}`}>Traffic</p>
                    <p className={`text-sm font-black ${trafficTextClass}`}>{trafficText}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* SELECTED DRIVER DETAIL CARD (GLASSMORPHISM) */}
        {selectedDriverId && (() => {
          return (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] animate-in zoom-in-95 duration-300">
              <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-6 shadow-2xl border border-white/20 w-72 flex flex-col items-center text-center relative overflow-hidden group">
                <button
                  onClick={() => setSelectedDriverId(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900/10 text-slate-800 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all backdrop-blur-sm z-20"
                >
                  <div className="text-xl leading-none">&times;</div>
                </button>

                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shadow-lg mb-4 border border-blue-200">
                  <Truck size={32} className="text-blue-600 drop-shadow-md" />
                </div>

                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1">Your Location</h3>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live GPS Active</p>
                </div>

                <div className="flex items-center justify-center gap-3 w-full mt-2">
                  <div className="bg-blue-50/80 px-4 py-3 rounded-xl backdrop-blur-sm border border-blue-100 flex-1 flex flex-col items-center">
                    <p className="text-[9px] font-black uppercase text-blue-500 mb-1">Latitude</p>
                    <p className="text-xs font-black text-blue-700">{driverLocation?.lat.toFixed(5)}</p>
                  </div>
                  <div className="bg-indigo-50/80 px-4 py-3 rounded-xl backdrop-blur-sm border border-indigo-100 flex-1 flex flex-col items-center">
                    <p className="text-[9px] font-black uppercase text-indigo-500 mb-1">Longitude</p>
                    <p className="text-xs font-black text-indigo-700">{driverLocation?.lng.toFixed(5)}</p>
                  </div>
                </div>

                <div className="w-full mt-3 bg-slate-50/80 px-4 py-2 rounded-xl backdrop-blur-sm border border-slate-200 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase text-slate-500">Distance Driven</p>
                  <p className="text-sm font-black text-slate-800">{accumulatedDistance.toFixed(2)} km</p>
                </div>

              </div>
            </div>
          );
        })()}

        {/* FLOATING HUD - WITH LIVE STATS - VISIBLE ONLY AFTER DELAY */}
        {trafficFeaturesVisible && (() => {
          // Use Route Totals from OSRM
          const distDisplay = routeTotals.dist > 0 ? routeTotals.dist.toFixed(1) : '0.0';
          const timeDisplay = routeTotals.time > 0 ? Math.ceil(routeTotals.time) : '0';

          return (
            <div className="absolute top-6 right-6 z-[900] flex flex-col gap-2 pointer-events-none">
              <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-xl border border-slate-100 w-44 animate-in slide-in-from-bottom duration-1000 fade-in">
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">LIVE SHIFT METER</p>

                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span className="flex items-center gap-1"><Zap size={10} className="text-amber-500" /> Trip Dist.</span>
                  <span>{distDisplay} km</span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span className="flex items-center gap-1"><Clock size={10} className="text-indigo-500" /> Trip Time</span>
                  <span>{timeDisplay} min</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span className="flex items-center gap-1"><Activity size={10} className="text-emerald-500" /> Avg TAT</span>
                  <span>{averageTat} m</span>
                </div>

                <div className="h-px bg-slate-200 my-1"></div>

                <button
                  onClick={() => {
                    setShowTraffic(!showTraffic);
                    if (!showTraffic) speak("Live Traffic Layer Enabled via Google Maps SDK");
                  }}
                  disabled={!trafficFeaturesVisible}
                  className={`flex items-center justify-between text-xs font-bold w-full p-1 rounded transition-colors ${showTraffic ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'} ${!trafficFeaturesVisible ? 'opacity-50 cursor-not-allowed' : 'pointer-events-auto'}`}
                >
                  <span className="flex items-center gap-1"><Truck size={10} /> Traffic (G-SDK)</span>
                  <span className={showTraffic ? 'animate-pulse text-indigo-500' : ''}>{showTraffic ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* FORCE FIX BUTTON REMOVED */}

      </div>

      {/* 4. TASK LIST - GRID LAYOUT */}
      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-2 mb-4">Task Grid Sequence ({allSortedTasks.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {allSortedTasks.map((task) => {
            const isCompleted = task.status === 'Completed';
            const isSelected = selectedBinId === task.id;
            const tatDisplay = calculateTatDisplay(task.id);

            // Calculate Distance/ETA for list items too
            const metrics = realtimeMetrics[task.id];
            const dist = metrics ? metrics.dist : getDistance(driverLocation.lat, driverLocation.lng, task.coordinates.lat, task.coordinates.lng);
            const eta = metrics ? Math.ceil(metrics.time) : calculateETA(dist);

            // Status Badge Logic (Standardized)
            const s = (task.status || '').toLowerCase();
            let statusColor = 'bg-slate-100 text-slate-500';
            let statusText = 'EMPTY';
            if (s === 'full') { statusColor = 'bg-rose-100 text-rose-600 border border-rose-200'; statusText = 'FULL'; }
            else if (s === 'half full' || s === 'half-full') { statusColor = 'bg-amber-100 text-amber-600 border border-amber-200'; statusText = 'HALF'; }
            else if (s === 'empty') { statusColor = 'bg-emerald-100 text-emerald-600 border border-emerald-200'; statusText = 'EMPTY'; }
            else if (s === 'completed') { statusColor = 'bg-blue-100 text-blue-600 border border-blue-200'; statusText = 'DONE'; }

            // Omission removed as requested - show all 23 bins in list

            return (
              <div
                key={task.id}
                onClick={() => handleCardClick(task.id)}
                className={`p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer select-none active:scale-[0.98]
                            ${isCompleted ? 'bg-blue-50/40 border-blue-100 opacity-60 order-last' : 'bg-white border-slate-100 shadow-sm hover:border-slate-300 hover:shadow-md'}
                            ${isSelected ? 'ring-2 ring-blue-500 border-transparent bg-blue-50/20' : ''}
                        `}
              >
                <div className="flex items-center gap-4 w-full h-[72px]">
                  {/* Left: ID Number */}
                  <div className={`w-14 h-14 shrink-0 rounded-[1rem] flex items-center justify-center font-black text-white text-[1rem] shadow border border-slate-700/50 mt-1 ml-1
                              ${isCompleted ? 'bg-blue-400' : 'bg-[#0f172a]'}
                          `}>
                    {(parseInt(task.id.replace(/\D/g, '')) || 0).toString().padStart(2, '0')}
                  </div>

                  {/* Middle: Details & Badge */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center h-full pt-1.5">
                    <h4 className="font-black text-sm text-[#0f172a] uppercase tracking-wide truncate mb-1">
                      {task.locationName || 'Unknown'}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2 truncate">
                      <MapPin size={10} className="shrink-0 text-blue-400" />
                      <span className="truncate">{task.streetName || 'No Street Specified'}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${statusColor}`}>
                        {statusText}
                      </span>

                      {/* Extra Route Info */}
                      {showRoute && !isCompleted && (
                        <>
                          <span className="text-[8px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">{dist.toFixed(1)}km</span>
                          <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">{eta}m</span>
                        </>
                      )}

                      {/* LIVE TAT INDICATOR */}
                      {tatDisplay && !isCompleted && (
                        <span className="text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest bg-amber-500 text-white animate-pulse">
                          TAT: {tatDisplay}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions (Stacked vertically on right edge) */}
                  <div className="flex flex-col gap-2 shrink-0 pr-1 py-1 h-full justify-between">
                    <button
                      onClick={(e) => handleGPSNavigate(task.coordinates.lat, task.coordinates.lng, e)}
                      className="w-11 h-[32px] rounded-[0.8rem] bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm"
                      title="Navigate"
                    >
                      <Navigation size={14} className="rotate-45" />
                    </button>

                    <button
                      onPointerDown={(e) => handleCompleteAction(task.id, e)}
                      onClick={(e) => { e.stopPropagation(); if (e.cancelable) e.preventDefault(); }}
                      style={{ touchAction: 'none' }}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all active:scale-95 shadow-sm select-none
                                      ${isCompleted ? 'bg-blue-600 border-blue-600 text-white pointer-events-none' :
                          completingIds.has(task.id) ? 'bg-emerald-50 border-emerald-500 text-emerald-500 pointer-events-none' :
                            pendingConfirmId === task.id ? 'bg-amber-500 border-amber-500 text-white' :
                              'bg-white border-emerald-400 text-emerald-500 hover:bg-emerald-50 hover:border-emerald-500'}
                                  `}
                      title="Tap twice to complete"
                    >
                      {isCompleted ? <CheckCircle2 size={24} className="animate-in zoom-in duration-300" /> :
                        completingIds.has(task.id) ? <CheckCircle2 size={24} className="animate-pulse" /> :
                          pendingConfirmId === task.id ? <Check size={24} strokeWidth={6} /> :
                            <Check size={24} strokeWidth={4} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* END OF SHIFT SUMMARY MODAL */}
      {
        shiftEnded && (
          <div className="fixed inset-0 z-[2000] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-32 bg-indigo-600 rounded-b-[50%] -translate-y-16"></div>
              <div className="relative z-10 -mt-4 mb-4">
                <div className="w-20 h-20 mx-auto bg-white rounded-3xl flex items-center justify-center shadow-xl">
                  <Truck size={40} className="text-indigo-600" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-1">Shift Complete</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Excellent Work Driver!</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Distance</p>
                  <p className="text-xl font-black text-slate-900">{accumulatedDistance.toFixed(1)} km</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg TAT</p>
                  <p className="text-xl font-black text-emerald-600">{averageTat} min</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Online</p>
                  <p className="text-xl font-black text-slate-900">{sessionDuration} m</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</p>
                  <p className="text-xl font-black text-amber-500">A+</p>
                </div>
              </div>

              <button
                onClick={() => setShiftEnded(false)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all"
              >
                Close Report
              </button>
            </div>
          </div>
        )
      }


    </div >
  );
};
