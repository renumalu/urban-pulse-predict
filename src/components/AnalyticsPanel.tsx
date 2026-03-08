import { motion } from 'framer-motion';
import { Activity, Clock, Zap, Download, FileSpreadsheet } from 'lucide-react';
import type { TrafficData, FloodData, AccidentData } from '@/lib/simulation';
import { exportTrafficCSV, exportFloodCSV, exportAccidentsCSV, exportFullReport } from '@/lib/csv-export';

interface AnalyticsPanelProps {
  traffic: TrafficData[];
  flood: FloodData[];
  accidents: AccidentData[];
}

export default function AnalyticsPanel({ traffic, flood, accidents }: AnalyticsPanelProps) {
  const topCongested = [...traffic].sort((a, b) => b.congestionLevel - a.congestionLevel).slice(0, 5);
  const floodProne = [...flood].sort((a, b) => b.riskLevel - a.riskLevel).slice(0, 5);
  const highAccidents = accidents.filter(a => a.severity === 'high').length;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4 border-glow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-neon-purple" />
          <h3 className="font-display text-sm tracking-wider text-neon-purple">ANALYTICS</h3>
        </div>
        <button
          onClick={() => exportFullReport(traffic, flood, accidents)}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono-tech bg-neon-purple/10 text-neon-purple hover:bg-neon-purple/20 transition-colors"
          title="Export full city report as CSV"
        >
          <Download className="w-3 h-3" /> Export
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-secondary rounded-md p-3 text-center">
          <Clock className="w-4 h-4 mx-auto mb-1 text-neon-cyan" />
          <div className="font-mono-tech text-lg text-foreground">{(Math.random() * 5 + 3).toFixed(1)}m</div>
          <div className="text-xs text-muted-foreground">Avg Response</div>
        </div>
        <div className="bg-secondary rounded-md p-3 text-center">
          <Zap className="w-4 h-4 mx-auto mb-1 text-neon-orange" />
          <div className="font-mono-tech text-lg text-foreground">{highAccidents}</div>
          <div className="text-xs text-muted-foreground">Critical Events</div>
        </div>
        <div className="bg-secondary rounded-md p-3 text-center">
          <Activity className="w-4 h-4 mx-auto mb-1 text-neon-green" />
          <div className="font-mono-tech text-lg text-foreground">{Math.round(85 + Math.random() * 10)}%</div>
          <div className="text-xs text-muted-foreground">System Health</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => exportTrafficCSV(traffic)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-mono-tech bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
          <FileSpreadsheet className="w-3 h-3" /> Traffic CSV
        </button>
        <button onClick={() => exportFloodCSV(flood)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-mono-tech bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 transition-colors">
          <FileSpreadsheet className="w-3 h-3" /> Flood CSV
        </button>
        <button onClick={() => exportAccidentsCSV(accidents)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-mono-tech bg-neon-orange/10 text-neon-orange hover:bg-neon-orange/20 transition-colors">
          <FileSpreadsheet className="w-3 h-3" /> Accidents CSV
        </button>
      </div>

      <div>
        <h4 className="text-xs text-muted-foreground font-display tracking-wider mb-2">TOP CONGESTION ZONES</h4>
        <div className="space-y-1">
          {topCongested.map((t, i) => (
            <motion.div key={t.zoneId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2 text-xs">
              <span className="font-mono-tech text-muted-foreground w-4">{i + 1}</span>
              <span className="font-mono-tech text-foreground flex-1 truncate">{t.zoneName}</span>
              <span className="font-mono-tech text-neon-red">{Math.round(t.congestionLevel * 100)}%</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs text-muted-foreground font-display tracking-wider mb-2">FLOOD-PRONE AREAS</h4>
        <div className="space-y-1">
          {floodProne.map((f, i) => (
            <div key={f.zoneId} className="flex items-center gap-2 text-xs">
              <span className="font-mono-tech text-muted-foreground w-4">{i + 1}</span>
              <span className="font-mono-tech text-foreground flex-1 truncate">{f.zoneName}</span>
              <span className="font-mono-tech text-neon-cyan">{Math.round(f.riskLevel * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
