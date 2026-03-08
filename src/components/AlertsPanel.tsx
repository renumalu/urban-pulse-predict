import { motion, AnimatePresence } from 'framer-motion';
import type { Alert } from '@/lib/simulation';
import { Bell, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface AlertsPanelProps {
  alerts: Alert[];
}

const severityConfig = {
  critical: { icon: AlertTriangle, color: 'text-neon-red', bg: 'bg-neon-red/10 border-neon-red/30' },
  warning: { icon: AlertCircle, color: 'text-neon-orange', bg: 'bg-neon-orange/10 border-neon-orange/30' },
  info: { icon: Info, color: 'text-neon-blue', bg: 'bg-neon-blue/10 border-neon-blue/30' },
};

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3 border-glow">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-neon-orange" />
        <h3 className="font-display text-sm tracking-wider text-neon-orange">LIVE ALERTS</h3>
        {alerts.length > 0 && (
          <span className="ml-auto bg-neon-red/20 text-neon-red text-xs font-mono-tech px-2 py-0.5 rounded-full animate-pulse-neon">
            {alerts.length}
          </span>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1">
        <AnimatePresence mode="popLayout">
          {alerts.slice(0, 8).map((alert) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex items-start gap-2 p-2 rounded-md border ${config.bg}`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.color}`} />
                <div className="min-w-0">
                  <p className="text-xs text-foreground leading-tight">{alert.message}</p>
                  <p className="text-xs text-muted-foreground font-mono-tech mt-0.5">{alert.zone}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {alerts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4 font-mono-tech">No active alerts</p>
        )}
      </div>
    </div>
  );
}
