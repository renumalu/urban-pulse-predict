import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, AlertTriangle, Building, TreePine } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { INDIAN_ZONES } from '@/lib/india-zones';

interface NoiseData {
  zone_id: string;
  decibel_level: number;
  category: string;
  source: string;
  near_sensitive_area: boolean;
}

const getNoiseColor = (db: number) => {
  if (db <= 50) return 'text-neon-green';
  if (db <= 65) return 'text-warning';
  if (db <= 75) return 'text-neon-orange';
  if (db <= 85) return 'text-neon-red';
  return 'text-destructive';
};

const getNoiseBg = (db: number) => {
  if (db <= 50) return 'border-neon-green bg-neon-green/10';
  if (db <= 65) return 'border-warning bg-warning/10';
  if (db <= 75) return 'border-neon-orange bg-neon-orange/10';
  return 'border-neon-red bg-neon-red/10';
};

const getNoiseLabel = (db: number) => {
  if (db <= 50) return 'Quiet';
  if (db <= 65) return 'Moderate';
  if (db <= 75) return 'Loud';
  if (db <= 85) return 'Very Loud';
  return 'Dangerous';
};

const NOISE_SOURCES = ['traffic', 'construction', 'industrial', 'commercial', 'residential'];

const generateSimulatedData = (): NoiseData[] => {
  return INDIAN_ZONES.map(zone => {
    const base = 35 + Math.random() * 50 + (zone.population > 50 ? 15 : 0);
    const db = Math.min(Math.round(base), 110);
    return {
      zone_id: zone.id,
      decibel_level: db,
      category: getNoiseLabel(db),
      source: NOISE_SOURCES[Math.floor(Math.random() * NOISE_SOURCES.length)],
      near_sensitive_area: Math.random() > 0.7,
    };
  });
};

export default function NoisePollutionPanel() {
  const [data, setData] = useState<NoiseData[]>([]);
  const [filter, setFilter] = useState<'all' | 'violations'>('all');

  useEffect(() => {
    const fetchData = async () => {
      const { data: dbData } = await supabase
        .from('noise_data')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(36);
      
      if (dbData && dbData.length > 0) {
        setData(dbData.map(d => ({
          zone_id: d.zone_id,
          decibel_level: d.decibel_level,
          category: d.category,
          source: d.source,
          near_sensitive_area: d.near_sensitive_area,
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
  const avgDb = data.length ? Math.round(data.reduce((s, d) => s + d.decibel_level, 0) / data.length) : 0;
  const violations = data.filter(d => d.near_sensitive_area && d.decibel_level > 55);
  const loudZones = data.filter(d => d.decibel_level > 75).length;

  const filteredData = filter === 'violations' ? violations : [...data].sort((a, b) => b.decibel_level - a.decibel_level);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3 border-glow">
          <div className="flex items-center gap-2 mb-1">
            <Volume2 className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">AVG NOISE</span>
          </div>
          <span className={`text-2xl font-display ${getNoiseColor(avgDb)}`}>{avgDb}</span>
          <p className="text-[10px] font-mono-tech text-muted-foreground">dB</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 border-glow">
          <div className="flex items-center gap-2 mb-1">
            <VolumeX className="w-4 h-4 text-neon-red" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">LOUD ZONES</span>
          </div>
          <span className="text-2xl font-display text-neon-red">{loudZones}</span>
          <p className="text-[10px] font-mono-tech text-muted-foreground">&gt; 75 dB</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 border-glow">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-neon-orange" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">VIOLATIONS</span>
          </div>
          <span className="text-2xl font-display text-neon-orange">{violations.length}</span>
          <p className="text-[10px] font-mono-tech text-muted-foreground">Near sensitive areas</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 border-glow">
          <div className="flex items-center gap-2 mb-1">
            <TreePine className="w-4 h-4 text-neon-green" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">QUIET ZONES</span>
          </div>
          <span className="text-2xl font-display text-neon-green">{data.filter(d => d.decibel_level <= 50).length}</span>
          <p className="text-[10px] font-mono-tech text-muted-foreground">&lt; 50 dB</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded text-xs font-mono-tech ${filter === 'all' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>All Zones</button>
        <button onClick={() => setFilter('violations')} className={`px-3 py-1.5 rounded text-xs font-mono-tech ${filter === 'violations' ? 'bg-neon-orange/20 text-neon-orange' : 'text-muted-foreground hover:text-foreground'}`}>
          ⚠️ Violations ({violations.length})
        </button>
      </div>

      {/* Noise Heatmap Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[500px] overflow-y-auto">
        {filteredData.map((d, i) => (
          <motion.div
            key={d.zone_id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className={`border rounded-lg p-3 ${getNoiseBg(d.decibel_level)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono-tech text-foreground truncate">{zoneMap[d.zone_id]?.name || d.zone_id}</span>
              <span className={`text-sm font-display ${getNoiseColor(d.decibel_level)}`}>{d.decibel_level} dB</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${d.decibel_level > 75 ? 'bg-destructive' : d.decibel_level > 55 ? 'bg-neon-orange' : 'bg-neon-green'}`} style={{ width: `${Math.min(d.decibel_level / 1.1, 100)}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono-tech text-muted-foreground">
              <span className="capitalize">📢 {d.source}</span>
              {d.near_sensitive_area && (
                <span className="text-neon-orange flex items-center gap-1">
                  <Building className="w-3 h-3" /> Sensitive Area
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
