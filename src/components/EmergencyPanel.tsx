import { motion } from 'framer-motion';
import type { EmergencyUnit } from '@/lib/simulation';
import { Siren, Flame, Shield, Ambulance } from 'lucide-react';

interface EmergencyPanelProps {
  units: EmergencyUnit[];
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

export default function EmergencyPanel({ units }: EmergencyPanelProps) {
  const available = units.filter(u => u.status === 'available').length;
  const dispatched = units.filter(u => u.status !== 'available').length;

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

      <div className="space-y-2 max-h-48 overflow-y-auto">
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
              <span className="font-mono-tech text-sm text-foreground capitalize flex-1">{u.type} {u.id.slice(-1)}</span>
              <span className={`text-xs font-mono-tech capitalize ${statusColors[u.status]}`}>{u.status}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
