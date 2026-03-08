import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import type { EmergencyUnit } from '@/lib/simulation';
import { INDIAN_ZONES, ZONE_POSITIONS } from '@/lib/india-zones';
import { Siren, Flame, Shield, Ambulance, Navigation, Loader2 } from 'lucide-react';

interface EmergencyPanelProps {
  units: EmergencyUnit[];
  onRouteCalculated?: (route: { lat: number; lng: number }[]) => void;
}

const iconMap = {
  ambulance: Ambulance,
  fire: Flame,
  police: Shield,
};

const statusColors = {
  available: 'text-neon-green',
  dispatched: 'text-neon-orange',
  'en-route': 'text-neon-red',
};

const ZONE_OPTIONS = INDIAN_ZONES.map(z => [z.id, z.name] as const);

export default function EmergencyPanel({ units, onRouteCalculated }: EmergencyPanelProps) {
  const available = units.filter(u => u.status === 'available').length;
  const dispatched = units.filter(u => u.status !== 'available').length;

  const [fromZone, setFromZone] = useState('z31'); // Delhi
  const [toZone, setToZone] = useState('z25'); // UP
  const [routing, setRouting] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; time: number; waypoints: number } | null>(null);

  const calculateRoute = async () => {
    setRouting(true);
    setRouteInfo(null);
    try {
      const from = ZONE_POSITIONS[fromZone];
      const to = ZONE_POSITIONS[toZone];
      const { data, error } = await supabase.functions.invoke('emergency-route', {
        body: { start_lat: from[0], start_lng: from[1], end_lat: to[0], end_lng: to[1] },
      });
      if (error) throw error;
      setRouteInfo({ distance: data.distance_km, time: data.estimated_time_min, waypoints: data.waypoints });
      onRouteCalculated?.(data.route);
    } catch (err) {
      console.error('Route calculation failed:', err);
    } finally {
      setRouting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4 border-glow">
      <div className="flex items-center gap-2">
        <Siren className="w-5 h-5 text-neon-red" />
        <h3 className="font-display text-sm tracking-wider text-neon-red">EMERGENCY UNITS</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary rounded-md p-3 text-center">
          <div className="font-mono-tech text-2xl text-neon-green">{available}</div>
          <div className="text-xs text-muted-foreground">Available</div>
        </div>
        <div className="bg-secondary rounded-md p-3 text-center">
          <div className="font-mono-tech text-2xl text-neon-orange">{dispatched}</div>
          <div className="text-xs text-muted-foreground">Dispatched</div>
        </div>
      </div>

      {/* Emergency Route Planner */}
      <div className="border-t border-border pt-3 space-y-2">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-neon-cyan" />
          <h4 className="font-display text-xs tracking-wider text-neon-cyan">ROUTE PLANNER</h4>
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-muted-foreground font-mono-tech">From</label>
            <select
              value={fromZone}
              onChange={e => setFromZone(e.target.value)}
              className="w-full bg-secondary text-foreground text-xs font-mono-tech rounded-md px-2 py-1.5 border border-border focus:border-primary outline-none"
            >
              {ZONE_OPTIONS.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-mono-tech">To</label>
            <select
              value={toZone}
              onChange={e => setToZone(e.target.value)}
              className="w-full bg-secondary text-foreground text-xs font-mono-tech rounded-md px-2 py-1.5 border border-border focus:border-primary outline-none"
            >
              {ZONE_OPTIONS.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={calculateRoute}
            disabled={routing || fromZone === toZone}
            className="w-full flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-mono-tech text-xs py-2 rounded-md transition-colors disabled:opacity-40"
          >
            {routing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
            {routing ? 'CALCULATING...' : 'DISPATCH ROUTE'}
          </button>
        </div>

        {routeInfo && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            className="bg-secondary rounded-md p-2 space-y-1"
          >
            <div className="flex justify-between text-xs font-mono-tech">
              <span className="text-muted-foreground">Distance</span>
              <span className="text-neon-cyan">{routeInfo.distance} km</span>
            </div>
            <div className="flex justify-between text-xs font-mono-tech">
              <span className="text-muted-foreground">ETA</span>
              <span className="text-neon-green">{routeInfo.time} min</span>
            </div>
            <div className="flex justify-between text-xs font-mono-tech">
              <span className="text-muted-foreground">Waypoints</span>
              <span className="text-foreground">{routeInfo.waypoints}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Unit List */}
      <div className="space-y-2 max-h-36 overflow-y-auto">
        {units.map((u, i) => {
          const Icon = iconMap[u.type];
          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 bg-secondary rounded-md p-2"
            >
              <Icon className={`w-4 h-4 ${statusColors[u.status]}`} />
              <span className="font-mono-tech text-sm text-foreground capitalize flex-1">{u.type} {u.id.slice(-2)}</span>
              <span className={`text-xs font-mono-tech capitalize ${statusColors[u.status]}`}>{u.status}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
