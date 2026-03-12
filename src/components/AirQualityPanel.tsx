import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wind, AlertTriangle, Thermometer, Droplets } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { INDIAN_ZONES } from '@/lib/india-zones';

interface AQIData {
  zone_id: string;
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  category: string;
}

const getAQIColor = (aqi: number) => {
  if (aqi <= 50) return 'text-neon-green';
  if (aqi <= 100) return 'text-warning';
  if (aqi <= 150) return 'text-neon-orange';
  if (aqi <= 200) return 'text-neon-red';
  if (aqi <= 300) return 'text-destructive';
  return 'text-neon-purple';
};

const getAQIBg = (aqi: number) => {
  if (aqi <= 50) return 'border-neon-green bg-neon-green/10';
  if (aqi <= 100) return 'border-warning bg-warning/10';
  if (aqi <= 150) return 'border-neon-orange bg-neon-orange/10';
  if (aqi <= 200) return 'border-neon-red bg-neon-red/10';
  return 'border-destructive bg-destructive/10';
};

const getAQILabel = (aqi: number) => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy (Sensitive)';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

// Generate simulated AQI data for all zones
const generateSimulatedData = (): AQIData[] => {
  return INDIAN_ZONES.map(zone => {
    const baseAQI = Math.round(30 + Math.random() * 220 + (zone.population > 50 ? 40 : 0));
    const aqi = Math.min(baseAQI, 500);
    return {
      zone_id: zone.id,
      aqi,
      pm25: Math.round(aqi * 0.4 + Math.random() * 20),
      pm10: Math.round(aqi * 0.6 + Math.random() * 30),
      o3: Math.round(20 + Math.random() * 80),
      no2: Math.round(10 + Math.random() * 60),
      so2: Math.round(5 + Math.random() * 30),
      co: +(0.5 + Math.random() * 3).toFixed(1),
      category: getAQILabel(aqi),
    };
  });
};

export default function AirQualityPanel() {
  const [data, setData] = useState<AQIData[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'aqi' | 'name'>('aqi');

  useEffect(() => {
    const fetchData = async () => {
      const { data: dbData } = await supabase
        .from('air_quality_data')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(36);
      
      if (dbData && dbData.length > 0) {
        setData(dbData.map(d => ({
          zone_id: d.zone_id,
          aqi: d.aqi,
          pm25: d.pm25,
          pm10: d.pm10,
          o3: d.o3,
          no2: d.no2,
          so2: d.so2,
          co: d.co,
          category: d.category,
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
  const sortedData = [...data].sort((a, b) => 
    sortBy === 'aqi' ? b.aqi - a.aqi : (zoneMap[a.zone_id]?.name || '').localeCompare(zoneMap[b.zone_id]?.name || '')
  );

  const avgAQI = data.length ? Math.round(data.reduce((s, d) => s + d.aqi, 0) / data.length) : 0;
  const criticalZones = data.filter(d => d.aqi > 200).length;
  const selected = selectedZone ? data.find(d => d.zone_id === selectedZone) : null;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3 border-glow">
          <div className="flex items-center gap-2 mb-1">
            <Wind className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">AVG AQI</span>
          </div>
          <span className={`text-2xl font-display ${getAQIColor(avgAQI)}`}>{avgAQI}</span>
          <p className="text-[10px] font-mono-tech text-muted-foreground">{getAQILabel(avgAQI)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 border-glow">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-neon-red" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">CRITICAL ZONES</span>
          </div>
          <span className="text-2xl font-display text-neon-red">{criticalZones}</span>
          <p className="text-[10px] font-mono-tech text-muted-foreground">AQI &gt; 200</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 border-glow">
          <div className="flex items-center gap-2 mb-1">
            <Droplets className="w-4 h-4 text-neon-cyan" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">PM2.5 AVG</span>
          </div>
          <span className="text-2xl font-display text-neon-cyan">
            {data.length ? Math.round(data.reduce((s, d) => s + d.pm25, 0) / data.length) : 0}
          </span>
          <p className="text-[10px] font-mono-tech text-muted-foreground">µg/m³</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 border-glow">
          <div className="flex items-center gap-2 mb-1">
            <Thermometer className="w-4 h-4 text-neon-orange" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">PM10 AVG</span>
          </div>
          <span className="text-2xl font-display text-neon-orange">
            {data.length ? Math.round(data.reduce((s, d) => s + d.pm10, 0) / data.length) : 0}
          </span>
          <p className="text-[10px] font-mono-tech text-muted-foreground">µg/m³</p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono-tech text-muted-foreground">SORT BY:</span>
        <button onClick={() => setSortBy('aqi')} className={`px-2 py-1 rounded text-xs font-mono-tech ${sortBy === 'aqi' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>AQI</button>
        <button onClick={() => setSortBy('name')} className={`px-2 py-1 rounded text-xs font-mono-tech ${sortBy === 'name' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Name</button>
      </div>

      {/* Selected Zone Detail */}
      {selected && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`border rounded-lg p-4 ${getAQIBg(selected.aqi)}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-display text-sm text-foreground">{zoneMap[selected.zone_id]?.name}</h4>
            <span className={`text-xl font-display ${getAQIColor(selected.aqi)}`}>{selected.aqi} AQI</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { label: 'PM2.5', value: selected.pm25, unit: 'µg/m³' },
              { label: 'PM10', value: selected.pm10, unit: 'µg/m³' },
              { label: 'O₃', value: selected.o3, unit: 'ppb' },
              { label: 'NO₂', value: selected.no2, unit: 'ppb' },
              { label: 'SO₂', value: selected.so2, unit: 'ppb' },
              { label: 'CO', value: selected.co, unit: 'mg/m³' },
            ].map(p => (
              <div key={p.label} className="text-center">
                <span className="text-[10px] font-mono-tech text-muted-foreground block">{p.label}</span>
                <span className="text-sm font-display text-foreground">{p.value}</span>
                <span className="text-[8px] font-mono-tech text-muted-foreground block">{p.unit}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 bg-secondary/50 rounded text-xs font-mono-tech text-muted-foreground">
            💡 {selected.aqi > 200 ? 'Health advisory: Avoid outdoor activities. Wear N95 mask.' :
                selected.aqi > 100 ? 'Sensitive groups should reduce prolonged outdoor exertion.' :
                'Air quality is acceptable for outdoor activities.'}
          </div>
        </motion.div>
      )}

      {/* Zone Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[500px] overflow-y-auto">
        {sortedData.map((d, i) => (
          <motion.div
            key={d.zone_id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => setSelectedZone(selectedZone === d.zone_id ? null : d.zone_id)}
            className={`border rounded-lg p-3 cursor-pointer transition-colors ${getAQIBg(d.aqi)} ${selectedZone === d.zone_id ? 'ring-1 ring-primary' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-tech text-foreground truncate">{zoneMap[d.zone_id]?.name || d.zone_id}</span>
              <span className={`text-sm font-display ${getAQIColor(d.aqi)}`}>{d.aqi}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${d.aqi > 200 ? 'bg-destructive' : d.aqi > 100 ? 'bg-neon-orange' : 'bg-neon-green'}`} style={{ width: `${Math.min(d.aqi / 5, 100)}%` }} />
              </div>
              <span className="text-[10px] font-mono-tech text-muted-foreground">{getAQILabel(d.aqi).split(' ')[0]}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
