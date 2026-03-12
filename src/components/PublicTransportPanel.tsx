import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bus, Train, Clock, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { INDIAN_ZONES } from '@/lib/india-zones';

interface TransportVehicle {
  zone_id: string;
  transport_type: string;
  route_name: string;
  occupancy_percent: number;
  eta_minutes: number;
  status: string;
  vehicle_id: string;
}

const ROUTE_NAMES = {
  bus: ['City Express', 'Metro Link', 'Ring Road', 'Airport Shuttle', 'Cross Town', 'Highway Express'],
  metro: ['Blue Line', 'Red Line', 'Green Line', 'Yellow Line', 'Orange Line', 'Violet Line'],
  local_train: ['Suburban Fast', 'Suburban Slow', 'Inter-City', 'Regional Express'],
};

const generateSimulatedData = (): TransportVehicle[] => {
  const vehicles: TransportVehicle[] = [];
  const types = ['bus', 'metro', 'local_train'] as const;
  
  INDIAN_ZONES.slice(0, 20).forEach((zone, zi) => {
    const count = zone.population > 50 ? 3 : zone.population > 20 ? 2 : 1;
    for (let v = 0; v < count; v++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const routes = ROUTE_NAMES[type];
      const occupancy = Math.round(20 + Math.random() * 80);
      vehicles.push({
        zone_id: zone.id,
        transport_type: type,
        route_name: routes[Math.floor(Math.random() * routes.length)],
        occupancy_percent: occupancy,
        eta_minutes: Math.round(1 + Math.random() * 25),
        status: occupancy > 90 ? 'overcrowded' : Math.random() > 0.8 ? 'delayed' : 'on_time',
        vehicle_id: `${type.charAt(0).toUpperCase()}${zi}${v}`,
      });
    }
  });
  return vehicles;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'on_time': return 'text-neon-green';
    case 'delayed': return 'text-neon-orange';
    case 'overcrowded': return 'text-neon-red';
    default: return 'text-muted-foreground';
  }
};

const getOccupancyColor = (pct: number) => {
  if (pct > 90) return 'bg-destructive';
  if (pct > 70) return 'bg-neon-orange';
  if (pct > 50) return 'bg-warning';
  return 'bg-neon-green';
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'metro': case 'local_train': return Train;
    default: return Bus;
  }
};

export default function PublicTransportPanel() {
  const [data, setData] = useState<TransportVehicle[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      const { data: dbData } = await supabase
        .from('transport_data')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(100);
      
      if (dbData && dbData.length > 0) {
        setData(dbData.map(d => ({
          zone_id: d.zone_id,
          transport_type: d.transport_type,
          route_name: d.route_name,
          occupancy_percent: d.occupancy_percent,
          eta_minutes: d.eta_minutes,
          status: d.status,
          vehicle_id: d.vehicle_id,
        })));
      } else {
        setData(generateSimulatedData());
      }
    };
    fetchData();
    const interval = setInterval(() => setData(generateSimulatedData()), 20000);
    return () => clearInterval(interval);
  }, []);

  const zoneMap = Object.fromEntries(INDIAN_ZONES.map(z => [z.id, z]));
  const filtered = typeFilter === 'all' ? data : data.filter(d => d.transport_type === typeFilter);
  const overcrowded = data.filter(d => d.occupancy_percent > 90).length;
  const delayed = data.filter(d => d.status === 'delayed').length;
  const avgOccupancy = data.length ? Math.round(data.reduce((s, d) => s + d.occupancy_percent, 0) / data.length) : 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3 border-glow">
          <div className="flex items-center gap-2 mb-1">
            <Bus className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">VEHICLES</span>
          </div>
          <span className="text-2xl font-display text-primary">{data.length}</span>
          <p className="text-[10px] font-mono-tech text-muted-foreground">Active</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 border-glow">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-neon-cyan" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">AVG OCCUPANCY</span>
          </div>
          <span className={`text-2xl font-display ${avgOccupancy > 80 ? 'text-neon-red' : 'text-neon-cyan'}`}>{avgOccupancy}%</span>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 border-glow">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-neon-red" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">OVERCROWDED</span>
          </div>
          <span className="text-2xl font-display text-neon-red">{overcrowded}</span>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 border-glow">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-neon-orange" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">DELAYED</span>
          </div>
          <span className="text-2xl font-display text-neon-orange">{delayed}</span>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'bus', 'metro', 'local_train'].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 rounded text-xs font-mono-tech capitalize ${typeFilter === t ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {t === 'local_train' ? 'Local Train' : t === 'all' ? `All (${data.length})` : t}
          </button>
        ))}
      </div>

      {/* Vehicle List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filtered.map((v, i) => {
          const Icon = getTypeIcon(v.transport_type);
          return (
            <motion.div
              key={`${v.vehicle_id}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="border border-border rounded-lg p-3 bg-card/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono-tech text-foreground">{v.route_name}</span>
                  <span className="text-[10px] font-mono-tech text-muted-foreground">#{v.vehicle_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  {v.status === 'on_time' ? <CheckCircle className="w-3 h-3 text-neon-green" /> : <AlertTriangle className="w-3 h-3 text-neon-orange" />}
                  <span className={`text-[10px] font-mono-tech capitalize ${getStatusColor(v.status)}`}>{v.status.replace('_', ' ')}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] font-mono-tech text-muted-foreground mb-1">
                    <span>Occupancy</span>
                    <span className={v.occupancy_percent > 90 ? 'text-neon-red' : 'text-foreground'}>{v.occupancy_percent}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getOccupancyColor(v.occupancy_percent)}`} style={{ width: `${v.occupancy_percent}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono-tech text-muted-foreground block">ETA</span>
                  <span className="text-sm font-display text-foreground">{v.eta_minutes}m</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono-tech text-muted-foreground block">Zone</span>
                  <span className="text-[10px] font-mono-tech text-foreground">{zoneMap[v.zone_id]?.name?.split(' ')[0] || v.zone_id}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
