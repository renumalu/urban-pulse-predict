import { motion } from 'framer-motion';
import { Ambulance, CloudRain, Car, ArrowRight, Timer, Droplets, TrendingDown } from 'lucide-react';
import type { TrafficData, FloodData, EmergencyUnit } from '@/lib/simulation';

interface SolutionsPanelProps {
  traffic: TrafficData[];
  flood: FloodData[];
  emergencyUnits: EmergencyUnit[];
}

export default function SolutionsPanel({ traffic, flood, emergencyUnits }: SolutionsPanelProps) {
  const avgCongestion = traffic.length
    ? Math.round((traffic.reduce((s, t) => s + t.congestionLevel, 0) / traffic.length) * 100)
    : 0;
  const highFloodZones = flood.filter(f => f.riskLevel > 0.5).length;
  const avgRainfall = flood.length
    ? (flood.reduce((s, f) => s + f.rainfall, 0) / flood.length).toFixed(1)
    : '0';
  const availableUnits = emergencyUnits.filter(u => u.status === 'available').length;
  const dispatchedUnits = emergencyUnits.filter(u => u.status !== 'available').length;

  const solutions = [
    {
      crisis: 'Delayed Emergency Response',
      crisisDesc: 'Ambulances lose critical minutes in unpredictable traffic',
      solution: 'A* Route Optimization',
      solutionDesc: 'Real-time dispatch with optimized routing across all zones',
      icon: Ambulance,
      metricIcon: Timer,
      metricValue: `${availableUnits}/${emergencyUnits.length}`,
      metricLabel: 'Units Ready',
      secondMetric: `${dispatchedUnits}`,
      secondLabel: 'Active Dispatches',
      color: 'text-neon-red',
      bg: 'bg-neon-red/10',
      borderColor: 'border-neon-red/20',
    },
    {
      crisis: 'Urban Flooding Without Foresight',
      crisisDesc: 'Flood alerts come after water rises — no early simulation',
      solution: 'Predictive Flood Simulation',
      solutionDesc: 'Elevation-based risk scoring with live OpenWeatherMap rainfall',
      icon: CloudRain,
      metricIcon: Droplets,
      metricValue: `${highFloodZones}`,
      metricLabel: 'High-Risk Zones',
      secondMetric: `${avgRainfall}mm`,
      secondLabel: 'Avg Rainfall',
      color: 'text-neon-cyan',
      bg: 'bg-neon-cyan/10',
      borderColor: 'border-neon-cyan/20',
    },
    {
      crisis: 'Chronic Congestion & Economic Loss',
      crisisDesc: 'Traffic dashboards show what already happened — not what\'s coming',
      solution: 'LSTM Traffic Predictions',
      solutionDesc: '30/60/120min forecasting with trend analysis across 36 zones',
      icon: Car,
      metricIcon: TrendingDown,
      metricValue: `${avgCongestion}%`,
      metricLabel: 'Avg Congestion',
      secondMetric: `${traffic.filter(t => t.congestionLevel > 0.7).length}`,
      secondLabel: 'Critical Zones',
      color: 'text-neon-orange',
      bg: 'bg-neon-orange/10',
      borderColor: 'border-neon-orange/20',
    },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3 border-glow">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
        <h3 className="font-display text-sm tracking-wider text-neon-green text-glow-green">CRISIS → SOLUTION</h3>
      </div>

      {solutions.map((s, i) => (
        <motion.div
          key={s.crisis}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.12 }}
          className={`rounded-lg border ${s.borderColor} p-3 space-y-2`}
        >
          {/* Crisis → Solution header */}
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${s.bg}`}>
              <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-destructive font-mono-tech truncate">{s.crisis}</span>
                <ArrowRight className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                <span className={`${s.color} font-mono-tech truncate`}>{s.solution}</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-body truncate mt-0.5">{s.solutionDesc}</p>
            </div>
          </div>

          {/* Live metrics */}
          <div className="flex gap-2">
            <div className={`flex-1 rounded-md ${s.bg} px-2 py-1.5 flex items-center gap-2`}>
              <s.metricIcon className={`w-3 h-3 ${s.color}`} />
              <div>
                <div className={`font-mono-tech text-sm ${s.color} leading-none`}>{s.metricValue}</div>
                <div className="text-[9px] text-muted-foreground">{s.metricLabel}</div>
              </div>
            </div>
            <div className="flex-1 rounded-md bg-secondary px-2 py-1.5 flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${s.color.replace('text-', 'bg-')}`} />
              <div>
                <div className="font-mono-tech text-sm text-foreground leading-none">{s.secondMetric}</div>
                <div className="text-[9px] text-muted-foreground">{s.secondLabel}</div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
