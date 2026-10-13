import { DriverProfile, Bin, LeaveRequest } from '../types';

export const calculateDriverMetrics = (driver: DriverProfile, bins: Bin[], leaves: LeaveRequest[]) => {
    if (!driver) return { todayCompleted: 0, todayUncollected: 0, approvedLeaves: 0, netSalary: 0 };
    const employeeId = driver.employeeId || driver.driverId;

    // Filter data for this specific driver
    const currentId = (employeeId || '').trim().toLowerCase();
    const driverBins = bins.filter(bin => (bin.assignedDriverId || '').trim().toLowerCase() === currentId);
    const driverLeaves = leaves.filter(l => (l.driverId || '').trim().toLowerCase() === currentId && l.status === 'Approved');

    const todayCompleted = driverBins.filter(b => (b.status || '').trim().toLowerCase() === 'completed').length;
    
    // Only count bins as "uncollected" (pending) if they are neither Completed nor Empty
    const todayUncollected = driverBins.filter(b => {
        const s = (b.status || '').trim().toLowerCase();
        return s !== 'completed' && s !== 'empty';
    }).length;

    const approvedNormalCount = driverLeaves.filter(l => !l.reason.toLowerCase().includes('hourly')).length;
    const approvedHourlyCount = driverLeaves.filter(l => l.reason.toLowerCase().includes('hourly')).length;

    const BASE_NET = 32000;
    
    // Task penalty logic: ₹200 for each pending (uncollected) task
    const taskPenalty = todayUncollected * 200;
    
    // Live Projected Salary = Base Salary - (Pending Tasks * 200)
    let projectedSalary = BASE_NET - taskPenalty;
    
    // Leaves penalty is standard. 
    const leavePenalty = (approvedNormalCount * 500) + (approvedHourlyCount * 300);
    const netSalary = Math.max(0, projectedSalary - leavePenalty);

    return {
        todayCompleted,
        todayUncollected,
        approvedLeaves: driverLeaves.length,
        netSalary
    };
};

const PUBLIC_HOLIDAYS_2026 = [
    '01-01', '01-14', '01-15', '01-16', '01-26', '02-15', '03-20', '04-01', 
    '04-10', '04-14', '05-01', '05-22', '06-17', '07-17', '08-15', '08-22', 
    '09-07', '10-02', '10-20', '11-04', '11-14', '12-25'
];

export const getHistoricalMetrics = (monthDate: Date) => {
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();

    // Determine how many months ago this record is.
    const now = new Date();
    
    // If we want exact months diff strictly based on calendar index:
    const monthsAgo = (now.getFullYear() - year) * 12 + (now.getMonth() - month);

    let leaves = 0;
    let pending = 0;

    // Fixed Historical Patterns based on rules (assuming 1 month ago is current record in history view)
    if (monthsAgo === 1) { 
        leaves = 3; pending = 6; 
    } else if (monthsAgo === 2) { 
        leaves = 2; pending = 4; 
    } else if (monthsAgo === 3) { 
        leaves = 1; pending = 2; 
    } else if (monthsAgo > 3) {
        leaves = 0; pending = 0;
    } else {
        leaves = 0; pending = 0;
    }

    // Get exact working days by removing Sundays and explicit holidays
    let workingDays = 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const dayDate = new Date(year, month, d);
        const mm = String(month + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        const isSun = dayDate.getDay() === 0;
        const isHol = PUBLIC_HOLIDAYS_2026.includes(`${mm}-${dd}`);
        
        if (!isSun && !isHol) {
            workingDays++;
        }
    }
    
    const totalCompletedTasks = workingDays * 38;

    const taskPenalty = pending * 200;
    const leavePenalty = leaves * 500;
    const BASE_NET = 32000;
    const netCredited = Math.max(0, BASE_NET - taskPenalty - leavePenalty);

    return {
        leaves,
        pending,
        taskPenalty,
        leavePenalty,
        netCredited,
        totalCompletedTasks,
        monthName: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        fullMonthName: monthDate.toLocaleDateString('en-US', { month: 'long' }),
        year
    };
};
