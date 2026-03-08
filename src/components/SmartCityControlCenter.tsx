import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, AlertTriangle, Route, BrainCircuit, TrafficCone, Activity,
  Shield, Check, X, MapPin, Clock, TrendingUp, TrendingDown, Zap,
  Radio, Volume2, VolumeX
} from 'lucide-react';
import { toast } from 'sonner';
import {
  checkAndDispatchAlerts,
  getDynamicRoutes,
  detectAnomalies,
  optimizeSignalTimings,
  requestNotificationPermission,
  sendBrowserNotification,
  type Alert,
  type RouteOption,
  type Anomaly,
  type SignalOptimization,
} from '@/lib/smart-city-engine';
import { ZONE_MAP, INDIAN_ZONES, ZONE_POSITIONS } from '@/lib/india-zones';

interface SmartCityControlCenterProps {
  onRouteSelected?: (route: RouteOption) => void;
}

export default function SmartCityControlCenter({ onRouteSelected }: SmartCityControlCenterProps) {
  const [activeTab, setActiveTab] = useState<'alerts' | 'routes' | 'anomalies' | 'signals'>('alerts');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [signalOptimizations, setSignalOptimizations] = useState<SignalOptimization[]>([]);
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try { return typeof Notification !== 'undefined' && Notification.permission === 'granted'; }
    catch { return false; }
  });
  const [fromZone, setFromZone] = useState('z31');
  const [toZone, setToZone] = useState('z13');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    const newAlerts = await checkAndDispatchAlerts();
    setAlerts(prev => {
      const existingIds = new Set(prev.map(a => a.id.split('-').slice(0, 3).join('-')));
      const uniqueNew = newAlerts.filter(a => !existingIds.has(a.id.split('-').slice(0, 3).join('-')));
      
      // Send browser notifications for critical alerts
      if (notificationsEnabled) {
        uniqueNew.filter(a => a.severity === 'critical').forEach(a => {
          sendBrowserNotification('🚨 Critical Alert', a.message);
        });
      }

      // Show toast for new alerts
      uniqueNew.slice(0, 3).forEach(a => {
        if (a.severity === 'critical') toast.error(a.message, { duration: 5000 });
        else if (a.severity === 'high') toast.warning(a.message, { duration: 4000 });
      });

      return [...uniqueNew, ...prev].slice(0, 50);
    });
  }, [notificationsEnabled]);

  // Fetch routes
  const fetchRoutes = useCallback(async () => {
    if (fromZone === toZone) return;
    setLoading(true);
    const routeOptions = await getDynamicRoutes(fromZone, toZone);
    setRoutes(routeOptions);
    setLoading(false);
  }, [fromZone, toZone]);

  // Fetch anomalies
  const fetchAnomalies = useCallback(async () => {
    const detected = await detectAnomalies();
    setAnomalies(detected);
    
    // Notify for severe anomalies
    detected.filter(a => a.severity > 0.7).forEach(a => {
      if (notificationsEnabled) {
        sendBrowserNotification('⚠️ Anomaly Detected', a.description);
      }
    });
  }, [notificationsEnabled]);

  // Fetch signal optimizations
  const fetchSignalOptimizations = useCallback(async () => {
    const opts = await optimizeSignalTimings();
    setSignalOptimizations(opts);
  }, []);

  // Initial load and auto-refresh
  useEffect(() => {
    fetchAlerts();
    fetchAnomalies();
    fetchSignalOptimizations();
  }, [fetchAlerts, fetchAnomalies, fetchSignalOptimizations]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAlerts();
      fetchAnomalies();
      fetchSignalOptimizations();
    }, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAlerts, fetchAnomalies, fetchSignalOptimizations]);

  const enableNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      toast.info('🔇 Push notifications disabled');
      return;
    }
    // Check if Notification API is available (blocked in iframes)
    if (typeof Notification === 'undefined') {
      toast.warning('⚠️ Notifications are not available in embedded preview. Open in a new tab to enable.');
      // Still toggle the internal state so the UI reflects the intent
      setNotificationsEnabled(true);
      toast.success('🔔 In-app alert toasts will be shown for critical events');
      return;
    }
    try {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
      if (granted) {
        toast.success('🔔 Push notifications enabled — you will receive critical alerts');
        sendBrowserNotification('UrbanPulse', 'You will now receive critical alerts');
      } else {
        // Even if browser denies, enable in-app toasts
        setNotificationsEnabled(true);
        toast.info('🔔 Browser denied push — in-app alert toasts enabled instead');
      }
    } catch {
      setNotificationsEnabled(true);
      toast.info('🔔 In-app alert toasts enabled (push not supported here)');
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    toast.success('Alert acknowledged');
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-500/10';
      case 'high': return 'border-neon-orange bg-neon-orange/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-neon-green bg-neon-green/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'traffic': return <TrafficCone className="w-4 h-4" />;
      case 'flood': return <Activity className="w-4 h-4" />;
      case 'accident': return <AlertTriangle className="w-4 h-4" />;
      case 'anomaly': return <BrainCircuit className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
  const anomalyCount = anomalies.filter(a => a.severity > 0.5).length;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden border-glow">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-neon-purple" />
          <h3 className="font-display text-sm tracking-wider text-neon-purple">SMART CITY CONTROL</h3>
          {autoRefresh && (
            <Radio className="w-3 h-3 text-neon-green animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={enableNotifications}
            className={`p-1.5 rounded-md transition-colors ${notificationsEnabled ? 'text-neon-green bg-neon-green/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
            title={notificationsEnabled ? 'Click to disable notifications' : 'Click to enable notifications'}
          >
            {notificationsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              const next = !autoRefresh;
              setAutoRefresh(next);
              toast.info(next ? '⚡ Auto-refresh ON — data updates every 30s' : '⏸️ Auto-refresh paused');
            }}
            className={`p-1.5 rounded-md transition-colors ${autoRefresh ? 'text-neon-green bg-neon-green/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
            title={autoRefresh ? 'Auto-refresh ON (click to pause)' : 'Auto-refresh OFF (click to resume)'}
          >
            <Zap className={`w-4 h-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {[
          { id: 'alerts', label: 'Alerts', icon: Bell, badge: criticalCount },
          { id: 'routes', label: 'Routes', icon: Route },
          { id: 'anomalies', label: 'Anomalies', icon: BrainCircuit, badge: anomalyCount },
          { id: 'signals', label: 'Signals', icon: TrafficCone },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono-tech transition-colors relative ${
              activeTab === tab.id 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge ? (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* ALERTS TAB */}
          {activeTab === 'alerts' && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-mono-tech">No active alerts</p>
                </div>
              ) : (
                alerts.slice(0, 10).map((alert, i) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`border rounded-lg p-3 ${getSeverityColor(alert.severity)} ${alert.acknowledged ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-md ${
                        alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        alert.severity === 'high' ? 'bg-neon-orange/20 text-neon-orange' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {getTypeIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground font-mono-tech">
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                          {alert.dispatched && (
                            <span className="text-[10px] text-neon-green font-mono-tech">• DISPATCHED</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {!alert.acknowledged && (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="p-1 rounded hover:bg-secondary text-neon-green"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ROUTES TAB */}
          {activeTab === 'routes' && (
            <motion.div
              key="routes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground font-mono-tech">FROM</label>
                  <select
                    value={fromZone}
                    onChange={e => setFromZone(e.target.value)}
                    className="w-full bg-secondary text-foreground text-xs font-mono-tech rounded-md px-2 py-1.5 border border-border"
                  >
                    {INDIAN_ZONES.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-mono-tech">TO</label>
                  <select
                    value={toZone}
                    onChange={e => setToZone(e.target.value)}
                    className="w-full bg-secondary text-foreground text-xs font-mono-tech rounded-md px-2 py-1.5 border border-border"
                  >
                    {INDIAN_ZONES.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={fetchRoutes}
                disabled={loading || fromZone === toZone}
                className="w-full py-2 rounded-md bg-primary/20 text-primary font-mono-tech text-xs hover:bg-primary/30 disabled:opacity-50"
              >
                {loading ? 'Finding routes...' : 'Find Alternative Routes'}
              </button>

              {routes.length > 0 && (
                <div className="space-y-2">
                  {routes.map((route, i) => (
                    <motion.div
                      key={route.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => onRouteSelected?.(route)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        route.is_recommended 
                          ? 'border-neon-green bg-neon-green/10 hover:bg-neon-green/20' 
                          : 'border-border hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono-tech text-foreground">
                          {route.id === 'direct' ? 'Direct Route' : route.reason}
                        </span>
                        {route.is_recommended && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-green/20 text-neon-green font-mono-tech">
                            RECOMMENDED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-mono-tech text-muted-foreground">
                        <span>{route.distance_km} km</span>
                        <span>{route.estimated_time_min} min</span>
                        <span className={route.congestion_level > 0.6 ? 'text-neon-red' : route.congestion_level > 0.3 ? 'text-neon-orange' : 'text-neon-green'}>
                          {Math.round(route.congestion_level * 100)}% congestion
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ANOMALIES TAB */}
          {activeTab === 'anomalies' && (
            <motion.div
              key="anomalies"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {anomalies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BrainCircuit className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-mono-tech">No anomalies detected</p>
                </div>
              ) : (
                anomalies.map((anomaly, i) => (
                  <motion.div
                    key={anomaly.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`border rounded-lg p-3 ${
                      anomaly.severity > 0.7 ? 'border-red-500 bg-red-500/10' :
                      anomaly.severity > 0.4 ? 'border-neon-orange bg-neon-orange/10' :
                      'border-yellow-500 bg-yellow-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {anomaly.deviation_percent > 0 ? (
                        <TrendingUp className="w-4 h-4 text-neon-red" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-neon-cyan" />
                      )}
                      <span className="text-sm font-mono-tech text-foreground">
                        {ZONE_MAP[anomaly.zone_id]?.name || anomaly.zone_id}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{anomaly.description}</p>
                    <div className="flex items-center gap-4 text-[10px] font-mono-tech">
                      <span className="text-muted-foreground">
                        Baseline: <span className="text-foreground">{anomaly.baseline_value}%</span>
                      </span>
                      <span className="text-muted-foreground">
                        Current: <span className={anomaly.deviation_percent > 0 ? 'text-neon-red' : 'text-neon-green'}>
                          {anomaly.current_value}%
                        </span>
                      </span>
                      <span className={anomaly.deviation_percent > 0 ? 'text-neon-red' : 'text-neon-green'}>
                        {anomaly.deviation_percent > 0 ? '+' : ''}{anomaly.deviation_percent}%
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* SIGNALS TAB */}
          {activeTab === 'signals' && (
            <motion.div
              key="signals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {signalOptimizations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrafficCone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-mono-tech">No optimizations available</p>
                </div>
              ) : (
                <>
                  <div className="text-xs text-muted-foreground font-mono-tech mb-3">
                    AI-recommended signal timing adjustments based on predictions
                  </div>
                  {signalOptimizations.slice(0, 10).map((opt, i) => (
                    <motion.div
                      key={opt.zone_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border border-border rounded-lg p-3 bg-secondary/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-mono-tech text-foreground">{opt.zone_name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono-tech ${
                          opt.change_percent > 0 ? 'bg-neon-orange/20 text-neon-orange' : 'bg-neon-green/20 text-neon-green'
                        }`}>
                          {opt.change_percent > 0 ? '+' : ''}{opt.change_percent}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(opt.recommended_timing / 90) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono-tech text-foreground w-12 text-right">
                          {opt.recommended_timing}s
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono-tech">
                        <span className="text-muted-foreground">{opt.reason}</span>
                        <span className="text-neon-green">+{opt.expected_improvement}% flow</span>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
