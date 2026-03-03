import { useState, useEffect } from 'react';
import { databaseService } from '../services/database.service';
import {
    DriverProfile,
    Bin,
    Complaint,
    LeaveRequest,
    Notification,
    LiveDriverStatus,
    DriversHubEntry,
    TaskProTask,
    DailyRecord
} from '../types';
import { KANDIGAI_BINS } from '../constants/kandigaiData';

export const useDrivers = () => {
    const [drivers, setDrivers] = useState<DriverProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This now fetches from 'drivers' node which matches DriverProfile interface
        const unsubscribe = databaseService.subscribeToDrivers((data) => {
            // Filter out any invalid driver records
            const validDrivers = data.filter(d => d && d.driverId);
            setDrivers(validDrivers);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return { drivers, loading };
};

export const useLiveStatus = () => {
    const [liveStatus, setLiveStatus] = useState<LiveDriverStatus[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let currentLiveStatus: LiveDriverStatus[] = [];
        let currentSignups: any[] = [];

        const mergeData = async () => {
            if (currentSignups.length === 0 && currentLiveStatus.length === 0) {
                setLiveStatus([]);
                return;
            }

            // Fetch roles to ensure we ONLY show drivers
            const users = await databaseService.getAllUsers();
            const driverMap = new Map();
            users.forEach((u: any) => {
                if (u.role === 'driver') {
                    const id = (u.employeeId || u.driverId || '').toUpperCase();
                    if (id) driverMap.set(id, u);
                }
            });

            // Create a base from signups - ONLY if they are drivers
            const merged = currentSignups
                .filter(signup => {
                    const id = (signup.driverId || '').toUpperCase();
                    return id.startsWith('UHD') || id.startsWith('EMP') || driverMap.has(id);
                })
                .map(signup => {
                    const id = (signup.driverId || '').toUpperCase();
                    const live = currentLiveStatus.find(l => (l.driverId || '').toUpperCase() === id);
                    const userRecord = driverMap.get(id);

                    return {
                        driverId: signup.driverId,
                        driverName: signup.username || signup['username'] || userRecord?.username || live?.driverName || 'Unknown',
                        status: live?.status || 'offline',
                        lastActive: live?.lastActive || new Date().toISOString(),
                        location: signup['selected area'] || signup.location || userRecord?.location || live?.location || 'Kandigai',
                    } as LiveDriverStatus;
                });

            // Add any live status entries not in signups - ONLY if they are drivers
            currentLiveStatus.forEach(live => {
                const id = (live.driverId || '').toUpperCase();
                if (!merged.find(m => (m.driverId || '').toUpperCase() === id)) {
                    if (id.startsWith('UHD') || id.startsWith('EMP') || driverMap.has(id)) {
                        merged.push(live);
                    }
                }
            });

            setLiveStatus(merged);
            setLoading(false);
        };

        const unsubLive = databaseService.subscribeToLiveStatus((data) => {
            currentLiveStatus = data;
            mergeData();
        });

        const unsubSignup = databaseService.subscribeToSignup((data) => {
            currentSignups = data;
            mergeData();
        });

        return () => {
            unsubLive();
            unsubSignup();
        };
    }, []);

    return { liveStatus, loading };
};

export const useDriversHub = () => {
    const [hubEntries, setHubEntries] = useState<DriversHubEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let currentHub: DriversHubEntry[] = [];
        let currentSignups: any[] = [];

        const mergeData = async () => {
            if (currentSignups.length === 0 && currentHub.length === 0) {
                setHubEntries([]);
                return;
            }

            // Fetch roles to ensure we ONLY show drivers
            const users = await databaseService.getAllUsers();
            const driverMap = new Map();
            users.forEach((u: any) => {
                if (u.role === 'driver') {
                    const id = (u.employeeId || u.driverId || '').toUpperCase();
                    if (id) driverMap.set(id, u);
                }
            });

            // Create base from signups - ONLY if they are drivers
            const merged = currentSignups
                .filter(signup => {
                    const id = (signup.driverId || '').toUpperCase();
                    return id.startsWith('UHD') || id.startsWith('EMP') || driverMap.has(id);
                })
                .map(signup => {
                    const id = (signup.driverId || '').toUpperCase();
                    const hub = currentHub.find(h => (h.driverId || '').toUpperCase() === id);
                    const userRecord = driverMap.get(id);

                    return {
                        driverId: signup.driverId,
                        personnelIdentity: {
                            name: signup.username || signup['username'] || userRecord?.username || hub?.personnelIdentity?.name || 'Unknown',
                            driverId: signup.driverId,
                            phone: signup['phone num'] || signup.phone || userRecord?.phone || hub?.personnelIdentity?.phone || '',
                            location: signup['selected area'] || signup.location || userRecord?.location || hub?.personnelIdentity?.location || 'Kandigai',
                            profilePhoto: hub?.personnelIdentity?.profilePhoto || userRecord?.profilePhoto || null
                        },
                        accountLifecycle: hub?.accountLifecycle || { status: 'Operational', color: 'green' },
                        deployment: hub?.deployment || { tasksCompleted: 0 },
                        availability: hub?.availability || { status: 'offline' },
                        utility: hub?.utility || { blockUser: false },
                        workLogs: hub?.workLogs || []
                    } as DriversHubEntry;
                });

            // Add any hub entries not in signups - ONLY if they are drivers
            currentHub.forEach(hub => {
                const id = (hub.driverId || '').toUpperCase();
                if (!merged.find(m => (m.driverId || '').toUpperCase() === id)) {
                    if (id.startsWith('UHD') || id.startsWith('EMP') || driverMap.has(id)) {
                        merged.push(hub);
                    }
                }
            });

            setHubEntries(merged);
            setLoading(false);
        };

        const unsubHub = databaseService.subscribeToDriversHub((data) => {
            currentHub = data;
            mergeData();
        });

        const unsubSignup = databaseService.subscribeToSignup((data) => {
            currentSignups = data;
            mergeData();
        });

        return () => {
            unsubHub();
            unsubSignup();
        };
    }, []);

    return { hubEntries, loading };
};

export const useTasks = () => {
    const [tasks, setTasks] = useState<TaskProTask[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = databaseService.subscribeToTasks((data) => {
            setTasks(data);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    return { tasks, loading };
};

export const useBins = () => {
    // FIREWALL: Initialize with Kandigai Bins so they are NEVER empty, even if Firebase socket takes 10s to open.
    const [bins, setBins] = useState<Bin[]>(KANDIGAI_BINS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = databaseService.subscribeToBins((data) => {
            // MERGE: Kandigai bins use static definitions as base, but LIVE Firebase data wins
            // This ensures driver task completions (status: 'Completed') are preserved
            const kandigaiIds = new Set(KANDIGAI_BINS.map(b => b.id));
            const otherBins = data.filter(b =>
                !kandigaiIds.has(b.id) &&
                (b.areaName || '').toLowerCase() !== 'kandigai'
            );

            // Merge: static Kandigai base + live Firebase overrides (live status wins)
            const mergedKandigai = KANDIGAI_BINS.map(staticBin => {
                const liveBin = data.find(lb => lb.id === staticBin.id);
                return liveBin ? { ...staticBin, ...liveBin } : staticBin;
            });

            const mergedBins = [...otherBins, ...mergedKandigai];

            setBins(mergedBins);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return { bins, loading };
};

export const useComplaints = () => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = databaseService.subscribeToComplaints((data) => {
            setComplaints(data);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return { complaints, loading };
};

export const useLeaves = () => {
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = databaseService.subscribeToLeaves((data) => {
            setLeaves(data);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return { leaves, loading };
};

export const useDailyRecords = (driverId?: string) => {
    const [records, setRecords] = useState<DailyRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!driverId) return;
        const unsubscribe = databaseService.subscribeToDailyRecords(driverId, (data) => {
            setRecords(data);
            setLoading(false);
        });
        return unsubscribe;
    }, [driverId]);

    return { records, loading };
};

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = databaseService.subscribeToNotifications((data) => {
            setNotifications(data);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return { notifications, loading };
};
