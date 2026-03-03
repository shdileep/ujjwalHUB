import React, { useState, useEffect, useMemo } from 'react';
import { LiveDriverStatus, User } from '../../types';
import { UserMinus, Clock, MapPin } from 'lucide-react';
import { databaseService } from '../../services/database.service';
import { AREA_COMPONENT_MAPPING } from '../../constants/areas';

interface Props {
  drivers: LiveDriverStatus[];
  adminUser?: User | null;
}

export const LiveStatus: React.FC<Props> = ({ drivers, adminUser }) => {
  const [driverLocations, setDriverLocations] = useState<Record<string, string>>({});

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

  const filteredDrivers = useMemo(() => {
    const adminLocRaw = (adminUser?.location || '').trim();
    if (!drivers) return [];

    // Filter out Admins (UHA prefix) strictly if they leak from the data source
    const onlyDrivers = drivers.filter(d => {
      const id = (d.driverId || '').toUpperCase();
      return id.startsWith('UHD') || id.startsWith('EMP');
    });

    if (!adminLocRaw || adminLocRaw === 'Total' || adminLocRaw === 'All' || adminLocRaw === 'Chennai') return onlyDrivers;

    const adminLocLower = adminLocRaw.toLowerCase();

    // 1. Resolve Allowed Components (Case-Insensitive)
    let allowedComponents = AREA_COMPONENT_MAPPING[adminLocRaw];
    if (!allowedComponents) {
      const key = Object.keys(AREA_COMPONENT_MAPPING).find(k => k.toLowerCase() === adminLocLower);
      if (key) allowedComponents = AREA_COMPONENT_MAPPING[key];
    }
    allowedComponents = (allowedComponents || []).map(c => c.toLowerCase());

    return onlyDrivers.filter(driver => {
      const driverIdLower = (driver.driverId || '').toLowerCase();
      const driverLocLower = (driver.location || (driver as any).area || driverLocations[driverIdLower] || '').trim().toLowerCase();
      const driverNameLower = (driver.driverName || '').toLowerCase();

      // IF WE DON'T KNOW DRIVER LOCATION, DO NOT SHOW THEM (Strict Filtering for Admins)
      if (!driverLocLower) return false;

      // 1. Direct Match
      if (driverLocLower === adminLocLower) return true;

      // 2. Special Grouping: West Chengalpattu
      if (adminLocLower === 'west chengalpattu') {
        const WCP_SUB_AREAS = ['west chengalpattu', 'kandigai', 'nallambakkam', 'kolapakkam', 'unamancheri', 'melakottaiyur'];
        return WCP_SUB_AREAS.some(sa => driverLocLower.includes(sa));
      }

      // 3. Component Matching
      if (allowedComponents.length > 0) {
        return allowedComponents.some(c =>
          driverLocLower === c ||
          driverLocLower.includes(c)
        );
      }

      return false;
    });
  }, [drivers, adminUser?.location, driverLocations]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-gray-800">Live Driver Status</h2>
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            {filteredDrivers.filter(d => d.status === 'online').length} Online
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            {filteredDrivers.filter(d => d.status === 'offline').length} Offline
          </span>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
        {filteredDrivers.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Driver ID</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Driver Name</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Current Status</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDrivers.map((driver, idx) => (
                <tr key={driver.driverId || idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono font-black text-indigo-600">{driver.driverId || 'DRV-ERR'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px] uppercase shadow-sm border border-indigo-100">
                        {(driver.driverName || 'User').substring(0, 2)}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{driver.driverName || 'Unknown Driver'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${driver.status === 'online' ? 'bg-green-500 shadow-lg shadow-green-200 animate-pulse' : 'bg-red-500'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${driver.status === 'online' ? 'text-green-600' : 'text-red-500'}`}>
                        {driver.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5 text-xs font-bold">
                      <Clock size={12} className="text-gray-400" />
                      {driver.status === 'online' ? (
                        <span className="text-green-600 uppercase tracking-widest text-[9px] animate-pulse">Active Now</span>
                      ) : (
                        <span className="text-emerald-600">
                          {driver.lastActive ? new Date(driver.lastActive).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : 'Never'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-gray-300">
            <UserMinus size={64} className="mb-4 opacity-20" />
            <p className="font-black uppercase tracking-widest text-sm text-gray-400">No registered drivers</p>
            <p className="text-[10px] font-bold mt-1 text-gray-300 uppercase tracking-widest">Real-time status updates will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};
