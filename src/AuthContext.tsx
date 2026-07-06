import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Complaint, AuthState } from './types.js';

interface ContextProps {
  auth: AuthState;
  complaints: Complaint[];
  loadingComplaints: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string, role: string, category?: string) => Promise<string | null>;
  logout: () => void;
  fetchComplaints: (silent?: boolean) => Promise<void>;
  createComplaint: (title: string, description: string, category: string, location: string) => Promise<Complaint | null>;
  updateStatus: (complaintId: string, status: string) => Promise<boolean>;
  assignAgent: (complaintId: string, agentId: string) => Promise<boolean>;
  sendChatMessage: (complaintId: string, message: string) => Promise<boolean>;
  submitFeedback: (complaintId: string, rating: number, comment: string) => Promise<boolean>;
  fetchAgents: () => Promise<any[]>;
  errorMsg: string | null;
  setErrorMsg: (msg: string | null) => void;
}

const AuthContext = createContext<ContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: localStorage.getItem('complaint_token'),
    user: null,
    isLoading: true
  });
  
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize and load user profile if token already exists in localStorage
  useEffect(() => {
    async function loadUser() {
      if (!auth.token) {
        setAuth(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${auth.token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setAuth({
            token: auth.token,
            user: data.user,
            isLoading: false
          });
        } else {
          // Token is invalid/expired, reset
          localStorage.removeItem('complaint_token');
          setAuth({
            token: null,
            user: null,
            isLoading: false
          });
        }
      } catch (e) {
        console.error('Failed to restore authentication session', e);
        setAuth(prev => ({ ...prev, isLoading: false }));
      }
    }
    loadUser();
  }, [auth.token]);

  // Fetch complaints for current logged-in role
  const fetchComplaints = async (silent = false) => {
    if (!auth.token) return;
    if (!silent) setLoadingComplaints(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/complaints', {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (res.ok) {
        const list = await res.json();
        setComplaints(list);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to load complaints');
      }
    } catch (e) {
      console.error('Fetch complaints error', e);
      setErrorMsg('Network error while recovering complaints feed.');
    } finally {
      if (!silent) setLoadingComplaints(false);
    }
  };

  // Re-fetch complaints automatically whenever user changes
  useEffect(() => {
    if (auth.user) {
      fetchComplaints();
      const runPolling = setInterval(() => {
        fetchComplaints(true);
      }, 5000);
      return () => clearInterval(runPolling);
    } else {
      setComplaints([]);
    }
  }, [auth.user]);

  // Login handler
  const login = async (email: string, password: string): Promise<string | null> => {
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        return data.error || 'Invalid credentials';
      }

      localStorage.setItem('complaint_token', data.token);
      setAuth({
        token: data.token,
        user: data.user,
        isLoading: false
      });
      return null;
    } catch (e) {
      console.error('Login connection error', e);
      return 'Failed to reach authentication server.';
    }
  };

  // Register handler
  const register = async (name: string, email: string, password: string, role: string, category?: string): Promise<string | null> => {
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, role, category })
      });

      const data = await res.json();
      if (!res.ok) {
        return data.error || 'Failed to register account';
      }

      localStorage.setItem('complaint_token', data.token);
      setAuth({
        token: data.token,
        user: data.user,
        isLoading: false
      });
      return null;
    } catch (e) {
      console.error('Registration link error', e);
      return 'Network disruption during registration setup.';
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('complaint_token');
    setAuth({
      token: null,
      user: null,
      isLoading: false
    });
    setComplaints([]);
  };

  // Create complaint (Citizen only)
  const createComplaint = async (title: string, description: string, category: string, location: string): Promise<Complaint | null> => {
    if (!auth.token) return null;
    setErrorMsg(null);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ title, description, category, location })
      });
      const data = await res.json();
      if (res.ok) {
        setComplaints(prev => [data, ...prev]);
        return data;
      } else {
        setErrorMsg(data.error || 'Failed to file complaint');
        return null;
      }
    } catch (e) {
      console.error('Failed to create complaint', e);
      setErrorMsg('Server connection lost during submission.');
      return null;
    }
  };

  // Update Status of Complaint
  const updateStatus = async (complaintId: string, status: string): Promise<boolean> => {
    if (!auth.token) return false;
    try {
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updated = await res.json();
        setComplaints(prev => prev.map(c => c.id === complaintId ? updated : c));
        return true;
      }
    } catch (e) {
      console.error('Failed to update status', e);
    }
    return false;
  };

  // Assign Agent to Complaint (Admin Only)
  const assignAgent = async (complaintId: string, agentId: string): Promise<boolean> => {
    if (!auth.token) return false;
    try {
      const res = await fetch(`/api/admin/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ complaintId, agentId })
      });
      if (res.ok) {
        const updated = await res.json();
        setComplaints(prev => prev.map(c => c.id === complaintId ? updated : c));
        return true;
      }
    } catch (e) {
      console.error('Failed to assign agent', e);
    }
    return false;
  };

  // Send Chat Message on Complaint
  const sendChatMessage = async (complaintId: string, message: string): Promise<boolean> => {
    if (!auth.token || !message.trim()) return false;
    try {
      const res = await fetch(`/api/complaints/${complaintId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ message })
      });
      if (res.ok) {
        const updated = await res.json();
        setComplaints(prev => prev.map(c => c.id === complaintId ? updated : c));
        return true;
      }
    } catch (e) {
      console.error('Failed to send chat message', e);
    }
    return false;
  };

  // Submit Feedback (Citizen only)
  const submitFeedback = async (complaintId: string, rating: number, comment: string): Promise<boolean> => {
    if (!auth.token) return false;
    try {
      const res = await fetch(`/api/complaints/${complaintId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ rating, comment })
      });
      if (res.ok) {
        const updated = await res.json();
        setComplaints(prev => prev.map(c => c.id === complaintId ? updated : c));
        return true;
      }
    } catch (e) {
      console.error('Failed to submit feedback', e);
    }
    return false;
  };

  // Fetch specialized agents (Admin assignment helpers)
  const fetchAgents = async (): Promise<any[]> => {
    if (!auth.token) return [];
    try {
      const res = await fetch('/api/agents', {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch agents list', e);
    }
    return [];
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        complaints,
        loadingComplaints,
        login,
        register,
        logout,
        fetchComplaints,
        createComplaint,
        updateStatus,
        assignAgent,
        sendChatMessage,
        submitFeedback,
        fetchAgents,
        errorMsg,
        setErrorMsg
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
