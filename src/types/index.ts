// TypeScript types for CIVIX AI

export type UserRole = 'citizen' | 'authority' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  fullName?: string;
  photoURL?: string;
  role: UserRole;
  phone?: string;
  address?: string;
  city?: string;
  ward?: string;
  emergencyContact?: string;
  language: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  profilePrivacy: 'public' | 'private';
  communityScore: number;
  totalComplaints: number;
  resolvedComplaints: number;
  badges: string[];
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  isBanned: boolean;
  fcmToken?: string;
  department?: string;
}

export type ComplaintStatus =
  | 'submitted'
  | 'verified'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'rejected';

export type ComplaintSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ComplaintCategory =
  | 'Road & Infrastructure'
  | 'Water & Sanitation'
  | 'Electricity'
  | 'Public Safety'
  | 'Garbage & Waste'
  | 'Parks & Recreation'
  | 'Noise Pollution'
  | 'Air Quality'
  | 'Public Transport'
  | 'Buildings & Construction'
  | 'Other';

export interface GeoLocation {
  lat: number;
  lng: number;
  address: string;
  city?: string;
  ward?: string;
}

export interface TimelineEvent {
  status: ComplaintStatus;
  timestamp: Date;
  message: string;
  updatedBy?: string;
  attachments?: string[];
}

export interface Complaint {
  id: string;
  citizenId: string;
  citizenName: string;
  citizenAvatar?: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  status: ComplaintStatus;
  location: GeoLocation;
  photos: string[];
  videos: string[];
  audioUrl?: string;
  department: string;
  assignedAuthorityId?: string;
  assignedAuthorityName?: string;
  estimatedRepairTime: string;
  estimatedCost: string;
  urgencyScore: number;
  supporterCount: number;
  supporters: string[];
  tags: string[];
  timeline: TimelineEvent[];
  aiAnalysis?: {
    impactSummary: string;
    recommendations: string;
  };
  workerAssigned?: string;
  repairImages: string[];
  resolutionNote?: string;
  isSpam: boolean;
  isDuplicate: boolean;
  duplicateOf?: string;
  viewCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  complaintId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: UserRole;
  text: string;
  createdAt: Date;
  isOfficial: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'complaint_update' | 'achievement' | 'nearby_alert' | 'leaderboard' | 'system';
  complaintId?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface Authority {
  id: string;
  uid: string;
  name: string;
  email: string;
  department: string;
  jurisdiction: string;
  isApproved: boolean;
  assignedComplaints: number;
  resolvedComplaints: number;
  createdAt: Date;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  headName: string;
  contactEmail: string;
  contactPhone: string;
  categories: ComplaintCategory[];
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  city: string;
  ward?: string;
  score: number;
  totalComplaints: number;
  resolvedComplaints: number;
  badges: string[];
  rank: number;
  period: 'weekly' | 'monthly' | 'alltime';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  points: number;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  targetId: string;
  targetType: 'user' | 'complaint' | 'authority';
  details: Record<string, unknown>;
  timestamp: Date;
}

export interface DashboardStats {
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  inProgressComplaints: number;
  avgResolutionTime: number;
  categoryBreakdown: Record<string, number>;
  severityBreakdown: Record<string, number>;
  monthlyTrend: { month: string; count: number }[];
}
