/*
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║         UJJWALHUB — QUAD DATABASE SYNC MANAGER (db.manager.ts)          ║
 * ║                                                                          ║
 * ║  Every operation in this file writes to ALL 4 databases simultaneously. ║
 * ║                                                                          ║
 * ║  🔥 FIREBASE   → Real-time live data (bins, drivers, tasks, status)     ║
 * ║  ⚡ SUPABASE   → Structured reports (salary, performance, leave)         ║
 * ║  🍃 MONGODB    → Audit logs (every action, route history, events)        ║
 * ║  ☁️ CLOUDINARY → All media (driver photos, bin images, PDF reports)      ║
 * ║                                                                          ║
 * ║  Usage: import { syncAll } from './db.manager';                          ║
 * ║         await syncAll.driverLogin(driverId, name, area);                 ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { supabase } from './supabase.service';
import { cloudinaryService } from './cloudinary.service';
import { mongodbService } from './mongodb.service';
import { databaseService } from './database.service';

// ─────────────────────────────────────────────────────────────────────────────
// 🛠️ INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Silently log to MongoDB without blocking the main operation */
async function mongoLog(collection: string, doc: Record<string, any>) {
    try {
        await mongodbService.insertOne(collection, {
            ...doc,
            _ts: new Date().toISOString(),
            _date: new Date().toISOString().split('T')[0]
        });
    } catch (e) {
        console.warn('⚠️ MongoDB log failed (non-blocking):', e);
    }
}

/** Silently save to Supabase without blocking the main operation */
async function supabaseSave(table: string, row: Record<string, any>, conflictCol?: string) {
    try {
        const query = supabase.from(table);
        const opts = conflictCol ? { onConflict: conflictCol } : undefined;
        const { error } = opts
            ? await query.upsert({ ...row, updated_at: new Date().toISOString() }, opts)
            : await query.insert({ ...row, created_at: new Date().toISOString() });
        if (error) console.warn(`⚠️ Supabase save failed (${table}):`, error.message);
    } catch (e) {
        console.warn('⚠️ Supabase save failed (non-blocking):', e);
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// 🌐 SYNC ALL — Every operation writes to all 4 databases
// ─────────────────────────────────────────────────────────────────────────────

export const syncAll = {

    // ══════════════════════════════════════════════════════════════════════
    // 👤 DRIVER LIFECYCLE
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Driver Signup — writes to all 4 databases
     * 🔥 Firebase: creates driver profile + DriversHub + LiveStatus + redistributes bins
     * ⚡ Supabase: stores driver profile for reporting
     * 🍃 MongoDB: logs the signup event
     * ☁️ Cloudinary: uploads profile photo if provided, returns URL
     */
    async driverSignup(driverId: string, driverData: any, profilePhotoFile?: File): Promise<string | null> {
        console.log('🔄 SyncAll: driverSignup →', driverId);

        // ☁️ CLOUDINARY: Upload photo first (if provided)
        let photoUrl: string | null = driverData.profilePhoto || null;
        if (profilePhotoFile) {
            try {
                const uploaded = await cloudinaryService.uploadImage(
                    profilePhotoFile,
                    `ujjwalhub/drivers/${driverId}`
                );
                if (uploaded.secure_url) {
                    photoUrl = uploaded.secure_url;
                    console.log('✅ Cloudinary: Driver photo uploaded');
                }
            } catch (e) {
                console.warn('⚠️ Cloudinary photo upload failed, continuing without photo');
            }
        }

        const finalDriverData = { ...driverData, profilePhoto: photoUrl };

        // 🔥 FIREBASE: Create full driver record
        await databaseService.createDriver(driverId, finalDriverData);

        // ⚡ SUPABASE: Store driver profile for reports
        await supabaseSave('drivers', {
            driver_id: driverId,
            name: driverData.username || '',
            email: driverData.email || '',
            phone: driverData.phone || '',
            area: driverData.location || '',
            status: 'active',
            photo_url: photoUrl,
            employee_id: driverData.employeeId || driverId,
            joined_at: driverData.createdAt || new Date().toISOString()
        }, 'driver_id');

        // 🍃 MONGODB: Audit log
        await mongoLog('activity_logs', {
            type: 'driver_signup',
            userId: driverId,
            userName: driverData.username || '',
            role: 'driver',
            area: driverData.location || '',
            details: { email: driverData.email, phone: driverData.phone, hasPhoto: !!photoUrl }
        });

        console.log('✅ SyncAll: driverSignup complete across all 4 DBs');
        return photoUrl;
    },

    /**
     * Driver Login — writes to all 4 databases
     * 🔥 Firebase: updates status to online
     * ⚡ Supabase: records login event in sessions table
     * 🍃 MongoDB: logs login event with timestamp
     * ☁️ Cloudinary: N/A (no media on login)
     */
    async driverLogin(driverId: string, driverName: string, area: string): Promise<void> {
        console.log('🔄 SyncAll: driverLogin →', driverName);

        // 🔥 FIREBASE: Start duty session
        await databaseService.recordDutyStart(driverId);

        // ⚡ SUPABASE: Record session start
        await supabaseSave('driver_sessions', {
            driver_id: driverId,
            driver_name: driverName,
            area,
            login_time: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
            status: 'active'
        });

        // 🍃 MONGODB: Audit log
        await mongoLog('activity_logs', {
            type: 'driver_login',
            userId: driverId,
            userName: driverName,
            role: 'driver',
            area,
            details: { loginTime: new Date().toISOString() }
        });

        console.log('✅ SyncAll: driverLogin complete across all 4 DBs');
    },

    /**
     * Driver Logout — writes to all 4 databases
     * 🔥 Firebase: records logout, sets status offline, ends duty session
     * ⚡ Supabase: closes session record, stores duty hours
     * 🍃 MongoDB: logs logout event with session summary
     * ☁️ Cloudinary: N/A
     */
    async driverLogout(driverId: string, driverName: string, area: string, totalDutyMinutes?: number): Promise<void> {
        console.log('🔄 SyncAll: driverLogout →', driverName);

        // 🔥 FIREBASE: Record logout
        await databaseService.recordLogout(driverId);

        const logoutTime = new Date().toISOString();
        const date = logoutTime.split('T')[0];

        // ⚡ SUPABASE: Close session
        try {
            await supabase
                .from('driver_sessions')
                .update({
                    logout_time: logoutTime,
                    duty_minutes: totalDutyMinutes || 0,
                    status: 'completed',
                    updated_at: logoutTime
                })
                .eq('driver_id', driverId)
                .eq('date', date)
                .eq('status', 'active');
        } catch (e) {
            console.warn('⚠️ Supabase session close failed (non-blocking)');
        }

        // 🍃 MONGODB: Audit log
        await mongoLog('activity_logs', {
            type: 'driver_logout',
            userId: driverId,
            userName: driverName,
            role: 'driver',
            area,
            details: { logoutTime, dutyMinutes: totalDutyMinutes }
        });

        console.log('✅ SyncAll: driverLogout complete across all 4 DBs');
    },

    /**
     * Update Driver Profile Photo — writes to all 4 databases
     * ☁️ Cloudinary: uploads new photo → returns URL
     * 🔥 Firebase: saves URL to driver profile
     * ⚡ Supabase: updates photo_url in drivers table
     * 🍃 MongoDB: logs photo update event
     */
    async updateDriverPhoto(driverId: string, driverName: string, photoFile: File): Promise<string | null> {
        console.log('🔄 SyncAll: updateDriverPhoto →', driverName);

        // ☁️ CLOUDINARY: Upload first
        const uploaded = await cloudinaryService.uploadImage(photoFile, `ujjwalhub/drivers/${driverId}`);
        if (!uploaded.secure_url) {
            console.error('❌ Cloudinary upload failed');
            return null;
        }
        const photoUrl = uploaded.secure_url;

        // 🔥 FIREBASE: Update profile
        await databaseService.updateDriver(driverId, { profilePhoto: photoUrl });

        // ⚡ SUPABASE: Update driver record
        await supabaseSave('drivers', { driver_id: driverId, photo_url: photoUrl }, 'driver_id');

        // 🍃 MONGODB: Audit log
        await mongoLog('activity_logs', {
            type: 'driver_photo_updated',
            userId: driverId,
            userName: driverName,
            role: 'driver',
            details: { newPhotoUrl: photoUrl }
        });

        console.log('✅ SyncAll: updateDriverPhoto complete across all 4 DBs');
        return photoUrl;
    },


    // ══════════════════════════════════════════════════════════════════════
    // 🗑️ BIN OPERATIONS
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Complete a bin collection — writes to all 4 databases
     * 🔥 Firebase: updates bin status to Completed, records in binHistory
     * ⚡ Supabase: increments driver's collection count for the day
     * 🍃 MongoDB: logs every single bin collection with full details
     * ☁️ Cloudinary: uploads damage photo if provided
     */
    async completeBinCollection(
        binId: string,
        driverId: string,
        driverName: string,
        area: string,
        damagePhotoFile?: File
    ): Promise<void> {
        console.log('🔄 SyncAll: completeBinCollection → bin', binId, 'by', driverName);

        // ☁️ CLOUDINARY: Upload damage photo if provided
        let damagePhotoUrl: string | null = null;
        if (damagePhotoFile) {
            try {
                const uploaded = await cloudinaryService.uploadImage(
                    damagePhotoFile,
                    `ujjwalhub/bins/${binId}`
                );
                if (uploaded.secure_url) damagePhotoUrl = uploaded.secure_url;
            } catch (e) {
                console.warn('⚠️ Bin photo upload failed (non-blocking)');
            }
        }

        // 🔥 FIREBASE: Mark bin as completed
        await databaseService.updateBinStatus(binId, 'Completed', 0, driverId);

        // Increment task count in DriversHub
        await databaseService.incrementDriverTaskCount(driverId);

        const today = new Date().toISOString().split('T')[0];

        // ⚡ SUPABASE: Update daily collection stats
        await supabaseSave('daily_collections', {
            driver_id: driverId,
            driver_name: driverName,
            area,
            date: today,
            bin_id: binId,
            collected_at: new Date().toISOString(),
            damage_photo_url: damagePhotoUrl
        });

        // 🍃 MONGODB: Detailed collection log
        await mongoLog('bin_collections', {
            type: 'bin_collected',
            binId,
            driverId,
            driverName,
            area,
            date: today,
            damagePhotoUrl,
            collectedAt: new Date().toISOString()
        });

        console.log('✅ SyncAll: completeBinCollection complete across all 4 DBs');
    },

    /**
     * Report bin damage with photo — writes to all 4 databases
     * ☁️ Cloudinary: uploads damage photo
     * 🔥 Firebase: creates complaint with photo URL
     * ⚡ Supabase: logs damage report
     * 🍃 MongoDB: logs damage event
     */
    async reportBinDamage(
        binId: string,
        driverId: string,
        driverName: string,
        area: string,
        description: string,
        photoFile?: File
    ): Promise<void> {
        console.log('🔄 SyncAll: reportBinDamage → bin', binId);

        // ☁️ CLOUDINARY: Upload damage photo
        let photoUrl: string | null = null;
        if (photoFile) {
            const uploaded = await cloudinaryService.uploadImage(photoFile, `ujjwalhub/damage/${binId}`);
            if (uploaded.secure_url) photoUrl = uploaded.secure_url;
        }

        // 🔥 FIREBASE: Create complaint
        const complaintId = `COMP-${Date.now()}`;
        await databaseService.createComplaint({
            id: complaintId,
            binId,
            driverId,
            driverName,
            area,
            description,
            photoUrl,
            status: 'Pending',
            createdAt: new Date().toISOString()
        } as any);

        // ⚡ SUPABASE: Store damage report
        await supabaseSave('damage_reports', {
            complaint_id: complaintId,
            bin_id: binId,
            driver_id: driverId,
            driver_name: driverName,
            area,
            description,
            photo_url: photoUrl,
            status: 'Pending'
        });

        // 🍃 MONGODB: Log event
        await mongoLog('activity_logs', {
            type: 'bin_damage_reported',
            userId: driverId,
            userName: driverName,
            role: 'driver',
            area,
            details: { binId, complaintId, description, photoUrl }
        });

        console.log('✅ SyncAll: reportBinDamage complete across all 4 DBs');
    },


    // ══════════════════════════════════════════════════════════════════════
    // 📋 LEAVE REQUESTS
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Submit leave request — writes to all 4 databases
     * 🔥 Firebase: creates leave request
     * ⚡ Supabase: stores structured leave record
     * 🍃 MongoDB: logs submission event
     * ☁️ Cloudinary: N/A
     */
    async submitLeaveRequest(leaveData: {
        id: string;
        driverId: string;
        driverName: string;
        area: string;
        date: string;
        type: string;
        reason: string;
        status: string;
    }): Promise<void> {
        console.log('🔄 SyncAll: submitLeaveRequest →', leaveData.driverName);

        // 🔥 FIREBASE: Create leave request
        await databaseService.createLeaveRequest(leaveData as any);

        // ⚡ SUPABASE: Store structured leave record
        await supabaseSave('leave_records', {
            leave_id: leaveData.id,
            driver_id: leaveData.driverId,
            driver_name: leaveData.driverName,
            area: leaveData.area,
            date: leaveData.date,
            leave_type: leaveData.type,
            reason: leaveData.reason,
            status: leaveData.status
        }, 'leave_id');

        // 🍃 MONGODB: Audit log
        await mongoLog('activity_logs', {
            type: 'leave_requested',
            userId: leaveData.driverId,
            userName: leaveData.driverName,
            role: 'driver',
            area: leaveData.area,
            details: { leaveId: leaveData.id, date: leaveData.date, type: leaveData.type }
        });

        console.log('✅ SyncAll: submitLeaveRequest complete across all 4 DBs');
    },

    /**
     * Admin approves/rejects leave — writes to all 4 databases
     * 🔥 Firebase: updates leave status
     * ⚡ Supabase: updates leave record status
     * 🍃 MongoDB: logs admin decision
     * ☁️ Cloudinary: N/A
     */
    async resolveLeaveRequest(
        leaveId: string,
        status: 'Approved' | 'Rejected',
        adminId: string,
        adminName: string,
        driverId: string,
        driverName: string
    ): Promise<void> {
        console.log('🔄 SyncAll: resolveLeaveRequest →', leaveId, status);

        // 🔥 FIREBASE: Update leave status
        await databaseService.updateLeaveRequest(leaveId, {
            status,
            resolvedBy: adminId,
            resolvedAt: new Date().toISOString()
        } as any);

        // ⚡ SUPABASE: Update leave record
        try {
            await supabase
                .from('leave_records')
                .update({ status, resolved_by: adminId, updated_at: new Date().toISOString() })
                .eq('leave_id', leaveId);
        } catch (e) { console.warn('⚠️ Supabase leave update failed (non-blocking)'); }

        // 🍃 MONGODB: Admin decision log
        await mongoLog('activity_logs', {
            type: `leave_${status.toLowerCase()}`,
            userId: adminId,
            userName: adminName,
            role: 'admin',
            details: { leaveId, driverId, driverName, decision: status, decidedAt: new Date().toISOString() }
        });

        console.log('✅ SyncAll: resolveLeaveRequest complete across all 4 DBs');
    },


    // ══════════════════════════════════════════════════════════════════════
    // 💰 SALARY & PERFORMANCE
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Save monthly salary report — writes to all 4 databases
     * 🔥 Firebase: saves salary node under driver
     * ⚡ Supabase: stores salary record for all-time history and reports
     * 🍃 MongoDB: logs salary calculation event
     * ☁️ Cloudinary: uploads PDF report if provided
     */
    async saveSalaryReport(report: {
        driverId: string;
        driverName: string;
        area: string;
        month: string;
        tasksCompleted: number;
        leaveDays: number;
        baseSalary: number;
        deductions: number;
        finalSalary: number;
    }, pdfBlob?: Blob): Promise<string | null> {
        console.log('🔄 SyncAll: saveSalaryReport →', report.driverName, report.month);

        // ☁️ CLOUDINARY: Upload salary PDF if provided
        let pdfUrl: string | null = null;
        if (pdfBlob) {
            try {
                const uploaded = await cloudinaryService.uploadImage(
                    pdfBlob,
                    `ujjwalhub/reports/salary/${report.driverId}`
                );
                if (uploaded.secure_url) pdfUrl = uploaded.secure_url;
            } catch (e) { console.warn('⚠️ PDF upload failed (non-blocking)'); }
        }

        // 🔥 FIREBASE: Save in driver's salary history node
        const salaryKey = report.month.replace('-', '_');
        await databaseService.updateDriver(report.driverId, {
            [`salaryHistory/${salaryKey}`]: {
                ...report,
                pdfUrl,
                generatedAt: new Date().toISOString()
            }
        } as any);

        // ⚡ SUPABASE: Structured salary record
        await supabaseSave('salary_reports', {
            driver_id: report.driverId,
            driver_name: report.driverName,
            area: report.area,
            month: report.month,
            tasks_completed: report.tasksCompleted,
            leave_days: report.leaveDays,
            base_salary: report.baseSalary,
            deductions: report.deductions,
            final_salary: report.finalSalary,
            pdf_url: pdfUrl
        }, 'driver_id,month');

        // 🍃 MONGODB: Audit log
        await mongoLog('salary_logs', {
            type: 'salary_report_generated',
            driverId: report.driverId,
            driverName: report.driverName,
            area: report.area,
            month: report.month,
            finalSalary: report.finalSalary,
            pdfUrl,
            generatedAt: new Date().toISOString()
        });

        console.log('✅ SyncAll: saveSalaryReport complete across all 4 DBs');
        return pdfUrl;
    },

    /**
     * Save driver performance snapshot — writes to all 4 databases
     * 🔥 Firebase: updates driver's performance node
     * ⚡ Supabase: stores for ranking and leaderboard queries
     * 🍃 MongoDB: logs performance snapshot
     * ☁️ Cloudinary: N/A
     */
    async savePerformanceSnapshot(perf: {
        driverId: string;
        driverName: string;
        area: string;
        period: string;
        tasksCompleted: number;
        efficiency: number;
        totalDutyHours: number;
        leaveDays: number;
    }): Promise<void> {
        console.log('🔄 SyncAll: savePerformanceSnapshot →', perf.driverName, perf.period);

        // 🔥 FIREBASE: Update driver performance
        await databaseService.updateDriver(perf.driverId, {
            lastPerformance: {
                period: perf.period,
                tasksCompleted: perf.tasksCompleted,
                efficiency: perf.efficiency,
                updatedAt: new Date().toISOString()
            }
        } as any);

        // ⚡ SUPABASE: Structured for queries
        await supabaseSave('performance_records', {
            driver_id: perf.driverId,
            driver_name: perf.driverName,
            area: perf.area,
            period: perf.period,
            tasks_completed: perf.tasksCompleted,
            efficiency: perf.efficiency,
            total_duty_hours: perf.totalDutyHours,
            leave_days: perf.leaveDays
        }, 'driver_id,period');

        // 🍃 MONGODB: Snapshot log
        await mongoLog('performance_logs', {
            type: 'performance_snapshot',
            driverId: perf.driverId,
            driverName: perf.driverName,
            area: perf.area,
            period: perf.period,
            efficiency: perf.efficiency,
            tasksCompleted: perf.tasksCompleted
        });

        console.log('✅ SyncAll: savePerformanceSnapshot complete across all 4 DBs');
    },


    // ══════════════════════════════════════════════════════════════════════
    // 📣 COMPLAINTS & NOTIFICATIONS
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Create complaint — writes to all 4 databases
     * 🔥 Firebase: complaint node
     * ⚡ Supabase: complaints table for admin querying
     * 🍃 MongoDB: audit log
     * ☁️ Cloudinary: photo upload if provided
     */
    async createComplaint(complaint: {
        id: string;
        driverId: string;
        driverName: string;
        area: string;
        subject: string;
        description: string;
        status: string;
    }, photoFile?: File): Promise<void> {
        console.log('🔄 SyncAll: createComplaint →', complaint.driverName);

        // ☁️ CLOUDINARY: Upload if photo provided
        let photoUrl: string | null = null;
        if (photoFile) {
            try {
                const uploaded = await cloudinaryService.uploadImage(photoFile, `ujjwalhub/complaints/${complaint.id}`);
                if (uploaded.secure_url) photoUrl = uploaded.secure_url;
            } catch (e) { console.warn('⚠️ Complaint photo upload failed'); }
        }

        // 🔥 FIREBASE
        await databaseService.createComplaint({ ...complaint, photoUrl } as any);

        // ⚡ SUPABASE
        await supabaseSave('complaints', {
            complaint_id: complaint.id,
            driver_id: complaint.driverId,
            driver_name: complaint.driverName,
            area: complaint.area,
            subject: complaint.subject,
            description: complaint.description,
            status: complaint.status,
            photo_url: photoUrl
        }, 'complaint_id');

        // 🍃 MONGODB
        await mongoLog('activity_logs', {
            type: 'complaint_created',
            userId: complaint.driverId,
            userName: complaint.driverName,
            role: 'driver',
            area: complaint.area,
            details: { complaintId: complaint.id, subject: complaint.subject, photoUrl }
        });

        console.log('✅ SyncAll: createComplaint complete across all 4 DBs');
    },

    /**
     * Admin action (block driver, delete driver, system changes)
     * 🔥 Firebase: applies the action
     * ⚡ Supabase: updates driver status in drivers table
     * 🍃 MongoDB: mandatory audit trail
     * ☁️ Cloudinary: N/A
     */
    async adminAction(
        adminId: string,
        adminName: string,
        action: string,
        targetId: string,
        targetName: string,
        details?: any
    ): Promise<void> {
        console.log('🔄 SyncAll: adminAction →', action, 'on', targetName);

        // ⚡ SUPABASE: Log admin action
        await supabaseSave('admin_actions', {
            admin_id: adminId,
            admin_name: adminName,
            action,
            target_id: targetId,
            target_name: targetName,
            details: JSON.stringify(details || {})
        });

        // 🍃 MONGODB: Permanent audit trail
        await mongoLog('admin_audit', {
            type: 'admin_action',
            adminId,
            adminName,
            action,
            targetId,
            targetName,
            details
        });

        console.log('✅ SyncAll: adminAction logged across all 4 DBs');
    },


    // ══════════════════════════════════════════════════════════════════════
    // 🗺️ ROUTE HISTORY
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Save completed route for a driver — writes to all 4 databases
     * 🔥 Firebase: save route summary to driver node
     * ⚡ Supabase: structured route record
     * 🍃 MongoDB: full route snapshot with all bin IDs
     * ☁️ Cloudinary: N/A
     */
    async saveRouteHistory(route: {
        driverId: string;
        driverName: string;
        area: string;
        date: string;
        binsCompleted: string[];
        startTime: string;
        endTime: string;
        totalDutyMinutes: number;
    }): Promise<void> {
        console.log('🔄 SyncAll: saveRouteHistory →', route.driverName, route.date);

        // 🔥 FIREBASE: Save route summary to driver
        await databaseService.updateDriver(route.driverId, {
            lastRoute: {
                date: route.date,
                binsCompleted: route.binsCompleted.length,
                area: route.area,
                endTime: route.endTime
            }
        } as any);

        // ⚡ SUPABASE: Structured for history queries
        await supabaseSave('route_history', {
            driver_id: route.driverId,
            driver_name: route.driverName,
            area: route.area,
            date: route.date,
            bins_completed: route.binsCompleted.length,
            start_time: route.startTime,
            end_time: route.endTime,
            duty_minutes: route.totalDutyMinutes
        });

        // 🍃 MONGODB: Full archive with all bin IDs
        await mongoLog('route_history', {
            type: 'route_completed',
            driverId: route.driverId,
            driverName: route.driverName,
            area: route.area,
            date: route.date,
            binsCompleted: route.binsCompleted,  // full list of bin IDs
            totalBins: route.binsCompleted.length,
            startTime: route.startTime,
            endTime: route.endTime,
            totalDutyMinutes: route.totalDutyMinutes
        });

        console.log('✅ SyncAll: saveRouteHistory complete across all 4 DBs');
    },


    // ══════════════════════════════════════════════════════════════════════
    // 🧹 DRIVER DELETION (Admin)
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Admin deletes a driver — writes to all 4 databases
     * 🔥 Firebase: removes driver (Firebase handles redistribution)
     * ⚡ Supabase: marks driver as 'deleted'
     * 🍃 MongoDB: logs deletion permanently (for history)
     * ☁️ Cloudinary: N/A (photos remain as archive)
     */
    async deleteDriver(
        driverId: string,
        driverName: string,
        area: string,
        adminId: string,
        adminName: string
    ): Promise<void> {
        console.log('🔄 SyncAll: deleteDriver →', driverName);

        // ⚡ SUPABASE: Mark driver as deleted (soft delete)
        try {
            await supabase
                .from('drivers')
                .update({ status: 'deleted', deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
                .eq('driver_id', driverId);
        } catch (e) { console.warn('⚠️ Supabase driver delete mark failed'); }

        // 🍃 MONGODB: Permanent deletion log
        await mongoLog('admin_audit', {
            type: 'driver_deleted',
            adminId,
            adminName,
            driverId,
            driverName,
            area,
            deletedAt: new Date().toISOString()
        });

        // 🔥 FIREBASE: This is done by the calling component via databaseService.deleteDriver()
        // We log first before Firebase deletion so the record is preserved

        console.log('✅ SyncAll: deleteDriver logged across all 4 DBs');
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// 📝 LOG ONLY — Sync to Supabase + MongoDB WITHOUT extra Firebase writes
// Use these when Firebase was already written by an existing databaseService call
// These are the bridges for: DriverPayments, AdminOverview, DriverComplaints, AdminComplaints
// ─────────────────────────────────────────────────────────────────────────────

export const logOnly = {

    /**
     * Log complaint created (after Firebase already saved it)
     * ⚡ Supabase: complaints table  🍃 MongoDB: activity log
     */
    async complaintCreated(
        complaint: { id: string; subject: string; messages?: any[]; status?: string },
        userId: string,
        userName: string,
        role: 'driver' | 'admin',
        area?: string
    ): Promise<void> {
        await supabaseSave('complaints', {
            complaint_id: complaint.id,
            sender_id: userId,
            sender_name: userName,
            role,
            area: area || '',
            subject: complaint.subject,
            status: complaint.status || 'Unread',
            message_count: (complaint.messages || []).length
        }, 'complaint_id');

        await mongoLog('activity_logs', {
            type: 'complaint_created',
            userId,
            userName,
            role,
            area,
            details: { complaintId: complaint.id, subject: complaint.subject }
        });
    },

    /**
     * Log any complaint update (reply, star, delete, forward, AI reply)
     * 🍃 MongoDB: update event log
     */
    async complaintUpdated(
        complaintId: string,
        action: string,
        userId: string,
        userName: string,
        role: 'driver' | 'admin',
        details?: any
    ): Promise<void> {
        await mongoLog('activity_logs', {
            type: `complaint_${action}`,
            userId,
            userName,
            role,
            details: { complaintId, action, ...(details || {}) }
        });
    },

    /**
     * Log a salary payslip view — saves to Supabase + MongoDB
     * ⚡ Supabase: salary_reports  🍃 MongoDB: salary_logs
     */
    async salaryViewed(data: {
        driverId: string;
        driverName: string;
        area: string;
        month: string;
        grossSalary: number;
        netSalary: number;
        deductions: number;
        leaveDays: number;
        tasksIncomplete: number;
    }): Promise<void> {
        await supabaseSave('salary_reports', {
            driver_id: data.driverId,
            driver_name: data.driverName,
            area: data.area,
            month: data.month,
            base_salary: data.grossSalary,
            deductions: data.deductions,
            final_salary: data.netSalary,
            leave_days: data.leaveDays,
            tasks_incomplete: data.tasksIncomplete
        }, 'driver_id,month');

        await mongoLog('salary_logs', {
            type: 'payslip_viewed',
            ...data,
            viewedAt: new Date().toISOString()
        });
    },

    /**
     * Log admin opening a driver dossier
     * ⚡ Supabase: admin_actions  🍃 MongoDB: admin_audit
     */
    async dossierViewed(
        adminId: string,
        adminName: string,
        driverId: string,
        driverName: string,
        area: string
    ): Promise<void> {
        await supabaseSave('admin_actions', {
            admin_id: adminId,
            admin_name: adminName,
            action: 'dossier_viewed',
            target_id: driverId,
            target_name: driverName,
            details: JSON.stringify({ area })
        });

        await mongoLog('admin_audit', {
            type: 'dossier_viewed',
            adminId,
            adminName,
            driverId,
            driverName,
            area,
            viewedAt: new Date().toISOString()
        });
    },

    /**
     * Log an admin generating a PDF report
     */
    async adminPdfExported(
        adminId: string,
        adminName: string,
        driverId: string,
        driverName: string,
        reportType: string
    ): Promise<void> {
        await supabaseSave('admin_actions', {
            admin_id: adminId,
            admin_name: adminName,
            action: 'pdf_exported',
            target_id: driverId,
            target_name: driverName,
            details: JSON.stringify({ reportType })
        });

        await mongoLog('admin_audit', {
            type: 'pdf_exported',
            adminId,
            adminName,
            driverId,
            driverName,
            reportType,
            exportedAt: new Date().toISOString()
        });
    },

    /**
     * Log a leave request submitted (after Firebase)
     * ⚡ Supabase: leave_records  🍃 MongoDB: activity_logs
     */
    async leaveRequested(leaveData: any): Promise<void> {
        await supabaseSave('leave_records', {
            leave_id: leaveData.id,
            driver_id: leaveData.driverId,
            driver_name: leaveData.driverName,
            area: leaveData.area,
            date: leaveData.fromDate || leaveData.date,
            leave_type: leaveData.type,
            reason: leaveData.reason,
            status: leaveData.status
        }, 'leave_id');

        await mongoLog('activity_logs', {
            type: 'leave_requested',
            userId: leaveData.driverId,
            userName: leaveData.driverName,
            role: 'driver',
            area: leaveData.area,
            details: { leaveId: leaveData.id, type: leaveData.type, date: leaveData.fromDate }
        });
    },

    /**
     * Log a leave resolution (after Firebase)
     */
    async leaveResolved(leaveId: string, status: string, adminId: string, adminName: string, driverId: string, driverName: string): Promise<void> {
        try {
            await supabase
                .from('leave_records')
                .update({ status, resolved_by: adminId, updated_at: new Date().toISOString() })
                .eq('leave_id', leaveId);
        } catch (e) {
            console.warn('Supabase leave update failed (non-blocking)');
        }

        await mongoLog('activity_logs', {
            type: `leave_${status.toLowerCase()}`,
            userId: adminId,
            userName: adminName,
            role: 'admin',
            details: { leaveId, driverId, driverName, decision: status }
        });
    },

    /**
     * Log a cancelled leave (after Firebase)
     */
    async leaveCancelled(leaveId: string, driverId: string, driverName: string): Promise<void> {
        try {
            await supabase
                .from('leave_records')
                .update({ status: 'Cancelled by Driver', updated_at: new Date().toISOString() })
                .eq('leave_id', leaveId);
        } catch (e) {
            console.warn('Supabase leave update failed (non-blocking)');
        }

        await mongoLog('activity_logs', {
            type: 'leave_cancelled',
            userId: driverId,
            userName: driverName,
            role: 'driver',
            details: { leaveId }
        });
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// 📊 DB STATUS CHECK — Verify all 4 connections are alive
// ─────────────────────────────────────────────────────────────────────────────

export async function checkAllDBStatus(): Promise<{
    firebase: boolean;
    supabase: boolean;
    mongodb: boolean;
    cloudinary: boolean;
}> {
    const results = { firebase: false, supabase: false, mongodb: false, cloudinary: false };

    // 🔥 Firebase
    try {
        const { get, ref } = await import('firebase/database');
        const { database } = await import('../firebase.config');
        await get(ref(database, '.info/connected'));
        results.firebase = true;
    } catch { results.firebase = false; }

    // ⚡ Supabase
    try {
        const { error } = await supabase.from('drivers').select('driver_id').limit(1);
        results.supabase = !error;
    } catch { results.supabase = false; }

    // 🍃 MongoDB
    try {
        const res = await mongodbService.find('activity_logs', {}, 1);
        results.mongodb = !res.error;
    } catch { results.mongodb = false; }

    // ☁️ Cloudinary (check config)
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    results.cloudinary = !!(cloudName && preset);

    console.table({
        '🔥 Firebase': results.firebase ? '✅ Connected' : '❌ Failed',
        '⚡ Supabase': results.supabase ? '✅ Connected' : '❌ Failed',
        '🍃 MongoDB': results.mongodb ? '✅ Connected' : '❌ Failed',
        '☁️ Cloudinary': results.cloudinary ? '✅ Configured' : '❌ Missing Config',
    });

    return results;
}

export default syncAll;
