
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Bin, DriverProfile, User as UserType } from '../../types';
import { CHENNAI_LOCATIONS } from '../../constants';
import { AREA_COMPONENT_MAPPING } from '../../constants/areas';
import { getSpecialAreaBins } from '../../utils/binRandomizer';
import {
  X, MapPin, Loader2, Plus,
  CheckCircle2, LayoutGrid,
  ClipboardCheck, Timer, Navigation2, Navigation,
  Target, Trash2, Zap, Search,
  ChevronDown, User as UserIcon, Globe, Activity, Shield,
  AlertTriangle, UserCheck, Radio, Compass, Minus,
  Building, Map as MapIcon, ChevronRight, Info, UploadCloud, FileSpreadsheet,
  Check, Filter, List, MoreVertical, Clock
} from 'lucide-react';
import { databaseService } from '../../services/database.service';

// Leaflet is loaded via script tag in index.html
declare var L: any;

const CHENNAI_BOUNDARY = [
  [13.5500, 79.7000],
  [13.5500, 80.4000],
  [12.2000, 80.4000],
  [12.2000, 79.5000],
  [12.8000, 79.5000],
  [13.5500, 79.7000]
];

const WORLD_BOUNDARY = [
  [90, -180], [90, 180], [-90, 180], [-90, -180], [90, -180]
];

const isPointInChennai = (lat: number, lng: number): boolean => {
  let inside = false;
  for (let i = 0, j = CHENNAI_BOUNDARY.length - 1; i < CHENNAI_BOUNDARY.length; j = i++) {
    const xi = CHENNAI_BOUNDARY[i][0], yi = CHENNAI_BOUNDARY[i][1];
    const xj = CHENNAI_BOUNDARY[j][0], yj = CHENNAI_BOUNDARY[j][1];
    const intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const cleanLocationString = (str: string, type: 'area' | 'street') => {
  if (!str || str.trim().length === 0) return type === 'area' ? "LOCAL SECTOR" : "STREET POINT";

  const entities = ['CMWSSB', 'GCC', 'TNEB', 'CRMWW', 'CMA', 'BSNL', 'METRO', 'WATER', 'SEWERAGE', 'BOARD', 'TAMILNADU', 'TAMIL NADU', 'CORPORATION', 'GOVT', 'OFFICE', 'STATION', 'BUILDING', 'DEPOT'];
  const noise = ['India', 'Zonal', 'Zone', 'Ward', 'Division', 'District', 'Circle', 'Block', 'Unit', 'Sec', 'Sector', 'Div', 'Dept', 'Department'];

  let cleaned = str;
  // 1. Strip administrative noise with trailing numbers (e.g., "Ward 12")
  cleaned = cleaned.replace(new RegExp(`\\b(${entities.join('|')})\\b`, 'gi'), '');
  cleaned = cleaned.replace(new RegExp(`\\b(${noise.join('|')})\\b\\s*\\d+`, 'gi'), '');
  cleaned = cleaned.replace(new RegExp(`\\b(${noise.join('|')})\\b`, 'gi'), '');

  // 2. Strip standalone numbers
  cleaned = cleaned.replace(/\b\d+(\s+\d+)*\b/g, '');

  // 3. Clean special characters
  cleaned = cleaned.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ').replace(/\s+/g, ' ').trim();

  // If we cleaned EVERYTHING, put back the original without numbers
  if (!cleaned || cleaned.length < 2) {
    const rawCleaned = str.replace(/\d+/g, '').replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ').trim();
    return (rawCleaned.length > 2 ? rawCleaned : str).toUpperCase();
  }

  return cleaned.toUpperCase();
};

const getBinIconSvg = (status: Bin['status'], size: number = 32) => {
  const colors: Record<string, string> = { 'Empty': '#10b981', 'Full': '#ef4444', 'Half Full': '#f59e0b', 'Half-Full': '#f59e0b', 'Completed': '#3b82f6' };
  const color = colors[status] || colors['Empty'];
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="92" rx="30" ry="6" fill="black" opacity="0.1" />
      <path d="M25 25 L75 25 L70 85 Q68 90 63 90 L37 90 Q32 90 30 85 Z" fill="${color}" />
      <path d="M20 15 Q20 10 30 10 L70 10 Q80 10 80 15 L80 25 L20 25 Z" fill="${color}" />
      <rect x="40" y="5" width="20" height="5" rx="2" fill="${color}" opacity="0.8" />
    </svg>`;
};

interface Props {
  bins: Bin[];
  drivers: DriverProfile[];
  onUpdate: (bins: Bin[]) => void;
  adminUser?: UserType | null;
}

export const BinsManagement: React.FC<Props> = ({ bins, drivers, onUpdate, adminUser }) => {
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  const [selectedBinIds, setSelectedBinIds] = useState<string[]>([]);
  const [hoveredDriverId, setHoveredDriverId] = useState<string | null>(null);
  const pressTimerRef = useRef<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [zoneViolationActive, setZoneViolationActive] = useState(false);
  const [mapLocked, setMapLocked] = useState(false);

  // Form States
  const [formMode, setFormMode] = useState<'manual' | 'tactical'>('manual');
  const [formArea, setFormArea] = useState('');
  const [formStreet, setFormStreet] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('fleet');
  const [formCoords, setFormCoords] = useState<{ lat: number, lng: number } | null>(null);

  // Task Assessment & Selection
  const [assessmentActive, setAssessmentActive] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectionTargets, setSelectionTargets] = useState<string[]>([]);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load assessment state
    const loadSettings = async () => {
      if (adminUser?.location) {
        const settings = await databaseService.getAreaSettings(adminUser.location);
        setAssessmentActive(settings.assessmentActive || false);
      }
    };
    loadSettings();
  }, [adminUser?.location]);

  const toggleAssessment = async () => {
    if (!adminUser?.location) return;
    const newState = !assessmentActive;
    setAssessmentActive(newState);
    await databaseService.updateAreaSettings(adminUser.location, { assessmentActive: newState });

    // If turning OFF, reset to spatial split
    if (!newState && adminUser.location.toLowerCase() === 'kandigai') {
      await databaseService.distributeKandigaiBinsSpatially();
    }
  };

  const handleLongPressStart = (id: string) => {
    if (!assessmentActive) return;
    longPressTimer.current = setTimeout(() => {
      setIsSelectionMode(true);
      setSelectionTargets(prev => prev.includes(id) ? prev : [...prev, id]);
    }, 1000); // 1 second long press for selection
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleAssignSelected = async (driverId: string) => {
    const updates: any = {};
    selectionTargets.forEach(id => {
      updates[`bins/${id}/assignedDriverId`] = driverId === 'fleet' ? null : driverId;
    });
    await databaseService.updateData('/', updates);
    setIsSelectionMode(false);
    setSelectionTargets([]);
  };

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const binLayerGroupRef = useRef<any>(null);
  const dimLayerRef = useRef<any>(null);

  const visibleBins = useMemo(() => {
    if (!adminUser?.location) return bins;
    const userLocationRaw = adminUser.location.trim();
    const userLocationLower = userLocationRaw.toLowerCase();
    if (userLocationLower === 'total' || userLocationLower === 'chennai' || userLocationLower === 'all') return bins;

    let allowedComponents = AREA_COMPONENT_MAPPING[userLocationRaw];
    if (!allowedComponents) {
      const matchingKey = Object.keys(AREA_COMPONENT_MAPPING).find(k => k.toLowerCase() === userLocationLower);
      if (matchingKey) allowedComponents = AREA_COMPONENT_MAPPING[matchingKey];
    }
    allowedComponents = allowedComponents || [];

    const filtered = bins.filter(b => {
      const binArea = (b.areaName || '').trim().toLowerCase();
      const binLoc = (b.locationName || '').trim().toLowerCase();
      if (binArea === userLocationLower || binLoc === userLocationLower) return true;
      if (userLocationLower === 'west chengalpattu') {
        const isMatch = binArea === 'west chengalpattu' || binArea === 'kandigai';
        if (isMatch) return true;
        const WCP_SUB_AREAS = ['kandigai', 'nallambakkam', 'kolapakkam', 'unamancheri', 'melakottaiyur'];
        return WCP_SUB_AREAS.some(sa => binLoc.includes(sa) || binArea.includes(sa));
      }
      if (userLocationLower === 'kandigai') {
        return binArea === 'kandigai' || binLoc === 'kandigai' || binLoc === 'melakottaiyur' || binLoc === 'nallambakkam';
      }
      if (allowedComponents.length > 0) {
        return allowedComponents.some(c => {
          const compLower = c.toLowerCase();
          return binArea === compLower || binLoc === compLower || binLoc.includes(compLower);
        });
      }
      return false;
    });

    if (filtered.length > 0) {
      if (userLocationLower === 'adambakkam' || userLocationLower === 'west chengalpattu' || userLocationLower === 'kandigai' || userLocationLower === 'total' || userLocationLower === 'chennai' || userLocationLower === 'all') {
        return filtered;
      }
      return getSpecialAreaBins(filtered, userLocationRaw);
    }
    return filtered;
  }, [bins, adminUser?.location]);

  const stats = useMemo(() => ({
    total: visibleBins.length,
    completed: visibleBins.filter(b => (b.status || '').toUpperCase() === 'COMPLETED').length,
    pending: visibleBins.filter(b => b.status === 'Full' || b.status === 'Half-Full' || b.status === 'Half Full').length
  }), [visibleBins]);

  const nextId = useMemo(() => {
    const ids = bins.map(b => parseInt(b.id)).filter(id => !isNaN(id));
    const max = ids.length > 0 ? Math.max(...ids) : 0;
    return (max + 1).toString().padStart(2, '0');
  }, [bins]);

  const selectedAreaStreets = useMemo(() => {
    const area = CHENNAI_LOCATIONS.find(loc => loc.name.toUpperCase() === formArea.toUpperCase());
    return area ? area.streets : [];
  }, [formArea]);

  const getDriverName = (id?: string) => {
    if (assessmentActive) return 'GENERAL';
    if (!id || id === 'fleet') return 'UNASSIGNED';
    const driver = drivers.find(d => d.employeeId === id || d.driverId === id);
    return driver ? (driver.username || 'UNKNOWN').toUpperCase() : 'UNASSIGNED';
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'User-Agent': 'UjjwalHub' }
      });
      const data = await res.json();
      const addr = data.address || {};

      // Much more granular area detection
      let rawArea = addr.suburb || addr.neighbourhood || addr.city_district || addr.village || addr.town || addr.hamlet || addr.residential || addr.subdistrict || addr.city || "";

      // Much smarter street/point detection (landmarks first)
      let rawStreet = addr.road || addr.pedestrian || addr.footway || addr.path || addr.address29 || addr.place || addr.amenity || addr.building || addr.office || addr.shop || "";

      // IF AREA AND STREET ARE THE SAME, try to find a more specific landmark
      if (rawArea.toLowerCase() === rawStreet.toLowerCase() || !rawStreet) {
        const landmark = addr.amenity || addr.building || addr.office || addr.shop || addr.tourism || addr.historic || addr.leisure || "";
        if (landmark && landmark.toLowerCase() !== rawArea.toLowerCase()) {
          rawStreet = landmark;
        } else if (data.display_name) {
          const parts = data.display_name.split(',');
          const firstPart = parts[0].trim();
          if (firstPart.toLowerCase() !== rawArea.toLowerCase()) {
            rawStreet = firstPart;
          }
        }
      }

      setFormArea(cleanLocationString(rawArea, 'area'));
      setFormStreet(cleanLocationString(rawStreet, 'street'));
    } catch (e) {
      setFormArea("MANUAL SECTOR");
      setFormStreet("EXACT POINT");
    } finally {
      setIsGeocoding(false);
    }
  };

  const triggerViolation = (lat: number, lng: number) => {
    setZoneViolationActive(true); setMapLocked(true); setIsFormOpen(false);
    dimLayerRef.current = L.polygon([WORLD_BOUNDARY, CHENNAI_BOUNDARY], { fillColor: '#000', fillOpacity: 0.6, stroke: false, interactive: false }).addTo(leafletMapRef.current);
    const goldenBorder = L.polygon(CHENNAI_BOUNDARY, { color: '#fbbf24', weight: 4, fillOpacity: 0.05 }).addTo(leafletMapRef.current);
    setTimeout(() => {
      if (dimLayerRef.current) leafletMapRef.current.removeLayer(dimLayerRef.current);
      if (goldenBorder) leafletMapRef.current.removeLayer(goldenBorder);
      setZoneViolationActive(false); setMapLocked(false);
    }, 4000);
  };

  useEffect(() => {
    if (mapContainerRef.current && !leafletMapRef.current) {
      leafletMapRef.current = L.map(mapContainerRef.current, { center: [13.0827, 80.2707], zoom: 12, zoomControl: false, doubleClickZoom: false });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(leafletMapRef.current);
      binLayerGroupRef.current = L.layerGroup().addTo(leafletMapRef.current);

      leafletMapRef.current.on('dblclick', (e: any) => {
        if (mapLocked) return;
        const { lat, lng } = e.latlng;
        if (!isPointInChennai(lat, lng)) { triggerViolation(lat, lng); return; }
        setFormCoords({ lat, lng }); setFormMode('tactical'); setIsFormOpen(true);
        reverseGeocode(lat, lng);
      });
      leafletMapRef.current.on('click', () => !mapLocked && setSelectedBinId(null));

      setTimeout(() => {
        leafletMapRef.current?.invalidateSize();
      }, 500);
    }
  }, [mapLocked]);

  useEffect(() => {
    if (!leafletMapRef.current || !binLayerGroupRef.current) return;
    binLayerGroupRef.current.clearLayers();
    visibleBins.forEach(bin => {
      if (!bin.coordinates) return;
      const isMultiSelected = selectedBinIds.includes(bin.id);
      const isHoveredZone = hoveredDriverId === bin.assignedDriverId;
      const shouldDim = hoveredDriverId && !isHoveredZone;
      const dName = getDriverName(bin.assignedDriverId);

      const marker = L.marker([bin.coordinates.lat, bin.coordinates.lng], {
        icon: L.divIcon({
          className: 'bin-marker',
          html: `<div style="width:36px; height:36px; display:flex; align-items:center; justify-content:center; position:relative; transition: all 0.3s ease; opacity: ${shouldDim ? 0.3 : 1}; transform: scale(${isHoveredZone ? 1.2 : 1});">
            <div style="position:absolute; inset:-4px; border-radius:50%; border: 3px solid ${isHoveredZone ? '#fbbf24' : (isMultiSelected ? '#6366f1' : 'transparent')}; opacity: ${isHoveredZone || isMultiSelected ? 1 : 0};"></div>
            ${getBinIconSvg(bin.status, 36)}
          </div>`,
          iconSize: [36, 36], iconAnchor: [18, 18]
        })
      }).addTo(binLayerGroupRef.current);

      marker.on('click', (e: any) => {
        L.DomEvent.stopPropagation(e);
        if (selectedBinIds.length > 0) {
          setSelectedBinIds(prev => prev.includes(bin.id) ? prev.filter(id => id !== bin.id) : [...prev, bin.id]);
        } else {
          setSelectedBinId(bin.id);
          leafletMapRef.current.flyTo([bin.coordinates.lat, bin.coordinates.lng], 18);
        }
      });
    });
  }, [visibleBins, selectedBinIds, hoveredDriverId]);

  const handleDeployment = () => {
    if (!formArea || !formStreet) return;
    const newBin: Bin = {
      id: nextId,
      status: 'Empty',
      locationName: formArea,
      streetName: formStreet,
      areaName: adminUser?.location || formArea,
      coordinates: formCoords || { lat: 13.08, lng: 80.20 },
      assignedDriverId: selectedDriverId === 'fleet' ? undefined : selectedDriverId
    };
    onUpdate([...bins, newBin]);
    setIsFormOpen(false);
    setFormArea(''); setFormStreet(''); setFormCoords(null); setFormMode('manual');
  };

  const handleCloseUI = () => {
    setIsFormOpen(false);
    setFormMode('manual');
    setFormCoords(null);
    setFormArea('');
    setFormStreet('');
  };

  const handleBulkAssign = (driverId: string) => {
    const updatedBins = bins.map(b => selectedBinIds.includes(b.id) ? { ...b, assignedDriverId: driverId } : b);
    onUpdate(updatedBins);
    setSelectedBinIds([]);
  };

  const handleDeleteUnassigned = async () => {
    const unassignedCount = visibleBins.filter(b => !b.assignedDriverId || b.assignedDriverId === 'unassigned').length;
    if (window.confirm(`⚠️ PERMANENT DELETE: Are you sure you want to remove ALL ${unassignedCount} unassigned nodes? This will delete them from the database forever.`)) {
      try {
        const unassignedIds = visibleBins.filter(b => !b.assignedDriverId || b.assignedDriverId === 'unassigned').map(b => b.id);
        const updates: any = {};
        unassignedIds.forEach(id => {
          updates[`bins/${id}`] = null;
        });
        await databaseService.updateData('/', updates); // General batch update helper
        alert(`✅ ${unassignedCount} unassigned nodes have been purged.`);
      } catch (err) {
        // Fallback if updateData helper is not ideal
        const unassignedIds = visibleBins.filter(b => !b.assignedDriverId || b.assignedDriverId === 'unassigned').map(b => b.id);
        const filteredBins = bins.filter(b => !unassignedIds.includes(b.id));
        onUpdate(filteredBins);
        alert(`✅ Refreshing local state... Unassigned nodes removed.`);
      }
    }
  };


  const currentDetailBin = visibleBins.find(b => b.id === selectedBinId);

  return (
    <div className="space-y-6 pb-24 px-2 relative">
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <LayoutGrid size={18} />, label: 'Hubs', val: stats.total, color: 'indigo' },
          { icon: <ClipboardCheck size={18} />, label: 'Cleared', val: stats.completed, color: 'emerald' },
          { icon: <Timer size={18} />, label: 'Tasks', val: stats.pending, color: 'amber' }
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
            <div className={`text-${s.color}-600 mb-2`}>{s.icon}</div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-lg font-black text-slate-900 leading-none">{s.val}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 px-2">
        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">TaskPro Grid</h2>

        {/* Assessment Toggle */}
        <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl px-6 py-3 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">UjjwalHUB Task Assessment</span>
          <button
            onClick={toggleAssessment}
            className={`w-12 h-6 rounded-full transition-all relative ${assessmentActive ? 'bg-indigo-600' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${assessmentActive ? 'right-1' : 'left-1'}`} />
          </button>
          <span className={`text-[10px] font-black uppercase ${assessmentActive ? 'text-indigo-600' : 'text-slate-400'}`}>
            {assessmentActive ? 'ON' : 'OFF'}
          </span>
        </div>

        <div className="flex gap-2">
          <button onClick={() => { setFormMode('manual'); setFormCoords(null); setFormArea(''); setFormStreet(''); setIsFormOpen(true); }}
            className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2">
            <Plus size={16} /> Deploy Node
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-1 border shadow-xl relative overflow-hidden h-[400px]">
        <div ref={mapContainerRef} className="w-full h-full rounded-[2.3rem]" />

        {/* CUSTOM MAP CONTROLS */}
        <div className="absolute left-4 bottom-4 z-[400] flex flex-col items-center p-1 bg-white/90 backdrop-blur-md rounded-xl border border-white/20 shadow-xl gap-2">
          <button onClick={(e) => { e.stopPropagation(); leafletMapRef.current?.zoomIn(); }} className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
            <Plus size={16} strokeWidth={3} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); leafletMapRef.current?.setView([13.0827, 80.2707], 12); }} className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
            <Compass size={16} strokeWidth={3} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); leafletMapRef.current?.zoomOut(); }} className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
            <Minus size={16} strokeWidth={3} />
          </button>
        </div>

        {/* TACTICAL OVERLAY */}
        <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white text-[9px] font-black text-slate-500 uppercase tracking-widest pointer-events-none shadow-lg z-10 flex items-center gap-2">
          <Activity size={12} className="text-indigo-500 animate-pulse" /> Double-tap for Tactical Placement
        </div>

        {selectedBinId && currentDetailBin && (
          <div className="absolute top-6 right-6 w-80 bg-white/98 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border-4 border-white z-[1000] animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-black text-slate-900 uppercase">Node #{currentDetailBin.id}</h4>
              <button onClick={() => setSelectedBinId(null)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900 transition-colors"><X size={20} /></button>
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">{currentDetailBin.locationName}</p>
            <p className="text-[10px] text-slate-400 mb-2">{currentDetailBin.streetName}</p>
            <div className="flex items-center gap-3 py-3 px-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
              <UserIcon size={16} className="text-indigo-400" />
              <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight truncate">
                {getDriverName(currentDetailBin.assignedDriverId)}
              </p>
            </div>
            <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 ${currentDetailBin.status === 'Full' ? 'bg-rose-100 text-rose-600' :
              currentDetailBin.status === 'Half-Full' || currentDetailBin.status === 'Half Full' ? 'bg-amber-100 text-amber-600' :
                currentDetailBin.status === 'Completed' ? 'bg-blue-100 text-blue-600' :
                  'bg-emerald-100 text-emerald-600'
              }`}>
              {currentDetailBin.status || 'EMPTY'}
            </div>
            <button onClick={() => {
              const url = `https://www.google.com/maps?q=${currentDetailBin.coordinates.lat},${currentDetailBin.coordinates.lng}`;
              window.open(url, '_blank');
            }}
              className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 mb-2 hover:bg-indigo-600 hover:text-white transition-all">
              <Navigation size={14} /> Navigate to GMap
            </button>
            <button onClick={() => { if (confirm('Remove this node?')) { onUpdate(bins.filter(b => b.id !== currentDetailBin.id)); setSelectedBinId(null); } }} className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-600 hover:text-white transition-all">
              <Trash2 size={14} /> Remove Node
            </button>
          </div>
        )}

        {/* FLOATING DEPLOYMENT FORM - INSIDE MAP */}
        {isFormOpen && (
          <div className="absolute inset-4 z-[1000] flex items-center justify-center pointer-events-none">
            <div className="w-full max-w-[340px] bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl p-6 space-y-6 pointer-events-auto border-4 border-white animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90%] no-scrollbar">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Plus size={20} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Deploy Node</h3>
                </div>
                <button onClick={handleCloseUI} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:text-slate-900 transition-colors"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Shield size={10} className="text-indigo-400" />
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em]">Serial ID: #{nextId}</span>
                </div>

                <div className="space-y-3 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Detected Area</p>
                    <input
                      type="text"
                      className="w-full p-3 bg-white border border-slate-100 rounded-xl font-black text-[11px] text-slate-700 uppercase focus:border-indigo-500 outline-none transition-all"
                      value={formArea}
                      onChange={(e) => setFormArea(e.target.value)}
                      placeholder="ENTER AREA..."
                    />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Street Point</p>
                    <input
                      type="text"
                      className="w-full p-3 bg-white border border-slate-100 rounded-xl font-black text-[11px] text-slate-700 uppercase focus:border-indigo-500 outline-none transition-all"
                      value={formStreet}
                      onChange={(e) => setFormStreet(e.target.value)}
                      placeholder="ENTER STREET..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Assign Driver</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 no-scrollbar">
                    {drivers
                      .filter(d => {
                        const dLoc = (d.location || '').toLowerCase();
                        const adminLoc = (adminUser?.location || '').toLowerCase();
                        return dLoc === adminLoc || dLoc === formArea.toLowerCase();
                      })
                      .map(d => (
                        <button key={d.driverId} onClick={() => setSelectedDriverId(d.driverId)} className={`w-full p-3 rounded-2xl border-2 transition-all flex items-center justify-between ${selectedDriverId === d.driverId ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-50 bg-white hover:border-indigo-100 shadow-sm'}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-600">
                              {(d.username || 'DR').substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-[10px] font-black text-slate-700 uppercase">{(d.username || 'UNKNOWN')}</span>
                          </div>
                          {selectedDriverId === d.driverId && <CheckCircle2 size={14} className="text-indigo-600" />}
                        </button>
                      ))}
                    <button onClick={() => setSelectedDriverId('fleet')} className={`w-full p-3 rounded-2xl border-2 transition-all flex items-center justify-between ${selectedDriverId === 'fleet' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-50 bg-white hover:border-indigo-100 shadow-sm'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">
                          GF
                        </div>
                        <span className="text-[10px] font-black text-slate-700 uppercase">General Fleet</span>
                      </div>
                      {selectedDriverId === 'fleet' && <CheckCircle2 size={14} className="text-indigo-600" />}
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={handleDeployment} disabled={!formArea || !formStreet || isGeocoding} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] disabled:opacity-20 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                {isGeocoding ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />} DEPLOY ASSET NODE
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-12">
        {(() => {
          // Grouping logic that ensures ALL visible bins are shown
          const grouped: Record<string, Bin[]> = {};
          visibleBins.forEach(bin => {
            const key = bin.assignedDriverId || 'unassigned';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(bin);
          });

          const groupKeys = Object.keys(grouped).sort((a, b) => {
            if (a === 'unassigned') return -1;
            if (b === 'unassigned') return 1;
            return a.localeCompare(b);
          });

          if (groupKeys.length === 0) {
            return (
              <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">No active nodes in this sector</p>
              </div>
            );
          }

          return groupKeys.map(key => {
            const groupBins = grouped[key];
            const driver = drivers.find(d => d.employeeId === key || d.driverId === key);
            let dName = driver ? (driver.username || 'UNKNOWN').toUpperCase() : (key === 'unassigned' ? 'UNASSIGNED NODES' : 'EXTERNAL FLEET');

            if (assessmentActive && key !== 'unassigned') {
              dName = 'GENERAL';
            }

            return (
              <div key={key} className="space-y-6">
                <div className="flex items-center justify-between px-4 py-2 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 self-start w-full">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs ${key === 'unassigned' ? 'bg-slate-400' : 'bg-indigo-600'}`}>
                      {(dName || '').substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase">{dName}</h3>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{groupBins.length} BINS</p>
                    </div>
                  </div>

                  {key === 'unassigned' && adminUser?.location && (
                    <div className="flex gap-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase italic">Nodes pending manual or spatial split</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupBins.sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0)).map(bin => {
                    const isCompleted = bin.status === 'Completed';
                    const isSelected = selectedBinIds.includes(bin.id) || selectedBinId === bin.id;
                    return (
                      <div key={bin.id}
                        onMouseEnter={() => setHoveredDriverId(bin.assignedDriverId || null)}
                        onMouseLeave={() => setHoveredDriverId(null)}
                        onMouseDown={() => handleLongPressStart(bin.id)}
                        onMouseUp={handleLongPressEnd}
                        onTouchStart={() => handleLongPressStart(bin.id)}
                        onTouchEnd={handleLongPressEnd}
                        onClick={() => {
                          if (isSelectionMode) {
                            setSelectionTargets(prev => prev.includes(bin.id) ? prev.filter(id => id !== bin.id) : [...prev, bin.id]);
                            return;
                          }
                          if (selectedBinIds.length > 0) {
                            setSelectedBinIds(prev => prev.includes(bin.id) ? prev.filter(id => id !== bin.id) : [...prev, bin.id]);
                          } else {
                            setSelectedBinId(bin.id);
                            leafletMapRef.current?.flyTo([bin.coordinates.lat, bin.coordinates.lng], 18);
                          }
                        }}
                        className={`bg-white p-6 rounded-[2.5rem] border transition-all duration-300 relative ${isSelected || selectionTargets.includes(bin.id) ? 'border-indigo-500 shadow-xl scale-[1.02]' : 'border-slate-100 hover:border-indigo-200'} ${isCompleted ? 'opacity-60 grayscale-[0.3]' : ''}`}
                      >
                        {isSelectionMode && (
                          <div className="absolute top-4 left-4 z-10">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${selectionTargets.includes(bin.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
                              {selectionTargets.includes(bin.id) && <Check size={14} strokeWidth={4} />}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-[1rem] flex items-center justify-center font-black text-white text-[1rem] ${isCompleted ? 'bg-indigo-300' : 'bg-[#0f172a]'}`}>
                            {bin.id.padStart(2, '0')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-black text-sm text-[#0f172a] uppercase truncate">{bin.locationName}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${bin.status === 'Full' ? 'bg-rose-100 text-rose-600' :
                                bin.status === 'Half-Full' || bin.status === 'Half Full' ? 'bg-amber-100 text-amber-600' :
                                  bin.status === 'Completed' ? 'bg-blue-100 text-blue-600' :
                                    'bg-emerald-100 text-emerald-600'
                                }`}>
                                {bin.status || 'EMPTY'}
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{bin.streetName}</p>
                            <span className="text-[8px] font-bold px-2 py-1 rounded bg-slate-50 border border-slate-200 text-slate-500 uppercase">
                              {getDriverName(bin.assignedDriverId)}
                            </span>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button onClick={(e) => {
                              e.stopPropagation();
                              const url = `https://www.google.com/maps?q=${bin.coordinates.lat},${bin.coordinates.lng}`;
                              window.open(url, '_blank');
                            }}
                              className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-100 shadow-sm"
                              title="Open in Google Maps">
                              <Navigation size={14} className="rotate-45" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this bin?')) onUpdate(bins.filter(b => b.id !== bin.id)); }}
                              className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-rose-300 hover:bg-rose-50 hover:text-rose-500 transition-colors border border-slate-100 shadow-sm">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}
      </div>

      {isSelectionMode && selectionTargets.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[2000] bg-slate-900 rounded-t-[3rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] p-8 border-t border-slate-800 animate-in slide-in-from-bottom-20 duration-500">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-6 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Tasks Selected</span>
                <p className="text-2xl font-black text-white leading-none">{selectionTargets.length}</p>
              </div>
              <button onClick={() => { setIsSelectionMode(false); setSelectionTargets([]); }} className="p-3 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all"><X size={20} /></button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Assign To:</span>
              <div className="flex gap-2">
                {drivers
                  .filter(d => (d.location || '').toLowerCase() === (adminUser?.location || '').toLowerCase())
                  .map(d => (
                    <button key={d.driverId} onClick={() => handleAssignSelected(d.driverId)} className="shrink-0 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl active:scale-95">
                      {d.username.split(' ')[0]}
                    </button>
                  ))}
                <button onClick={() => handleAssignSelected('fleet')} className="shrink-0 px-6 py-4 bg-slate-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-600 transition-all shadow-xl active:scale-95">
                  General Fleet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedBinIds.length > 0 && !isSelectionMode && (
        <div className="fixed bottom-0 left-0 right-0 z-[2000] bg-white rounded-t-[3rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] p-8 border-t border-slate-100">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-6 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black">{selectedBinIds.length}</div>
              <button onClick={() => setSelectedBinIds([])} className="p-3 bg-slate-100 rounded-xl"><X size={16} /></button>
            </div>
            <div className="flex gap-2">
              {drivers.map(d => (
                <button key={d.driverId} onClick={() => handleBulkAssign(d.driverId)} className="shrink-0 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase">
                  {d.username.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}


      {zoneViolationActive && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[5000] bg-slate-950 text-white px-10 py-6 rounded-full border-2 border-amber-500 font-black uppercase tracking-tight shadow-2xl scale-110">
          OUTSIDE CHENNAI GRID LIMITS
        </div>
      )}
    </div>
  );
};
