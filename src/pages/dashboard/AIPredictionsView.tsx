import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, Minus, RefreshCw, Clock, Radio, ArrowUp, MapPin, CloudRain, AlertTriangle, Droplets } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { INDIAN_ZONES, getZoneName, ZONE_MAP } from '@/lib/india-zones';

interface Prediction {
  zone_id: string;
  zone_name: string;
  capital: string;
  current_congestion: number;
  predicted_30min: number;
  predicted_60min: number;
  predicted_120min: number;
  trend: string;
  confidence: number;
  factors: string[] | null;
}

interface WeatherData {
  zone_id: string;
  rainfall: number;
  humidity: number | null;
  temperature: number | null;
}

type FloodRisk = 'extreme' | 'high' | 'moderate' | 'low';

export default function AIPredictionsView() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [weatherMap, setWeatherMap] = useState<Record<string, WeatherData>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);

  const mapPrediction = useCallback((p: any): Prediction => {
    const zone = ZONE_MAP[p.zone_id];
    return {
      ...p,
      zone_name: zone?.name || getZoneName(p.zone_id),
      capital: zone?.capital || '',
    };
  }, []);

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    try {
      const [predResult, weatherResult] = await Promise.all([
        supabase
          .from('traffic_predictions')
          .select('*')
          .order('current_congestion', { ascending: false })
          .limit(36),
        supabase
          .from('weather_data')
          .select('zone_id, rainfall, humidity, temperature')
          .order('recorded_at', { ascending: false })
          .limit(36)
      ]);

      if (predResult.error) throw predResult.error;

      // Build weather lookup map
      const wMap: Record<string, WeatherData> = {};
      (weatherResult.data || []).forEach(w => {
        if (!wMap[w.zone_id]) wMap[w.zone_id] = w;
      });
      setWeatherMap(wMap);

      setPredictions((predResult.data || []).map(mapPrediction));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
      toast.error('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  }, [mapPrediction]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('predictions-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'traffic_predictions' }, (payload) => {
        const n = payload.new as any;
        setPredictions(prev => {
          const mapped = mapPrediction(n);
          const updated = prev.find(p => p.zone_id === n.zone_id)
            ? prev.map(p => p.zone_id === n.zone_id ? mapped : p)
            : [...prev, mapped];
          return updated.sort((a, b) => b.current_congestion - a.current_congestion).slice(0, 36);
        });
        setLastUpdated(new Date());
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'weather_data' }, (payload) => {
        const w = payload.new as WeatherData;
        setWeatherMap(prev => ({ ...prev, [w.zone_id]: w }));
      })
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') toast.success('Live predictions connected', { duration: 2000 });
      });
    return () => { supabase.removeChannel(channel); };
  }, [mapPrediction]);

  // Calculate flood risk based on rainfall
  const getFloodRisk = (rainfall: number): { level: FloodRisk; label: string; color: string; bgColor: string } => {
    if (rainfall >= 50) return { level: 'extreme', label: 'EXTREME', color: 'text-red-400', bgColor: 'bg-red-500/20' };
    if (rainfall >= 30) return { level: 'high', label: 'HIGH', color: 'text-neon-orange', bgColor: 'bg-neon-orange/20' };
    if (rainfall >= 15) return { level: 'moderate', label: 'MODERATE', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
    return { level: 'low', label: 'LOW', color: 'text-neon-green', bgColor: 'bg-neon-green/20' };
  };

  const avgCurrent = predictions.length ? Math.round(predictions.reduce((s, p) => s + p.current_congestion, 0) / predictions.length * 100) : 0;
  const avg1h = predictions.length ? Math.round(predictions.reduce((s, p) => s + p.predicted_60min, 0) / predictions.length * 100) : 0;
  const criticalCount = predictions.filter(p => p.predicted_60min > 0.7).length;
  
  // Count monsoon alerts
  const monsoonAlerts = Object.values(weatherMap).filter(w => w.rainfall >= 30).length;

  const getTrendLabel = (trend: string) => {
    if (trend === 'rising' || trend === 'increasing') return { label: 'Rising', icon: <TrendingUp className="w-4 h-4" />, color: 'text-neon-red' };
    if (trend === 'falling' || trend === 'decreasing' || trend === 'clearing') return { label: 'Falling', icon: <TrendingDown className="w-4 h-4" />, color: 'text-neon-green' };
    if (trend === 'peak') return { label: 'Peak', icon: <ArrowUp className="w-4 h-4" />, color: 'text-neon-orange' };
    return { label: 'Stable', icon: <Minus className="w-4 h-4" />, color: 'text-muted-foreground' };
  };

  const getBarColor = (value: number) => {
    if (value > 0.7) return 'bg-neon-red';
    if (value > 0.4) return 'bg-neon-orange';
    return 'bg-neon-green';
  };

  return (
    <div className="h-full p-4 overflow-y-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-neon-purple" />
          <h2 className="font-display text-base tracking-wider text-neon-purple">AI PREDICTIONS</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Radio className={`w-3 h-3 ${isLive ? 'text-neon-green animate-pulse' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-mono-tech ${isLive ? 'text-neon-green' : 'text-muted-foreground'}`}>
              {isLive ? 'LIVE' : '...'}
            </span>
          </div>
          <button
            onClick={fetchPredictions}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-neon-green/10 text-neon-green hover:bg-neon-green/20 transition-colors disabled:opacity-50 text-xs font-mono-tech"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Generate
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { value: `${avgCurrent}%`, label: 'Current', color: 'text-neon-cyan', icon: null },
          { value: `${avg1h}%`, label: '1h Pred', color: 'text-neon-purple', icon: null },
          { value: `${criticalCount}`, label: 'Critical', color: 'text-neon-red', icon: null },
          { value: `${monsoonAlerts}`, label: 'Flood Risk', color: monsoonAlerts > 0 ? 'text-neon-orange' : 'text-neon-green', icon: <CloudRain className="w-3 h-3" /> },
        ].map((s, i) => (
          <div key={i} className="bg-secondary rounded-lg p-2.5 text-center">
            <div className={`font-mono-tech text-lg ${s.color} flex items-center justify-center gap-1`}>
              {s.icon}
              {s.value}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono-tech">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Monsoon Alert Banner */}
      {monsoonAlerts > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neon-orange/10 border border-neon-orange/30 rounded-lg p-3 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-neon-orange flex-shrink-0" />
          <div className="flex-1">
            <span className="font-display text-xs text-neon-orange">MONSOON ALERT</span>
            <p className="text-[11px] text-muted-foreground font-mono-tech">
              {monsoonAlerts} state{monsoonAlerts > 1 ? 's' : ''} experiencing heavy rainfall — increased flood risk
            </p>
          </div>
        </motion.div>
      )}

      {/* Prediction Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-6 h-6 mx-auto mb-3 animate-spin text-neon-purple" />
            <p className="text-sm text-muted-foreground font-mono-tech">Loading predictions...</p>
          </div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-mono-tech text-sm">
            No predictions available yet
          </div>
        ) : (
          predictions.map((p, i) => {
            const trend = getTrendLabel(p.trend);
            const uniqueKey = `${p.zone_id}-${i}`;
            const weather = weatherMap[p.zone_id];
            const rainfall = weather?.rainfall ?? 0;
            const floodRisk = getFloodRisk(rainfall);
            const bars = [
              { label: 'Now', value: p.current_congestion },
              { label: '30m', value: p.predicted_30min },
              { label: '1h', value: p.predicted_60min },
              { label: '2h', value: p.predicted_120min },
            ];
            return (
              <motion.div
                key={uniqueKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`bg-card border rounded-lg p-3.5 space-y-2.5 ${
                  floodRisk.level === 'extreme' ? 'border-red-500/50' :
                  floodRisk.level === 'high' ? 'border-neon-orange/50' :
                  'border-border'
                }`}
              >
                {/* Zone name + capital + trend + flood risk */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-display text-sm tracking-wide text-foreground">{p.zone_name}</span>
                    {p.capital && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono-tech">
                        <MapPin className="w-2.5 h-2.5" />
                        {p.capital}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Flood Risk Badge */}
                    {rainfall > 0 && (
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${floodRisk.bgColor}`}>
                        <Droplets className={`w-3 h-3 ${floodRisk.color}`} />
                        <span className={`text-[10px] font-mono-tech ${floodRisk.color}`}>
                          {Math.round(rainfall)}mm
                        </span>
                      </div>
                    )}
                    <div className={`flex items-center gap-1 ${trend.color}`}>
                      {trend.icon}
                      <span className="text-xs font-mono-tech">{trend.label}</span>
                    </div>
                  </div>
                </div>

                {/* Flood Risk Indicator Bar */}
                {rainfall >= 15 && (
                  <div className="flex items-center gap-2 py-1">
                    <CloudRain className={`w-3.5 h-3.5 ${floodRisk.color}`} />
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          floodRisk.level === 'extreme' ? 'bg-red-500' :
                          floodRisk.level === 'high' ? 'bg-neon-orange' :
                          'bg-yellow-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (rainfall / 60) * 100)}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                    <span className={`text-[10px] font-mono-tech ${floodRisk.color}`}>
                      {floodRisk.label} RISK
                    </span>
                  </div>
                )}

                {/* Congestion bars */}
                <div className="grid grid-cols-4 gap-2">
                  {bars.map(b => (
                    <div key={b.label} className="space-y-1">
                      <div className="text-[10px] text-muted-foreground font-mono-tech text-center">{b.label}</div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${getBarColor(b.value)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(b.value * 100)}%` }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                        />
                      </div>
                      <div className={`text-[10px] font-mono-tech text-center ${b.value > 0.7 ? 'text-neon-red' : b.value > 0.4 ? 'text-neon-orange' : 'text-neon-green'}`}>
                        {Math.round(b.value * 100)}%
                      </div>
                    </div>
                  ))}
                </div>

                {/* Factors + confidence */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {rainfall >= 15 && (
                      <span className={`text-[10px] font-mono-tech px-2 py-0.5 rounded ${floodRisk.bgColor} ${floodRisk.color}`}>
                        monsoon
                      </span>
                    )}
                    {(p.factors || []).slice(0, 2).map(f => (
                      <span key={f} className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                        {f.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                  <span className={`text-[10px] font-mono-tech flex-shrink-0 ${p.confidence > 80 ? 'text-neon-green' : 'text-muted-foreground'}`}>
                    {Math.round(p.confidence)}% conf
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Last updated */}
      {lastUpdated && (
        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-mono-tech pb-2">
          <Clock className="w-3 h-3" />
          Updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
