import {
    ref,
    set,
    get,
    update,
    push,
    onValue,
    off,
    remove,
    DataSnapshot
} from 'firebase/database';
import { database } from '../firebase.config';
import {
    DriverProfile,
    AdminProfile,
    LiveDriverStatus,
    DriversHubEntry,
    TaskProTask,
    Bin,
    Complaint,
    LeaveRequest,
    Notification,
    DailyRecord,
    User
} from '../types';
import { performKMeans } from '../utils/clustering';

export const databaseService = {
    // ============ SPECIAL SINGLE NODES (REQUESTED BY USER) ============
    async saveToDriverNode(driverId: string, data: any): Promise<void> {
        console.log(`📝 DB: Saving to /driver/${driverId}`);
        const nodeData = {
            driverId: driverId,
            employeeId: data.employeeId || driverId,
            username: data.username || '',
            email: data.email || '',
            phone: data.phone || '',
            location: data.location || '',
            profilePhoto: data.profilePhoto || null,
            password: data.password || '',
            createdAt: data.createdAt || new Date().toISOString(),
            status: data.status || 'offline',
            isProfileComplete: data.isProfileComplete ?? true
        };
        await set(ref(database, `driver/${driverId}`), nodeData);
    },

    async saveToAdminNode(adminId: string, data: any): Promise<void> {
        console.log(`📝 DB: Saving to /admin/${adminId}`);
        const nodeData = {
            adminId: adminId,
            employeeId: data.employeeId || adminId,
            username: data.username || '',
            email: data.email || '',
            phone: data.phone || '',
            location: data.location || '',
            profilePhoto: data.profilePhoto || null,
            password: data.password || '',
            createdAt: data.createdAt || new Date().toISOString(),
            isProfileComplete: data.isProfileComplete ?? true
        };
        await set(ref(database, `admin/${adminId}`), nodeData);
    },

    async checkNodeExists(path: string): Promise<boolean> {
        const snapshot = await get(ref(database, path));
        return snapshot.exists();
    },

    // ============ DRIVERS ============

    // Create Driver (Signup) -> Syncs to DriversHub
    async createDriver(driverId: string, driverData: DriverProfile): Promise<void> {
        console.log(`📡 Creating driver record for ${driverId}...`);
        // 1. Save to Drivers Node
        const cleanDriverData = {
            ...driverData,
            status: driverData.status || 'offline',
            location: driverData.location || 'Kandigai',
            createdAt: driverData.createdAt || new Date().toISOString(),
            profilePhoto: driverData.profilePhoto || null,
            workLogs: []
        };
        await set(ref(database, `drivers/${driverId}`), cleanDriverData);

        // 2. Initialize in DriversHub
        const driversHubEntry: DriversHubEntry = {
            driverId: driverId,
            personnelIdentity: {
                name: driverData.username || 'Unknown',
                driverId: driverId,
                phone: driverData.phone || '',
                profilePhoto: driverData.profilePhoto || null,
                location: driverData.location || 'Kandigai'
            },
            accountLifecycle: {
                status: 'Operational',
                color: 'green'
            },
            deployment: {
                tasksCompleted: 0
            },
            availability: {
                status: (driverData.status as any) || 'offline'
            },
            utility: {
                blockUser: false
            },
            workLogs: []
        };
        await set(ref(database, `DriversHub/${driverId}`), driversHubEntry);

        // 3. Initialize in LiveDriverStatus
        const liveStatus: LiveDriverStatus = {
            driverId: driverId,
            driverName: driverData.username || 'Unknown',
            status: driverData.status || 'offline',
            lastActive: new Date().toISOString(),
            location: driverData.location || 'Kandigai'
        };
        await set(ref(database, `LiveDriverStatus/${driverId}`), liveStatus);

        // 4. Trigger Automatic Redistribution for the area
        if (cleanDriverData.location) {
            await this.redistributeAreaBins(cleanDriverData.location);
        }

        console.log(`✅ Driver record for ${driverId} completed.`);
    },

    async redistributeAreaBins(areaName: string): Promise<void> {
        console.log(`🔄 [K-Means] Redistributing bins for area: ${areaName}...`);

        // 1. Fetch all drivers in this area
        const driversRef = ref(database, 'drivers');
        const driversSnapshot = await get(driversRef);
        if (!driversSnapshot.exists()) return;

        const allDrivers = Object.values(driversSnapshot.val() as Record<string, DriverProfile>);
        const areaDrivers = allDrivers
            .filter(d => {
                const dLoc = (d.location || '').toLowerCase();
                const target = areaName.toLowerCase();
                // Match either the exact location or the location containing the zone suffix
                return dLoc === target || dLoc.startsWith(target + ' - zone');
            })
            .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

        if (areaDrivers.length === 0) {
            console.warn(`⚠️ No drivers found for ${areaName} to redistribute bins.`);
            return;
        }

        // 2. Fetch all bins in this area
        const binsRef = ref(database, 'bins');
        const binsSnapshot = await get(binsRef);
        if (!binsSnapshot.exists()) return;

        const allBins = Object.values(binsSnapshot.val() as Record<string, Bin>);
        const areaBins = allBins
            .filter(b => {
                const bArea = (b.areaName || '').toLowerCase();
                const bLoc = (b.locationName || '').toLowerCase();
                const target = areaName.toLowerCase();

                if (bArea === target || bLoc === target) return true;
                if (target === 'west chengalpattu') {
                    const isMatch = bArea === 'west chengalpattu' || bArea === 'kandigai';
                    if (isMatch) return true;
                    return ['kandigai', 'nallambakkam', 'kolapakkam', 'unamancheri', 'melakottaiyur']
                        .some(sa => bLoc.includes(sa) || bArea.includes(sa));
                }
                return false;
            });

        if (areaBins.length === 0) {
            console.warn(`⚠️ No bins found for ${areaName} to redistribute.`);
            return;
        }

        console.log(`📊 Clustering ${areaBins.length} bins for ${areaDrivers.length} drivers in ${areaName}...`);

        // 3. Perform K-Means Clustering
        const k = areaDrivers.length;
        const clusteredBinsMap = performKMeans(areaBins, k);

        const updates: any = {};

        // Map clusters to drivers based on their index in sorted areaDrivers
        areaDrivers.forEach((driver, driverIdx) => {
            const assignedBins = clusteredBinsMap.get(driverIdx) || [];
            const zoneName = areaDrivers.length > 1
                ? `${areaName} - Zone ${driverIdx + 1}`
                : areaName;

            console.log(`📍 Assigning ${assignedBins.length} bins to ${driver.username} (${zoneName})`);

            // Update Driver Node with Zone Info
            updates[`drivers/${driver.driverId}/assignedZone`] = zoneName;
            updates[`DriversHub/${driver.driverId}/personnelIdentity/location`] = zoneName;
            updates[`LiveDriverStatus/${driver.driverId}/location`] = zoneName;

            // Optional: If we want to keep d.location synced as well
            // updates[`drivers/${driver.driverId}/location`] = zoneName;

            // Update each bin in this cluster
            assignedBins.forEach(bin => {
                updates[`bins/${bin.id}/assignedDriverId`] = driver.driverId;
            });
        });

        await update(ref(database), updates);
        console.log(`✅ [K-Means] Redistribution for ${areaName} complete.`);
    },

    async recordDutySession(driverId: string, type: 'start' | 'end'): Promise<void> {
        const timestamp = new Date().toISOString();
        const dateKey = timestamp.split('T')[0];

        const logsRef = ref(database, `DriversHub/${driverId}/workLogs`);
        const snapshot = await get(logsRef);
        let logs: any[] = snapshot.exists() ? snapshot.val() : [];

        if (type === 'start') {
            logs.push({
                id: `SID-${Date.now()}`,
                date: dateKey,
                start: timestamp,
                end: null,
                duration: 'In Progress'
            });
        } else {
            // Find the last log that has no end time
            const lastLogIdx = [...logs].reverse().findIndex(l => !l.end);
            if (lastLogIdx !== -1) {
                const actualIdx = logs.length - 1 - lastLogIdx;
                const start = new Date(logs[actualIdx].start);
                const end = new Date(timestamp);
                const diffMs = end.getTime() - start.getTime();
                const diffHrs = Math.floor(diffMs / 3600000);
                const diffMins = Math.floor((diffMs % 3600000) / 60000);

                logs[actualIdx].end = timestamp;
                logs[actualIdx].duration = `${diffHrs}h ${diffMins}m`;
            }
        }

        await set(logsRef, logs);
        // Sync to driver node as well
        await set(ref(database, `drivers/${driverId}/workLogs`), logs);
    },

    // New specific signup node storage as requested by user
    async createSignupRecord(driverId: string, data: { username: string, email: string, phone: string, location: string, password?: string }): Promise<void> {
        console.log(`📝 DB: Attempting createSignupRecord at /signup/${driverId}`);
        const signupData = {
            "username": data.username,
            "email": data.email,
            "phone num": data.phone,
            "selected area": data.location,
            "password": data.password || '',
            "driverId": driverId
        };
        await set(ref(database, `signup/${driverId}`), signupData);
    },

    subscribeToSignup(callback: (signups: any[]) => void): () => void {
        const signupRef = ref(database, 'signup');
        const unsubscribe = onValue(signupRef, (snapshot) => {
            if (snapshot.exists()) {
                const signups = Object.entries(snapshot.val()).map(([key, data]: [string, any]) => ({
                    ...data,
                    driverId: data.driverId || key
                }));
                callback(signups);
            } else {
                callback([]);
            }
        }, (error: any) => {
            console.error("❌ Firebase Subscription Error (signup):", error.message, error.code);
        });
        return () => off(signupRef);
    },

    async getDriver(driverId: string): Promise<DriverProfile | null> {
        const snapshot = await get(ref(database, `drivers/${driverId}`));
        if (snapshot.exists()) return snapshot.val();

        // Fallback to singular node
        const singularSnapshot = await get(ref(database, `driver/${driverId}`));
        return singularSnapshot.exists() ? singularSnapshot.val() : null;
    },

    // Update Driver Status (Active/On Duty / Offline)
    async updateDriverStatus(driverId: string, status: 'online' | 'offline'): Promise<void> {
        const timestamp = new Date().toISOString();
        const updates: any = {};

        // 1. Update Driver Node
        updates[`drivers/${driverId}/status`] = status;
        if (status === 'online') {
            updates[`drivers/${driverId}/activeDutyTime`] = timestamp;
            await this.recordDutySession(driverId, 'start');
        } else {
            updates[`drivers/${driverId}/lastLogoutTime`] = timestamp;
            await this.recordDutySession(driverId, 'end');
        }

        // 2. Update DriversHub
        updates[`DriversHub/${driverId}/availability/status`] = status;

        // ... rest of the status update logic ...

        // 3. Update LiveDriverStatus
        const driverProfile = await this.getDriver(driverId);
        const driverName = driverProfile?.username || 'Unknown Driver';

        const liveStatus: LiveDriverStatus = {
            driverId: driverId,
            driverName: driverName,
            status: status,
            lastActive: timestamp,
            location: driverProfile?.location || ''
        };

        updates[`LiveDriverStatus/${driverId}`] = liveStatus;

        await update(ref(database), updates);
    },

    async incrementDriverTaskCount(driverId: string): Promise<void> {
        if (!driverId) return;
        const hubRef = ref(database, `DriversHub/${driverId}/deployment/tasksCompleted`);
        const snapshot = await get(hubRef);
        const currentCount = snapshot.exists() ? (snapshot.val() || 0) : 0;

        const updates: any = {};
        updates[`DriversHub/${driverId}/deployment/tasksCompleted`] = currentCount + 1;

        // Also update LiveDriverStatus lastActive
        updates[`LiveDriverStatus/${driverId}/lastActive`] = new Date().toISOString();

        await update(ref(database), updates);
    },

    async getAllDrivers(): Promise<DriverProfile[]> {
        const snapshot = await get(ref(database, 'drivers'));
        if (!snapshot.exists()) return [];
        return Object.entries(snapshot.val()).map(([key, data]: [string, any]) => ({
            ...data,
            driverId: data.driverId || key
        }));
    },

    subscribeToDrivers(callback: (drivers: DriverProfile[]) => void): () => void {
        const driversRef = ref(database, 'drivers');
        const unsubscribe = onValue(driversRef, (snapshot) => {
            if (snapshot.exists()) {
                const drivers = Object.entries(snapshot.val()).map(([key, data]: [string, any]) => ({
                    ...data,
                    driverId: data.driverId || key
                }));
                callback(drivers);
            } else {
                callback([]);
            }
        }, (error: any) => {
            console.error("❌ Firebase Subscription Error (drivers):", error.message, error.code);
        });
        return () => off(driversRef);
    },

    // ============ ADMINS ============
    async getAllAdmins(): Promise<AdminProfile[]> {
        const snapshot = await get(ref(database, 'admins'));
        if (!snapshot.exists()) return [];
        return Object.entries(snapshot.val()).map(([key, data]: [string, any]) => ({
            ...data,
            adminId: data.adminId || key
        }));
    },

    async createAdmin(adminId: string, adminData: AdminProfile): Promise<void> {
        console.log(`📝 DB: Attempting createAdmin at /admins/${adminId}`);
        const cleanAdminData = {
            ...adminData,
            location: adminData.location || '',
            profilePhoto: adminData.profilePhoto || null
        };
        await set(ref(database, `admins/${adminId}`), cleanAdminData);
    },

    async getAdmin(adminId: string): Promise<AdminProfile | null> {
        const snapshot = await get(ref(database, `admins/${adminId}`));
        if (snapshot.exists()) return snapshot.val();

        // Fallback to singular node
        const singularSnapshot = await get(ref(database, `admin/${adminId}`));
        return singularSnapshot.exists() ? singularSnapshot.val() : null;
    },

    // ============ LIVE DRIVER STATUS ============
    subscribeToLiveStatus(callback: (statuses: LiveDriverStatus[]) => void): () => void {
        const liveRef = ref(database, 'LiveDriverStatus');
        const unsubscribe = onValue(liveRef, async (snapshot) => {
            if (snapshot.exists()) {
                const rawVal = snapshot.val();
                const entries = Object.entries(rawVal);
                const statuses = [];

                for (const [key, data] of entries) {
                    if (typeof data !== 'object' || data === null) continue;

                    let name = (data as any).driverName;
                    if (!name) {
                        try {
                            const profileSnapshot = await get(ref(database, `drivers/${key}`));
                            if (profileSnapshot.exists()) {
                                name = profileSnapshot.val().username;
                            } else {
                                name = 'Unknown Driver';
                            }
                        } catch (e) {
                            name = 'Unknown Driver';
                        }
                    }

                    statuses.push({
                        ...data,
                        driverId: key,
                        driverName: name,
                        status: (data as any).status || 'offline',
                        lastActive: (data as any).lastActive || new Date().toISOString()
                    } as LiveDriverStatus);
                }
                callback(statuses);
            } else {
                callback([]);
            }
        }, (error: any) => {
            console.error("❌ Firebase Subscription Error (LiveDriverStatus):", error.message, error.code);
        });
        return () => off(liveRef);
    },

    // ============ DRIVERS HUB ============
    subscribeToDriversHub(callback: (entries: DriversHubEntry[]) => void): () => void {
        const hubRef = ref(database, 'DriversHub');
        const unsubscribe = onValue(hubRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(Object.values(snapshot.val()));
            } else {
                callback([]);
            }
        }, (error: any) => {
            console.error("❌ Firebase Subscription Error (DriversHub):", error.message, error.code);
        });
        return () => off(hubRef);
    },

    // ============ TASK PRO ============
    async createTask(task: TaskProTask): Promise<void> {
        await set(ref(database, `TaskPro/${task.id}`), task);
    },

    async assignTask(taskId: string, driverId: string): Promise<void> {
        await update(ref(database, `TaskPro/${taskId}`), {
            assignedDriverId: driverId,
            fleetAssessment: 'particular'
        });
    },

    async updateTask(taskId: string, updates: Partial<TaskProTask>): Promise<void> {
        await update(ref(database, `TaskPro/${taskId}`), updates);
    },

    subscribeToTasks(callback: (tasks: TaskProTask[]) => void): () => void {
        const tasksRef = ref(database, 'TaskPro');
        const unsubscribe = onValue(tasksRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(Object.values(snapshot.val()));
            } else {
                callback([]);
            }
        }, (error: any) => {
            console.error("❌ Firebase Subscription Error (TaskPro):", error.message, error.code);
        });
        return () => off(tasksRef);
    },

    // ============ USERS (Generic) ============
    async createUser(userId: string, userData: any): Promise<void> {
        console.log(`📝 DB: Attempting createUser at /users/${userId}`);
        await set(ref(database, `users/${userId}`), userData);
    },

    async getUser(userId: string): Promise<any | null> {
        const snapshot = await get(ref(database, `users/${userId}`));
        return snapshot.exists() ? snapshot.val() : null;
    },

    async getUserByEmail(email: string): Promise<any | null> {
        if (!email) return null;
        const sanitizedEmail = email.replace(/[.@]/g, '_');

        // Try direct fetch first (most efficient)
        let user = await this.getUser(sanitizedEmail);
        if (user) return user;

        // Try searching all users as fallback
        try {
            const usersRef = ref(database, 'users');
            const snapshot = await get(usersRef);
            if (snapshot.exists()) {
                const users = snapshot.val();
                return Object.values(users).find((u: any) => u.email === email) || null;
            }
        } catch (err) {
            console.error("❌ getUserByEmail fallback failed:", err);
        }
        return null;
    },

    async updateUser(userId: string, updates: Partial<any>): Promise<void> {
        await update(ref(database, `users/${userId}`), updates);
    },

    // ============ BINS ============
    async getAllBins(): Promise<Bin[]> {
        const snapshot = await get(ref(database, 'bins'));
        if (!snapshot.exists()) return [];
        return Object.values(snapshot.val());
    },

    async createBin(binId: string, binData: Bin): Promise<void> {
        await set(ref(database, `bins/${binId}`), binData);
    },

    // OPTIMIZED: Bulk Import for 12k+ bins (Chunked to prevent timeout)
    async saveAllBins(bins: Bin[]): Promise<void> {
        const CHUNK_SIZE = 500;
        const total = bins.length;

        for (let i = 0; i < total; i += CHUNK_SIZE) {
            const chunk = bins.slice(i, i + CHUNK_SIZE);
            const updates: Record<string, any> = {};

            chunk.forEach(bin => {
                updates[bin.id] = bin;
            });

            // Update this chunk into the 'bins' node
            // Using update on 'bins' node merges this chunk in
            await update(ref(database, 'bins'), updates);

            // Tiny delay to keep UI responsive and network happy
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    },

    async updateBinStatus(binId: string, status: Bin['status'], fillLevel: number, driverId?: string): Promise<void> {
        const updates: any = {};
        updates[`bins/${binId}/status`] = status;
        updates[`bins/${binId}/fillLevel`] = fillLevel;
        updates[`bins/${binId}/lastCollection`] = new Date().toISOString();

        if (status === 'Completed' && driverId) {
            updates[`bins/${binId}/assignedDriverId`] = driverId;
            // Record in history
            const historyRef = push(ref(database, `binHistory/${binId}`));
            updates[`binHistory/${binId}/${historyRef.key}`] = {
                timestamp: new Date().toISOString(),
                driverId: driverId,
                action: 'Collection'
            };
        }

        await update(ref(database), updates);
    },

    async getAllUsers(): Promise<any[]> {
        const snapshot = await get(ref(database, 'users'));
        if (!snapshot.exists()) return [];
        return Object.values(snapshot.val());
    },

    // ============ GENERIC DRIVER UPDATE (Compatibility) ============
    async updateDriver(driverId: string, updates: Partial<any>): Promise<void> {
        // This is a comprehensive update that might touch multiple nodes depending on what's properly passed
        // For now, we update 'drivers' node primarily
        await update(ref(database, `drivers/${driverId}`), updates);

        // If 'availability' is in updates, sync it to Hub and LiveStatus
        if (updates.availability) {
            const status = updates.availability === 'On Duty' || updates.availability === 'Online' || updates.availability === 'online' ? 'online' : 'offline';
            await this.updateDriverStatus(driverId, status);
        }
    },

    async recordLogout(driverId: string): Promise<void> {
        const timestamp = new Date().toISOString();
        const date = timestamp.split('T')[0];
        const displayTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const driverRef = ref(database, `drivers/${driverId}`);
        const snapshot = await get(driverRef);
        const currentData = snapshot.val() || {};
        let workLogs = currentData.workLogs || [];

        // Find the active session (one with end: null)
        const activeIndex = [...workLogs].reverse().findIndex(log => log.end === null);
        if (activeIndex !== -1) {
            const actualIndex = workLogs.length - 1 - activeIndex;
            const session = workLogs[actualIndex];

            // Calculate duration in minutes if startTime is available (from recordDutyStart)
            if (session.startTime) {
                const start = new Date(session.startTime);
                const end = new Date(timestamp);
                const diffMs = end.getTime() - start.getTime();
                const diffMins = Math.round(diffMs / (1000 * 60));
                session.duration = `${diffMins} min`;
            } else {
                session.duration = 'Completed';
            }

            session.end = displayTime;
            session.endTime = timestamp;
            workLogs[actualIndex] = session;
        }

        const updates: any = {};
        updates[`drivers/${driverId}/lastActive`] = timestamp;
        updates[`drivers/${driverId}/lastLogoutTime`] = displayTime;
        updates[`drivers/${driverId}/availability`] = 'offline';
        updates[`drivers/${driverId}/status`] = 'offline';
        updates[`drivers/${driverId}/workLogs`] = workLogs;
        updates[`LiveDriverStatus/${driverId}/status`] = 'offline';
        updates[`LiveDriverStatus/${driverId}/lastActive`] = timestamp;
        updates[`DriversHub/${driverId}/availability/status`] = 'offline';
        updates[`DriversHub/${driverId}/workLogs`] = workLogs;

        // Also update the daily record in the 'leave' node
        updates[`leave/${driverId}/${date}/logoutTime`] = displayTime;

        await update(ref(database), updates);
    },

    async getDailyRecords(driverId: string): Promise<DailyRecord[]> {
        const snapshot = await get(ref(database, `leave/${driverId}`));
        if (!snapshot.exists()) return [];
        return Object.values(snapshot.val());
    },



    async updateBin(binId: string, updates: Partial<Bin>, driverId?: string): Promise<void> {
        const finalUpdates: any = {};
        Object.entries(updates).forEach(([key, val]) => {
            finalUpdates[`bins/${binId}/${key}`] = val;
        });

        if (updates.status === 'Completed' && driverId) {
            finalUpdates[`bins/${binId}/assignedDriverId`] = driverId;
            const historyKey = push(ref(database, `binHistory/${binId}`)).key;
            finalUpdates[`binHistory/${binId}/${historyKey}`] = {
                timestamp: new Date().toISOString(),
                driverId: driverId,
                action: 'Collection'
            };
        }

        await update(ref(database), finalUpdates);
    },

    async deleteBin(binId: string): Promise<void> {
        await remove(ref(database, `bins/${binId}`));
    },

    subscribeToBins(callback: (bins: Bin[]) => void): () => void {
        const binsRef = ref(database, 'bins');
        const unsubscribe = onValue(binsRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(Object.values(snapshot.val()));
            } else {
                callback([]);
            }
        }, (error: any) => {
            console.error("❌ Firebase Subscription Error (bins):", error.message, error.code);
        });
        return () => off(binsRef);
    },

    async resetAreaBins(areaName: string): Promise<void> {
        console.log(`♻️ DB: Resetting bins for area: ${areaName}`);
        const snapshot = await get(ref(database, 'bins'));
        if (!snapshot.exists()) return;

        const allBins: Bin[] = Object.values(snapshot.val());
        const areaBins = allBins.filter(b =>
            (b.areaName || '').toLowerCase() === areaName.toLowerCase() ||
            (b.locationName || '').toLowerCase() === areaName.toLowerCase()
        );

        const updates: any = {};
        areaBins.forEach(bin => {
            if (bin.status === 'Completed') {
                // Revert to a 'task' status. 
                // Heuristic: Alternating status for variety
                const idNum = parseInt(bin.id.replace(/\D/g, '')) || 0;
                const newStatus = (idNum % 2 === 0) ? 'Full' : 'Half Full';
                updates[`bins/${bin.id}/status`] = newStatus;
            }
        });

        if (Object.keys(updates).length > 0) {
            await update(ref(database), updates);
        }
    },

    async resetAllBins(): Promise<void> {
        console.log("♻️ DB: Resetting ALL bins to pending tasks...");
        const snapshot = await get(ref(database, 'bins'));
        if (!snapshot.exists()) return;

        const allBins: Bin[] = Object.values(snapshot.val());
        const updates: any = {};

        allBins.forEach(bin => {
            if (bin.status === 'Completed') {
                // Revert to original statuses (Full/Half Full)
                // We use a deterministic logic based on ID to make it feel "restored"
                const idNum = parseInt(bin.id.replace(/\D/g, '')) || 0;
                const newStatus = (idNum % 2 === 0) ? 'Full' : 'Half Full';
                const newLevel = (idNum % 2 === 0) ? 90 : 50;

                updates[`bins/${bin.id}/status`] = newStatus;
                updates[`bins/${bin.id}/fillLevel`] = newLevel;
            }
        });

        if (Object.keys(updates).length > 0) {
            await update(ref(database), updates);
        }
    },

    async resetBinsToDefault(defaultBins: Bin[]): Promise<void> {
        const binsRef = ref(database, 'bins');
        await set(binsRef, {});
        for (const bin of defaultBins) {
            await set(ref(database, `bins/${bin.id}`), bin);
        }
    },

    async redefineUjjwalRoute(): Promise<void> {
        // 1. Define Route Entities (VIT -> Vandalur -> Chrompet)
        // 1. Define Route Entities (Tata New Haven -> Pudupakkam)
        // Start: Tata New Haven Ribbon Walk (Mambakkam) - Approx 12.8279, 80.1706
        // End: Pudupakkam Anjaneyar Temple - Approx 12.7950, 80.2100 (Towards Kelambakkam)

        // 1. Define Route Entities (Tata Homes -> Vandalur -> Perungalathur -> Pudupakkam)
        // Explicit 22 Nodes as requested by User
        const ROUTE_NODES = [
            { name: "Tata Homes - Main Entry", street: "Mambakkam Main Rd", lat: 12.8350, lng: 80.1700 }, // Tata New Haven
            { name: "Near Tata Homes Internal Road", street: "Internal Road", lat: 12.8370, lng: 80.1650 },
            { name: "Kandigai", street: "Kandigai Junction", lat: 12.8510, lng: 80.1450 },
            { name: "Nallambakkam", street: "Nallambakkam Rd", lat: 12.8550, lng: 80.1400 },
            { name: "Perumal Kovil Street", street: "Kandigai", lat: 12.8580, lng: 80.1420 },
            { name: "Tagore Medical College Area", street: "Rathinamangalam", lat: 12.8613, lng: 80.1365 },
            { name: "Government High School Area", street: "Rathinamangalam", lat: 12.8650, lng: 80.1380 },
            { name: "Rathanamangalam", street: "Main Road", lat: 12.8700, lng: 80.1400 },
            { name: "Sri Ramanujar Engineering College", street: "College Rd", lat: 12.8760, lng: 80.1380 },
            { name: "KPL Sports Academy 1.0", street: "Sports Zone", lat: 12.8790, lng: 80.1250 },
            { name: "Nedunkundram - Gandhi Road", street: "Gandhi Road", lat: 12.8820, lng: 80.1040 },
            { name: "KY Technologies", street: "Tech Park Area", lat: 12.8850, lng: 80.0980 },
            { name: "Crescent School - Main Road", street: "GST Road Vandalur", lat: 12.8880, lng: 80.0920 },
            { name: "Near Sudhakar Law Associates", street: "Vandalur", lat: 12.8960, lng: 80.0800 },
            { name: "Manapaanai Chettinadu Virundhu", street: "Restaurant Area", lat: 12.9000, lng: 80.0850 },
            { name: "Perunguthur - New Road", street: "Perungalathur Bypass", lat: 12.9048, lng: 80.0891 },
            { name: "SK Party Hall", street: "Service Road", lat: 12.9150, lng: 80.1000 },
            { name: "Ramgee Motors Area", street: "GST Auto Hub", lat: 12.9250, lng: 80.1150 },
            { name: "TCDS Area", street: "Sanatorium", lat: 12.9350, lng: 80.1250 },
            { name: "M.A.R.S Transport", street: "Logistics Hub", lat: 12.9450, lng: 80.1350 },
            { name: "Pudupakkam - Entry Point", street: "Kelambakkam Vandalur Rd", lat: 12.8100, lng: 80.1900 },
            { name: "Pudupakkam - Main Area", street: "End Node", lat: 12.8050, lng: 80.1950 }
        ];

        // 2. Fetch Existing
        const existingBins = await this.getAllBins();

        // 3. Construct New Bin List
        // Strategy: Overwrite existing bins with route data. Add new bins if route is longer.
        // Finally, add 3 NEW EMPTY TASKS.

        let newBins: Bin[] = [];
        let maxId = 0;

        // Map existing bins to Route Nodes
        // If we have more route nodes than existing bins, we create new ones.
        // If we have more existing bins than route nodes, the extras stay as is (or move to end?) 
        // User said: "All bin locations are re-aligned". 
        // We will prioritize Route Nodes.

        const loopCount = Math.max(existingBins.length, ROUTE_NODES.length);

        for (let i = 0; i < loopCount; i++) {
            const existingBin = existingBins[i];
            const routeNode = ROUTE_NODES[i] || ROUTE_NODES[ROUTE_NODES.length - 1]; // Fallback to last node if overflow

            const nextBinId = existingBin ? existingBin.id : (i + 1).toString().padStart(2, '0');
            maxId = Math.max(maxId, parseInt(nextBinId));

            // Logic: Update Existing OR Create New based on Route
            // If i < ROUTE_NODES.length, we impose the route location.
            // If i >= ROUTE_NODES.length (extra existing bins), we keep them but maybe move to Chrompet? 
            // Let's just keep them as is if they are extra, or move to Chrompet. 
            // User implies "Route redefined", so likely want strict adherence. 
            // I'll set extras to Chrompet vicinity.

            const newValues = i < ROUTE_NODES.length ? {
                locationName: routeNode.name.toUpperCase(),
                streetName: routeNode.street.toUpperCase(),
                coordinates: { lat: routeNode.lat, lng: routeNode.lng }
            } : {
                // Extras default to Chrompet
                locationName: "CHROMPET EXTENSION",
                streetName: "GST ROAD",
                coordinates: { lat: 12.9520 + (i * 0.0001), lng: 80.1410 }
            };

            newBins.push({
                id: nextBinId,
                status: existingBin?.status || 'Empty',
                assignedDriverId: existingBin?.assignedDriverId, // Preserve assignment
                ...newValues,
                imageUrl: existingBin?.imageUrl // Preserve image
            });
        }



        // 5. Overwrite Database
        const binsRef = ref(database, 'bins');
        await set(binsRef, {}); // Clear to ensure clean array structure
        for (const bin of newBins) {
            await set(ref(database, `bins/${bin.id}`), bin);
        }
    },

    // ============ COMPLAINTS ============
    async createComplaint(complaintData: Complaint): Promise<string> {
        await set(ref(database, `complaints/${complaintData.id}`), complaintData);
        return complaintData.id;
    },

    async updateComplaint(complaintId: string, updates: Partial<Complaint>): Promise<void> {
        await update(ref(database, `complaints/${complaintId}`), updates);
    },

    async deleteComplaint(complaintId: string): Promise<void> {
        await remove(ref(database, `complaints/${complaintId}`));
    },

    async getAllComplaints(): Promise<Complaint[]> {
        const snapshot = await get(ref(database, 'complaints'));
        if (!snapshot.exists()) return [];
        return Object.values(snapshot.val());
    },

    subscribeToComplaints(callback: (complaints: Complaint[]) => void): () => void {
        const complaintsRef = ref(database, 'complaints');
        return onValue(complaintsRef, (snapshot) => {
            if (snapshot.exists()) {
                const complaints = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
                    ...data,
                    id
                })) as Complaint[];
                callback(complaints);
            } else {
                callback([]);
            }
        });
    },

    // ============ LEAVE REQUESTS ============
    async createLeaveRequest(leaveData: LeaveRequest): Promise<string> {
        console.log(`📝 Creating leave request: ${leaveData.id}`, leaveData);
        try {
            await set(ref(database, `leaves/${leaveData.id}`), leaveData);
            console.log(`✅ Leave request ${leaveData.id} created successfully.`);
            return leaveData.id;
        } catch (error) {
            console.error(`❌ Failed to create leave request ${leaveData.id}:`, error);
            throw error;
        }
    },

    async updateLeaveRequest(leaveId: string, updates: Partial<LeaveRequest>): Promise<void> {
        await update(ref(database, `leaves/${leaveId}`), updates);
    },

    async cancelLeaveRequest(leaveId: string, driverId?: string, date?: string): Promise<void> {
        console.log(`🚫 Cancelling leave request: ${leaveId}`);
        await update(ref(database, `leaves/${leaveId}`), {
            status: 'Cancelled by Driver',
            lastUpdated: new Date().toISOString()
        });

        // If a driverId and date are provided, update their daily record to 'Present'
        if (driverId && date) {
            await this.updateDailyRecord({
                driverId,
                date,
                leaveStatus: 'Present',
                leaveRequestId: undefined
            });
        }
    },

    async getAllLeaves(): Promise<LeaveRequest[]> {
        const snapshot = await get(ref(database, 'leaves'));
        if (!snapshot.exists()) return [];

        const leaves = snapshot.val();
        return Object.entries(leaves).map(([id, data]: [string, any]) => ({
            ...data,
            id
        }));
    },

    subscribeToLeaves(callback: (leaves: LeaveRequest[]) => void): () => void {
        const leavesRef = ref(database, 'leaves');
        return onValue(leavesRef, (snapshot) => {
            if (snapshot.exists()) {
                const leaves = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
                    ...data,
                    id
                })) as LeaveRequest[];
                callback(leaves);
            } else {
                callback([]);
            }
        });
    },

    // ============ NOTIFICATIONS ============
    async createNotification(notificationData: Notification): Promise<string> {
        const notificationsRef = ref(database, 'notifications');
        const newNotificationRef = push(notificationsRef);
        await set(newNotificationRef, notificationData);
        return newNotificationRef.key!;
    },

    async updateNotification(notificationId: string, updates: Partial<Notification>): Promise<void> {
        await update(ref(database, `notifications/${notificationId}`), updates);
    },

    async deleteNotification(notificationId: string): Promise<void> {
        await remove(ref(database, `notifications/${notificationId}`));
    },

    async getAllNotifications(): Promise<Notification[]> {
        const snapshot = await get(ref(database, 'notifications'));
        if (!snapshot.exists()) return [];
        return Object.values(snapshot.val());
    },

    subscribeToNotifications(callback: (notifications: Notification[]) => void): () => void {
        const notificationsRef = ref(database, 'notifications');
        return onValue(notificationsRef, (snapshot) => {
            if (snapshot.exists()) {
                const notifications = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
                    ...data,
                    id
                })) as Notification[];
                callback(notifications);
            } else {
                callback([]);
            }
        });
    },

    async deleteAllNotifications(): Promise<void> {
        await remove(ref(database, 'notifications'));
    },

    // ============ DAILY RECORDS (LEAVE NODE) ============
    // Handles the new unified 'leave' node for daily auditing
    async updateDailyRecord(record: Partial<DailyRecord>): Promise<void> {
        if (!record.driverId || !record.date) return;
        const recordRef = ref(database, `leave/${record.driverId}/${record.date}`);
        await update(recordRef, {
            ...record,
            lastUpdated: new Date().toISOString()
        });
    },

    async recordDutyStart(driverId: string): Promise<void> {
        const timestamp = new Date().toISOString();
        const date = timestamp.split('T')[0];
        const displayTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Update daily record for audit
        await this.updateDailyRecord({
            driverId,
            date,
            startTime: timestamp,
            status: 'Present'
        });

        // Add to workLogs session array
        const driverRef = ref(database, `drivers/${driverId}`);
        const snapshot = await get(driverRef);
        const currentData = snapshot.val() || {};
        const workLogs = currentData.workLogs || [];

        // Clean up any stale active sessions (if driver didn't log out properly)
        const cleanedLogs = workLogs.map((log: any) => {
            if (log.end === null) {
                return { ...log, end: 'STALE', duration: 'N/A' };
            }
            return log;
        });

        const newSession = {
            id: `LOG-${Date.now()}`,
            date,
            start: displayTime,
            startTime: timestamp,
            end: null,
            duration: 'Active'
        };

        const updatedLogs = [...cleanedLogs, newSession];

        const updates: any = {};
        updates[`drivers/${driverId}/workLogs`] = updatedLogs;
        updates[`DriversHub/${driverId}/workLogs`] = updatedLogs;
        updates[`drivers/${driverId}/status`] = 'online';
        updates[`drivers/${driverId}/availability`] = 'On Duty';
        updates[`drivers/${driverId}/lastActive`] = timestamp;
        updates[`drivers/${driverId}/activatedAt`] = timestamp;
        updates[`LiveDriverStatus/${driverId}/status`] = 'online';
        updates[`LiveDriverStatus/${driverId}/lastActive`] = timestamp;
        updates[`DriversHub/${driverId}/availability/status`] = 'online';

        await update(ref(database), updates);
    },

    subscribeToDailyRecords(driverId: string, callback: (records: DailyRecord[]) => void): () => void {
        const leaveRef = ref(database, `leave/${driverId}`);
        const unsubscribe = onValue(leaveRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(Object.values(snapshot.val()));
            } else {
                callback([]);
            }
        });
        return () => off(leaveRef);
    },

    // ============ DATA HEALING / REPAIR ============
    async repairDriverData(): Promise<void> {
        console.log("🛠️ Starting Comprehensive Database Repair...");
        const updates: any = {};
        const allUsers = await this.getAllUsers();

        console.log(`🔍 Checking ${allUsers.length} users for node consistency...`);

        for (const user of allUsers) {
            const role = user.role;
            const id = user.uid || user.employeeId; // Preference for UID as key in plural nodes, but employeeId for singular
            const employeeId = user.employeeId || id;

            if (role === 'driver') {
                // 1. Singular Driver Node (Requested)
                updates[`driver/${employeeId}/driverId`] = employeeId;
                updates[`driver/${employeeId}/employeeId`] = employeeId;
                updates[`driver/${employeeId}/username`] = user.username || '';
                updates[`driver/${employeeId}/email`] = user.email || '';
                updates[`driver/${employeeId}/phone`] = user.phone || '';
                updates[`driver/${employeeId}/location`] = user.location || 'Kandigai';
                updates[`driver/${employeeId}/password`] = user.password || '';
                updates[`driver/${employeeId}/createdAt`] = user.joinedAt || user.createdAt || new Date().toISOString();
                updates[`driver/${employeeId}/status`] = user.status || 'offline';
                updates[`driver/${employeeId}/isProfileComplete`] = user.isProfileComplete ?? true;

                // 2. Plural Drivers Node
                updates[`drivers/${employeeId}/driverId`] = employeeId;
                updates[`drivers/${employeeId}/username`] = user.username || '';
                updates[`drivers/${employeeId}/email`] = user.email || '';
                updates[`drivers/${employeeId}/phone`] = user.phone || '';
                updates[`drivers/${employeeId}/location`] = user.location || 'Kandigai';

                // 3. Signup Node (Consistency)
                updates[`signup/${employeeId}/username`] = user.username || '';
                updates[`signup/${employeeId}/email`] = user.email || '';
                updates[`signup/${employeeId}/phone num`] = user.phone || '';
                updates[`signup/${employeeId}/selected area`] = user.location || 'Kandigai';
                updates[`signup/${employeeId}/password`] = user.password || '';
                updates[`signup/${employeeId}/driverId`] = employeeId;

                // 4. Hub & Live Status
                updates[`DriversHub/${employeeId}/driverId`] = employeeId;
                updates[`DriversHub/${employeeId}/personnelIdentity/name`] = user.username || 'Unknown';
                updates[`DriversHub/${employeeId}/availability/status`] = user.status || 'offline';
            } else if (role === 'admin') {
                // 1. Singular Admin Node (Requested)
                updates[`admin/${employeeId}/adminId`] = employeeId;
                updates[`admin/${employeeId}/employeeId`] = employeeId;
                updates[`admin/${employeeId}/username`] = user.username || '';
                updates[`admin/${employeeId}/email`] = user.email || '';
                updates[`admin/${employeeId}/phone`] = user.phone || '';
                updates[`admin/${employeeId}/password`] = user.password || '';
                updates[`admin/${employeeId}/createdAt`] = user.joinedAt || user.createdAt || new Date().toISOString();
                updates[`admin/${employeeId}/isProfileComplete`] = user.isProfileComplete ?? true;

                // 2. Plural Admins Node
                updates[`admins/${employeeId}/adminId`] = employeeId;
                updates[`admins/${employeeId}/username`] = user.username || '';
                updates[`admins/${employeeId}/email`] = user.email || '';

                // 3. Signup Node (Consistency)
                updates[`signup/${employeeId}/username`] = user.username || '';
                updates[`signup/${employeeId}/email`] = user.email || '';
                updates[`signup/${employeeId}/password`] = user.password || '';
                updates[`signup/${employeeId}/driverId`] = employeeId;
            }
        }

        if (Object.keys(updates).length > 0) {
            console.log(`📦 Applying ${Object.keys(updates).length} healing updates...`);
            await update(ref(database), updates);
            console.log("✅ Database healing complete.");
        } else {
            console.log("✨ No healing required.");
        }
    },

    // Utility to fix root-level pollution (UHD... keys at root)
    async cleanupLegacyRootNodes(): Promise<void> {
        console.log("🧹 DB: Starting Root Node Cleanup...");
        const rootRef = ref(database);
        const snapshot = await get(rootRef);

        if (snapshot.exists()) {
            const rootData = snapshot.val();
            const updates: any = {};
            let count = 0;

            for (const [key, value] of Object.entries(rootData)) {
                // Detect root keys starting with UHD or UHA
                if (key.startsWith('UHD') || key.startsWith('UHA')) {
                    console.log(`📦 Found misplaced root node: ${key}. Migrating...`);
                    const isDriver = key.startsWith('UHD');
                    const targetPath = isDriver ? `driver/${key}` : `admin/${key}`;

                    // Move to new target nodes
                    updates[targetPath] = value;
                    // Delete from root
                    updates[key] = null;
                    count++;
                }
            }

            if (count > 0) {
                await update(ref(database), updates);
                console.log(`✅ Cleanup complete. Migrated ${count} nodes from root.`);
            } else {
                console.log("✨ Root is already clean.");
            }
        }
    },

    // ============ DELETE DRIVER PERMANENTLY ============
    async deleteDriver(driverId: string, email?: string): Promise<void> {
        console.log(`🗑️ DB: Permanently deleting driver: ${driverId}`);
        const updates: any = {};

        // 1. Fetch all users to find matching UIDs (Crucial for UID-based nodes)
        try {
            const usersSnap = await get(ref(database, 'users'));
            if (usersSnap.exists()) {
                const users = usersSnap.val();
                Object.keys(users).forEach(uid => {
                    const u = users[uid];
                    if (u.employeeId === driverId || u.uid === driverId || uid === driverId) {
                        console.log(`🧹 Found user record with UID ${uid}. Wiping...`);
                        updates[`users/${uid}`] = null;
                        // Also check for email-sanitized key
                        if (u.email) {
                            const san = u.email.replace(/[.@]/g, '_');
                            updates[`users/${san}`] = null;
                        }
                    }
                });
            }
        } catch (e) {
            console.warn("⚠️ User record search failed:", e);
        }

        // 2. Clear known paths
        const paths = [
            `users/${driverId}`,
            `drivers/${driverId}`,
            `driver/${driverId}`,
            `signup/${driverId}`,
            `DriversHub/${driverId}`,
            `LiveDriverStatus/${driverId}`,
            `leave/${driverId}`,
            driverId // root node
        ];

        // Clear by email if provided
        if (email) {
            const sanitizedEmail = email.replace(/[.@]/g, '_');
            updates[`users/${sanitizedEmail}`] = null;
        }

        paths.forEach(p => {
            updates[p] = null;
        });

        // 3. Search and remove leave requests
        try {
            const leavesSnap = await get(ref(database, 'leaves'));
            if (leavesSnap.exists()) {
                const leaves = leavesSnap.val();
                Object.keys(leaves).forEach(leaveId => {
                    if (leaves[leaveId].driverId === driverId) {
                        updates[`leaves/${leaveId}`] = null;
                    }
                });
            }
        } catch (e) {
            console.warn("⚠️ Leave deletion failed:", e);
        }

        // 4. Unassign bins from TaskPro/bins and trigger redistribution
        try {
            const binsSnap = await get(ref(database, 'bins'));
            if (binsSnap.exists()) {
                const bins = binsSnap.val();
                let areaToRedistribute: string | null = null;

                Object.keys(bins).forEach(binId => {
                    if (bins[binId].assignedDriverId === driverId) {
                        // Unassign instead of deleting
                        updates[`bins/${binId}/assignedDriverId`] = null;
                        if (!areaToRedistribute) {
                            areaToRedistribute = bins[binId].areaName;
                        }
                    }
                });

                // Apply initial updates (unassignment) before redistribution
                await update(ref(database), updates);

                // If we found an area, trigger redistribution
                if (areaToRedistribute) {
                    await this.redistributeAreaBins(areaToRedistribute);
                }
            }
        } catch (e) {
            console.warn("⚠️ Bin cleanup and redistribution failed:", e);
        }

        console.log(`✅ Driver ${driverId} deleted and bins unassigned/redistributed.`);
    },

    // ============ GENERIC UPDATE HELPER ============
    async updateData(path: string, updates: any): Promise<void> {
        await update(ref(database, path), updates);
    },

    // ============ AREA SETTINGS & SPATIAL SPLIT ============
    async getAreaSettings(area: string): Promise<any> {
        const snap = await get(ref(database, `settings/areas/${area.toLowerCase()}`));
        return snap.exists() ? snap.val() : {};
    },

    async updateAreaSettings(area: string, settings: any): Promise<void> {
        await update(ref(database, `settings/areas/${area.toLowerCase()}`), settings);
    },


    async distributeKandigaiBinsSpatially(): Promise<void> {
        console.log("📍 Starting Spatial Split for Kandigai...");

        // 1. Get Kandigai Drivers
        const drivers = await this.getAllDrivers();
        const kandigaiDrivers = drivers
            .filter(d => (d.location || '').toLowerCase() === 'kandigai')
            .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

        if (kandigaiDrivers.length === 0) {
            console.warn("⚠️ No drivers in Kandigai to distribute tasks to.");
            return;
        }

        // 2. Get Kandigai Bins
        const binsSnap = await get(ref(database, 'bins'));
        if (!binsSnap.exists()) return;
        const allBins = binsSnap.val();
        const kBins = Object.entries(allBins)
            .filter(([id, b]: [string, any]) => (b.areaName || '').toLowerCase() === 'kandigai')
            .map(([id, b]: [string, any]) => ({ ...b, id }));

        if (kBins.length === 0) return;

        const updates: any = {};

        if (kandigaiDrivers.length === 1) {
            // Case 1: Only one driver - assign all bins to them
            const d1 = kandigaiDrivers[0].employeeId;
            kBins.forEach(bin => {
                updates[`bins/${bin.id}/assignedDriverId`] = d1;
            });
            await update(ref(database), updates);
            console.log(`✅ Single Driver Assignment: All bins to ${d1}`);
            return;
        }

        // Case 2: 2+ drivers - Spatial Split
        const d1 = kandigaiDrivers[0].employeeId;
        const d2 = kandigaiDrivers[1].employeeId;

        // 3. Simple K-Means (K=2)
        // Initial Centroids (Min/Max Lat/Lng for diversity)
        let c1 = kBins[0].coordinates;
        let c2 = kBins[kBins.length - 1].coordinates;

        const getDist = (p1: any, p2: any) => Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lng - p2.lng, 2);

        let clusters: any[][] = [[], []];

        // Run 5 iterations for stability
        for (let iter = 0; iter < 5; iter++) {
            clusters = [[], []];
            kBins.forEach(bin => {
                const d1Arr = getDist(bin.coordinates, c1);
                const d2Arr = getDist(bin.coordinates, c2);
                if (d1Arr < d2Arr) clusters[0].push(bin);
                else clusters[1].push(bin);
            });

            // Update Centroids
            if (clusters[0].length > 0) {
                c1 = {
                    lat: clusters[0].reduce((s, b) => s + b.coordinates.lat, 0) / clusters[0].length,
                    lng: clusters[0].reduce((s, b) => s + b.coordinates.lng, 0) / clusters[0].length
                };
            }
            if (clusters[1].length > 0) {
                c2 = {
                    lat: clusters[1].reduce((s, b) => s + b.coordinates.lat, 0) / clusters[1].length,
                    lng: clusters[1].reduce((s, b) => s + b.coordinates.lng, 0) / clusters[1].length
                };
            }
        }

        // 4. Update Firebase
        clusters[0].forEach(bin => {
            updates[`bins/${bin.id}/assignedDriverId`] = d1;
        });
        clusters[1].forEach(bin => {
            updates[`bins/${bin.id}/assignedDriverId`] = d2;
        });

        await update(ref(database), updates);
        console.log(`✅ Spatial Split Complete: ${clusters[0].length} to ${d1}, ${clusters[1].length} to ${d2}`);
    },

    async purgeUserAllData(role: string, employeeId: string, uid: string, email: string): Promise<void> {
        console.log(`🧨 DB: Purging all data for ${role} ${employeeId}...`);
        const sanitizedEmail = (email || '').replace(/[.@]/g, '_');
        const updates: any = {};

        // 1. Core Auth-Mapping Nodes
        updates[`users/${uid}`] = null;
        if (sanitizedEmail) updates[`users/${sanitizedEmail}`] = null;

        // 2. Role-Specific Profiles
        if (role === 'driver') {
            updates[`drivers/${employeeId}`] = null;
            updates[`driver/${employeeId}`] = null;
            updates[`DriversHub/${employeeId}`] = null;
            updates[`LiveDriverStatus/${employeeId}`] = null;
            updates[`leave/${employeeId}`] = null;
        } else if (role === 'admin') {
            updates[`admins/${employeeId}`] = null;
            updates[`admin/${employeeId}`] = null;
        }

        // 3. Generic Signup Node
        updates[`signup/${employeeId}`] = null;

        // 4. Search and remove leave requests from the 'leaves' node
        try {
            const leavesSnap = await get(ref(database, 'leaves'));
            if (leavesSnap.exists()) {
                const leaves = leavesSnap.val();
                Object.keys(leaves).forEach(leaveId => {
                    if (leaves[leaveId].driverId === employeeId || leaves[leaveId].employeeId === employeeId) {
                        updates[`leaves/${leaveId}`] = null;
                    }
                });
            }
        } catch (e) {
            console.warn("⚠️ Leave deletion failed during purge:", e);
        }

        // Apply deletion
        await update(ref(database), updates);
        console.log(`✅ ${role} ${employeeId} purged from database.`);
    }
};
