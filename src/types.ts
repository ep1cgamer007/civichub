/**
 * Shared Type Definitions for Online Complaint Registration System
 */

export type UserRole = 'USER' | 'AGENT' | 'ADMIN';

export type ComplaintCategory = 'Water' | 'Roads' | 'Electricity' | 'Waste Management';

export type ComplaintStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  category?: ComplaintCategory; // Optional for agents to specify their domain
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  complaintId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  location: string;
  status: ComplaintStatus;
  agentId: string | null;
  agentName: string | null;
  createdAt: string;
  updatedAt: string;
  feedback: Feedback | null;
  chat: ChatMessage[];
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
}
