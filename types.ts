
export type Role = 'admin' | 'driver' | null;

export interface User {
  username: string;
  email: string;
  phone: string;
  role: Role;
  uid: string; // Firebase Auth UID
  employeeId: string;
  location?: string;
  isGoogleUser?: boolean;
  profilePhoto?: string;
  isProfileComplete?: boolean;
}

export interface DutyEvent {
  status: 'On Duty' | 'Off Duty';
  timestamp: string;
}

export interface AdminProfile {
  adminId: string; // e.g., ADM001
  username: string;
  email: string;
  phone: string;
  createdAt: string;
  profilePhoto?: string;
  location?: string;
}

export interface DriverProfile {
  driverId: string; // e.g., DRV001
  employeeId?: string; // Added to match usage
  username: string;
  email: string;
  phone: string;
  password?: string; // Encrypted ideally, but storing as requested
  status: 'online' | 'offline';
  availability?: string; // Added to match usage
  activeDutyTime?: string;
  lastLogoutTime?: string;
  createdAt: string;
  profilePhoto?: string;
  location?: string; // Added for filtering
  activatedAt?: string;
  lastUpdated?: string;
  dutyHistory?: DutyEvent[];
  isActive?: boolean;
  needsRecoveryNotice?: boolean;
  workLogs?: ActivityLog[];
  assignedZone?: string;
}

export interface ActivityLog {
  id: string;
  date: string;
  start: string;
  end: string | null;
  duration: string;
}

export interface LiveDriverStatus {
  driverId: string;
  driverName: string;
  status: 'online' | 'offline';
  lastActive: string;
  employeeId?: string;
  location?: string;
}

export interface DriversHubEntry {
  driverId: string;
  personnelIdentity: {
    name: string;
    driverId: string;
    email?: string;
    phone: string;
    profilePhoto?: string;
    location?: string; // Added for filtering
  };
  accountLifecycle: {
    status: 'Operational' | 'Blocked';
    color: string; // e.g., 'green', 'red'
    documentPDF?: string;
  };
  deployment: {
    tasksCompleted: number;
    taskReportPDF?: string;
  };
  availability: {
    status: 'online' | 'offline';
  };
  utility: {
    blockUser: boolean;
    idCardURL?: string;
  };
  workLogs?: ActivityLog[];
}

export interface TaskProTask {
  id: string;
  binId: string;
  area: string;
  street: string;
  fleetAssessment: 'general' | 'particular';
  assignedDriverId?: string; // If 'particular'
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export interface Bin {
  id: string;
  locationName: string;
  areaName?: string;
  streetName: string;
  coordinates: { lat: number; lng: number };
  status: 'Empty' | 'Half Full' | 'Half-Full' | 'Full' | 'Completed';
  assignedDriverId?: string;
  imageUrl?: string;
}

export interface Attachment {
  name: string;
  type: string;
  data: string;
}

export interface Message {
  id: string;
  senderName: string;
  senderEmail: string;
  receiverEmail: string;
  content: string;
  timestamp: string;
  attachments: Attachment[];
  fontFamily?: string;
  isBold?: boolean;
}

export interface Complaint {
  id: string;
  threadId: string;
  subject: string;
  messages: Message[];
  status: 'Pending' | 'Resolved' | 'In Progress' | 'Unread' | 'Replied' | 'Seen';
  createdAt?: string;
  lastUpdated: string;
  driverId?: string;
  driverName?: string;
  targetArea?: string; // For broad broadcasts
  isStarredByAdmin: boolean;
  isStarredByDriver: boolean;
  isDeletedByAdmin: boolean;
  isDeletedByDriver: boolean;
  isAiRepliedByAdmin: boolean;
}

export interface LeaveRequest {
  id: string;
  driverId: string;
  driverName: string;
  area?: string; // ADDED: To track which area this leave belongs to
  phone?: string;
  type?: string;
  fromDate?: string;
  toDate?: string;
  fromTime?: string;
  toTime?: string;
  startDate?: string;
  endDate?: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled by Driver';
  adminRemarks?: string;
  createdAt?: string;
  timestamp?: string;
}

export interface DailyRecord {
  driverId: string;
  driverName: string;
  date: string; // YYYY-MM-DD
  tasksCompleted: number;
  leaveStatus: 'Present' | 'On Leave' | 'Emergency' | 'Hourly';
  leaveRequestId?: string;
  startTime?: string;
  logoutTime?: string;
  lastUpdated: string;
}

export interface Notification {
  id: string;
  title?: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'broadcast' | 'activity';
  read: boolean;
}

export interface AppState {
  role: Role;
  user: User | null;
  isAuthenticated: boolean;
  drivers: DriverProfile[]; // Added missing prop
  liveStatus: LiveDriverStatus[];
  driversHub: DriversHubEntry[];
  bins: Bin[];
  complaints: Complaint[];
  leaves: LeaveRequest[];
  notifications: Notification[];
  isDriverActive: boolean;
  activationTime: string | null;
  lastSynced?: string;
  isUjjwalRouteActive: boolean;
  assessmentActive: boolean;
  tasks: TaskProTask[];
  dailyRecords: DailyRecord[];
}
