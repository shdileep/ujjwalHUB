
import { DriverProfile, Bin, LeaveRequest } from '../types';

export const calculateDriverMetrics = (driver: DriverProfile, bins: Bin[], leaves: LeaveRequest[]) => {
    const employeeId = driver.employeeId || driver.driverId;

    // Filter data for this specific driver
    const currentId = (employeeId || '').trim().toLowerCase();
    const driverBins = bins.filter(bin => (bin.assignedDriverId || '').trim().toLowerCase() === currentId);
    const driverLeaves = leaves.filter(l => (l.driverId || '').trim().toLowerCase() === currentId && l.status === 'Approved');

    const todayCompleted = driverBins.filter(b => b.status === 'Completed').length;
    const todayUncollected = driverBins.filter(b => b.status !== 'Completed').length;

    const approvedNormalCount = driverLeaves.filter(l => !l.reason.toLowerCase().includes('hourly')).length;
    const approvedHourlyCount = driverLeaves.filter(l => l.reason.toLowerCase().includes('hourly')).length;

    const BASE_NET = 32000;
    const taskPenalty = todayUncollected * 100;
    const leavePenalty = (approvedNormalCount * 500) + (approvedHourlyCount * 300);
    const netSalary = Math.max(0, BASE_NET - taskPenalty - leavePenalty);

    return {
        todayCompleted,
        todayUncollected,
        approvedLeaves: driverLeaves.length,
        netSalary
    };
};
