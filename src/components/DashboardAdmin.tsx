import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext.tsx';
import { Complaint, User } from '../types.js';
import { Shield, Sparkles, MessageSquare, MapPin, Loader2, Star, Users, ClipboardCheck, ArrowUpDown, Clock, Filter, Search, UserCheck, TrendingUp, BarChart4, PieChart as PieChartIcon, HeartHandshake } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  CartesianGrid
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs">
        <p className="font-bold text-white mb-1.5">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center space-x-2 text-[10px] font-semibold">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></span>
              <span className="text-slate-400">{entry.name}:</span>
              <span className="text-white font-mono font-bold">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

interface Props {
  onSelectComplaint: (id: string) => void;
}

export default function DashboardAdmin({ onSelectComplaint }: Props) {
  const { auth, complaints, assignAgent, fetchComplaints } = useAuth();
  const [stats, setStats] = useState<any | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [adminTab, setAdminTab] = useState<'analytics' | 'analytics_details' | 'management'>('analytics');
  
  // Track selected agent ID per complaint ID for drop-downs
  const [assignSelections, setAssignSelections] = useState<{ [complaintId: string]: string }>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);
      try {
        const resStats = await fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const resAgents = await fetch('/api/agents', {
          headers: { 'Authorization': `Bearer ${auth.token}` }
        });

        if (resStats.ok && resAgents.ok) {
          const statsData = await resStats.json();
          const agentsData = await resAgents.json();
          setStats(statsData);
          setAgents(agentsData);
        }
      } catch (e) {
        console.error('Failed to preload admin statistics and agent loads', e);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, [auth.token, complaints, refreshKey]);

  const handleAssign = async (complaintId: string) => {
    const agentId = assignSelections[complaintId];
    if (!agentId) return;

    setAssigningId(complaintId);
    const success = await assignAgent(complaintId, agentId);
    setAssigningId(null);
    if (success) {
      await fetchComplaints();
      setRefreshKey(prev => prev + 1);
    }
  };

  const filtered = complaints.filter(c => {
    const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.userName && c.userName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesStatus && matchesSearch;
  });

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3 font-sans text-slate-100" id="admin_loading_indicator">
        <Loader2 className="w-8 h-8 text-indigo-450 animate-spin" />
        <p className="text-xs text-slate-300 font-bold">Assembling System Analytics...</p>
      </div>
    );
  }

  // Fallback defaults if load failure or mock
  const activeStats = stats || {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    inProgress: complaints.filter(c => c.status === 'Assigned' || c.status === 'In Progress').length,
    resolved: complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
    categoriesCount: {
      Water: complaints.filter(c => c.category === 'Water').length,
      Roads: complaints.filter(c => c.category === 'Roads').length,
      Electricity: complaints.filter(c => c.category === 'Electricity').length,
      'Waste Management': complaints.filter(c => c.category === 'Waste Management').length,
    },
    agentStats: [],
    feedbacksCount: complaints.filter(c => c.feedback).length,
    averageRating: 5.0,
    feedbacksList: complaints.map(c => c.feedback).filter(Boolean)
  };

  const chartCategories = [
    { name: 'Water', count: complaints.filter(c => c.category === 'Water').length, color: '#38bdf8' },
    { name: 'Roads', count: complaints.filter(c => c.category === 'Roads').length, color: '#f59e0b' },
    { name: 'Electricity', count: complaints.filter(c => c.category === 'Electricity').length, color: '#eab308' },
    { name: 'Waste Management', count: complaints.filter(c => c.category === 'Waste Management').length, color: '#10b981' }
  ];

  const barChartData = chartCategories.map(cat => ({
    name: cat.name === 'Waste Management' ? 'Waste' : cat.name,
    'Unassigned': complaints.filter(c => c.category === cat.name && c.status === 'Pending').length,
    'In Progress': complaints.filter(c => c.category === cat.name && (c.status === 'Assigned' || c.status === 'In Progress')).length,
    'Resolved': complaints.filter(c => c.category === cat.name && (c.status === 'Resolved' || c.status === 'Closed')).length,
    Total: complaints.filter(c => c.category === cat.name).length
  }));

  const pieChartData = chartCategories.map(cat => ({
    name: cat.name === 'Waste Management' ? 'Waste' : cat.name,
    value: cat.count || 0,
    color: cat.color
  })).filter(d => d.value > 0);

  const ratingVals = [5, 4, 3, 2, 1];
  const ratingDistribution = ratingVals.map(stars => ({
    name: `${stars} Stars`,
    count: complaints.filter(c => c.feedback?.rating === stars).length,
    percentage: complaints.filter(c => c.feedback).length > 0
      ? (complaints.filter(c => c.feedback?.rating === stars).length / complaints.filter(c => c.feedback).length) * 100
      : 0
  }));

  const categoryLabels = Object.keys(activeStats.categoriesCount);
  const categoryValues = Object.values(activeStats.categoriesCount) as number[];
  const maxVal = Math.max(...categoryValues, 1);

  return (
    <div className="space-y-6 font-sans text-xs text-slate-100" id="admin_dashboard_wrapper">
      {/* Admin Title Panel */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8 text-white relative shadow-lg overflow-hidden" id="admin_hero_banner">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-550/15 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Municipal Coordinator Space</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Coordinator Dashboard</h1>
            <p className="text-slate-300 text-xs leading-relaxed">
              Easily oversee neighborhood issues, assign local specialists, check resolution speeds, and help citizens get support.
            </p>
          </div>
          <button 
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-400 hover:to-indigo-550 border border-indigo-700/30 py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-lg flex items-center space-x-1 cursor-pointer active:scale-95 text-white"
            title="Reload backend statistics"
          >
            <span>🔄 Refresh Stats</span>
          </button>
        </div>
      </div>

      {/* Analytics widgets row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="admin_stats_widgets">
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl shadow-md space-y-1 backdrop-blur-md">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Issues Filed</span>
          <p className="text-2xl font-extrabold text-white leading-none">{activeStats.total}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-1 backdrop-blur-md">
          <span className="text-[10px] font-bold text-amber-300 block uppercase tracking-wider">Unassigned Issues</span>
          <p className="text-2xl font-extrabold text-amber-200 leading-none">{activeStats.pending}</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl space-y-1 backdrop-blur-md">
          <span className="text-[10px] font-bold text-blue-300 block uppercase tracking-wider">Ongoing Repairs</span>
          <p className="text-2xl font-extrabold text-blue-200 leading-none">{activeStats.inProgress}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl space-y-1 backdrop-blur-md">
          <span className="text-[10px] font-bold text-emerald-300 block uppercase tracking-wider">Fully Resolved</span>
          <p className="text-2xl font-extrabold text-emerald-200 leading-none">{activeStats.resolved}</p>
        </div>
      </div>

      {/* Navigation Tabs Selector */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-white/10 pb-4" id="admin_navigation_tabs">
        <div className="flex space-x-2 bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-semibold">
          <button 
            type="button"
            onClick={() => setAdminTab('analytics')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg cursor-pointer transition ${
              adminTab === 'analytics' 
                ? 'bg-indigo-600 text-white font-extrabold shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart4 className="w-3.5 h-3.5 text-indigo-300" />
            <span>📊 Interactive Analytics</span>
          </button>
          
          <button 
            type="button"
            onClick={() => setAdminTab('management')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg cursor-pointer transition ${
              adminTab === 'management' 
                ? 'bg-indigo-600 text-white font-extrabold shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-indigo-300" />
            <span>📋 Delegation & Management</span>
          </button>
        </div>

        <div className="text-[10px] text-slate-450 text-slate-400 font-semibold bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
          Logged as municipal coordinator: <span className="font-extrabold text-indigo-300">{auth.user?.name}</span>
        </div>
      </div>

      {adminTab === 'analytics' ? (
        <div className="space-y-6" id="analytics_dashboard_section">
          {/* Main Visual charts layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Bar Chart comparing Categories and current status breakdown */}
            <div className="lg:col-span-8 bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-xl flex flex-col space-y-4 text-white">
              <div>
                <h3 className="text-xs font-extrabold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
                  <BarChart4 className="w-4 h-4 text-sky-450 text-sky-400" /> Department-wise Complaint Breakdown
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Compare citizen ticket counts and processing loads per civil category</p>
              </div>

              <div className="h-64 cursor-default text-[10px]" style={{ minHeight: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                    <Bar dataKey="Unassigned" fill="#f59e0b" name="Unassigned" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="In Progress" fill="#3b82f6" name="In Progress" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Resolved" fill="#10b981" name="Resolved" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart / Donut Chart */}
            <div className="lg:col-span-4 bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-xl flex flex-col space-y-4 text-white">
              <div>
                <h3 className="text-xs font-extrabold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
                  <PieChartIcon className="w-4 h-4 text-pink-400" /> Share by Department
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Visual proportion of reported municipal damage</p>
              </div>

              <div className="relative h-44 flex items-center justify-center">
                {pieChartData.length === 0 ? (
                  <p className="text-slate-400 italic text-xs">No issue reports submitted yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {pieChartData.length > 0 && (
                  <div className="absolute text-center flex flex-col justify-center pointer-events-none">
                    <span className="text-lg font-extrabold text-white leading-none">{activeStats.total}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
                  </div>
                )}
              </div>

              {/* Pie Legends */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                {chartCategories.map(cat => (
                  <div key={cat.name} className="flex items-center space-x-1.5 text-[10px] font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-slate-300 truncate" title={cat.name}>{cat.name === 'Waste Management' ? 'Waste' : cat.name}: {cat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Secondary stats row: Ratings distribution and quick metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Star ratings */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-emerald-400" /> Citizen Satisfaction Rate
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Ratings left by residents upon issue completion</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-amber-300 mr-1 font-mono">⭐ {activeStats.averageRating}</span>
                  <span className="text-[9px] text-slate-450 block font-bold font-mono">/ 5 avg score</span>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {ratingDistribution.map((item) => {
                  return (
                    <div key={item.name} className="flex items-center space-x-3 text-xs font-semibold">
                      <span className="w-16 text-slate-300 text-left">{item.name}</span>
                      <div className="flex-1 bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5 relative">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-[10px] text-slate-400 font-mono font-bold">
                        {item.count} {item.count === 1 ? 'user' : 'users'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* City Specialist Load Overview */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
              <div>
                <h3 className="text-xs font-extrabold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-400" /> Active Specialist Loads
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Department workload and queue levels for dispatch engineers</p>
              </div>

              {agents.length === 0 ? (
                <p className="text-slate-400 text-xs italic py-10 text-center">No specialized field agents registered yet.</p>
              ) : (
                <div className="divide-y divide-white/5 max-h-[185px] overflow-y-auto pr-1">
                  {agents.map(ag => {
                    const specLoad = activeStats.agentStats?.find((as: any) => as.id === ag.id) || { totalAssigned: 0, activeComplaints: 0 };
                    return (
                      <div key={ag.id} className="py-2.5 flex items-center justify-between text-xs font-semibold first:pt-0 last:pb-0">
                        <div>
                          <p className="text-white font-bold">{ag.name}</p>
                          <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider font-mono inline-block mt-0.5">{ag.category} Dept</span>
                        </div>
                        <div className="flex space-x-3 text-[10px] font-bold font-mono">
                          <span className="bg-white/5 border border-white/10 text-slate-300 px-2 py-0.5 rounded">All: {specLoad.totalAssigned}</span>
                          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2 py-0.5 rounded">Active: {specLoad.activeComplaints}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Two Columns: Category Load Bars & Agent Mechanics List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-md space-y-4 text-white" id="category_pie_visual_box">
              <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase">Issues by Department</h3>
              
              <div className="space-y-4 pt-2">
                {categoryLabels.map((cat, i) => {
                  const val = categoryValues[i];
                  const percentage = activeStats.total > 0 ? (val / activeStats.total) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1.5 text-xs font-semibold">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">{cat}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{val} tickets ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full rounded-full transition-all duration-501 selection:bg-indigo-300 ${
                            cat === 'Water' ? 'bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]' :
                            cat === 'Roads' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                            cat === 'Electricity' ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]' :
                            'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Customer Satisfaction Avg:</span>
                <span className="flex items-center text-amber-300 font-mono font-extrabold text-sm">
                  ⭐ {activeStats.averageRating} / 5
                </span>
              </div>
            </div>

            {/* Dynamic Mechanic Workloads */}
            <div className="lg:col-span-8 bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-md space-y-4 text-white" id="agent_workloads_box">
              <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase">Active Specialists</h3>
              
              {agents.length === 0 ? (
                <p className="text-slate-400 py-6 text-center italic">No registered department mechanic agents available.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {agents.map(ag => {
                    const specLoad = activeStats.agentStats?.find((as: any) => as.id === ag.id) || { totalAssigned: 0, activeComplaints: 0 };
                    return (
                      <div key={ag.id} className="bg-white/5 p-4 rounded-xl border border-white/15 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-white text-sm">{ag.name}</h4>
                          <p className="text-[10px] text-indigo-300 font-semibold uppercase">{ag.category} Department</p>
                          <p className="text-[10px] text-slate-400">{ag.email}</p>
                        </div>
                        <div className="text-right text-[10px] font-semibold text-slate-300 space-y-1">
                          <span className="block bg-white/5 border border-white/10 px-2 py-0.5 rounded font-mono">Total Claims: {specLoad.totalAssigned}</span>
                          <span className="block bg-amber-500/10 border border-amber-500/25 text-amber-300 px-2 py-0.5 rounded font-mono">Active Load: {specLoad.activeComplaints}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Assignment Hub Sheet */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden" id="incident_management_hub">
            <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-white">
              <div>
                <h3 className="text-sm font-bold text-white">Incident Delegation Board</h3>
                <p className="text-[10px] text-slate-400 font-medium">Verify structural alerts and delegate unassigned complaints to specific field agents</p>
              </div>

              {/* Table Level Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto font-bold text-[11px] text-slate-300 items-center">
                <div className="relative w-full sm:w-52 text-xs font-semibold">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <Search className="w-3.5 h-3.5 text-indigo-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search citizen or description..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1e293b] border border-white/10 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-450"
                    id="admin_complaints_search"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="bg-[#1e293b] border border-white/10 text-xs px-2 py-1.5 rounded-xl font-bold text-white cursor-pointer focus:outline-none"
                  id="admin_category_filter"
                >
                  <option value="All">All Topics</option>
                  <option value="Water">Water & Sewage</option>
                  <option value="Roads">Roads & Streets</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Waste Management">Waste Management</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-[#1e293b] border border-white/10 text-xs px-2 py-1.5 rounded-xl font-bold text-white cursor-pointer focus:outline-none"
                  id="admin_status_filter"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Unassigned Only (Pending)</option>
                  <option value="Assigned">Assigned Only</option>
                  <option value="In Progress">In Progress Work</option>
                  <option value="Resolved">Resolved Fixed</option>
                  <option value="Closed">Closed Archived</option>
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="p-16 text-center text-slate-400 italic font-bold">No registered complaints matching these filter constraints.</p>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left text-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                      <th className="p-4 pl-6">Incident Summary</th>
                      <th className="p-4">Coordinates / Scope</th>
                      <th className="p-4">Active Status</th>
                      <th className="p-4">Allocated Field Engineer</th>
                      <th className="p-4 text-right pr-6">Assignment Command</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-semibold text-slate-200">
                    {filtered.map((c: Complaint) => {
                      const matchedDeptAgents = agents.filter(a => a.category === c.category);
                      const selectedAgentId = assignSelections[c.id] || '';

                      return (
                        <tr key={c.id} className="hover:bg-white/5 transition duration-150 animate-pulse-slow">
                          <td className="p-4 pl-6">
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-white block text-sm">{c.title}</span>
                              <span className="text-[10px] text-slate-400 block font-semibold font-mono">ID: {c.id} by {c.userName}</span>
                            </div>
                          </td>
                          <td className="p-4 text-xs font-semibold text-slate-200">
                            <div className="space-y-1">
                              <span className="flex items-center text-slate-300">
                                <MapPin className="w-3 h-3 text-indigo-400 mr-1 shrink-0" /> {c.location}
                              </span>
                              <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 inline-block px-2 py-0.5 text-[9px] rounded font-mono uppercase tracking-wider font-bold">{c.category}</span>
                            </div>
                          </td>
                          <td className="p-4 text-xs">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              c.status === 'Pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              c.status === 'Assigned' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                              c.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                              c.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              'bg-white/10 text-slate-300 border border-white/10'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-slate-300">
                            {c.agentName ? (
                              <span className="text-white bg-indigo-500/10 px-2 py-1 rounded-md text-xs border border-indigo-500/20">{c.agentName}</span>
                            ) : (
                              <span className="text-rose-300 font-bold">❌ Unallocated</span>
                            )}
                          </td>
                          <td className="p-4 text-right pr-6">
                            {c.status === 'Pending' ? (
                              <div className="flex items-center justify-end space-x-2">
                                <select
                                  value={selectedAgentId}
                                  onChange={e => setAssignSelections({ ...assignSelections, [c.id]: e.target.value })}
                                  className="bg-[#1e293b] border border-white/10 focus:border-indigo-500/30 text-white p-1.5 px-2 rounded-xl text-[10px] focus:outline-none cursor-pointer transition max-w-[125px]"
                                  id={`select_agent_${c.id}`}
                                >
                                  <option value="">Choose Agent</option>
                                  {matchedDeptAgents.map(ag => (
                                    <option key={ag.id} value={ag.id}>{ag.name}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleAssign(c.id)}
                                  disabled={!selectedAgentId || assigningId === c.id}
                                  className="bg-indigo-650 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-500 text-white font-extrabold py-1.5 px-3 rounded-xl text-[10px] cursor-pointer transition shrink-0 shadow-md active:scale-95"
                                  id={`alloc_btn_${c.id}`}
                                >
                                  {assigningId === c.id ? 'Working...' : 'Delegate'}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => onSelectComplaint(c.id)}
                                className="bg-white/5 border border-white/10 hover:border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 font-bold py-1.5 px-3 rounded-xl text-[10px] cursor-pointer transition duration-150"
                                id={`inspect_${c.id}`}
                              >
                                Inspect / Chat
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
