import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Radio, Wifi, Server, Satellite, Signal, Activity, Shield, CheckCircle2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DataStream {
  id: string;
  name: string;
  icon: typeof Radio;
  status: 'active' | 'idle' | 'error';
  latency: number;
  lastUpdate: string;
}

export default function DataStreamStatus() {
  const [streams, setStreams] = useState<DataStream[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  const fetchStreams = async () => {
    setRefreshing(true);
    try {
      const fmt = (iso: string | null) => iso ? new Date(iso).toLocaleTimeString() : 'N/A';

      const measure = async (fn: () => PromiseLike<{ data: any[] | null; error: any }>): Promise<{ latency: number; count: number; data: any[] }> => {
        const start = performance.now();
        const { data, error } = await fn();
        return { latency: Math.round(performance.now() - start), count: error ? 0 : (data?.length || 0), data: data || [] };
      };

      const [traffic, weather, accidents, alerts, emergency, zones] = await Promise.all([
        measure(() => supabase.from('traffic_data').select('*').order('recorded_at', { ascending: false }).limit(1) as any),
        measure(() => supabase.from('weather_data').select('*').order('recorded_at', { ascending: false }).limit(1) as any),
        measure(() => supabase.from('accident_data').select('*').order('reported_at', { ascending: false }).limit(1) as any),
        measure(() => supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(1) as any),
        measure(() => supabase.from('emergency_units').select('*').order('updated_at', { ascending: false }).limit(1) as any),
        measure(() => supabase.from('city_zones').select('*').order('created_at', { ascending: false }).limit(1) as any),
      ]);

      if (!mountedRef.current) return;

      const getTime = (data: any[]): string | null => {
        const row = data[0];
        if (!row) return null;
        return row.recorded_at || row.created_at || row.reported_at || row.updated_at || null;
      };

      setStreams([
        { id: 'traffic-data', name: 'Traffic Sensors', icon: Signal, status: traffic.count > 0 ? 'active' : 'error', latency: traffic.latency, lastUpdate: fmt(getTime(traffic.data)) },
        { id: 'weather-api', name: 'Weather API', icon: Satellite, status: weather.count > 0 ? 'active' : 'idle', latency: weather.latency, lastUpdate: fmt(getTime(weather.data)) },
        { id: 'incident-feed', name: 'Accident Reports', icon: Shield, status: accidents.count > 0 ? 'active' : 'idle', latency: accidents.latency, lastUpdate: fmt(getTime(accidents.data)) },
        { id: 'alerts-stream', name: 'Alert System', icon: Activity, status: alerts.count > 0 ? 'active' : 'idle', latency: alerts.latency, lastUpdate: fmt(getTime(alerts.data)) },
        { id: 'emergency-gps', name: 'Emergency GPS', icon: Radio, status: emergency.count > 0 ? 'active' : 'idle', latency: emergency.latency, lastUpdate: fmt(getTime(emergency.data)) },
        { id: 'cloud-backend', name: 'Cloud Backend', icon: Server, status: zones.count > 0 ? 'active' : 'error', latency: zones.latency, lastUpdate: fmt(getTime(zones.data)) },
      ]);
    } catch {
      console.warn('Failed to fetch data streams');
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchStreams();
    const interval = setInterval(fetchStreams, 10000);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, []);

  const activeCount = streams.filter(s => s.status === 'active').length;
  const avgLatency = streams.length ? Math.round(streams.reduce((s, st) => s + st.latency, 0) / streams.length) : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3 border-glow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="w-5 h-5 text-neon-cyan" />
          <h3 className="font-display text-sm tracking-wider text-neon-cyan">DATA STREAMS</h3>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchStreams} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Refresh now">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-neon-green" />
            <span className="text-[10px] font-mono-tech text-neon-green">{activeCount}/{streams.length} LIVE</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] font-mono-tech text-muted-foreground">
        <span>Avg Latency: <span className={avgLatency < 200 ? 'text-neon-green' : avgLatency < 500 ? 'text-neon-orange' : 'text-neon-red'}>{avgLatency}ms</span></span>
        <span>•</span>
        <span>Refresh: <span className="text-foreground">10s</span></span>
      </div>

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
              <div className={`w-2 h-2 rounded-full ${stream.status === 'active' ? 'bg-neon-green animate-pulse' : stream.status === 'idle' ? 'bg-neon-orange' : 'bg-neon-red'}`} />
              <stream.icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-mono-tech text-foreground">{stream.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-[10px] font-mono-tech ${stream.latency < 100 ? 'text-neon-green' : stream.latency < 300 ? 'text-neon-orange' : 'text-neon-red'}`}>{stream.latency}ms</span>
              <span className="text-[10px] font-mono-tech text-muted-foreground w-20 text-right">{stream.lastUpdate}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
