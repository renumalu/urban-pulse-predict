import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { INDIAN_ZONES } from '@/lib/india-zones';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquarePlus, ThumbsUp, Clock, CheckCircle2, AlertCircle,
  ArrowLeft, Filter, Plus, MapPin, Send, Loader2, User, LogOut
} from 'lucide-react';

interface Report {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  zone_id: string;
  status: string;
  priority: string;
  vote_count: number;
  created_at: string;
  profiles?: { display_name: string } | null;
}

interface Vote {
  report_id: string;
}

const CATEGORIES = [
  { value: 'pothole', label: 'Pothole / Road Damage' },
  { value: 'traffic_signal', label: 'Traffic Signal Issue' },
  { value: 'flooding', label: 'Flooding / Waterlogging' },
  { value: 'streetlight', label: 'Streetlight Outage' },
  { value: 'garbage', label: 'Garbage / Waste' },
  { value: 'noise', label: 'Noise Pollution' },
  { value: 'encroachment', label: 'Encroachment' },
  { value: 'water_supply', label: 'Water Supply Issue' },
  { value: 'general', label: 'General / Other' },
];

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  open: { color: 'text-neon-orange', icon: AlertCircle, label: 'Open' },
  in_progress: { color: 'text-neon-cyan', icon: Clock, label: 'In Progress' },
  resolved: { color: 'text-neon-green', icon: CheckCircle2, label: 'Resolved' },
};

export default function CitizenReports() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [zoneId, setZoneId] = useState('z31');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('citizen_reports')
      .select('*, profiles(display_name)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReports(data as any);
    }

    if (user) {
      const { data: votes } = await supabase
        .from('report_votes')
        .select('report_id')
        .eq('user_id', user.id);
      if (votes) {
        setUserVotes(new Set(votes.map((v: Vote) => v.report_id)));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !description.trim()) return;
    setSubmitting(true);

    const zone = INDIAN_ZONES.find(z => z.id === zoneId);
    const { error } = await supabase.from('citizen_reports').insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      category,
      zone_id: zoneId,
      lat: zone?.lat,
      lng: zone?.lng,
      priority,
    });

    if (!error) {
      setTitle('');
      setDescription('');
      setCategory('general');
      setZoneId('z31');
      setPriority('medium');
      setShowForm(false);
      fetchReports();
    }
    setSubmitting(false);
  };

  const toggleVote = async (reportId: string) => {
    if (!user) return;
    if (userVotes.has(reportId)) {
      await supabase.from('report_votes').delete().eq('report_id', reportId).eq('user_id', user.id);
      setUserVotes(prev => { const n = new Set(prev); n.delete(reportId); return n; });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, vote_count: r.vote_count - 1 } : r));
    } else {
      await supabase.from('report_votes').insert({ report_id: reportId, user_id: user.id });
      setUserVotes(prev => new Set(prev).add(reportId));
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, vote_count: r.vote_count + 1 } : r));
    }
  };

  const filteredReports = reports.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <MessageSquarePlus className="w-5 h-5 text-primary" />
          <div>
            <h1 className="font-display text-lg tracking-wider text-primary text-glow-blue">CITIZEN REPORTS</h1>
            <p className="text-xs text-muted-foreground font-mono-tech">Submit, Vote & Track Issues</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono-tech flex items-center gap-1">
            <User className="w-3 h-3" /> {user?.email}
          </span>
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-mono-tech text-sm px-4 py-2 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" /> Report Issue
          </button>

          <div className="flex items-center gap-1 bg-secondary rounded-md p-1 ml-auto">
            <Filter className="w-3 h-3 text-muted-foreground ml-2" />
            {['all', 'open', 'in_progress', 'resolved'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-2 py-1 rounded text-xs font-mono-tech transition-colors ${filter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-secondary text-foreground text-xs font-mono-tech rounded-md px-2 py-1.5 border border-border"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Submit Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-4 space-y-3 border-glow">
                <h3 className="font-display text-sm tracking-wider text-primary">REPORT AN ISSUE</h3>

                <div>
                  <label className="text-xs text-muted-foreground font-mono-tech block mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Brief title of the issue"
                    required
                    maxLength={200}
                    className="w-full bg-secondary text-foreground text-sm font-mono-tech rounded-md px-3 py-2 border border-border focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-mono-tech block mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Detailed description of the problem..."
                    required
                    maxLength={1000}
                    rows={3}
                    className="w-full bg-secondary text-foreground text-sm font-mono-tech rounded-md px-3 py-2 border border-border focus:border-primary outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground font-mono-tech block mb-1">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-secondary text-foreground text-xs font-mono-tech rounded-md px-2 py-2 border border-border"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-mono-tech block mb-1">State/UT</label>
                    <select
                      value={zoneId}
                      onChange={e => setZoneId(e.target.value)}
                      className="w-full bg-secondary text-foreground text-xs font-mono-tech rounded-md px-2 py-2 border border-border"
                    >
                      {INDIAN_ZONES.map(z => (
                        <option key={z.id} value={z.id}>{z.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-mono-tech block mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value)}
                      className="w-full bg-secondary text-foreground text-xs font-mono-tech rounded-md px-2 py-2 border border-border"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-mono-tech text-sm px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="font-mono-tech text-2xl text-foreground">{reports.length}</div>
            <div className="text-xs text-muted-foreground font-mono-tech">Total Reports</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="font-mono-tech text-2xl text-neon-orange">{reports.filter(r => r.status === 'open').length}</div>
            <div className="text-xs text-muted-foreground font-mono-tech">Open Issues</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="font-mono-tech text-2xl text-neon-green">{reports.filter(r => r.status === 'resolved').length}</div>
            <div className="text-xs text-muted-foreground font-mono-tech">Resolved</div>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-mono-tech">
            No reports found. Be the first to report an issue!
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => {
              const statusConf = STATUS_CONFIG[report.status] || STATUS_CONFIG.open;
              const StatusIcon = statusConf.icon;
              const zoneName = INDIAN_ZONES.find(z => z.id === report.zone_id)?.name || report.zone_id;
              const hasVoted = userVotes.has(report.id);
              const categoryLabel = CATEGORIES.find(c => c.value === report.category)?.label || report.category;

              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-lg p-4 border-glow hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Vote button */}
                    <button
                      onClick={() => toggleVote(report.id)}
                      className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md transition-colors ${
                        hasVoted
                          ? 'bg-primary/20 text-primary'
                          : 'bg-secondary text-muted-foreground hover:text-primary'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${hasVoted ? 'fill-current' : ''}`} />
                      <span className="text-xs font-mono-tech">{report.vote_count}</span>
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-mono-tech text-sm text-foreground truncate">{report.title}</h3>
                        <span className={`flex items-center gap-1 text-xs font-mono-tech ${statusConf.color}`}>
                          <StatusIcon className="w-3 h-3" /> {statusConf.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{report.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono-tech">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {zoneName}
                        </span>
                        <span className="bg-secondary px-1.5 py-0.5 rounded">{categoryLabel}</span>
                        <span className={`px-1.5 py-0.5 rounded ${
                          report.priority === 'high' ? 'bg-neon-red/10 text-neon-red' :
                          report.priority === 'medium' ? 'bg-neon-orange/10 text-neon-orange' :
                          'bg-secondary'
                        }`}>
                          {report.priority}
                        </span>
                        <span>by {(report.profiles as any)?.display_name || 'Anonymous'}</span>
                        <span>{new Date(report.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
