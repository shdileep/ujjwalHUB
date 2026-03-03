
import React from 'react';
import { Truck, Trash2, Users, PieChart, Bell, Info, UserCircle, CreditCard, LayoutDashboard, MessageSquareWarning, CalendarDays, Settings as SettingsIcon, FileText, LayoutList } from 'lucide-react';

export const CHENNAI_LOCATIONS = [
  { name: 'Kandigai', streets: ['Kelambakkam–Vandalur Road', 'Vengadamangalam Road', 'Melakottaiyur Main Road', 'Nallambakkam Village Road', 'Tagore College Road', 'Munu Adhi Nagar'] },
  { name: 'Adyar', streets: [] },
  { name: 'Besant Nagar', streets: [] },
  { name: 'Chromepet', streets: [] },
  { name: 'Pallavaram', streets: [] },
  { name: 'Koyambedu', streets: [] },
  { name: 'Guduvancheri', streets: [] },
  { name: 'Kelambakkam', streets: [] },
  { name: 'Perungalathur', streets: [] },
  { name: 'Nungambakkam', streets: [] },
  { name: 'Palavakkam', streets: [] },
  { name: 'Sholinganallur', streets: [] },
  { name: 'St. Thomas Mount', streets: [] },
  { name: 'Tambaram', streets: [] },
  { name: 'Thiruporur', streets: [] },
  { name: 'Thiruvanmiyur', streets: [] },
  { name: 'Velachery', streets: [] },
  { name: 'Medavakkam', streets: [] },
  { name: 'Semmencheri', streets: [] },
  { name: 'Siruseri', streets: [] },
  { name: 'SIPCOT', streets: [] },
  { name: 'Vandalur', streets: [] }
];

export const COMPLAINT_ISSUES = [
  { category: 'Route-related', issues: ['Blocked road', 'Traffic delay', 'Route change needed', 'GPS mismatch'] },
  { category: 'Location-related', issues: ['Restricted access', 'Construction area', 'Wrong coordinates', 'Remote area'] },
  { category: 'Bin-related', issues: ['Overflowing bin', 'Damaged bin', 'Missing bin', 'Illegal dumping nearby', 'Foul smell reported'] },
  { category: 'Vehicle-related', issues: ['Fuel leak', 'Brake issue', 'Tire puncture', 'Engine overheating', 'Battery low'] },
  { category: 'Safety-related', issues: ['Lack of PPE', 'Injury risk', 'Public harassment', 'Reckless driving reported'] },
  { category: 'Other', issues: ['Staff shortage', 'Equipment failure', 'Mobile app glitch'] },
];

export const MOTIVATIONAL_QUOTES = [
  "A clean city is a healthy city!",
  "Your work keeps our community shining.",
  "Waste is only waste if we waste it. Great job today!",
  "The beauty of our city is in your hands.",
  "Every bin collected is a step towards a greener future.",
  "Cleanliness is next to Godliness."
];

export const ADMIN_NAV_ITEMS = [
  { id: 'live-status', label: 'Live Driver Status', icon: <Truck size={20} /> },
  { id: 'profile', label: 'Profile', icon: <UserCircle size={20} /> },
  { id: 'bins', label: 'TaskPro', icon: <Trash2 size={20} /> },
  { id: 'drivers', label: 'DriversHUB', icon: <Users size={20} /> },
  { id: 'leaves', label: 'Leave Requests', icon: <CalendarDays size={20} /> },
  { id: 'complaints-mgmt', label: 'Complaints', icon: <MessageSquareWarning size={20} /> },
  { id: 'insights', label: 'Insights', icon: <PieChart size={20} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
  { id: 'support', label: 'About', icon: <Info size={20} /> },
  { id: 'overview-mgmt', label: 'Overview', icon: <LayoutList size={20} /> },
];

export const DRIVER_NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: <LayoutDashboard size={20} /> },
  { id: 'overview', label: 'Overview', icon: <FileText size={20} /> },
  { id: 'profile', label: 'Profile', icon: <UserCircle size={20} /> },
  { id: 'tasks', label: 'Tasks', icon: <Trash2 size={20} /> },
  { id: 'leaves', label: 'Leaves', icon: <CalendarDays size={20} /> },
  { id: 'complaints', label: 'Complaints', icon: <MessageSquareWarning size={20} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
  { id: 'payments', label: 'Payments', icon: <CreditCard size={20} /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
];
