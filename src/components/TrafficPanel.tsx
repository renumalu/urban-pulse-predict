import { motion } from 'framer-motion';
import type { TrafficData } from '@/lib/simulation';
import { Car, TrendingUp, Gauge } from 'lucide-react';

function CongestionBar({ level, label }: { level: number; label: string }) {
  const hue = 120 - level * 120;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-mono-tech text-muted-foreground w-32 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: `hsl(${hue}, 80%, 50%)` }}
          animate={{ width: `${level * 100}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
      <span className="font-mono-tech text-xs w-10 text-right" style={{ color: `hsl(${hue}, 80%, 60%)` }}>
        {Math.round(level * 100)}%
      </span>
    </div>
  );
}

interface TrafficPanelProps {
  traffic: TrafficData[];
  history: { time: string; value: number }[];
}

export default function TrafficPanel({ traffic, history }: TrafficPanelProps) {
  const avgCongestion = traffic.length ? traffic.reduce((s, t) => s + t.congestionLevel, 0) / traffic.length : 0;
  const totalVehicles = traffic.reduce((s, t) => s + t.vehicleCount, 0);
  const avgSpeed = traffic.length ? Math.round(traffic.reduce((s, t) => s + t.avgSpeed, 0) / traffic.length) : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4 border-glow">
      <div className="flex items-center gap-2">
        <Car className="w-5 h-5 text-primary" />
        <h3 className="font-display text-sm tracking-wider text-primary text-glow-blue">TRAFFIC MONITOR</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-secondary rounded-md p-3 text-center">
          <Gauge className="w-4 h-4 mx-auto mb-1 text-neon-cyan" />
          <div className="font-mono-tech text-lg text-foreground">{Math.round(avgCongestion * 100)}%</div>
          <div className="text-xs text-muted-foreground">Avg Congestion</div>
        </div>
        <div className="bg-secondary rounded-md p-3 text-center">
          <Car className="w-4 h-4 mx-auto mb-1 text-neon-blue" />
          <div className="font-mono-tech text-lg text-foreground">{totalVehicles.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Vehicles</div>
        </div>
        <div className="bg-secondary rounded-md p-3 text-center">
          <TrendingUp className="w-4 h-4 mx-auto mb-1 text-neon-green" />
          <div className="font-mono-tech text-lg text-foreground">{avgSpeed} km/h</div>
          <div className="text-xs text-muted-foreground">Avg Speed</div>
        </div>
      </div>

      {/* Mini chart */}
      <div className="h-16 flex items-end gap-[2px]">
        {history.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-sm bg-primary"
            style={{ opacity: 0.3 + (h.value / 100) * 0.7 }}
            animate={{ height: `${h.value}%` }}
            transition={{ duration: 0.5, delay: i * 0.02 }}
          />
        ))}
      </div>
      <div className="text-xs text-muted-foreground font-mono-tech">24h Congestion History</div>

      <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pr-1">
        {traffic.sort((a, b) => b.congestionLevel - a.congestionLevel).slice(0, 12).map(t => (
          <CongestionBar key={t.zoneId} label={t.zoneName} level={t.congestionLevel} />
        ))}
      </div>
      {traffic.length > 12 && (
        <div className="text-[10px] text-muted-foreground font-mono-tech text-center">
          +{traffic.length - 12} more zones
        </div>
      )}
    </div>
  );
}
