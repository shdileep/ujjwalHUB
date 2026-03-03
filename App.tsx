
import React, { useState, useEffect } from 'react';
import { Trash2, Plus, GripVertical, MapPin, Navigation, Clock, CheckCircle2, AlertTriangle, RefreshCw, Loader2, ShieldCheck } from 'lucide-react';
import { Splash } from './components/Splash';
import { RoleSelection } from './components/RoleSelection';
import { AuthContainer } from './components/AuthContainer';
import { Dashboard } from './components/Dashboard';
import { DriverDashboard } from './components/DriverDashboard';
import { CompleteProfile } from './components/CompleteProfile';
import { Role, User, AppState, DriverProfile, AdminProfile, LeaveRequest, Bin, Notification, Complaint, DutyEvent } from './types';
import { useAuth } from './hooks/useAuth';
import { useDrivers, useBins, useComplaints, useLeaves, useNotifications, useLiveStatus, useDriversHub, useTasks } from './hooks/useRealtimeData';
import { databaseService } from './services/database.service';
import { authService } from './services/auth.service';
import { database } from './firebase.config';
import { ref, get } from 'firebase/database';
import { OfflineIndicator } from './components/OfflineIndicator';

import { CHENNAI_BINS_DATA } from './constants/chennaiBins';
import { ADAMBAKKAM_FIXED } from './constants/adambakkamFixed'; // v17 Fix
import { WEST_CHENGALPATTU_BINS } from './constants/westChengalpattuBins';
import { KANDIGAI_BINS } from './constants/kandigaiData'; // v35 Kandigai Import

const STORAGE_KEY = 'ujjwalhub_persistent_state';

const DEFAULT_BINS: Bin[] = [];

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [role, setRole] = useState<Role>(() => {
    const saved = localStorage.getItem('ujjwal_session_role');
    return (saved && saved !== 'null' && saved !== 'undefined') ? (saved as Role) : null;
  });
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('ujjwal_authenticated') === 'true';
  });
  const [isDriverActive, setIsDriverActive] = useState(false);
  const [activationTime, setActivationTime] = useState<string | null>(null);
  const [isUjjwalRouteActive, setIsUjjwalRouteActive] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);
  const [isRestoringUser, setIsRestoringUser] = useState(true);
  const [showRulesOverlay, setShowRulesOverlay] = useState(false);
  const [assessmentActive, setAssessmentActive] = useState(false);

  // Firebase hooks
  const { currentUser: firebaseUser, loading: authLoading } = useAuth();
  const { drivers, loading: driversLoading } = useDrivers();
  const { bins, loading: binsLoading } = useBins();
  const { complaints, loading: complaintsLoading } = useComplaints();
  const { leaves, loading: leavesLoading } = useLeaves();
  const { notifications, loading: notificationsLoading } = useNotifications();
  const { liveStatus, loading: liveStatusLoading } = useLiveStatus();
  const { hubEntries, loading: hubLoading } = useDriversHub();
  const { tasks, loading: tasksLoading } = useTasks();

  const [state, setState] = useState<AppState>({
    role: null,
    user: null,
    isAuthenticated: false,
    drivers: [],
    bins: DEFAULT_BINS,
    tasks: [],
    notifications: [],
    complaints: [],
    leaves: [],
    liveStatus: [],
    driversHub: [],
    isDriverActive: false,
    activationTime: null,
    lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isUjjwalRouteActive: false,
    assessmentActive: false,
    dailyRecords: []
  });

  // Migrate localStorage data to Firebase (one-time)
  useEffect(() => {
    const migrateData = async () => {
      if (migrationDone || !firebaseUser) return;

      const savedState = localStorage.getItem(STORAGE_KEY);
      const savedUsers = localStorage.getItem(STORAGE_KEY + '_users');

      if (savedState || savedUsers) {
        try {
          // Migrate bins
          if (savedState) {
            const parsed = JSON.parse(savedState);

            if (parsed.bins && parsed.bins.length > 0) {
              for (const bin of parsed.bins) {
                await databaseService.createBin(bin.id, bin);
              }
            }

            // Migrate drivers
            if (parsed.drivers && parsed.drivers.length > 0) {
              for (const driver of parsed.drivers) {
                // Ensure we use the NEW createDriver which handles Hub sync
                await databaseService.createDriver(driver.employeeId, {
                  username: driver.name,
                  email: driver.email,
                  phone: driver.phone,
                  password: 'migrated_user', // dummy password for migration
                  driverId: driver.employeeId,
                  createdAt: new Date().toISOString()
                } as any);
              }
            }

            // Migrate complaints
            if (parsed.complaints && parsed.complaints.length > 0) {
              for (const complaint of parsed.complaints) {
                await databaseService.createComplaint(complaint);
              }
            }

            // Migrate leaves
            if (parsed.leaves && parsed.leaves.length > 0) {
              for (const leave of parsed.leaves) {
                await databaseService.createLeaveRequest(leave);
              }
            }

            // Migrate notifications - DISABLED per user request to stop default notifications
            // if (parsed.notifications && parsed.notifications.length > 0) {
            //   for (const notification of parsed.notifications) {
            //     await databaseService.createNotification(notification);
            //   }
            // }

            // NUCLEAR OPTION: Delete all notifications immediately if requested
            await databaseService.deleteAllNotifications();
            console.log("☢️ NOTIFICATIONS NODE WIPED PERMANENTLY ☢️");
          }

          // Migrate users
          if (savedUsers) {
            const users = JSON.parse(savedUsers);
            for (const user of users) {
              await databaseService.createUser(user.email.replace(/[.@]/g, '_'), user);
            }
          }

          setMigrationDone(true);
          console.log('✅ Data migration completed successfully');
        } catch (error) {
          console.error('Migration error:', error);
        }
      }
    };

    migrateData();
  }, [firebaseUser, migrationDone]);

  // Data Healing - Auto-migrates users to drivers/hub if missing or if from Kandigai
  useEffect(() => {
    if (isAuthenticated) {
      const healDrivers = async () => {
        try {
          console.log("🛠️ App-level data healing starting...");
          await databaseService.repairDriverData();
          await databaseService.cleanupLegacyRootNodes();
          console.log("✅ App-level data healing completed.");
        } catch (e) {
          console.error("Heal error:", e);
        }
      };

      // Force healing for now to ensure user-requested nodes are created
      healDrivers();
      // const hasHealed = localStorage.getItem('drivers_healed_v5_signup');
      // if (!hasHealed) {
      //   healDrivers().then(() => localStorage.setItem('drivers_healed_v5_signup', 'true'));
      // }
    }
  }, [isAuthenticated]);

  // Kandigai Data Seeding (v37) - Ensures the 46 bins are in DB exactly and forces upload
  useEffect(() => {
    const seedKandigai = async () => {
      if (!firebaseUser || !isAuthenticated) return;

      try {
        const binsRef = ref(database, 'bins');
        const snapshot = await get(binsRef);
        let kandigaiCount = 0;

        if (snapshot.exists()) {
          const allBinsInDb = Object.values(snapshot.val() as Record<string, Bin>);
          kandigaiCount = allBinsInDb.filter(b => (b.areaName || '').toLowerCase() === 'kandigai').length;
        }

        // Always check Kandigai data presence, and inject immediately if absent or partially absent
        if (kandigaiCount < 46) {
          console.log(`🚀 Seeding Kandigai Dataset (Current: ${kandigaiCount}, Required: 46)...`);
          await databaseService.saveAllBins(KANDIGAI_BINS);
          console.log("✅ Kandigai Dataset Synchronized.");
        } else {
          // Force an upload anyway for Kandigai to overwrite any broken CSV imports by the admin
          const hasForcedKandigaiUpload = localStorage.getItem('kandigai_forced_upload_v2');
          if (!hasForcedKandigaiUpload) {
            console.log("🚀 Force Re-Uploading Kandigai Dataset to fix corrupted imports...");
            await databaseService.saveAllBins(KANDIGAI_BINS);
            localStorage.setItem('kandigai_forced_upload_v2', 'true');
            console.log("✅ Kandigai Dataset Force Synchronized.");
          } else {
            console.log("ℹ️ Kandigai dataset is healthy (46 bins).");
          }
        }
      } catch (e) {
        console.error("Kandigai Seeding Error:", e);
      }
    };

    seedKandigai();
  }, [firebaseUser, isAuthenticated]);

  // Healing logic for Leaves metadata (v38)
  useEffect(() => {
    const healLeaves = async () => {
      if (!firebaseUser || leaves.length === 0 || hubEntries.length === 0) return;

      const hasHealed = localStorage.getItem('leaves_metadata_healed_v1');
      if (hasHealed) return;

      console.log("🩹 Starting Leave Metadata Healing...");
      let healCount = 0;

      for (const leave of leaves) {
        const lName = (leave.driverName || '').trim().toUpperCase();
        if (!leave.driverName || lName === 'N/A' || lName === 'UNKNOWN' || !leave.area) {
          // Attempt recovery from hub entries
          const hubMatch = hubEntries.find(h =>
            (h.driverId || '').trim().toLowerCase() === (leave.driverId || '').trim().toLowerCase()
          );

          if (hubMatch) {
            const updates: Partial<LeaveRequest> = {};
            if (!leave.driverName || lName === 'N/A' || lName === 'UNKNOWN') {
              updates.driverName = hubMatch.personnelIdentity.name;
            }
            if (!leave.area) {
              updates.area = hubMatch.personnelIdentity.location || 'Kandigai';
            }
            if (!leave.phone || leave.phone === 'Unknown') {
              updates.phone = hubMatch.personnelIdentity.phone;
            }

            if (Object.keys(updates).length > 0) {
              console.log(`🩹 Healing leave ${leave.id} for driver ${hubMatch.personnelIdentity.name}`);
              await databaseService.updateLeaveRequest(leave.id, updates);
              healCount++;
            }
          }
        }
      }

      if (healCount > 0) {
        console.log(`✅ Healed ${healCount} records in 'leaves' node.`);
      }
      localStorage.setItem('leaves_metadata_healed_v1', 'true');
    };

    healLeaves();
  }, [firebaseUser, leaves, hubEntries]);

  // GUARANTEED NUKE: Runs once to clear notifications, ignoring migration status
  useEffect(() => {
    const hasNuked = localStorage.getItem('notifications_nuked_v1');
    if (!hasNuked && firebaseUser) {
      databaseService.deleteAllNotifications().then(() => {
        console.log("☢️ GUARANTEED NUKE: Notifications cleared.");
        localStorage.setItem('notifications_nuked_v1', 'true');
        // Force local state clear just in case
        setState(prev => ({ ...prev, notifications: [] }));
      });
    }
  }, [firebaseUser]);

  // Sync Firebase data to local state - SPLIT TO PREVENT OPTIMISTIC OVERWRITES
  useEffect(() => { setState(prev => ({ ...prev, drivers })); }, [drivers]);
  useEffect(() => { setState(prev => ({ ...prev, bins: bins.length > 0 ? bins : prev.bins })); }, [bins]);
  useEffect(() => { setState(prev => ({ ...prev, complaints })); }, [complaints]);
  useEffect(() => {
    setState(prev => {
      // Only update if the hook data is different to avoid racing with local optimistic updates
      if (JSON.stringify(prev.leaves) === JSON.stringify(leaves)) return prev;
      return { ...prev, leaves };
    });
  }, [leaves]);
  useEffect(() => { setState(prev => ({ ...prev, notifications: notifications.length > 0 ? notifications : prev.notifications })); }, [notifications]);
  useEffect(() => { setState(prev => ({ ...prev, liveStatus })); }, [liveStatus]);
  useEffect(() => { setState(prev => ({ ...prev, driversHub: hubEntries })); }, [hubEntries]);
  useEffect(() => { setState(prev => ({ ...prev, tasks })); }, [tasks]);
  useEffect(() => {
    setState(prev => ({
      ...prev,
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
  }, [drivers, bins, complaints, leaves, notifications, liveStatus, hubEntries, tasks]);

  // Load user data when Firebase auth changes
  useEffect(() => {
    const loadUserData = async () => {
      // 1. Give up immediately if auth is currently computing
      if (authLoading) return;

      // Check local storage for an active session to prevent aggressive logout
      const isLocallyAuthenticated = localStorage.getItem('ujjwal_authenticated') === 'true';
      const savedRole = localStorage.getItem('ujjwal_session_role') as Role;
      const cachedUser = localStorage.getItem('ujjwal_user_data');

      // 2. ABSOLUTE ZERO-WAIT LOCAL STORAGE OVERRIDE
      // If we have a cached user, we load it IMMEDIATELY regardless of Firebase state
      if (isLocallyAuthenticated && cachedUser) {
        try {
          const u = JSON.parse(cachedUser);
          if (!user || user.email !== u.email) {
            console.log("⚡ INSTANT HYDRATION: Restoring session from Local Storage Bypass...");
            setUser(u);
            setIsAuthenticated(true);
            const finalRole = u.role || savedRole || role;
            setRole(finalRole);
          }
          setIsRestoringUser(false);

          // We don't return here. We let the rest of the function run to sync with Firebase in the background
          // BUT we have already satisfied the UI payload.
        } catch (e) {
          console.warn("Cache parse failed, falling back to Firebase login...", e);
        }
      } else if (!firebaseUser) {
        // No local cache, and no firebase user -> True Logout
        console.log("🚪 No active session detected. Clearing credentials...");
        setUser(null);
        setIsAuthenticated(false);
        setIsRestoringUser(false);
        localStorage.removeItem('ujjwal_authenticated');
        localStorage.removeItem('ujjwal_session_role');
        localStorage.removeItem('ujjwal_user_data');
        return;
      }

      // If we made it here without returning, we either need to fetch from Firebase,
      // or we are doing a background sync for the locally hydrated user.
      if (!firebaseUser) return; // Background sync cannot happen without Firebase

      console.log("🔄 Verifying/Syncing user session for:", firebaseUser.email || firebaseUser.uid);

      try {
        let userData = null;
        if (firebaseUser.email) {
          userData = await databaseService.getUserByEmail(firebaseUser.email);
        }

        if (!userData) {
          userData = await databaseService.getUser(firebaseUser.uid);
        }

        if (userData) {
          // Found real profile
          setUser(userData);
          setIsAuthenticated(true);
          const finalRole = userData.role || savedRole || role;
          setRole(finalRole);
          localStorage.setItem('ujjwal_authenticated', 'true');
          localStorage.setItem('ujjwal_user_data', JSON.stringify(userData));
          localStorage.removeItem('signup_in_progress'); // Clear on success
          if (finalRole) localStorage.setItem('ujjwal_session_role', finalRole);
          console.log("✅ User profile synced:", userData.username);
        } else {
          // No profile? Create skeleton ONLY if we don't already have a valid user in state
          // AND we aren't currently in the middle of a signup
          if (localStorage.getItem('signup_in_progress') === 'true') {
            console.log("🛡️ Blocking skeleton overwrite: Signup in progress...");
            return;
          }

          if (user && user.isProfileComplete && user.uid === firebaseUser.uid) {
            console.log("🛡️ Blocking skeleton overwrite. Current user is complete.");
            return;
          }

          console.warn("⚠️ No user profile found in database. Initializing skeleton...");
          const skeletonUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            username: firebaseUser.displayName || 'New User',
            role: savedRole || role || 'driver',
            employeeId: `EMP-${firebaseUser.uid.slice(0, 5).toUpperCase()}`,
            location: 'Kandigai',
            isProfileComplete: false,
            joinedAt: new Date().toISOString()
          } as any;
          setUser(skeletonUser);
          setIsAuthenticated(true);
          localStorage.setItem('ujjwal_authenticated', 'true');
          localStorage.setItem('ujjwal_user_data', JSON.stringify(skeletonUser));
          if (savedRole || role) localStorage.setItem('ujjwal_session_role', savedRole || role as string);
        }
      } catch (err) {
        console.error("❌ Sync Error:", err);
      } finally {
        setIsRestoringUser(false);
      }
    };

    loadUserData();
  }, [firebaseUser, authLoading]);

  // Update state object when individual state pieces change
  useEffect(() => {
    setState(prev => ({
      ...prev,
      role,
      user,
      isAuthenticated,
      isDriverActive,
      activationTime,
      isUjjwalRouteActive,
      assessmentActive
    }));
  }, [role, user, isAuthenticated, isDriverActive, activationTime, isUjjwalRouteActive, assessmentActive]);

  // DATASET IMPORT (One-Time Execution)
  const [isRecovering, setIsRecovering] = useState(false);

  // DATASET IMPORT (One-Time Execution)
  useEffect(() => {
    // Immediate check on mount
    const checkAndImport = async () => {
      const hasImported = localStorage.getItem('chennai_bins_imported_v10');

      // Critical recovery condition: Low bins OR explicit version mismatch
      // DISABLE AUTO-RECOVERY as per user request to remove bins
      const shouldRecover = false; // !hasImported || (bins.length < 1000 && CHENNAI_BINS_DATA.length > 10000);

      if (shouldRecover) {
        console.log("CRITICAL: Starting Data Recovery...");
        setIsRecovering(true);

        // 1. Wipe if needed
        if (bins.length < 1000) {
          await databaseService.resetBinsToDefault([]);
        }

        // 2. BULK IMPORT (Optimized)
        console.log("Performing optimized bulk write...");
        await databaseService.saveAllBins(CHENNAI_BINS_DATA);

        localStorage.setItem('chennai_bins_imported_v10', 'true');
        console.log("Recovery Complete.");
        window.location.reload();
      }
    };

    // Small delay to ensure firebase is ready
    const timer = setTimeout(checkAndImport, 1000);
    return () => clearTimeout(timer);
  }, [bins.length]);

  // THE ENFORCER: Watch for and kill specific Ghost Bins (01/02 Adyar/Besant)
  // If they appear, they are deleted immediately.
  // THE ENFORCER: Watch for and kill specific Ghost Bins (01/02 Adyar/Besant)
  // DISABLED: It might be killing legitimate Adambakkam bins.
  // useEffect(() => {
  //   const ghostsFound = bins.filter(b => {
  //     if (b.id === '01' || b.id === '02') {
  //       const area = (b.areaName || '').toUpperCase();
  //       return !area.includes('ADAMBAKKAM');
  //     }
  //     return false;
  //   });
  //   if (ghostsFound.length > 0) {
  //     console.log("👻 ENFORCER: Detected Ghost Bins! Exterminating...", ghostsFound);
  //     ghostsFound.forEach(g => {
  //       databaseService.deleteBin(g.id);
  //     });
  //   }
  // }, [bins]);



  // 1. Splash Screen & Redistribution Automation
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);

    const loadAssessment = async () => {
      const location = user?.location;
      if (location) {
        try {
          const settings = await databaseService.getAreaSettings(location.trim());
          setAssessmentActive(settings.assessmentActive || false);
        } catch (e) {
          console.warn("Failed to fetch assessment settings:", e);
        }
      }
    };
    loadAssessment();
    const interval = setInterval(loadAssessment, 5000);

    const autoRedistribute = async () => {
      if (isAuthenticated && role === 'driver' && user?.location === 'Kandigai') {
        const hasRedistributed = sessionStorage.getItem(`redistributed_${user.employeeId}`);
        if (!hasRedistributed) {
          console.log("🚀 Automated Bin Redistribution triggered for:", user.username);
          try {
            await databaseService.redistributeAreaBins('Kandigai');
            sessionStorage.setItem(`redistributed_${user.employeeId}`, 'true');
            console.log("✅ Redistribution Complete.");
          } catch (e) {
            console.error("Redistribution failed:", e);
          }
        }
      }
    };

    if (isAuthenticated) {
      autoRedistribute();
    }

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isAuthenticated, role, user]);

  // 1. NUCLEAR GHOSTBUSTER: Persistent Watchdog
  // This runs on EVERY bins update to instantly kill Adyar/Besant 01/02
  useEffect(() => {
    if (!bins || bins.length === 0) return;

    const ghosts = bins.filter(b => {
      const id = b.id;
      const area = (b.areaName || '').toUpperCase();
      const loc = (b.locationName || '').toUpperCase();

      // Target: ID 01, 02 (or single digit 1, 2)
      // AND Area is ADYAR or BESANT
      if (['01', '02', '1', '2'].includes(id)) {
        if (area.includes('ADYAR') || area.includes('BESANT') ||
          loc.includes('ADYAR') || loc.includes('BESANT')) {
          return true;
        }
      }
      return false;
    });

    if (ghosts.length > 0) {
      console.error("👻 GHOSTBUSTER CAUGHT THEM:", ghosts);
      ghosts.forEach(g => {
        databaseService.deleteBin(g.id);
        // Also try deleting padded/unpadded variants just in case
        databaseService.deleteBin('01');
        databaseService.deleteBin('1');
        databaseService.deleteBin('02');
        databaseService.deleteBin('2');
      });
    }
  }, [bins]);

  // 2. Adambakkam Migration Logic - DIAMOND FIX (v18 - GOLDEN IMPORT + LOCK)
  useEffect(() => {
    const importAdambakkam = async () => {
      if (!firebaseUser || !isAuthenticated) return;
      const isDone = localStorage.getItem('adambakkam_v19_diamond');
      if (isDone) return;

      console.log('🚀 Starting Adambakkam Bins Import v19 (Diamond Fix - Post Kandigai Restore)...');

      try {
        // 1. NUKE EVERYTHING LOW ID
        const deletePromises = [];
        for (let i = 1; i <= 5; i++) {
          deletePromises.push(databaseService.deleteBin(i.toString()));
          deletePromises.push(databaseService.deleteBin(i.toString().padStart(2, '0')));
        }
        await Promise.all(deletePromises);

        // 2. Import GOLDEN DATA (01-43)
        await Promise.all(ADAMBAKKAM_FIXED.map(bin => {
          // Explicitly overwrite
          return databaseService.createBin(bin.id, bin);
        }));

        console.log(`✅ Successfully restored ${ADAMBAKKAM_FIXED.length} Adambakkam bins (v19)!`);
        localStorage.setItem('adambakkam_v19_diamond', 'true');

        window.location.reload();
      } catch (err) {
        console.error("❌ Adambakkam Migration Failed:", err);
      }
    };

    // Run IMMEDIATELY
    importAdambakkam();
  }, [firebaseUser, isAuthenticated]);

  // 3. West Chengalpattu Injection - (v21 - CUSTOM DISTRIBUTION 43 BINS)
  useEffect(() => {
    const importWC = async () => {
      if (!firebaseUser || !isAuthenticated) return;

      // Check for v34 flag (Corrected: 46 Bins V34, New Icons, Explicit Data from User - FINAL REAL)
      const isDone = localStorage.getItem('west_chengalpattu_v34_final_real');
      if (isDone) return;

      console.log('🚀 Starting West Chengalpattu Import v34 (Explicit Data, New Icons - REAL FIX)...');

      try {
        // 1. DELETE ALL West Chengalpattu Bins (By Area Name Search)
        // This ensures we catch ANY bin labeled for this area, regardless of ID format
        const allBins = await databaseService.getAllBins();
        const binsToDelete = allBins.filter(b =>
          b.areaName === 'West Chengalpattu' ||
          b.locationName === 'Mambakkam' ||
          b.locationName === 'Kandigai' ||
          b.locationName === 'Melakottaiyur' ||
          b.locationName === 'Nallambakkam' ||
          (b.id && (b.id.startsWith('WCP_') || (parseInt(b.id) <= 60 && !isNaN(parseInt(b.id)))))
        );

        console.log(`Found ${binsToDelete.length} bins to delete for West Chengalpattu cleanup.`);

        const deletePromises = binsToDelete.map(b => databaseService.deleteBin(b.id));
        await Promise.all(deletePromises);

        // 2. Import NEW 46 BINS
        await Promise.all(WEST_CHENGALPATTU_BINS.map(bin => {
          return databaseService.createBin(bin.id, bin);
        }));

        console.log(`✅ Successfully injected ${WEST_CHENGALPATTU_BINS.length} West Chengalpattu bins (v34)!`);
        localStorage.setItem('west_chengalpattu_v34_final_real', 'true');

        // Reload to reflect changes
        window.location.reload();
      } catch (err) {
        console.error("❌ West Chengalpattu Migration Failed:", err);
      }
    };
    importWC();
  }, [firebaseUser, isAuthenticated]);

  // 4. Kandigai Injection - (v47 - EXACT OFFICIAL DATASET AND COORDS)
  useEffect(() => {
    const importKandigai = async () => {
      if (binsLoading) return;
      if (!isAuthenticated) return;

      const isDone = localStorage.getItem('kandigai_v51_official');

      // Removed shouldForce check. We want to force this if flag is missing.
      if (isDone) return;

      console.log('🚀 [v51] Starting Kandigai Official Injection (Forcing precise data)...');
      try {
        const allCurrentBins = await databaseService.getAllBins();

        // Delete all old K_ bins or bins labeled Kandigai
        const binsToDelete = allCurrentBins.filter(b =>
          (b.areaName || '').toLowerCase() === 'kandigai' ||
          (b.id && b.id.startsWith('K_'))
        );

        if (binsToDelete.length > 0) {
          console.log(`Deleting ${binsToDelete.length} obsolete Kandigai bins...`);
          await Promise.all(binsToDelete.map(b => databaseService.deleteBin(b.id)));
        }

        console.log(`Injecting ${KANDIGAI_BINS.length} exact official Kandigai bins...`);
        await Promise.all(KANDIGAI_BINS.map(bin => databaseService.createBin(bin.id, bin)));

        localStorage.setItem('kandigai_v51_official', 'true');
        console.log("✅ [v51] Injection Complete. Reloading to apply.");
        window.location.reload(); // Reload needed to show new data immediately
      } catch (err) {
        console.error("❌ Fatal Injection Error (v47):", err);
      }
    };

    importKandigai();
  }, [isAuthenticated, binsLoading, bins.length]);

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));

    // Side effects should NOT be inside setState. 
    // They are handled by individual component actions or explicit service calls.
    // Handling specific state-driven effects here (like Ujjwal Route visibility)
    if (updates.hasOwnProperty('isUjjwalRouteActive')) {
      setIsUjjwalRouteActive(updates.isUjjwalRouteActive!);
    }
  };

  const FirebaseRulesNotice: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="p-8 md:p-12 space-y-8">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-red-50 text-red-600 rounded-3xl">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">DATABASE ACCESS BLOCKED (V2)</h2>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mt-2">Critical Security Rule Violation</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl space-y-4">
              <p className="text-sm font-bold text-slate-600 leading-relaxed">
                Firebase is rejecting your connection with <span className="text-red-600 font-black">PERMISSION_DENIED</span>.
                This happens when your Database Rules are set to locked mode or have expired.
              </p>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HOW TO FIX IN 30 SECONDS:</p>
                <ol className="list-decimal list-inside text-xs font-bold text-slate-600 space-y-1 ml-2">
                  <li>Go to your <a href="https://console.firebase.google.com/" target="_blank" className="text-indigo-600 underline">Firebase Console</a></li>
                  <li>Select your Project (Ujjwal) → Realtime Database</li>
                  <li>Click the <span className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px]">Rules</span> tab at the top</li>
                  <li>Paste the code block below and click <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px]">Publish</span></li>
                </ol>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-slate-900 text-white rounded-full text-[8px] font-black uppercase tracking-widest">Copy this Code</div>
              <pre className="bg-slate-900 text-indigo-300 p-8 rounded-3xl text-[11px] font-mono overflow-x-auto border-2 border-indigo-900/50">
                {`{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && (auth.uid === $uid || root.child('users').child(auth.uid).child('role').val() === 'admin')"
      }
    },
    "admin": {
      ".read": "auth != null",
      ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'admin' || auth.uid === $adminId || root.child('users').child(auth.uid).child('employeeId').val() === $adminId)"
    },
    "driver": {
      ".read": "auth != null",
      ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'admin' || root.child('users').child(auth.uid).child('employeeId').val() === $driverId || auth.uid === $driverId)"
    },
    "signup": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}`}
              </pre>
            </div>

            <button
              onClick={onClose}
              className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95"
            >
              I have updated my rules
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleLogin = async (userData: User, isNewSignup: boolean = false, password?: string) => {
    try {
      console.log(`🔐 handleLogin: isNewSignup=${isNewSignup}, role=${userData.role}, user=${userData.email}`);
      localStorage.removeItem('signup_in_progress'); // Global clear

      if (isNewSignup) {
        const sanitizedEmail = userData.email.replace(/[.@]/g, '_');

        // 1. Create User Records (Critical for Auth Sync)
        try {
          // Optimization: AuthContainer already wrote these, but we confirm here
          // to satisfy the handleLogin flow.
          console.log(`📝 Syncing user state for ${userData.username}...`);
          // We don't re-createUser here if not needed, or we just trust the state
          // since AuthContainer now handles pre-persistence.

          try {
            console.log(`📝 Creating Email-ID record at /users/${sanitizedEmail}...`);
            await databaseService.createUser(sanitizedEmail, userData);
            console.log("✅ Email record created.");
          } catch (emailErr: any) {
            console.warn("⚠️ Email-based user record failed (often blocked by rules), skipping...", emailErr);
          }
        } catch (err: any) {
          console.error("❌ CRITICAL: Failed to create Primary User record.", err);
          if (err.message?.includes('PERMISSION_DENIED')) {
            setShowRulesOverlay(true);
          }
          alert(`Database Registration Blocked: ${err.message}. 
          
This is usually caused by Firebase Security Rules. 
Please ensure your rules allow writes to: /users/${userData.uid}`);
          throw err;
        }

        // 2. Create Role-Specific Nodes
        try {
          if (userData.role === 'driver') {
            console.log("🚛 Registering Driver status...");
            await registerDriverStatus(userData, password);
            console.log("✅ Driver status registered.");
          } else if (userData.role === 'admin') {
            console.log("🛡️ Registering Admin status...");
            await registerAdminStatus(userData, password);
            console.log("✅ Admin status registered.");
          }
        } catch (err: any) {
          console.error("❌ CRITICAL: Role-specific registration failed.", err);
          alert(`Registration Error: ${err.message}. Admin/Dashboard nodes might be missing.`);
          // We don't throw here so the user can still enter, but they are notified of the failure.
        }
      } else {
        // Logged-in existing user verification
        // BE MORE AGGRESSIVE: Even if profile says it's incomplete, try to register it in correct nodes
        if (userData.role === 'driver') {
          try {
            const existingDriver = await databaseService.getDriver(userData.employeeId);
            if (!existingDriver || !userData.isProfileComplete) {
              console.warn("⚠️ Driver profile missing or incomplete for existing user. Auto-healing...");
              await registerDriverStatus(userData);
            }
            await updateDriverAvailability(userData, 'online');
          } catch (err: any) {
            console.error("❌ Existing driver recovery failed.", err);
            if (err.message?.includes('PERMISSION_DENIED')) setShowRulesOverlay(true);
          }
        } else if (userData.role === 'admin') {
          try {
            const existingAdmin = await databaseService.getAdmin(userData.employeeId);
            if (!existingAdmin || !userData.isProfileComplete) {
              console.warn("⚠️ Admin profile missing or incomplete for existing user. Auto-healing...");
              await registerAdminStatus(userData);
            }
          } catch (err: any) {
            console.error("❌ Existing admin recovery failed.", err);
            if (err.message?.includes('PERMISSION_DENIED')) setShowRulesOverlay(true);
          }
        }
      }

      // Final Hydration
      console.log("✨ Finalizing login state...");
      setUser(userData);
      setRole(userData.role);
      setIsAuthenticated(true);
      localStorage.setItem('ujjwal_authenticated', 'true');
      localStorage.setItem('ujjwal_user_data', JSON.stringify(userData));
      if (userData.role) localStorage.setItem('ujjwal_session_role', userData.role);
    } catch (err) {
      console.error("❌ Login process failure:", err);
      // Removed forced authentication on failure to prevent "skeleton trap"
      setIsAuthenticated(false);
      localStorage.removeItem('ujjwal_authenticated');
    }
  };

  const registerDriverStatus = async (user: User, password?: string) => {
    const newDriver: DriverProfile = {
      driverId: user.employeeId,
      username: user.username,
      email: user.email,
      phone: user.phone,
      password: password,
      status: 'offline',
      location: user.location, // Critical fix: include location
      createdAt: new Date().toISOString(),
      profilePhoto: user.profilePhoto || null
    };

    await databaseService.createDriver(user.employeeId, newDriver);
    await databaseService.saveToDriverNode(user.employeeId, newDriver);

    // Also create the specific signup record requested by the user
    await databaseService.createSignupRecord(user.employeeId, {
      username: user.username,
      email: user.email,
      phone: user.phone,
      location: user.location || 'Kandigai',
      password: password
    });

    // ============ VERIFICATION STEP ============
    console.log(`🔍 Verifying driver node at /driver/${user.employeeId}...`);
    const exists = await databaseService.checkNodeExists(`driver/${user.employeeId}`);
    if (!exists) {
      console.error(`❌ CRITICAL: Driver node creation failed at /driver/${user.employeeId}`);
      throw new Error(`Database Error: Driver node /driver/${user.employeeId} was not created. This usually means a permission block.`);
    }
    console.log(`✅ Verification successful for /driver/${user.employeeId}`);
  };

  const registerAdminStatus = async (user: User, password?: string) => {
    const newAdmin: AdminProfile & { password?: string, isProfileComplete?: boolean } = {
      adminId: user.employeeId,
      username: user.username,
      email: user.email,
      phone: user.phone,
      password: password,
      createdAt: new Date().toISOString(),
      isProfileComplete: user.isProfileComplete,
      profilePhoto: user.profilePhoto || null
    };

    console.log(`📝 saving admin to /admin/${user.employeeId}`);
    await databaseService.createAdmin(user.employeeId, newAdmin);
    await databaseService.saveToAdminNode(user.employeeId, newAdmin);

    // Also register the Admin in the generic signup node so they appear in that list if needed
    console.log(`📝 saving record to /signup/${user.employeeId}`);
    await databaseService.createSignupRecord(user.employeeId, {
      username: user.username,
      email: user.email,
      phone: user.phone,
      location: user.location || 'Chennai',
      password: password
    });

    // ============ VERIFICATION STEP ============
    console.log(`🔍 Verifying admin node at /admin/${user.employeeId}...`);
    const exists = await databaseService.checkNodeExists(`admin/${user.employeeId}`);
    if (!exists) {
      console.error(`❌ CRITICAL: Admin node creation failed at /admin/${user.employeeId}`);
      throw new Error(`Database Error: Admin node /admin/${user.employeeId} was not created. This usually means a permission block.`);
    }
    console.log(`✅ Verification successful for /admin/${user.employeeId}`);
  };

  const updateDriverAvailability = async (user: User, status: 'online' | 'offline') => {
    await databaseService.updateDriverStatus(user.employeeId, status);
  };

  const handleLogout = async () => {
    console.log("🚪 Starting logout process...");

    // 1. CLEAR LOCAL STORAGE IMMEDIATELY
    // Doing this first prevents the "Instant Hydration" race condition
    localStorage.removeItem('ujjwal_authenticated');
    localStorage.removeItem('ujjwal_session_role');
    localStorage.removeItem('ujjwal_user_data');
    localStorage.removeItem('ujjwal_session_email'); // If any

    // 2. Clear Local State
    setUser(null);
    setIsAuthenticated(false);
    setRole(null);
    setIsDriverActive(false);
    setActivationTime(null);
    setIsUjjwalRouteActive(false);

    try {
      if (user?.role === 'driver' && user.employeeId) {
        await databaseService.recordLogout(user.employeeId);
      }
    } catch (err) {
      console.error("Error updating driver status on logout:", err);
    }

    try {
      // 3. Sign out from Firebase Authentication
      await authService.signOut();
    } catch (err) {
      console.error("Error signing out from Firebase:", err);
    }

    console.log("✅ Logged out successfully");
  };

  const handleSyncAll = () => {
    setState(prev => ({
      ...prev,
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
  };

  if (isRecovering) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="animate-spin mb-4"><Loader2 size={64} className="text-indigo-500" /></div>
        <h1 className="text-2xl font-black uppercase tracking-widest mb-2">System Updating</h1>
        <p className="text-slate-400 font-mono text-sm max-w-md text-center">
          Synchronizing 12,000+ Smart Bins...<br />
          Do not close this window.
        </p>
      </div>
    )
  }

  // 1. Critical Loaders (Highest Priority)
  // If we are currently checking firebase auth OR fetching the user profile from DB,
  // we MUST stay on splash to avoid flickering the login screen.
  if (showSplash || authLoading || isRestoringUser) {
    return <Splash userName={user?.username} />;
  }

  // 2. Auth Flow (Only if NOT loading/restoring)
  if (!isAuthenticated) {
    if (!role) return <RoleSelection onSelectRole={(role) => setRole(role)} />;
    return <AuthContainer role={role} onLogin={handleLogin} onBack={() => setRole(null)} registeredUsers={[]} />;
  }

  // 3. User Data Fetch Failsafe
  // If we are authenticated but have no user data after restoration is finished, we have a sync error.
  if (!user) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-black uppercase tracking-widest mb-2">Sync Connection Error</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-xs font-bold leading-relaxed">
          We couldn't retrieve your profile from the Ujjwal Cloud Sync.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-white text-slate-900 font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-50 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={handleLogout}
          className="mt-6 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors"
        >
          Sign Out & Reset
        </button>
      </div>
    );
  }

  if (!user.isProfileComplete) {
    return <CompleteProfile user={user} onComplete={async (u) => {
      updateState({ user: u });
      if (u.role === 'driver') {
        const existing = await databaseService.getDriver(u.employeeId);
        if (!existing) await registerDriverStatus(u);
      }
    }} onLogout={handleLogout} />;
  }

  return (
    <div className="relative">
      {role === 'admin'
        ? <Dashboard
          state={state}
          onLogout={handleLogout}
          updateState={updateState}
          onSync={handleSyncAll}
          binsLoading={binsLoading}
          tasksLoading={tasksLoading}
          driversLoading={driversLoading}
        />
        : <DriverDashboard
          state={state}
          onLogout={handleLogout}
          updateState={updateState}
          onSync={handleSyncAll}
          binsLoading={binsLoading}
          tasksLoading={tasksLoading}
          driversLoading={driversLoading}
        />}
      <OfflineIndicator />
      <FirebaseRulesNotice isOpen={showRulesOverlay} onClose={() => setShowRulesOverlay(false)} />
    </div>
  );
};

export default App;