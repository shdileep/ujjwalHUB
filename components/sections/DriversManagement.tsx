
import React, { useState, useEffect } from 'react';
import { databaseService } from '../../services/database.service';
import { DriversHubEntry, User, AppState } from '../../types';
import { Phone, Mail, User as UserIcon, Clock, ShieldCheck, Search, CheckCircle2, UserCheck, UserX, Calendar, Eye, X, FileBarChart, Download, Printer, ShieldAlert, BadgeCheck, FileText, Scale, Activity, Briefcase, Lock, Unlock, MapPin, Trash2, Send } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IdentityCard } from './IdentityCard';
import { AREA_COMPONENT_MAPPING } from '../../constants/areas';

interface Props {
  drivers: DriversHubEntry[];
  updateState: (updates: Partial<AppState>) => void;
  adminUser?: User | null;
}

const DutyLogsModal: React.FC<{ driver: DriversHubEntry; onClose: () => void }> = ({ driver, onClose }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
      <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Activity size={24} /></div>
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Operational Lifecycle logs</h3>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{driver.personnelIdentity.name} • Registry {driver.driverId}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-4 bg-slate-100 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-sm active:scale-95">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-slate-50/50">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duty Start</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Logout Time</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Duration (Min)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {driver.workLogs && driver.workLogs.length > 0 ? (
                driver.workLogs.map((log: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">{log.date || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-emerald-500" />
                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.start || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-rose-500" />
                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.end || 'ACTIVE'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${log.duration === 'Active' ? 'bg-indigo-50 text-indigo-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                        {log.duration || '0 min'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No Operational Logs Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="px-10 py-8 border-t border-slate-100 flex justify-center bg-white">
        <button onClick={onClose} className="px-16 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all active:scale-95">
          Close Registry
        </button>
      </div>
    </div>
  </div>
);

const PdfViewerModal: React.FC<{ url: string; title: string; onClose: () => void }> = ({ url, title, onClose }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
    <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
      <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h3>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Official Digital Registry Transcript</p>
        </div>
        <button onClick={onClose} className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 rounded-2xl transition-all shadow-sm active:scale-95">
          <X size={24} />
        </button>
      </div>
      <div className="flex-1 bg-slate-100 p-4 relative group">
        <iframe src={url} className="w-full h-full rounded-2xl shadow-inner border border-slate-200" title="PDF Viewer" />
        <div className="absolute top-8 right-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <a href={url} download={title + ".pdf"} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-emerald-700 transition-all">
            <Download size={14} /> Direct Download
          </a>
        </div>
      </div>
      <div className="px-10 py-6 border-t border-slate-100 flex justify-center bg-white">
        <button onClick={onClose} className="px-16 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95">
          Close Registry
        </button>
      </div>
    </div>
  </div>
);

export const DriversManagement: React.FC<Props> = ({ drivers, updateState, adminUser }) => {
  const [selectedDriverForId, setSelectedDriverForId] = useState<DriversHubEntry | null>(null);
  const [selectedDriverForLogs, setSelectedDriverForLogs] = useState<DriversHubEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [driverLocations, setDriverLocations] = useState<Record<string, string>>({});
  const [pdfPreview, setPdfPreview] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      const users = await databaseService.getAllUsers();
      const locMap: Record<string, string> = {};
      users.forEach((u: any) => {
        if (u.role === 'driver') {
          const id = u.employeeId || u.driverId;
          if (id) {
            locMap[id.toLowerCase()] = u.location || '';
          }
        }
      });
      setDriverLocations(locMap);
    };
    fetchLocations();
  }, []);

  const calculateDuration = (start: string, end?: string) => {
    if (!end) return 'Ongoing';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (diff < 0) return 'N/A';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const mapDriverToUser = (driver: DriversHubEntry): User => ({
    username: driver.personnelIdentity.name,
    email: driver.personnelIdentity.email || '',
    phone: driver.personnelIdentity.phone,
    employeeId: driver.driverId,
    role: 'driver',
    uid: driver.driverId,
    profilePhoto: driver.personnelIdentity.profilePhoto,
  } as any);

  const toggleAccountActivation = async (driverId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Operational' ? 'Blocked' : 'Operational';
    const updates: any = {};
    updates[`DriversHub/${driverId}/accountLifecycle/status`] = newStatus;
    updates[`DriversHub/${driverId}/utility/blockUser`] = (newStatus === 'Blocked');
    updates[`drivers/${driverId}/isActive`] = (newStatus === 'Operational');

    await databaseService.updateDriver(driverId, {
      isActive: (newStatus === 'Operational'),
      status: (newStatus === 'Operational' ? 'offline' : 'blocked')
    });
  };

  const handleDeleteDriver = async (driverId: string, email?: string) => {
    const confirmation = window.confirm(`⚠️ PERMANENT DELETE: Are you sure you want to wipe all records for driver ${driverId}? This will remove them from the Hub, Live Status, Signup records, and unassign all their bins. THIS CANNOT BE UNDONE.`);
    if (confirmation) {
      try {
        await databaseService.deleteDriver(driverId, email);
        alert(`✅ Driver ${driverId} and all associated data have been purged.`);
      } catch (err) {
        console.error("Purge failed:", err);
        alert("❌ Error purging driver records.");
      }
    }
  };

  const addHeaderAndFooter = (doc: jsPDF, title: string, driver: DriversHubEntry) => {
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Header & Title
    doc.setFontSize(24);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFont("helvetica", "bold");
    doc.text("UJJWAL HUB", 14, 20);

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("URBAN INFRASTRUCTURE & SANITATION • GOVT OF TAMIL NADU", 14, 25);
    doc.setDrawColor(79, 70, 229);
    doc.line(14, 28, pageWidth - 14, 28);

    doc.setFontSize(14);
    doc.setTextColor(50);
    doc.text(title, 14, 40);

    // 2. Info Card (Photo Left, Details Right)
    doc.setDrawColor(230);
    doc.setFillColor(252, 252, 255);
    doc.roundedRect(14, 45, pageWidth - 28, 45, 4, 4, "FD");

    // PHOTO (LEFT)
    const photoX = 18;
    const photoY = 50;
    const photoW = 30;
    const photoH = 35;
    if (driver.personnelIdentity.profilePhoto && driver.personnelIdentity.profilePhoto.startsWith('data:')) {
      try {
        doc.addImage(driver.personnelIdentity.profilePhoto, 'JPEG', photoX, photoY, photoW, photoH);
      } catch (e) {
        doc.rect(photoX, photoY, photoW, photoH);
      }
    } else {
      doc.setDrawColor(200);
      doc.rect(photoX, photoY, photoW, photoH);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text("ID PHOTO", photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
    }

    // DETAILS (RIGHT)
    const detailX = 55;
    doc.setFontSize(11);
    doc.setTextColor(30);
    doc.setFont("helvetica", "bold");
    doc.text(driver.personnelIdentity.name || 'N/A', detailX, 58);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`ID: ${driver.driverId || 'N/A'}`, detailX, 64);
    doc.text(`Email: ${driver.personnelIdentity.email || 'N/A'}`, detailX, 70);
    doc.text(`Phone: ${driver.personnelIdentity.phone || 'N/A'}`, detailX, 76);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(`Working Hub: ${driver.personnelIdentity.location || 'Kandigai'}`, detailX, 84);
  };

  const addSignatureAndStamp = (doc: jsPDF, finalY: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = finalY + 25;

    if (currentY + 60 > pageHeight) {
      doc.addPage();
      currentY = 40;
    }

    // DRAWN SIGNATURE (Sachin Jhawar) - Using paths to ensure "NOT TEXT"
    doc.setDrawColor(20, 50, 150); // Deep Blue Ink
    doc.setLineWidth(0.5);

    const sX = 14;
    const sY = currentY + 10;

    // Simulating cursive 'Sachin' with paths
    doc.moveTo(sX, sY);
    doc.curveTo(sX + 5, sY - 8, sX + 10, sY - 5, sX + 8, sY);
    doc.curveTo(sX + 5, sY + 5, sX - 2, sY + 8, sX + 2, sY + 12);
    doc.lineTo(sX + 12, sY + 10);
    doc.curveTo(sX + 10, sY + 14, sX + 15, sY + 14, sX + 14, sY + 10);
    doc.curveTo(sX + 18, sY + 8, sX + 18, sY + 14, sX + 22, sY + 12);
    doc.lineTo(sX + 24, sY + 2);
    doc.lineTo(sX + 24, sY + 12);
    doc.curveTo(sX + 26, sY + 8, sX + 28, sY + 12, sX + 30, sY + 12);
    doc.lineTo(sX + 32, sY + 12);
    doc.curveTo(sX + 34, sY + 8, sX + 36, sY + 12, sX + 38, sY + 12);
    doc.curveTo(sX + 40, sY + 8, sX + 42, sY + 12, sX + 44, sY + 12);
    doc.moveTo(sX - 2, sY + 15);
    doc.curveTo(sX + 20, sY + 18, sX + 40, sY + 13, sX + 55, sY + 16);
    doc.stroke();

    doc.setFontSize(10);
    doc.setTextColor(30);
    doc.setFont("helvetica", "bold");
    doc.text("SACHIN JHAWAR", 14, currentY + 25);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("AUTHORIZED SECTION DIRECTOR", 14, currentY + 29);
    doc.text("UJJWAL HUB OPERATIONS • GOVT OF TN", 14, currentY + 33);
    doc.text("Registry Token: UHD-CERT-" + Math.floor(Math.random() * 900000), 14, currentY + 37);

    const sealX = pageWidth - 55;
    const sealY = currentY + 5;
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(1);
    doc.circle(sealX + 20, sealY + 20, 20);
    doc.circle(sealX + 20, sealY + 20, 18);
    doc.setFontSize(5);
    doc.text("OFFICIAL SEAL • UJJWAL HUB", sealX + 20, sealY + 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text("CERTIFIED", sealX + 20, sealY + 23, { align: 'center' });
    doc.setFontSize(4);
    doc.text(" TAMIL NADU MUNICIPAL AUTH ", sealX + 20, sealY + 28, { align: 'center' });

    doc.setTextColor(180);
    doc.setFontSize(7);
    doc.text("Authenticated on: " + new Date().toLocaleString(), 14, pageHeight - 10);
  };

  const generateTaskReport = async (driver: DriversHubEntry) => {
    const doc = new jsPDF();
    const profile = await databaseService.getDriver(driver.driverId);
    if (profile) {
      driver.personnelIdentity.email = profile.email || driver.personnelIdentity.email;
      driver.personnelIdentity.location = profile.location || driver.personnelIdentity.location;
    }

    addHeaderAndFooter(doc, "DEPLOYMENT TASK REGISTRY", driver);

    const allBins = await databaseService.getAllBins();
    const normalizedTargetId = (driver.driverId || '').toString().toLowerCase().trim();
    const completedTasks = allBins.filter(b => {
      const isCompleted = b.status === 'Completed';
      const assignedId = (b.assignedDriverId || '').toString().toLowerCase().trim();
      return isCompleted && (assignedId === normalizedTargetId || normalizedTargetId.includes(assignedId) || assignedId.includes(normalizedTargetId));
    });

    const rows = completedTasks.map((t, i) => [
      i + 1,
      t.locationName || 'Smart Bin Asset',
      t.id,
      `${t.areaName || ''} - ${t.streetName || ''}`,
      t.status === 'Completed' ? (t as any).lastUpdated || (t as any).lastCollection || new Date().toLocaleString() : 'PENDING'
    ]);

    autoTable(doc, {
      startY: 95,
      head: [['S.NO', 'TASK NAME', 'TASK ID', 'BIN LOCATION', 'COLLECTION TIME']],
      body: rows.length ? rows : [['-', 'NO COMPLETED TASKS DETECTED', '-', '-', '-']],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 95;
    addSignatureAndStamp(doc, finalY);

    const pdfBlob = doc.output('bloburl');
    setPdfPreview({ url: pdfBlob as unknown as string, title: "DEPLOYMENT TASK REGISTRY" });
  };

  const generateLifecycleReport = async (driver: DriversHubEntry) => {
    const doc = new jsPDF();
    const profile = await databaseService.getDriver(driver.driverId);
    if (profile) {
      driver.personnelIdentity.email = profile.email || driver.personnelIdentity.email;
      driver.personnelIdentity.location = profile.location || driver.personnelIdentity.location;
    }

    addHeaderAndFooter(doc, "OPERATIONAL LIFECYCLE LOGS", driver);

    const workLogs = driver.workLogs || [];
    const rows = workLogs.length > 0
      ? workLogs.map((log: any, i: number) => [
        i + 1,
        log.id || 'N/A',
        log.date || 'N/A',
        log.start || 'N/A',
        log.end || (log.duration === 'Active' ? 'STILL ON DUTY' : 'STALE'),
        log.duration || 'In Progress'
      ])
      : [['-', 'NO LOGS RECORDED IN CLOUD', '-', '-', '-', '-']];

    autoTable(doc, {
      startY: 95,
      head: [['S.NO', 'LOG ID', 'WORK DATE', 'DUTY START', 'LOGOUT TIME', 'TOTAL DURATION']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 7 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 95;
    addSignatureAndStamp(doc, finalY);

    const pdfBlob = doc.output('bloburl');
    setPdfPreview({ url: pdfBlob as unknown as string, title: "OPERATIONAL LIFECYCLE LOGS" });
  };

  const filteredDrivers = (drivers || []).filter(driver => {
    const id = (driver.driverId || '').toUpperCase();
    if (!id.startsWith('UHD') && !id.startsWith('EMP')) return false;

    const matchesSearch = (driver.personnelIdentity?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (driver.driverId || '').toLowerCase().includes(searchQuery.toLowerCase());

    const adminLocRaw = (adminUser?.location || '').trim();
    if (!adminLocRaw || ['all', 'total', 'chennai'].includes(adminLocRaw.toLowerCase())) return matchesSearch;

    const adminLocLower = adminLocRaw.toLowerCase();
    const targetId = driver.driverId || '';
    let driverLoc = (driver.personnelIdentity?.location || driverLocations[targetId.toLowerCase()] || (driver as any).location || '').trim();
    const driverLocLower = driverLoc.toLowerCase();

    if (!driverLocLower) return false;
    if (driverLocLower === adminLocLower) return matchesSearch;

    if (adminLocLower === 'west chengalpattu') {
      const WCP_SUB_AREAS = ['west chengalpattu', 'kandigai', 'nallambakkam', 'kolapakkam', 'unamancheri', 'melakottaiyur'];
      if (WCP_SUB_AREAS.some(sa => driverLocLower.includes(sa))) return matchesSearch;
    }

    let allowedComponents = AREA_COMPONENT_MAPPING[adminLocRaw];
    if (!allowedComponents) {
      const key = Object.keys(AREA_COMPONENT_MAPPING).find(k => k.toLowerCase() === adminLocLower);
      if (key) allowedComponents = AREA_COMPONENT_MAPPING[key];
    }
    allowedComponents = (allowedComponents || []).map(c => c.toLowerCase());

    return matchesSearch && allowedComponents.some(c => driverLocLower === c || driverLocLower.includes(c));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden px-2">
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">DriversHUB Console</h2>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search assets..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 shadow-sm text-sm font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel Identity</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Lifecycle</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Deployment</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Availability</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Utility</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredDrivers.map(driver => (
              <tr key={driver.driverId} className="hover:bg-indigo-50/20 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg shadow-inner overflow-hidden border-2 border-white">
                      {driver.personnelIdentity.profilePhoto ? (
                        <img src={driver.personnelIdentity.profilePhoto} alt="" className="w-full h-full object-cover" />
                      ) : (driver.personnelIdentity.name || 'U').charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm mb-1">{driver.personnelIdentity.name}</p>
                      <p className="text-[10px] font-mono font-black text-indigo-600 tracking-widest">{driver.driverId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <button
                    onClick={() => generateLifecycleReport(driver)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 ${driver.accountLifecycle.status === 'Operational' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                      }`}
                  >
                    {driver.accountLifecycle.status === 'Operational' ? <UserCheck size={12} /> : <UserX size={12} />}
                    {driver.accountLifecycle.status}
                  </button>
                </td>
                <td className="px-8 py-6 text-center">
                  <button
                    onClick={() => generateTaskReport(driver)}
                    className="inline-flex flex-col items-center hover:bg-white p-3 rounded-2xl transition-all border-2 border-transparent hover:border-indigo-100"
                  >
                    <span className="text-xl font-black text-indigo-600">{driver.deployment.tasksCompleted}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">View Tasks <FileBarChart size={10} /></span>
                  </button>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${driver.availability.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${driver.availability.status === 'online' ? 'text-green-600' : 'text-slate-400'}`}>{driver.availability.status}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => toggleAccountActivation(driver.driverId, driver.accountLifecycle.status)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${driver.utility.blockUser ? 'bg-indigo-600 text-white' : 'bg-red-50 text-red-600 border-red-100'
                        }`}
                    >
                      {driver.utility.blockUser ? <Unlock size={12} /> : <Lock size={12} />} {driver.utility.blockUser ? 'Unblock' : 'Block'}
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedDriverForId(driver)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase border border-indigo-100 flex-1">ID CARD</button>
                      <button
                        onClick={() => handleDeleteDriver(driver.driverId, driver.personnelIdentity.email)}
                        className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase border border-rose-100 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center"
                        title="Permanent Wipe"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedDriverForId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-8 md:p-12 shadow-2xl relative">
            <button onClick={() => setSelectedDriverForId(null)} className="absolute top-8 right-8 p-3 text-slate-400 hover:text-slate-900"><X size={24} /></button>
            <div className="max-h-[70vh] overflow-y-auto px-2">
              <IdentityCard user={mapDriverToUser(selectedDriverForId)} />
            </div>
            <div className="mt-8 flex justify-center"><button onClick={() => setSelectedDriverForId(null)} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs">Close</button></div>
          </div>
        </div>
      )}
      {selectedDriverForLogs && (
        <DutyLogsModal
          driver={selectedDriverForLogs}
          onClose={() => setSelectedDriverForLogs(null)}
        />
      )}
      {pdfPreview && (
        <PdfViewerModal
          url={pdfPreview.url}
          title={pdfPreview.title}
          onClose={() => setPdfPreview(null)}
        />
      )}
    </div>
  );
};