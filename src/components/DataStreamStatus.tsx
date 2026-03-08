import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radio, Wifi, Server, Satellite, Signal, Activity, Shield, CheckCircle2 } from 'lucide-react';

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

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setStreams([
        {
          id: 'traffic-iot',
          name: 'Traffic Sensors',
          icon: Signal,
          status: 'active',
          latency: Math.round(20 + Math.random() * 80),
          lastUpdate: new Date(now.getTime() - Math.random() * 5000).toLocaleTimeString(),
        },
        {
          id: 'weather-api',
          name: 'Weather API',
          icon: Satellite,
          status: 'active',
          latency: Math.round(100 + Math.random() * 200),
          lastUpdate: new Date(now.getTime() - Math.random() * 30000).toLocaleTimeString(),
        },
        {
          id: 'gis-maps',
          name: 'GIS / Map Data',
          icon: Activity,
          status: 'active',
          latency: Math.round(10 + Math.random() * 40),
          lastUpdate: new Date(now.getTime() - Math.random() * 2000).toLocaleTimeString(),
        },
        {
          id: 'incident-feed',
          name: 'Incident Reports',
          icon: Shield,
          status: Math.random() > 0.1 ? 'active' : 'idle',
          latency: Math.round(50 + Math.random() * 150),
          lastUpdate: new Date(now.getTime() - Math.random() * 60000).toLocaleTimeString(),
        },
        {
          id: 'emergency-gps',
          name: 'Emergency GPS',
          icon: Radio,
          status: 'active',
          latency: Math.round(5 + Math.random() * 30),
          lastUpdate: new Date(now.getTime() - Math.random() * 3000).toLocaleTimeString(),
        },
        {
          id: 'cloud-backend',
          name: 'Cloud Backend',
          icon: Server,
          status: 'active',
          latency: Math.round(30 + Math.random() * 70),
          lastUpdate: new Date(now.getTime() - Math.random() * 1000).toLocaleTimeString(),
        },
      ]);
    };

    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
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
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-neon-green" />
          <span className="text-[10px] font-mono-tech text-neon-green">{activeCount}/{streams.length} LIVE</span>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-3 text-[10px] font-mono-tech text-muted-foreground">
        <span>Avg Latency: <span className="text-foreground">{avgLatency}ms</span></span>
        <span>•</span>
        <span>Uptime: <span className="text-neon-green">99.7%</span></span>
      </div>

      {/* Stream list */}
      <div className="space-y-1.5">
        {streams.map((stream, i) => (
          <motion.div
            key={stream.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between py-1"
          >
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${
                stream.status === 'active' ? 'bg-neon-green animate-pulse' : 
                stream.status === 'idle' ? 'bg-neon-orange' : 'bg-neon-red'
              }`} />
              <stream.icon className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-mono-tech text-foreground">{stream.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono-tech text-muted-foreground">{stream.latency}ms</span>
              <span className="text-[10px] font-mono-tech text-muted-foreground">{stream.lastUpdate}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
