import { motion } from 'framer-motion';
import FloodPanel from '@/components/FloodPanel';
import City3DView from '@/components/City3DView';
import CityMapView from '@/components/CityMapView';
import type { TrafficData, FloodData, AccidentData, EmergencyUnit } from '@/lib/simulation';
import { CloudRain, Thermometer, Wind, Droplets } from 'lucide-react';

interface FloodViewProps {
  traffic: TrafficData[];
  flood: FloodData[];
  accidents: AccidentData[];
  emergencyUnits: EmergencyUnit[];
  floodHistory: { time: string; value: number }[];
  viewMode: '3d' | 'map';
}

export default function FloodView({
  traffic, flood, accidents, emergencyUnits, floodHistory, viewMode
}: FloodViewProps) {
  const avgRainfall = flood.length ? flood.reduce((s, f) => s + f.rainfall, 0) / flood.length : 0;
  const highRiskZones = flood.filter(f => f.riskLevel > 0.5);
  const criticalZones = flood.filter(f => f.riskLevel > 0.7);

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-y-auto">
      {/* Left panel - Flood data */}
      <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <FloodPanel flood={flood} history={floodHistory} />
        </motion.div>

        {/* Weather Summary Card */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="bg-card border border-border rounded-lg p-4 space-y-4 border-glow">
            <div className="flex items-center gap-2">
              <CloudRain className="w-5 h-5 text-neon-cyan" />
              <h3 className="font-display text-sm tracking-wider text-neon-cyan text-glow-cyan">WEATHER SUMMARY</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary rounded-md p-3 text-center">
                <Droplets className="w-4 h-4 mx-auto mb-1 text-neon-cyan" />
                <div className="font-mono-tech text-lg text-foreground">{avgRainfall.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">mm/hr Avg</div>
              </div>
              <div className="bg-secondary rounded-md p-3 text-center">
                <Wind className="w-4 h-4 mx-auto mb-1 text-neon-green" />
                <div className="font-mono-tech text-lg text-foreground">{flood.length}</div>
                <div className="text-xs text-muted-foreground">Zones Monitored</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">High Risk Zones</span>
                <span className="font-mono-tech text-neon-orange">{highRiskZones.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Critical Zones</span>
                <span className="font-mono-tech text-neon-red">{criticalZones.length}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Zone List */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <div className="bg-card border border-border rounded-lg p-4 border-glow">
            <h4 className="text-xs text-muted-foreground font-display tracking-wider mb-2">TOP RAINFALL ZONES</h4>
            {/* Legend */}
            <div className="flex items-center gap-4 text-[11px] font-mono-tech mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-neon-green flex-shrink-0" />
                <span className="text-muted-foreground">Low</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-neon-orange flex-shrink-0" />
                <span className="text-neon-orange">Medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-neon-red flex-shrink-0" />
                <span className="text-neon-red">Critical</span>
              </div>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin pr-1">
              {[...flood].sort((a, b) => b.rainfall - a.rainfall).slice(0, 10).map(f => (
                <div key={f.zoneId} className="flex items-center justify-between text-sm">
                  <span className="font-mono-tech text-foreground truncate flex-1 mr-2">{f.zoneName}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground w-14 text-right">{f.rainfall.toFixed(1)}mm</span>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${f.riskLevel > 0.7 ? 'bg-neon-red animate-pulse' : f.riskLevel > 0.4 ? 'bg-neon-orange' : 'bg-neon-green'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Center - Map or 3D View */}
      <div className="lg:col-span-2 min-h-[500px] order-1 lg:order-2">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="h-full">
          {viewMode === 'map' ? (
            <CityMapView
              traffic={traffic}
              flood={flood}
              accidents={accidents}
              emergencyUnits={emergencyUnits}
              emergencyRoute={[]}
            />
          ) : (
            <City3DView traffic={traffic} flood={flood} accidents={accidents} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
