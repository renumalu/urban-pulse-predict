import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, ZapOff, Gauge, AlertTriangle, Activity, BatteryWarning } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { INDIAN_ZONES } from '@/lib/india-zones';

interface PowerData {
  zone_id: string;
  load_mw: number;
  capacity_mw: number;
  load_percent: number;
  status: string;
  outage_active: boolean;
  outage_duration_min: number;
  frequency_hz: number;
}

const getLoadColor = (pct: number) => {
  if (pct > 90) return 'text-neon-red';
  if (pct > 75) return 'text-neon-orange';
  if (pct > 50) return 'text-warning';
  return 'text-neon-green';
};

const getLoadBg = (pct: number, outage: boolean) => {
  if (outage) return 'border-destructive bg-destructive/10';
  if (pct > 90) return 'border-neon-red bg-neon-red/10';
  if (pct > 75) return 'border-neon-orange bg-neon-orange/10';
  return 'border-border bg-card/50';
};

const generateSimulatedData = (): PowerData[] => {
  return INDIAN_ZONES.map(zone => {
    const capacity = 500 + zone.population * 20 + Math.random() * 200;
    const loadPct = 30 + Math.random() * 65 + (zone.population > 80 ? 10 : 0);
    const load = capacity * (loadPct / 100);
    const outage = Math.random() > 0.88;
    return {
      zone_id: zone.id,
      load_mw: Math.round(load),
      capacity_mw: Math.round(capacity),
      load_percent: Math.round(loadPct),
      status: outage ? 'outage' : loadPct > 90 ? 'critical' : loadPct > 75 ? 'warning' : 'normal',
      outage_active: outage,
      outage_duration_min: outage ? Math.round(5 + Math.random() * 120) : 0,
      frequency_hz: +(49.8 + Math.random() * 0.4).toFixed(2),
    };
  });
};

export default function PowerGridPanel() {
  const [data, setData] = useState<PowerData[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'outage'>('all');

  useEffect(() => {
    const fetchData = async () => {
      const { data: dbData } = await supabase
        .from('power_grid_data')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(36);
      
      if (dbData && dbData.length > 0) {
        setData(dbData.map(d => ({
          zone_id: d.zone_id,
          load_mw: d.load_mw,
          capacity_mw: d.capacity_mw,
          load_percent: d.load_percent,
          status: d.status,
          outage_active: d.outage_active,
          outage_duration_min: d.outage_duration_min,
          frequency_hz: d.frequency_hz,
        })));
      } else {
        setData(generateSimulatedData());
      }
    };
    fetchData();
    const interval = setInterval(() => setData(generateSimulatedData()), 30000);
    return () => clearInterval(interval);
  }, []);

  const zoneMap = Object.fromEntries(INDIAN_ZONES.map(z => [z.id, z]));
  const totalLoad = data.reduce((s, d) => s + d.load_mw, 0);
  const totalCapacity = data.reduce((s, d) => s + d.capacity_mw, 0);
  const outages = data.filter(d => d.outage_active);
  const criticalZones = data.filter(d => d.load_percent > 90);
  const avgFreq = data.length ? +(data.reduce((s, d) => s + d.frequency_hz, 0) / data.length).toFixed(2) : 50;

  const filtered = filter === 'outage' ? outages : filter === 'critical' ? criticalZones : [...data].sort((a, b) => b.load_percent - a.load_percent);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3 border-glow">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">TOTAL LOAD</span>
          </div>
          <span className="text-2xl font-display text-primary">{(totalLoad / 1000).toFixed(1)}</span>
          <p className="text-[10px] font-mono-tech text-muted-foreground">GW / {(totalCapacity / 1000).toFixed(1)} GW</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 border-glow">
          <div className="flex items-center gap-2 mb-1">
            <ZapOff className="w-4 h-4 text-neon-red" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">OUTAGES</span>
          </div>
          <span className="text-2xl font-display text-neon-red">{outages.length}</span>
          <p className="text-[10px] font-mono-tech text-muted-foreground">Active</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 border-glow">
          <div className="flex items-center gap-2 mb-1">
            <BatteryWarning className="w-4 h-4 text-neon-orange" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">OVERLOADED</span>
          </div>
          <span className="text-2xl font-display text-neon-orange">{criticalZones.length}</span>
          <p className="text-[10px] font-mono-tech text-muted-foreground">&gt; 90% load</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 border-glow">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-neon-cyan" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">GRID FREQ</span>
          </div>
          <span className={`text-2xl font-display ${Math.abs(avgFreq - 50) > 0.1 ? 'text-neon-orange' : 'text-neon-green'}`}>{avgFreq}</span>
          <p className="text-[10px] font-mono-tech text-muted-foreground">Hz (target: 50.00)</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded text-xs font-mono-tech ${filter === 'all' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>All ({data.length})</button>
        <button onClick={() => setFilter('critical')} className={`px-3 py-1.5 rounded text-xs font-mono-tech ${filter === 'critical' ? 'bg-neon-orange/20 text-neon-orange' : 'text-muted-foreground hover:text-foreground'}`}>⚡ Overloaded ({criticalZones.length})</button>
        <button onClick={() => setFilter('outage')} className={`px-3 py-1.5 rounded text-xs font-mono-tech ${filter === 'outage' ? 'bg-destructive/20 text-destructive' : 'text-muted-foreground hover:text-foreground'}`}>🔴 Outages ({outages.length})</button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[500px] overflow-y-auto">
        {filtered.map((d, i) => (
          <motion.div
            key={d.zone_id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className={`border rounded-lg p-3 ${getLoadBg(d.load_percent, d.outage_active)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {d.outage_active ? <ZapOff className="w-4 h-4 text-destructive animate-pulse" /> : <Zap className="w-4 h-4 text-primary" />}
                <span className="text-xs font-mono-tech text-foreground truncate">{zoneMap[d.zone_id]?.name || d.zone_id}</span>
              </div>
              <span className={`text-sm font-display ${getLoadColor(d.load_percent)}`}>{d.load_percent}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
              <div className={`h-full rounded-full ${d.load_percent > 90 ? 'bg-destructive' : d.load_percent > 75 ? 'bg-neon-orange' : 'bg-neon-green'}`} style={{ width: `${d.load_percent}%` }} />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono-tech text-muted-foreground">
              <span>{d.load_mw} / {d.capacity_mw} MW</span>
              <span>{d.frequency_hz} Hz</span>
            </div>
            {d.outage_active && (
              <div className="mt-2 flex items-center gap-1 text-[10px] font-mono-tech text-destructive">
                <AlertTriangle className="w-3 h-3" />
                Outage: {d.outage_duration_min} min
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
