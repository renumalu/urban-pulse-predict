import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { INDIAN_ZONES } from '@/lib/india-zones';
import {
  Brain, TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown,
  Loader2, RefreshCw, ChevronDown, ChevronUp, Zap, CloudRain, Clock, Users
} from 'lucide-react';

interface Prediction {
  zone_id: string;
  current_congestion: number;
  predicted_30min: number;
  predicted_60min: number;
  predicted_120min: number;
  confidence: number;
  trend: string;
  factors: string[];
  created_at: string;
}

const TREND_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  increasing: { icon: TrendingUp, color: 'text-neon-red', label: 'Rising' },
  decreasing: { icon: TrendingDown, color: 'text-neon-green', label: 'Falling' },
  stable: { icon: Minus, color: 'text-neon-cyan', label: 'Stable' },
  peak: { icon: ArrowUp, color: 'text-neon-red', label: 'Peak' },
  clearing: { icon: ArrowDown, color: 'text-neon-green', label: 'Clearing' },
};

const FACTOR_ICONS: Record<string, any> = {
  rush_hour: Clock,
  rain: CloudRain,
  high_density: Users,
  weekend: Zap,
};

function MiniPredictionChart({ current, p30, p60, p120 }: { current: number; p30: number; p60: number; p120: number }) {
  const points = [
    { t: 'Now', v: current },
    { t: '30m', v: p30 },
    { t: '1h', v: p60 },
    { t: '2h', v: p120 },
  ];
  const maxV = Math.max(...points.map(p => p.v), 0.01);

  return (
    <div className="flex items-end gap-1 h-10">
      {points.map((p, i) => {
        const hue = 120 - (p.v * 120);
        return (
          <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
            <motion.div
              className="w-full rounded-t-sm"
              style={{ backgroundColor: `hsl(${hue}, 80%, 50%)` }}
              initial={{ height: 0 }}
              animate={{ height: `${(p.v / maxV) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            />
            <span className="text-[9px] text-muted-foreground font-mono-tech">{p.t}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function TrafficPredictionPanel() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [error, setError] = useState('');

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('traffic_predictions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(36);

    if (!error && data && data.length > 0) {
      // Deduplicate by zone_id (keep latest)
      const seen = new Set<string>();
      const deduped: Prediction[] = [];
      for (const d of data) {
        if (!seen.has(d.zone_id)) {
          seen.add(d.zone_id);
          deduped.push(d as Prediction);
        }
      }
      setPredictions(deduped);
      setLastUpdated(new Date(data[0].created_at).toLocaleTimeString('en-IN'));
    }
    setLoading(false);
  }, []);

  const generatePredictions = async () => {
    setGenerating(true);
    setError('');
    try {
      const { data, error } = await supabase.functions.invoke('traffic-predict');
      if (error) throw error;
      if (data?.error) {
        setError(data.error);
      } else {
        await fetchPredictions();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate predictions');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('predictions-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'traffic_predictions' }, () => {
        fetchPredictions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPredictions]);

  const sortedPredictions = [...predictions].sort((a, b) => b.predicted_60min - a.predicted_60min);
  const displayPredictions = expanded ? sortedPredictions : sortedPredictions.slice(0, 8);

  const avgCurrent = predictions.length ? predictions.reduce((s, p) => s + p.current_congestion, 0) / predictions.length : 0;
  const avgPredicted = predictions.length ? predictions.reduce((s, p) => s + p.predicted_60min, 0) / predictions.length : 0;
  const avgConfidence = predictions.length ? predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length : 0;
  const criticalZones = predictions.filter(p => p.predicted_60min > 0.7).length;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3 border-glow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-neon-purple" />
          <h3 className="font-display text-sm tracking-wider text-neon-purple">AI PREDICTIONS</h3>
        </div>
        <button
          onClick={generatePredictions}
          disabled={generating}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono-tech bg-neon-purple/10 text-neon-purple hover:bg-neon-purple/20 transition-colors disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {generating ? 'Analyzing...' : 'Generate'}
        </button>
      </div>

      {error && (
        <div className="text-xs text-destructive font-mono-tech bg-destructive/10 border border-destructive/20 rounded p-2">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-secondary rounded-md p-2 text-center">
          <div className="font-mono-tech text-sm text-foreground">{Math.round(avgCurrent * 100)}%</div>
          <div className="text-[10px] text-muted-foreground">Current</div>
        </div>
        <div className="bg-secondary rounded-md p-2 text-center">
          <div className="font-mono-tech text-sm text-foreground">{Math.round(avgPredicted * 100)}%</div>
          <div className="text-[10px] text-muted-foreground">1h Pred</div>
        </div>
        <div className="bg-secondary rounded-md p-2 text-center">
          <div className="font-mono-tech text-sm text-neon-red">{criticalZones}</div>
          <div className="text-[10px] text-muted-foreground">Critical</div>
        </div>
        <div className="bg-secondary rounded-md p-2 text-center">
          <div className="font-mono-tech text-sm text-neon-green">{Math.round(avgConfidence * 100)}%</div>
          <div className="text-[10px] text-muted-foreground">Confidence</div>
        </div>
      </div>

      {/* Prediction List */}
      {loading && predictions.length === 0 ? (
        <div className="text-center py-4">
          <Loader2 className="w-4 h-4 animate-spin mx-auto text-primary" />
        </div>
      ) : predictions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3 font-mono-tech">
          Click "Generate" to create AI predictions
        </p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {displayPredictions.map((p) => {
              const zone = INDIAN_ZONES.find(z => z.id === p.zone_id);
              const trendConf = TREND_CONFIG[p.trend] || TREND_CONFIG.stable;
              const TrendIcon = trendConf.icon;

              return (
                <motion.div
                  key={p.zone_id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-secondary rounded-md p-2 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tech text-xs text-foreground truncate flex-1">
                      {zone?.name || p.zone_id}
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] font-mono-tech ${trendConf.color}`}>
                      <TrendIcon className="w-3 h-3" /> {trendConf.label}
                    </span>
                  </div>

                  <MiniPredictionChart
                    current={p.current_congestion}
                    p30={p.predicted_30min}
                    p60={p.predicted_60min}
                    p120={p.predicted_120min}
                  />

                  <div className="flex items-center gap-1 flex-wrap">
                    {p.factors?.slice(0, 3).map((f, i) => {
                      const FIcon = FACTOR_ICONS[f];
                      return (
                        <span key={i} className="flex items-center gap-0.5 text-[9px] text-muted-foreground bg-background/50 px-1 py-0.5 rounded">
                          {FIcon && <FIcon className="w-2.5 h-2.5" />} {f.replace('_', ' ')}
                        </span>
                      );
                    })}
                    <span className="text-[9px] text-muted-foreground ml-auto font-mono-tech">
                      {Math.round(p.confidence * 100)}% conf
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {sortedPredictions.length > 8 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1 text-xs font-mono-tech text-muted-foreground hover:text-foreground py-1"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Show less' : `Show all ${sortedPredictions.length} zones`}
            </button>
          )}
        </div>
      )}

      {lastUpdated && (
        <div className="text-[10px] text-muted-foreground font-mono-tech text-right">
          Last updated: {lastUpdated}
        </div>
      )}
    </div>
  );
}
