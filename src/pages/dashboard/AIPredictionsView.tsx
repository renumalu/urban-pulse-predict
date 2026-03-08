import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, Minus, RefreshCw, Zap, Clock, Target, AlertTriangle, Droplets, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Prediction {
  zone_id: string;
  zone_name?: string;
  current_congestion: number;
  predicted_30min: number;
  predicted_60min: number;
  predicted_120min: number;
  trend: string;
  confidence: number;
  factors: string[] | null;
}

export default function AIPredictionsView() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const { data: predData, error: predError } = await supabase
        .from('traffic_predictions')
        .select('*')
        .order('current_congestion', { ascending: false })
        .limit(36);

      if (predError) throw predError;

      const { data: zonesData } = await supabase
        .from('city_zones')
        .select('zone_id, name');

      const zoneMap = new Map(zonesData?.map(z => [z.zone_id, z.name]) || []);

      const merged = (predData || []).map(p => ({
        ...p,
        zone_name: zoneMap.get(p.zone_id) || p.zone_id,
      }));

      setPredictions(merged);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 60000);
    return () => clearInterval(interval);
  }, []);

  const avgConfidence = predictions.length
    ? Math.round(predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length)
    : 0;
  const risingCount = predictions.filter(p => p.trend === 'rising').length;
  const fallingCount = predictions.filter(p => p.trend === 'falling').length;
  const criticalCount = predictions.filter(p => p.predicted_60min > 0.7).length;

  const getTrendIcon = (trend: string) => {
    if (trend === 'rising') return <TrendingUp className="w-4 h-4 text-neon-red" />;
    if (trend === 'falling') return <TrendingDown className="w-4 h-4 text-neon-green" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusColor = (value: number) => {
    if (value > 0.7) return 'text-neon-red';
    if (value > 0.4) return 'text-neon-orange';
    return 'text-neon-green';
  };

  const getStatusDot = (value: number) => {
    if (value > 0.7) return 'bg-neon-red';
    if (value > 0.4) return 'bg-neon-orange';
    return 'bg-neon-green';
  };

  return (
    <div className="h-full p-4 overflow-y-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-neon-purple" />
          </div>
          <div>
            <h2 className="font-display text-lg tracking-wider text-neon-purple">AI PREDICTIONS</h2>
            <p className="text-xs text-muted-foreground font-mono-tech">
              Powered by Gemini Flash • Real-time traffic forecasting
            </p>
          </div>
        </div>
        <button
          onClick={fetchPredictions}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-xs font-mono-tech">Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-lg p-4 border-glow"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-neon-cyan" />
            <span className="text-xs text-muted-foreground font-mono-tech">AVG CONFIDENCE</span>
          </div>
          <div className="font-mono-tech text-2xl text-foreground">{avgConfidence}%</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-lg p-4 border-glow"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-neon-red" />
            <span className="text-xs text-muted-foreground font-mono-tech">RISING TREND</span>
          </div>
          <div className="font-mono-tech text-2xl text-neon-red">{risingCount}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-lg p-4 border-glow"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-neon-green" />
            <span className="text-xs text-muted-foreground font-mono-tech">FALLING TREND</span>
          </div>
          <div className="font-mono-tech text-2xl text-neon-green">{fallingCount}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-lg p-4 border-glow"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-neon-orange" />
            <span className="text-xs text-muted-foreground font-mono-tech">CRITICAL IN 60M</span>
          </div>
          <div className="font-mono-tech text-2xl text-neon-orange">{criticalCount}</div>
        </motion.div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-[11px] font-mono-tech">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-neon-green flex-shrink-0" />
          <span className="text-muted-foreground">Low (&lt;40%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-neon-orange flex-shrink-0" />
          <span className="text-neon-orange">Medium (40-70%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-neon-red flex-shrink-0" />
          <span className="text-neon-red">High (&gt;70%)</span>
        </div>
      </div>

      {/* Predictions Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-lg overflow-hidden border-glow"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-display text-xs tracking-wider text-muted-foreground">ZONE</th>
                <th className="text-center px-4 py-3 font-display text-xs tracking-wider text-muted-foreground">CURRENT</th>
                <th className="text-center px-4 py-3 font-display text-xs tracking-wider text-muted-foreground">+30M</th>
                <th className="text-center px-4 py-3 font-display text-xs tracking-wider text-muted-foreground">+60M</th>
                <th className="text-center px-4 py-3 font-display text-xs tracking-wider text-muted-foreground">+120M</th>
                <th className="text-center px-4 py-3 font-display text-xs tracking-wider text-muted-foreground">TREND</th>
                <th className="text-center px-4 py-3 font-display text-xs tracking-wider text-muted-foreground">CONFIDENCE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground font-mono-tech">
                    <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin" />
                    Loading predictions...
                  </td>
                </tr>
              ) : predictions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground font-mono-tech">
                    No predictions available
                  </td>
                </tr>
              ) : (
                predictions.map((p, i) => (
                  <motion.tr
                    key={p.zone_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusDot(p.current_congestion)}`} />
                        <span className="font-mono-tech text-foreground truncate max-w-[180px]">{p.zone_name}</span>
                      </div>
                    </td>
                    <td className={`text-center px-4 py-3 font-mono-tech ${getStatusColor(p.current_congestion)}`}>
                      {Math.round(p.current_congestion * 100)}%
                    </td>
                    <td className={`text-center px-4 py-3 font-mono-tech ${getStatusColor(p.predicted_30min)}`}>
                      {Math.round(p.predicted_30min * 100)}%
                    </td>
                    <td className={`text-center px-4 py-3 font-mono-tech ${getStatusColor(p.predicted_60min)}`}>
                      {Math.round(p.predicted_60min * 100)}%
                    </td>
                    <td className={`text-center px-4 py-3 font-mono-tech ${getStatusColor(p.predicted_120min)}`}>
                      {Math.round(p.predicted_120min * 100)}%
                    </td>
                    <td className="text-center px-4 py-3">
                      <div className="flex items-center justify-center">
                        {getTrendIcon(p.trend)}
                      </div>
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className={`font-mono-tech ${p.confidence > 80 ? 'text-neon-green' : p.confidence > 60 ? 'text-neon-cyan' : 'text-muted-foreground'}`}>
                        {Math.round(p.confidence)}%
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Last updated */}
      {lastUpdated && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-mono-tech">
          <Clock className="w-3 h-3" />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
