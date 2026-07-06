import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext.tsx';
import { Complaint } from '../types.js';
import { Search, MapPin, MessageSquare, ClipboardList, CheckCircle2, AlertCircle, BookmarkCheck, Calendar, Filter } from 'lucide-react';

interface Props {
  onSelectComplaint: (id: string) => void;
}

export default function DashboardAgent({ onSelectComplaint }: Props) {
  const { auth, complaints, updateStatus, fetchComplaints } = useAuth();
  const [activeTab, setActiveTab] = useState<'assigned' | 'backlog'>('assigned');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const agentCategory = auth.user?.category || 'Water';
  const agentId = auth.user?.id;

  // Filter complaints
  const myAssigned = complaints.filter(c => c.agentId === agentId);
  const departmentBacklog = complaints.filter(c => c.category === agentCategory && !c.agentId && c.status === 'Pending');

  const visibleComplaints = activeTab === 'assigned' ? myAssigned : departmentBacklog;

  const filtered = visibleComplaints.filter(c => {
    return searchQuery.trim() === '' || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleClaimTicket = async (complaintId: string) => {
    // Calling updateStatus triggers self-assignment on backend
    await updateStatus(complaintId, 'Assigned');
  };

  const stats = {
    myTotal: myAssigned.length,
    myActive: myAssigned.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length,
    myResolved: myAssigned.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
    backlogCount: departmentBacklog.length
  };

  return (
    <div className="space-y-6 font-sans text-slate-100" id="agent_dashboard_wrapper">
      {/* Specialty Welcome Banner */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8 text-white relative shadow-lg overflow-hidden" id="agent_hero_banner">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-550/15 rounded-full blur-3xl"></div>
        <div className="relative z-10 space-y-2.5">
          <div className="inline-flex items-center space-x-1.5 bg-indigo-500/15 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20">
            <span>🔧 {agentCategory} Department Staff</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            Hello, {auth.user?.name}
          </h1>
          <p className="text-slate-300 text-xs lg:text-sm leading-relaxed max-w-2xl">
            You are set as the solver for the <strong>{agentCategory} Department</strong>. Below you can view issues assigned to you, view unassigned work, reply to citizens in real-time, and update resolution statuses easily.
          </p>
        </div>
      </div>

      {/* Grid count cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="agent_stats_cards_row">
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl shadow-md space-y-1 backdrop-blur-md">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">My Assigned Work</span>
          <p className="text-xl font-extrabold text-white leading-none">{stats.myTotal}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-1 backdrop-blur-md">
          <span className="text-[10px] font-bold text-amber-300 tracking-wider block uppercase">Active Progress</span>
          <p className="text-xl font-extrabold text-amber-200 leading-none">{stats.myActive}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl space-y-1 backdrop-blur-md">
          <span className="text-[10px] font-bold text-emerald-300 tracking-wider block uppercase">Completed Tasks</span>
          <p className="text-xl font-extrabold text-emerald-200 leading-none">{stats.myResolved}</p>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl space-y-1 backdrop-blur-md">
          <span className="text-[10px] font-bold text-rose-300 tracking-wider block uppercase">New Dept Issues</span>
          <p className="text-xl font-extrabold text-rose-200 leading-none">{stats.backlogCount}</p>
        </div>
      </div>

      {/* Main interaction workspace */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl overflow-hidden" id="agent_dashboard_workspace">
        {/* Workspace Tab Header */}
        <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex space-x-2" id="agent_workspace_tabs">
            <button
              onClick={() => setActiveTab('assigned')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'assigned' 
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-650 text-white shadow-md' 
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
              id="tab_my_assigned"
            >
              <ClipboardList className="w-3.5 h-3.5 text-indigo-400" />
              <span>My Assignments ({stats.myTotal})</span>
            </button>
            <button
              onClick={() => setActiveTab('backlog')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'backlog' 
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-650 text-white shadow-md' 
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
              id="tab_dept_backlog"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Unassigned Dept Backlog ({stats.backlogCount})</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64 text-xs font-semibold">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search className="w-3.5 h-3.5 text-indigo-400" />
            </span>
            <input
              type="text"
              placeholder="Search by ID or title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white/10 transition"
              id="agent_search_input"
            />
          </div>
        </div>

        {/* Complaints Table/List */}
        {filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2 py-20 font-medium">
            <BookmarkCheck className="w-10 h-10 mx-auto text-indigo-400" />
            <p className="text-xs font-semibold">
              {activeTab === 'assigned' 
                ? 'Great job, you do not have any pending assigned tickets!' 
                : `Awesome! There is currently no unassigned emergency backlog in the ${agentCategory} Department.`}
            </p>
            <p className="text-[10px] text-slate-450">Check backup or review files for active tracking.</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left text-slate-350 border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                  <th className="p-4 pl-6">Incident Title / ID</th>
                  <th className="p-4">Citizen Submitter</th>
                  <th className="p-4">Coordinates / Location</th>
                  <th className="p-4">Status & Quality Action</th>
                  <th className="p-4 text-right pr-6">Operations Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-semibold text-slate-200">
                {filtered.map((c: Complaint) => (
                  <tr key={c.id} className="hover:bg-white/5 transition duration-150 animate-pulse-slow">
                    <td className="p-4 pl-6">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-white block text-sm">{c.title}</span>
                        <span className="text-[10px] text-slate-400 block font-semibold font-mono">ID: {c.id}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-200">
                      {c.userName}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-indigo-450 text-indigo-400" />
                        <span className="truncate max-w-[150px]">{c.location}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          c.status === 'Pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          c.status === 'Assigned' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          c.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          c.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          'bg-white/10 text-slate-300 border border-white/10'
                        }`}>
                          {c.status}
                        </span>
                        
                        {c.feedback && (
                          <span className="text-[9px] block text-green-300 bg-emerald-500/15 border border-emerald-500/20 px-1 py-0.2 rounded font-mono font-bold leading-tight" title="Citizen Satisfaction Score">
                            ⭐ Rate: {c.feedback.rating}/5
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex justify-end items-center space-x-2">
                        {activeTab === 'backlog' && (
                          <button
                            onClick={() => handleClaimTicket(c.id)}
                            className="bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-400 hover:to-indigo-550 text-white font-extrabold py-1.5 px-3 rounded-xl text-[10px] transition-transform active:scale-95 cursor-pointer shadow-md"
                            id={`claim_${c.id}`}
                          >
                            Claim Ticket
                          </button>
                        )}
                        <button
                          onClick={() => onSelectComplaint(c.id)}
                          className="bg-white/5 border border-white/10 hover:border-indigo-500/30 text-indigo-300 hover:bg-indigo-505 hover:bg-indigo-500/10 font-bold py-1.5 px-3 rounded-xl text-[10px] cursor-pointer transition duration-150"
                          id={`manage_${c.id}`}
                        >
                          {activeTab === 'backlog' ? 'Inspect Detail' : 'Diagnose & Chat'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
