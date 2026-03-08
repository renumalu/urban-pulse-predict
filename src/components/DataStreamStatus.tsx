import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Radio, Wifi, Server, Satellite, Signal, Activity, Shield, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DataStream {
  id: string;
  name: string;
  icon: typeof Radio;
  status: 'active' | 'idle' | 'error';
  latency: number;
  lastUpdate: string;
  recordCount?: number;
}

async function measureQuery(
  table: string,
  select: string,
  limit: number
): Promise<{ latency: number; count: number; lastAt: string | null }> {
  const start = performance.now();
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .order('recorded_at' in {} ? 'recorded_at' : 'created_at', { ascending: false })
    .limit(limit);
  const latency = Math.round(performance.now() - start);

  if (error) return { latency, count: 0, lastAt: null };

  const rows = data || [];
  const lastRow = rows[0] as any;
  const lastAt = lastRow?.recorded_at || lastRow?.created_at || lastRow?.reported_at || lastRow?.updated_at || null;

  return { latency, count: rows.length, lastAt };
}

export default function DataStreamStatus() {
  const [streams, setStreams] = useState<DataStream[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  const fetchStreams = async () => {
    setRefreshing(true);
    try {
      const [traffic, weather, accidents, alerts, emergency, zones] = await Promise.all([
        measureQuery('traffic_data', '*', 1),
        measureQuery('weather_data', '*', 1),
        measureQuery('accident_data', '*', 1),
        measureQuery('alerts', '*', 1),
        measureQuery('emergency_units', '*', 1),
        measureQuery('city_zones', '*', 1),
      ]);

      if (!mountedRef.current) return;

      const fmt = (iso: string | null) =>
        iso ? new Date(iso).toLocaleTimeString() : 'N/A';

      setStreams([
        {
          id: 'traffic-data',
          name: 'Traffic Sensors',
          icon: Signal,
          status: traffic.count > 0 ? 'active' : 'error',
          latency: traffic.latency,
          lastUpdate: fmt(traffic.lastAt),
          recordCount: traffic.count,
        },
        {
          id: 'weather-api',
          name: 'Weather API',
          icon: Satellite,
          status: weather.count > 0 ? 'active' : 'idle',
          latency: weather.latency,
          lastUpdate: fmt(weather.lastAt),
          recordCount: weather.count,
        },
        {
          id: 'incident-feed',
          name: 'Accident Reports',
          icon: Shield,
          status: accidents.count > 0 ? 'active' : 'idle',
          latency: accidents.latency,
          lastUpdate: fmt(accidents.lastAt),
          recordCount: accidents.count,
        },
        {
          id: 'alerts-stream',
          name: 'Alert System',
          icon: Activity,
          status: alerts.count > 0 ? 'active' : 'idle',
          latency: alerts.latency,
          lastUpdate: fmt(alerts.lastAt),
          recordCount: alerts.count,
        },
        {
          id: 'emergency-gps',
          name: 'Emergency GPS',
          icon: Radio,
          status: emergency.count > 0 ? 'active' : 'idle',
          latency: emergency.latency,
          lastUpdate: fmt(emergency.lastAt),
          recordCount: emergency.count,
        },
        {
          id: 'cloud-backend',
          name: 'Cloud Backend',
          icon: Server,
          status: zones.count > 0 ? 'active' : 'error',
          latency: zones.latency,
          lastUpdate: fmt(zones.lastAt),
          recordCount: zones.count,
        },
      ]);
    } catch {
      // Keep existing streams on error
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchStreams();
    const interval = setInterval(fetchStreams, 10000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  const activeCount = streams.filter(s => s.status === 'active').length;
  const avgLatency = streams.length
    ? Math.round(streams.reduce((s, st) => s + st.latency, 0) / streams.length)
    : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3 border-glow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="w-5 h-5 text-neon-cyan" />
          <h3 className="font-display text-sm tracking-wider text-neon-cyan">DATA STREAMS</h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStreams}
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-neon-green" />
            <span className="text-[10px] font-mono-tech text-neon-green">{activeCount}/{streams.length} LIVE</span>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-3 text-[10px] font-mono-tech text-muted-foreground">
        <span>Avg Latency: <span className={avgLatency < 200 ? 'text-neon-green' : avgLatency < 500 ? 'text-neon-orange' : 'text-neon-red'}>{avgLatency}ms</span></span>
        <span>•</span>
        <span>Refresh: <span className="text-foreground">10s</span></span>
        <span>•</span>
        <span>Streams: <span className="text-foreground">{streams.length}</span></span>
      </div>

      {/* Stream list */}
      <div className="space-y-1.5">
        {streams.map((stream, i) => (
          <motion.div
            key={stream.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                stream.status === 'active' ? 'bg-neon-green animate-pulse' : 
                stream.status === 'idle' ? 'bg-neon-orange' : 'bg-neon-red'
              }`} />
              <stream.icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-mono-tech text-foreground">{stream.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-[10px] font-mono-tech ${
                stream.latency < 100 ? 'text-neon-green' : stream.latency < 300 ? 'text-neon-orange' : 'text-neon-red'
              }`}>{stream.latency}ms</span>
              <span className="text-[10px] font-mono-tech text-muted-foreground w-20 text-right">{stream.lastUpdate}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
