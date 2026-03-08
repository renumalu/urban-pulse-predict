import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Fuel, Timer, TrendingDown, Factory, Users, Briefcase, HeartPulse } from 'lucide-react';
import type { TrafficData, FloodData, AccidentData } from '@/lib/simulation';

interface ImpactMetricsPanelProps {
  traffic: TrafficData[];
  flood: FloodData[];
  accidents: AccidentData[];
}

export default function ImpactMetricsPanel({ traffic, flood, accidents }: ImpactMetricsPanelProps) {
  const metrics = useMemo(() => {
    const avgCongestion = traffic.length
      ? traffic.reduce((s, t) => s + t.congestionLevel, 0) / traffic.length
      : 0.5;
    const avgSpeed = traffic.length
      ? traffic.reduce((s, t) => s + t.avgSpeed, 0) / traffic.length
      : 30;
    const highRiskZones = flood.filter(f => f.riskLevel > 0.5).length;
    const highSeverityAccidents = accidents.filter(a => a.severity === 'high').length;

    // Environmental Impact calculations (based on congestion reduction)
    const congestionReduction = Math.max(0, (0.65 - avgCongestion) * 100); // vs 65% baseline
    const fuelSaved = Math.round(congestionReduction * 12.5); // liters/hr across monitored zones
    const co2Reduced = Math.round(fuelSaved * 2.31); // kg CO2 per liter of fuel
    const idleTimeReduced = Math.round(congestionReduction * 0.8); // minutes per vehicle

    // Emergency Response metrics
    const responseTimeImprovement = Math.round(10 + congestionReduction * 0.3); // % improvement
    const livesImpacted = Math.round(responseTimeImprovement * 0.4);

    // Economic Productivity
    const productivityGain = Math.round(congestionReduction * 0.6); // % workforce productivity improvement
    const timeSaved = Math.round(congestionReduction * 2.1); // person-hours saved per 1000 commuters

    // Flood Mitigation
    const earlyWarningMinutes = Math.round(30 + Math.random() * 30);
    const evacuationEfficiency = Math.round(85 + Math.random() * 10);

    return {
      congestionReduction: Math.round(congestionReduction),
      fuelSaved,
      co2Reduced,
      idleTimeReduced,
      responseTimeImprovement,
      livesImpacted,
      productivityGain,
      timeSaved,
      earlyWarningMinutes,
      evacuationEfficiency,
      highRiskZones,
      avgSpeed: Math.round(avgSpeed),
    };
  }, [traffic, flood, accidents]);

  const impactCards = [
    {
      icon: HeartPulse,
      label: 'Emergency Response',
      value: `${metrics.responseTimeImprovement}%`,
      sub: 'faster dispatch time',
      color: 'text-neon-red',
      bg: 'bg-neon-red/10',
      desc: 'Reduction in response time directly saves lives',
    },
    {
      icon: Leaf,
      label: 'Carbon Reduction',
      value: `${metrics.co2Reduced}`,
      sub: 'kg CO₂/hr reduced',
      color: 'text-neon-green',
      bg: 'bg-neon-green/10',
      desc: 'Reduced idle time lowers emissions',
    },
    {
      icon: Fuel,
      label: 'Fuel Savings',
      value: `${metrics.fuelSaved}`,
      sub: 'liters/hr saved',
      color: 'text-neon-orange',
      bg: 'bg-neon-orange/10',
      desc: 'Optimized routing reduces wastage',
    },
    {
      icon: Briefcase,
      label: 'Productivity Gain',
      value: `${metrics.productivityGain}%`,
      sub: 'workforce efficiency',
      color: 'text-neon-cyan',
      bg: 'bg-neon-cyan/10',
      desc: 'Efficient mobility improves output',
    },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4 border-glow">
      <div className="flex items-center gap-2">
        <Factory className="w-5 h-5 text-neon-green" />
        <h3 className="font-display text-sm tracking-wider text-neon-green">REAL-WORLD IMPACT</h3>
      </div>

      {/* Main Impact Cards */}
      <div className="grid grid-cols-2 gap-2">
        {impactCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`${card.bg} rounded-lg p-3 space-y-1`}
          >
            <card.icon className={`w-4 h-4 ${card.color}`} />
            <div className={`font-display text-lg ${card.color}`}>{card.value}</div>
            <div className="text-[10px] text-muted-foreground font-mono-tech">{card.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Detailed Metrics */}
      <div className="space-y-2">
        <h4 className="text-xs text-muted-foreground font-display tracking-wider">MEASURABLE OUTCOMES</h4>
        
        {/* Idle Time Reduction */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Timer className="w-3 h-3 text-neon-orange" />
            <span className="font-mono-tech text-muted-foreground">Idle Time Reduced</span>
          </div>
          <span className="font-mono-tech text-foreground">{metrics.idleTimeReduced} min/vehicle</span>
        </div>

        {/* Flood Early Warning */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-3 h-3 text-neon-cyan" />
            <span className="font-mono-tech text-muted-foreground">Flood Early Warning</span>
          </div>
          <span className="font-mono-tech text-foreground">{metrics.earlyWarningMinutes} min ahead</span>
        </div>

        {/* Evacuation Efficiency */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-primary" />
            <span className="font-mono-tech text-muted-foreground">Evacuation Efficiency</span>
          </div>
          <span className="font-mono-tech text-foreground">{metrics.evacuationEfficiency}%</span>
        </div>

        {/* Time Saved */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Briefcase className="w-3 h-3 text-neon-green" />
            <span className="font-mono-tech text-muted-foreground">Person-Hours Saved</span>
          </div>
          <span className="font-mono-tech text-foreground">{metrics.timeSaved}/1K commuters</span>
        </div>
      </div>

      {/* Bottom tagline */}
      <div className="pt-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground font-mono-tech italic text-center">
          UrbanPulse doesn't just monitor cities — it protects them.
        </p>
      </div>
    </div>
  );
}
