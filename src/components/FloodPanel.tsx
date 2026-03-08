import { motion } from 'framer-motion';
import type { FloodData } from '@/lib/simulation';
import { Droplets, Mountain, AlertTriangle } from 'lucide-react';

interface FloodPanelProps {
  flood: FloodData[];
  history: { time: string; value: number }[];
}

export default function FloodPanel({ flood, history }: FloodPanelProps) {
  const highRisk = flood.filter(f => f.riskLevel > 0.5);
  const avgRainfall = flood.length ? flood.reduce((s, f) => s + f.rainfall, 0) / flood.length : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4 border-glow">
      <div className="flex items-center gap-2">
        <Droplets className="w-5 h-5 text-neon-cyan" />
        <h3 className="font-display text-sm tracking-wider text-neon-cyan text-glow-cyan">FLOOD RISK</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-secondary rounded-md p-3 text-center">
          <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-neon-orange" />
          <div className="font-mono-tech text-lg text-foreground">{highRisk.length}</div>
          <div className="text-xs text-muted-foreground">High Risk Zones</div>
        </div>
        <div className="bg-secondary rounded-md p-3 text-center">
          <Droplets className="w-4 h-4 mx-auto mb-1 text-neon-cyan" />
          <div className="font-mono-tech text-lg text-foreground">{avgRainfall.toFixed(0)}</div>
          <div className="text-xs text-muted-foreground">mm/hr Avg</div>
        </div>
        <div className="bg-secondary rounded-md p-3 text-center">
          <Mountain className="w-4 h-4 mx-auto mb-1 text-neon-green" />
          <div className="font-mono-tech text-lg text-foreground">{flood.filter(f => f.riskLevel < 0.3).length}</div>
          <div className="text-xs text-muted-foreground">Safe Zones</div>
        </div>
      </div>

      <div className="h-16 flex items-end gap-[2px]">
        {history.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-sm bg-neon-cyan"
            style={{ opacity: 0.3 + (h.value / 100) * 0.7 }}
            animate={{ height: `${h.value}%` }}
            transition={{ duration: 0.5, delay: i * 0.02 }}
          />
        ))}
      </div>
      <div className="text-xs text-muted-foreground font-mono-tech">24h Rainfall Trend</div>
      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] font-mono-tech">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-neon-green flex-shrink-0" />
          <span className="text-muted-foreground">Safe</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-neon-orange flex-shrink-0" />
          <span className="text-neon-orange">Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-neon-red flex-shrink-0" />
          <span className="text-neon-red">Critical</span>
        </div>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin pr-1">
        {flood.sort((a, b) => b.riskLevel - a.riskLevel).slice(0, 12).map(f => (
          <div key={f.zoneId} className="flex items-center justify-between text-sm">
            <span className="font-mono-tech text-muted-foreground truncate flex-1 mr-2">{f.zoneName}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-muted-foreground w-12 text-right">{f.rainfall.toFixed(0)}mm</span>
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${f.riskLevel > 0.7 ? 'bg-neon-red animate-pulse-neon' : f.riskLevel > 0.4 ? 'bg-neon-orange' : 'bg-neon-green'}`} />
            </div>
          </div>
        ))}
        {flood.length > 12 && (
          <div className="text-[10px] text-muted-foreground font-mono-tech text-center pt-1">
            +{flood.length - 12} more zones
          </div>
        )}
      </div>
    </div>
  );
}
