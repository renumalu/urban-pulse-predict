import { motion } from 'framer-motion';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import ImpactMetricsPanel from '@/components/ImpactMetricsPanel';
import HistoricalTrendsChart from '@/components/HistoricalTrendsChart';
import type { TrafficData, FloodData, AccidentData } from '@/lib/simulation';
import { BarChart3, TrendingUp, Download, FileSpreadsheet } from 'lucide-react';
import { exportTrafficCSV, exportFloodCSV, exportAccidentsCSV, exportFullReport } from '@/lib/csv-export';

interface AnalyticsViewProps {
  traffic: TrafficData[];
  flood: FloodData[];
  accidents: AccidentData[];
}

export default function AnalyticsView({ traffic, flood, accidents }: AnalyticsViewProps) {
  const avgCongestion = traffic.length
    ? Math.round((traffic.reduce((s, t) => s + t.congestionLevel, 0) / traffic.length) * 100)
    : 0;
  const avgSpeed = traffic.length
    ? Math.round(traffic.reduce((s, t) => s + t.avgSpeed, 0) / traffic.length)
    : 0;
  const totalVehicles = traffic.reduce((s, t) => s + t.vehicleCount, 0);
  const avgRainfall = flood.length
    ? (flood.reduce((s, f) => s + f.rainfall, 0) / flood.length).toFixed(1)
    : '0';

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-y-auto">
      {/* Left column */}
      <div className="space-y-4">
        {/* Key Metrics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-card border border-border rounded-lg p-4 space-y-4 border-glow">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-neon-purple" />
              <h3 className="font-display text-sm tracking-wider text-neon-purple">KEY METRICS</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary rounded-lg p-4">
                <div className="text-xs text-muted-foreground font-mono-tech mb-1">Avg Congestion</div>
                <div className="font-display text-3xl text-primary">{avgCongestion}%</div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${avgCongestion}%` }} />
                </div>
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <div className="text-xs text-muted-foreground font-mono-tech mb-1">Avg Speed</div>
                <div className="font-display text-3xl text-neon-green">{avgSpeed}</div>
                <div className="text-xs text-muted-foreground">km/h</div>
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <div className="text-xs text-muted-foreground font-mono-tech mb-1">Total Vehicles</div>
                <div className="font-display text-3xl text-neon-cyan">{totalVehicles.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">across 36 zones</div>
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <div className="text-xs text-muted-foreground font-mono-tech mb-1">Avg Rainfall</div>
                <div className="font-display text-3xl text-neon-orange">{avgRainfall}</div>
                <div className="text-xs text-muted-foreground">mm/hr</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Historical Trends Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <HistoricalTrendsChart />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <AnalyticsPanel traffic={traffic} flood={flood} accidents={accidents} />
        </motion.div>
      </div>

      {/* Right column */}
      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <ImpactMetricsPanel traffic={traffic} flood={flood} accidents={accidents} />
        </motion.div>

        {/* Export Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="bg-card border border-border rounded-lg p-4 space-y-4 border-glow">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-neon-green" />
              <h3 className="font-display text-sm tracking-wider text-neon-green">DATA EXPORT</h3>
            </div>

            <p className="text-xs text-muted-foreground">
              Download real-time city data as CSV reports for analysis and compliance.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => exportTrafficCSV(traffic)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="text-xs font-mono-tech">Traffic CSV</span>
              </button>
              <button
                onClick={() => exportFloodCSV(flood)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="text-xs font-mono-tech">Flood CSV</span>
              </button>
              <button
                onClick={() => exportAccidentsCSV(accidents)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-neon-orange/10 text-neon-orange hover:bg-neon-orange/20 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="text-xs font-mono-tech">Accidents CSV</span>
              </button>
              <button
                onClick={() => exportFullReport(traffic, flood, accidents)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-neon-purple/10 text-neon-purple hover:bg-neon-purple/20 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-xs font-mono-tech">Full Report</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Zone Performance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="bg-card border border-border rounded-lg p-4 border-glow">
            <h4 className="text-xs text-muted-foreground font-display tracking-wider mb-3">SLOWEST ZONES (AVG SPEED)</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
              {[...traffic].sort((a, b) => a.avgSpeed - b.avgSpeed).slice(0, 10).map((t, i) => (
                <div key={t.zoneId} className="flex items-center gap-2 text-xs">
                  <span className="font-mono-tech text-muted-foreground w-4 flex-shrink-0">{i + 1}</span>
                  <span className="font-mono-tech text-foreground flex-1 truncate">{t.zoneName}</span>
                  <span className="font-mono-tech text-neon-red flex-shrink-0">{t.avgSpeed} km/h</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
