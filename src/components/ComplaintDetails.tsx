import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext.tsx';
import { Complaint, ChatMessage } from '../types.js';
import { Send, Star, Compass, User, Tag, MapPin, Calendar, Clock, ArrowLeft, MessageSquare, AlertCircle } from 'lucide-react';

interface Props {
  complaintId: string;
  onBack: () => void;
}

export default function ComplaintDetails({ complaintId, onBack }: Props) {
  const { auth, complaints, sendChatMessage, updateStatus, submitFeedback } = useAuth();
  const [chatInput, setChatInput] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const complaint = complaints.find(c => c.id === complaintId);

  if (!complaint) {
    return (
      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 text-center space-y-4 font-sans text-slate-100" id="not_found_complaint">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto animate-bounce" />
        <h3 className="text-lg font-bold text-white">Incident Not Found</h3>
        <p className="text-slate-300 text-sm">The complaint you requested could not be fetched or does not exist.</p>
        <button onClick={onBack} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer" id="back_btn_notfound">
          Return to Hub
        </button>
      </div>
    );
  }

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const success = await sendChatMessage(complaint.id, chatInput);
    if (success) {
      setChatInput('');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    await updateStatus(complaint.id, newStatus);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    const success = await submitFeedback(complaint.id, rating, feedbackComment);
    setSubmittingFeedback(false);
    if (success) {
      setFeedbackComment('');
    }
  };

  const currentRole = auth.user?.role;

  // Milestone mapping for tracking bar
  const milestones = [
    { key: 'Pending', label: 'Filed', description: 'Under review' },
    { key: 'Assigned', label: 'Assigned', description: 'Engineer allocated' },
    { key: 'In Progress', label: 'In Progress', description: 'Active repair' },
    { key: 'Resolved', label: 'Resolved', description: 'Awaiting closed check' },
    { key: 'Closed', label: 'Closed & Rated', description: 'Incident Archived' }
  ];

  const getMilestoneIndex = (status: string) => {
    return milestones.findIndex(m => m.key === status);
  };

  const complaintIndex = getMilestoneIndex(complaint.status);

  return (
    <div className="space-y-6 font-sans text-slate-100 animate-fade-in" id={`complaint_details_space_${complaint.id}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg text-white" id="details_header">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-xl transition text-slate-300 hover:text-white cursor-pointer"
            id="back_to_dashboard_btn"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold">
              <span>Incident ID: {complaint.id}</span>
              <span>•</span>
              <span className="bg-indigo-500/15 border border-indigo-500/25 px-2 py-0.5 rounded text-indigo-300 font-bold font-mono uppercase tracking-wider text-[9px]">{complaint.category}</span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight mt-0.5">{complaint.title}</h2>
          </div>
        </div>

        {/* Status Badge Indicator */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-bold text-slate-400">STATUS DISPLAY:</span>
          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
            complaint.status === 'Pending' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
            complaint.status === 'Assigned' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
            complaint.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
            complaint.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
            'bg-white/10 text-slate-300 border-white/10'
          }`} id={`status_badge_details`}>
            {complaint.status}
          </span>
        </div>
      </div>      {/* Progress/Milestone Timeline Tracking */}
      <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-lg space-y-4 text-white" id="details_timeline_card">
        <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase">Resolution Timeline Tracker</h3>
        
        <div className="relative pt-4 pb-2">
          {/* Background line */}
          <div className="absolute top-8 left-10 md:left-14 right-10 md:right-14 h-1 bg-white/5 border-b border-white/10 -translate-y-1/2 z-0 hidden sm:block"></div>
          {/* Active progress line */}
          <div 
            className="absolute top-8 left-10 md:left-14 h-1 bg-gradient-to-r from-indigo-500 to-emerald-500 -translate-y-1/2 z-0 transition-all duration-500 hidden sm:block"
            style={{ width: `${Math.min(100, Math.max(0, (complaintIndex / (milestones.length - 1)) * 90))}%` }}
          ></div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-2 relative z-10">
            {milestones.map((m, index) => {
              const mIndex = getMilestoneIndex(m.key);
              const isPast = mIndex < complaintIndex;
              const isCurrent = mIndex === complaintIndex;

              return (
                <div key={m.key} className="flex sm:flex-col items-center sm:text-center space-x-3 sm:space-x-0 sm:space-y-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition ${
                    isPast ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]' :
                    isCurrent ? 'bg-indigo-650 border-indigo-505 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]' :
                    'bg-[#1e293b] border-white/10 text-slate-400'
                  }`}>
                    {isPast ? '✓' : index + 1}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold leading-tight ${
                      isCurrent ? 'text-indigo-300' : isPast ? 'text-emerald-300' : 'text-slate-400'
                    }`}>
                      {m.label}
                    </h4>
                    <p className="text-[10px] text-slate-450 text-slate-400 sm:max-w-[120px] mx-auto mt-0.5 font-semibold">{m.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Summary & Action Panel */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          {/* Details & Location Panel */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl shadow-lg space-y-4 flex-1 backdrop-blur-md">
            <h3 className="text-sm font-extrabold text-white border-b border-white/10 pb-2.5">MALFUNCTION PROFILE</h3>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-450 text-slate-400 font-bold block uppercase tracking-wider">Incident Description</span>
                <p className="font-medium text-slate-100 leading-relaxed bg-white/5 p-3.5 rounded-xl border border-white/10 whitespace-pre-wrap">{complaint.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start space-x-2.5 bg-white/5 p-3 rounded-xl border border-white/5">
                  <MapPin className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Location</span>
                    <span className="text-xs font-bold text-slate-200">{complaint.location}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 bg-white/5 p-3 rounded-xl border border-white/5">
                  <Calendar className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Reported On</span>
                    <span className="text-xs font-bold text-slate-200">{new Date(complaint.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                <div className="flex items-start space-x-2.5">
                  <User className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Submitted By</span>
                    <span className="text-xs font-bold text-slate-200">{complaint.userName}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <Compass className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Department Handler</span>
                    <span className="text-xs font-bold text-slate-200">
                      {complaint.agentName ? `${complaint.agentName}` : '❌ Awaiting Allocation'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Form: Agent Status Progression Controls */}
          {currentRole !== 'USER' && complaint.status !== 'Closed' && (
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4 shadow-lg backdrop-blur-md" id="agent_status_controls">
              <h3 className="text-sm font-extrabold tracking-tight text-white border-b border-white/10 pb-2.5 uppercase text-slate-100">
                Engineer Operations Panel
              </h3>
              <p className="text-xs text-slate-300">
                Process this emergency complaint. Progressing states notifies the citizen automatically in their tracker.
              </p>

              <div className="grid grid-cols-1 gap-2 pt-2 text-xs font-bold">
                {complaint.status === 'Pending' && (
                  <button 
                    onClick={() => handleStatusChange('Assigned')}
                    className="w-full bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-400 hover:to-indigo-550 text-white py-2.5 rounded-xl cursor-pointer shadow-md transition-transform active:scale-95 duration-100"
                    id="agent_action_claim"
                  >
                    Claim & Self-Assign Incident
                  </button>
                )}
                
                {(complaint.status === 'Assigned' || complaint.status === 'Pending') && (
                  <button 
                    onClick={() => handleStatusChange('In Progress')}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 py-2.5 rounded-xl cursor-pointer shadow-md transition-transform active:scale-95 duration-100"
                    id="agent_action_commence"
                  >
                    Commence Underway Work
                  </button>
                )}

                {complaint.status === 'In Progress' && (
                  <button 
                    onClick={() => handleStatusChange('Resolved')}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 py-2.5 rounded-xl cursor-pointer shadow-md transition-transform active:scale-95 duration-100"
                    id="agent_action_resolve"
                  >
                    Declare Incident as Resolved ✓
                  </button>
                )}
                
                {complaint.status === 'Resolved' && (
                  <p className="text-center text-xs text-emerald-300 font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 py-2 rounded-xl">
                    ⏳ Awaiting citizen sign-off & evaluation rating
                  </p>
                )}
              </div>
            </div>
          )}

          {/* User Feedback Module (Citizen submits feedback when status is Resolved) */}
          {currentRole === 'USER' && complaint.status === 'Resolved' && !complaint.feedback && (
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4 shadow-lg backdrop-blur-md" id="feedback_submission_card">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-white tracking-tight uppercase">Declare Closure & Rate Service</h3>
                <p className="text-xs text-slate-350 text-slate-450 text-slate-400 font-semibold">The engineer declared this fixed. Please grade the service resolution quality.</p>
              </div>

              <form onSubmit={handleFeedbackSubmit} className="space-y-3.5" id="feedback_form">
                {/* 5-Star input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Incident Rating</label>
                  <div className="flex items-center space-x-1.5" id="rating_stars_input">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="focus:outline-none transition-transform active:scale-110 cursor-pointer"
                        title={`${star} Stars`}
                      >
                        <Star 
                          className={`w-6 h-6 ${
                            star <= (hoverRating ?? rating) 
                              ? 'text-amber-400 fill-amber-300' 
                              : 'text-white/20 hover:text-white/40'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Closing Review Comments</label>
                  <textarea
                    placeholder="Describe your satisfaction with the speed and quality of this repair..."
                    rows={3}
                    value={feedbackComment}
                    onChange={e => setFeedbackComment(e.target.value)}
                    className="w-full bg-[#1e293b] border border-white/10 focus:border-indigo-500/40 rounded-xl p-3 text-xs focus:outline-none transition text-white placeholder-slate-500 font-semibold"
                    id="feedback_comment_input"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submittingFeedback}
                  id="submit_feedback_btn"
                  className="w-full bg-indigo-650 hover:bg-indigo-550 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-md transition disabled:bg-white/5 disabled:text-slate-500 cursor-pointer text-center"
                >
                  {submittingFeedback ? 'Signing off...' : 'Confirm Resolving Details & CLOSE Complaint'}
                </button>
              </form>
            </div>
          )}

          {/* Render Display Feedback (If already submitted) */}
          {complaint.feedback && (
            <div className="bg-[#1e293b]/70 border border-white/10 text-white p-5 rounded-2xl space-y-3 shadow-lg backdrop-blur-md animate-pulse-slow" id="display_feedback_card">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Citizen Sign-off Evaluation</span>
                <div className="flex items-center">
                  {[1,2,3,4,5].map(s => (
                    <Star 
                      key={s} 
                      className={`w-3.5 h-3.5 ${s <= complaint.feedback!.rating ? 'text-amber-400 fill-amber-400' : 'text-white/10'}`} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs font-mono italic text-slate-200">
                "{complaint.feedback.comment || 'No assessment thoughts provided.'}"
              </p>
              <span className="text-[9px] text-slate-500 block text-right font-extrabold uppercase font-mono">
                Reviewed on {new Date(complaint.feedback.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Real-time Communication Chat Stream */}
        <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl shadow-lg p-5 flex flex-col min-h-[460px] max-h-[560px] backdrop-blur-md" id="details_chat_panel">
          <div className="flex items-center space-x-2.5 border-b border-white/10 pb-3 text-white">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold leading-none uppercase text-slate-100">Civic Dispatch Lines</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">Direct query communications log between Citizens and Department Agents</p>
            </div>
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1 text-xs" id="chat_feed_container">
            {complaint.chat.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3 py-12">
                <span className="text-3xl animate-pulse">💬</span>
                <p className="text-xs font-bold text-slate-355 text-slate-300">No messages posted yet on this line.</p>
                <p className="text-[10px] text-slate-400 max-w-[200px] font-semibold">Send a note below to commence dialogue with your department handler.</p>
              </div>
            ) : (
              complaint.chat.map((msg: ChatMessage) => {
                const isSystem = msg.senderId === 'system';
                const isMe = msg.senderId === auth.user?.id;
                
                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-1.5">
                      <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1 text-[10px] text-indigo-300 font-bold font-mono uppercase tracking-wider">
                        🔹 {msg.message}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-md space-y-1 ${
                      isMe 
                        ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-none border border-indigo-505' 
                        : 'bg-white/5 text-slate-100 border border-white/10 rounded-bl-none'
                    }`}>
                      <div className="flex items-center justify-between space-x-6">
                        <span className={`font-extrabold text-[9px] uppercase tracking-wider ${isMe ? 'text-indigo-200' : 'text-indigo-300'}`}>
                          {msg.senderName} ({msg.senderRole})
                        </span>
                        <span className={`text-[9px] font-mono ${isMe ? 'text-indigo-300' : 'text-slate-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed break-words whitespace-pre-wrap font-medium">{msg.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Input Bar */}
          {complaint.status !== 'Closed' ? (
            <form onSubmit={handleSendChat} className="border-t border-white/10 pt-3 flex items-center space-x-2" id="chat_composer_form">
              <input
                type="text"
                placeholder="Write your diagnostic query or instructions here..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="flex-1 bg-[#1e293b] border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/40 text-white placeholder-slate-500 font-semibold"
                id="chat_text_input"
                name="chatTextInput"
                autoComplete="off"
              />
              <button
                type="submit"
                id="send_chat_msg_btn"
                className="p-2.5 bg-indigo-650 hover:bg-indigo-550 text-white rounded-xl shadow-md transition-transform duration-100 active:scale-95 cursor-pointer shrink-0"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="border-t border-white/10 pt-2.5 text-center text-rose-300 font-extrabold uppercase py-2 bg-rose-500/10 border border-rose-500/20 text-[10px] tracking-wider rounded-xl font-mono" id="chat_disabled_closed">
              🗄️ Locked: Communications closed upon final incident sign-off
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
