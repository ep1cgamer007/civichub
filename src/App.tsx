import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext.tsx';
import LoginRegister from './components/LoginRegister.tsx';
import DashboardUser from './components/DashboardUser.tsx';
import DashboardAgent from './components/DashboardAgent.tsx';
import DashboardAdmin from './components/DashboardAdmin.tsx';
import ComplaintDetails from './components/ComplaintDetails.tsx';
import { Building2, Shield, Wrench, User, LogOut, CheckSquare } from 'lucide-react';

function DashboardSwitch({ onSelectComplaint }: { onSelectComplaint: (id: string) => void }) {
  const { auth } = useAuth();

  if (!auth.user) return null;

  switch (auth.user.role) {
    case 'ADMIN':
      return <DashboardAdmin onSelectComplaint={onSelectComplaint} />;
    case 'AGENT':
      return <DashboardAgent onSelectComplaint={onSelectComplaint} />;
    case 'USER':
    default:
      return <DashboardUser onSelectComplaint={onSelectComplaint} />;
  }
}

function MainAppContent() {
  const { auth, logout } = useAuth();
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-[#0d111c] flex flex-col items-center justify-center space-y-4 font-sans relative overflow-hidden text-slate-100" id="app_loading_screen">
        {/* Glowing Background Blobs */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/25 blur-[120px]"></div>
          <div className="absolute bottom-[-5%] right-[5%] w-[35%] h-[35%] rounded-full bg-blue-500/20 blur-[100px]"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-14 h-14 rounded-full border-4 border-white/5 border-t-indigo-500 animate-spin"></div>
            <Building2 className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-xs text-indigo-300 font-extrabold tracking-wider uppercase">Loading CivicHub...</p>
        </div>
      </div>
    );
  }

  if (!auth.token || !auth.user) {
    return (
      <div className="min-h-screen bg-[#0d111c] relative overflow-hidden" id="login_screen_outer">
        {/* Floating background glowing circles */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] rounded-full bg-indigo-600/25 blur-[130px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-blue-500/20 blur-[130px]"></div>
          <div className="absolute top-[25%] right-[10%] w-[35%] h-[45%] rounded-full bg-purple-600/15 blur-[120px]"></div>
        </div>
        <div className="relative z-10">
          <LoginRegister />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d111c] pb-12 font-sans text-slate-200 relative overflow-hidden" id="main_content_skeleton">
      {/* Absolute backdrop blur effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/15 blur-[130px]"></div>
        <div className="absolute bottom-[-5%] right-[5%] w-[35%] h-[35%] rounded-full bg-blue-500/10 blur-[120px]"></div>
        <div className="absolute top-[30%] right-[-5%] w-[30%] h-[40%] rounded-full bg-purple-600/10 blur-[130px]"></div>
      </div>

      {/* Universal Civil Workspace Header in Frosted style */}
      <nav className="border-b border-white/10 backdrop-blur-md bg-white/5 sticky top-0 z-40 px-6 py-4 shadow-lg shadow-black/10 text-white" id="global_nav_header">
        <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setSelectedComplaintId(null)}>
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-xl shadow-md group-hover:scale-105 transition-transform duration-350">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white tracking-tight text-base sm:text-lg block leading-none">
                Civic<span className="text-indigo-400">Hub</span>
              </span>
              <span className="text-[10px] text-slate-400 block tracking-wide uppercase font-semibold mt-1">
                Easy Civic Solutions
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* User role badge in glass styling */}
            <div className="hidden sm:flex items-center space-x-2 bg-white/5 border border-white/15 p-1.5 px-3 rounded-xl text-xs font-semibold">
              {auth.user.role === 'ADMIN' ? (
                <div className="flex items-center space-x-1.5 text-indigo-300">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </div>
              ) : auth.user.role === 'AGENT' ? (
                <div className="flex items-center space-x-1.5 text-teal-355 font-bold font-mono text-teal-300">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{auth.user.category} Dept Responders</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 text-slate-300">
                  <User className="w-3.5 h-3.5" />
                  <span>Citizen Portal</span>
                </div>
              )}
            </div>

            {/* Profile greeting info */}
            <div className="text-right hidden md:block">
              <p className="text-xs font-extrabold text-slate-100 leading-tight">{auth.user.name}</p>
              <p className="text-[10px] text-slate-400 font-semibold">{auth.user.email}</p>
            </div>

            <button
              onClick={() => {
                setSelectedComplaintId(null);
                logout();
              }}
              title="Sign Out"
              className="p-2 bg-white/5 hover:bg-rose-500/20 hover:text-rose-455 border border-white/10 hover:border-rose-500/30 rounded-xl transition text-slate-300"
              id="global_logout_btn"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-6 relative z-10">
        {selectedComplaintId ? (
          <ComplaintDetails 
            complaintId={selectedComplaintId} 
            onBack={() => setSelectedComplaintId(null)} 
          />
        ) : (
          <DashboardSwitch onSelectComplaint={setSelectedComplaintId} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
