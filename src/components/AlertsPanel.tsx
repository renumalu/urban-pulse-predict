import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ZONE_MAP } from '@/lib/india-zones';

interface DbAlert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  zone_id: string;
  is_active: boolean;
  created_at: string;
}

const severityConfig: Record<string, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  critical: { icon: AlertTriangle, color: 'text-neon-red', bg: 'bg-neon-red/10 border-neon-red/30' },
  warning: { icon: AlertCircle, color: 'text-neon-orange', bg: 'bg-neon-orange/10 border-neon-orange/30' },
  info: { icon: Info, color: 'text-neon-blue', bg: 'bg-neon-blue/10 border-neon-blue/30' },
};

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<DbAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50);
    setAlerts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();

    // Realtime subscription
    const channel = supabase
      .channel('live-alerts-panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newAlert = payload.new as DbAlert;
          if (newAlert.is_active) {
            setAlerts(prev => [newAlert, ...prev].slice(0, 50));
          }
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as DbAlert;
          setAlerts(prev => {
            if (!updated.is_active) return prev.filter(a => a.id !== updated.id);
            return prev.map(a => a.id === updated.id ? updated : a);
          });
        } else if (payload.eventType === 'DELETE') {
          setAlerts(prev => prev.filter(a => a.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    // Polling fallback every 15s
    const interval = setInterval(fetchAlerts, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3 border-glow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-neon-orange" />
          <h3 className="font-display text-sm tracking-wider text-neon-orange">LIVE ALERTS</h3>
          {alerts.length > 0 && (
            <span className="ml-2 bg-neon-red/20 text-neon-red text-xs font-mono-tech px-2 py-0.5 rounded-full animate-pulse-neon">
              {alerts.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchAlerts} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-2 text-[10px] font-mono-tech">
            {criticalCount > 0 && <span className="text-neon-red">{criticalCount} CRITICAL</span>}
            {warningCount > 0 && <span className="text-neon-orange">{warningCount} WARNING</span>}
          </div>
        </div>
      </div>

      <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin pr-1">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert) => {
            const config = severityConfig[alert.severity] || severityConfig.info;
            const Icon = config.icon;
            const zoneName = ZONE_MAP[alert.zone_id]?.name || alert.zone_id;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex items-start gap-2 p-3 rounded-md border ${config.bg}`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground leading-tight">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground font-mono-tech">{zoneName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono-tech">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                    <span className={`text-[10px] font-mono-tech px-1.5 py-0.5 rounded ${
                      alert.severity === 'critical' ? 'bg-neon-red/20 text-neon-red' : 'bg-neon-orange/20 text-neon-orange'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {alerts.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground text-center py-8 font-mono-tech">No active alerts</p>
        )}
      </div>
    </div>
  );
}
