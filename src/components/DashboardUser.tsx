import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext.tsx';
import { ComplaintCategory, Complaint } from '../types.js';
import { Plus, MessageSquare, AlertTriangle, Filter, Search, MapPin, Tag, PlusCircle, Bookmark, Compass, LayoutGrid } from 'lucide-react';

interface Props {
  onSelectComplaint: (id: string) => void;
}

export default function DashboardUser({ onSelectComplaint }: Props) {
  const { auth, complaints, createComplaint, errorMsg, fetchComplaints } = useAuth();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchComplaints();
  }, []);
  
  // Submit Form States
  const [title, setTitle] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [category, setCategory] = useState<ComplaintCategory>('Water');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMsg(null);
    if (!title.trim() || !location.trim() || !description.trim()) {
      setInfoMsg('Please fill in all details.');
      return;
    }

    setSubmitting(true);
    const result = await createComplaint(title, description, category, location);
    setSubmitting(false);

    if (result) {
      // Clear forms
      setTitle('');
      setLocation('');
      setDescription('');
      setShowForm(false);
      setInfoMsg('Your complaint was filed successfully! An agent will review immediately.');
      setTimeout(() => setInfoMsg(null), 6000);
    }
  };

  // Filter complaints
  const filtered = complaints.filter(c => {
    const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const totals = {
    all: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    active: complaints.filter(c => c.status === 'Assigned' || c.status === 'In Progress').length,
    resolved: complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length
  };

  return (
    <div className="space-y-6 font-sans text-slate-100" id="citizen_dashboard_wrapper">
      {/* Welcome Hero Panel */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8 text-white relative shadow-lg overflow-hidden" id="dashboard_hero_banner">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 space-y-5">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Hello, {auth.user?.name}! 👋
            </h1>
            <p className="text-indigo-200 text-xs lg:text-sm leading-relaxed">
              Welcome to <strong>CivicHub</strong>, your easy-to-use neighborhood care center. Reporting local service issues and getting them resolved is now extremely simple.
            </p>
          </div>

          {/* Real-time 3-step explanation of CivicHub */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 pb-4 border-t border-b border-white/10">
            <div className="flex items-start space-x-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-550/30 text-indigo-300 border border-indigo-500/20 text-xs font-bold shrink-0 mt-0.5">1</span>
              <div>
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Report an Issue</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">Click the button below to easily state what needs repair: leakage, potholes, waste, downpower, etc.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-550/30 text-teal-300 border border-teal-500/20 text-xs font-bold shrink-0 mt-0.5">2</span>
              <div>
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Track & Chat</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">An expert engineer is automatically dispatched. Chat directly with your helper in real-time to check progress.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-550/30 text-emerald-300 border border-emerald-500/20 text-xs font-bold shrink-0 mt-0.5">3</span>
              <div>
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Rate & Sign-off</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">Once fixed, rate your service satisfaction from 1-5 stars to mark the complaint successfully resolved.</p>
              </div>
            </div>
          </div>

          <div className="pt-1">
            <button
              onClick={() => {
                setShowForm(!showForm);
                setInfoMsg(null);
              }}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-400 hover:to-indigo-550 text-white text-xs font-extrabold py-3 px-5 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
              id="toggle_report_form_btn"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{showForm ? 'Close Form' : 'Report a Neighborhood Problem Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {infoMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2.5 shadow-sm animate-pulse" id="dashboard_info_notification">
          <span>✓</span>
          <span>{infoMsg}</span>
        </div>
      )}

      {/* Submission Form Section */}
      {showForm && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl space-y-4" id="incident_filing_card">
          <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
            <div className="p-2 bg-white/5 text-indigo-300 rounded-lg border border-white/5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white leading-tight">Report a Problem</h2>
              <p className="text-[10px] text-slate-400 font-medium">Provide simple details below to get quick assistance from our department specialists</p>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold" id="new_complaint_form">
            <div className="col-span-1 space-y-3">
              <div className="space-y-1">
                <label className="text-slate-300">Name of Issue / Title</label>
                <input
                  type="text"
                  placeholder="e.g., Leaking water pipe, Large pavement pothole"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white/10 focus:outline-none transition font-medium text-white placeholder-slate-400"
                  id="form_title"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300">Category of Issue</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as ComplaintCategory)}
                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-2 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition font-medium text-white"
                    id="form_category"
                  >
                    <option value="Water">Water & Sewage</option>
                    <option value="Roads">Roads & Streets</option>
                    <option value="Electricity">Electricity Dept</option>
                    <option value="Waste Management">Waste Management</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300">Where is the issue?</label>
                  <input
                    type="text"
                    placeholder="e.g., Star lane corner, or specific address"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white/10 focus:outline-none transition font-medium text-white placeholder-slate-400"
                    id="form_location"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="col-span-1 flex flex-col space-y-3">
              <div className="space-y-1 flex-1 flex flex-col">
                <label className="text-slate-300">Describe what is wrong</label>
                <textarea
                  placeholder="Tell us what physical damage there is, or how it affects people around..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white/10 focus:outline-none transition flex-1 font-medium text-white placeholder-slate-400"
                  id="form_description"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-400 hover:to-indigo-550 text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition disabled:bg-indigo-400 cursor-pointer"
                id="submit_complaint_btn"
              >
                {submitting ? 'Submitting...' : 'Submit Report Now'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Counter Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="user_stats_cards_row">
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl shadow-md space-y-1.5 backdrop-blur-md">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">Total Reported</span>
          <p className="text-2xl font-extrabold text-white tracking-tight leading-none">{totals.all}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-1.5 backdrop-blur-md">
          <span className="text-[10px] font-bold text-amber-300 tracking-wider block uppercase">Awaiting Action</span>
          <p className="text-2xl font-extrabold text-amber-200 tracking-tight leading-none">{totals.pending}</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl space-y-1.5 backdrop-blur-md">
          <span className="text-[10px] font-bold text-blue-300 tracking-wider block uppercase">Active Progress</span>
          <p className="text-2xl font-extrabold text-blue-200 tracking-tight leading-none">{totals.active}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl space-y-1.5 backdrop-blur-md">
          <span className="text-[10px] font-bold text-emerald-300 tracking-wider block uppercase">Resolved Files</span>
          <p className="text-2xl font-extrabold text-emerald-205 text-emerald-200 tracking-tight leading-none">{totals.resolved}</p>
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4 text-white" id="utility_filter_bar">
        {/* Search Input */}
        <div className="relative w-full md:w-72 text-xs font-semibold">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search className="w-3.5 h-3.5 text-indigo-400" />
          </span>
          <input
            type="text"
            placeholder="Search matching complaints..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white/10 transition text-white placeholder-slate-400"
            id="complaints_search_input"
          />
        </div>

        {/* Filter Selection Grid */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-[11px] font-bold text-slate-300">
          <div className="flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dept:</span>
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-[#1e293b] border border-white/10 text-xs px-2.5 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-white cursor-pointer"
            id="filter_category"
          >
            <option value="All">All Categories</option>
            <option value="Water">Water & Sewage</option>
            <option value="Roads">Roads & Streets</option>
            <option value="Electricity">Electricity</option>
            <option value="Waste Management">Waste Management</option>
          </select>

          <span>Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#1e293b] border border-white/10 text-xs px-2.5 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-white cursor-pointer"
            id="filter_status"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Complaints List Sheet */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-md overflow-hidden text-slate-200" id="complaints_feed_table_box">
        {filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2 py-20">
            <Bookmark className="w-10 h-10 mx-auto text-indigo-400" />
            <p className="text-xs font-semibold">No complaints registered matching these criteria.</p>
            <p className="text-[10px] text-slate-450">Click compile or "Report New Municipal Emergency" to file a new complaint.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-300 text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                  <th className="p-4 pl-6">Incident Title / ID</th>
                  <th className="p-4">Department Category</th>
                  <th className="p-4">Coordinates / Location</th>
                  <th className="p-4">Status & Dispatch Handler</th>
                  <th className="p-4 text-right pr-6">Engagement Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-semibold text-slate-200">
                {filtered.map((c: Complaint) => (
                  <tr key={c.id} className="hover:bg-white/5 transition duration-150">
                    <td className="p-4 pl-6">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-white block text-sm">{c.title}</span>
                        <span className="text-[10px] text-slate-400 block font-semibold font-mono">ID: {c.id}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-semibold">
                      <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-slate-200 font-mono text-[10px]">
                        {c.category}
                      </span>
                    </td>
                    <td className="p-4 text-xs">
                      <div className="flex items-center space-x-1.5 text-slate-300 animate-pulse-slow">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="truncate max-w-[180px] text-slate-300">{c.location}</span>
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
                        <p className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                          Engine: {c.agentName || 'Awaiting Handler'}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <button
                        onClick={() => onSelectComplaint(c.id)}
                        className={`inline-flex items-center space-x-1 border py-1.5 px-3 rounded-xl text-[10px] font-extrabold cursor-pointer transition-all duration-200 ${
                          c.status === 'Resolved' 
                            ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border-rose-500/30' 
                            : 'bg-white/5 text-indigo-300 border-white/10 hover:bg-indigo-500/10 hover:border-indigo-500/20'
                        }`}
                        title="Interact with complaint logs"
                        id={`track_${c.id}`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>{c.status === 'Resolved' ? 'Action Required' : 'Track & Chat'}</span>
                      </button>
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
