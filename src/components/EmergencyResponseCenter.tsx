import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Ambulance, Flame, Shield, Siren, Phone, Navigation, Loader2,
  AlertTriangle, MapPin, Clock, CheckCircle2, XCircle, Radio,
  Send, PhoneCall, BellRing, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { INDIAN_ZONES, ZONE_POSITIONS, ZONE_MAP } from '@/lib/india-zones';

interface EmergencyUnit {
  id: string;
  unit_id: string;
  unit_type: string;
  status: string;
  lat: number;
  lng: number;
  updated_at: string;
}

interface EmergencyCall {
  id: string;
  type: 'ambulance' | 'fire' | 'police';
  zone_id: string;
  zone_name: string;
  status: 'pending' | 'dispatched' | 'en-route' | 'resolved';
  severity: string;
  description: string;
  timestamp: Date;
  dispatched_unit?: string;
}

export default function EmergencyResponseCenter() {
  const [activeTab, setActiveTab] = useState<'dispatch' | 'calls' | 'units' | 'history'>('dispatch');
  const [units, setUnits] = useState<EmergencyUnit[]>([]);
  const [calls, setCalls] = useState<EmergencyCall[]>([]);
  const [loading, setLoading] = useState(false);

  // Dispatch form
  const [dispatchType, setDispatchType] = useState<'ambulance' | 'fire' | 'police'>('ambulance');
  const [targetZone, setTargetZone] = useState('z31');
  const [emergencyDesc, setEmergencyDesc] = useState('');
  const [dispatching, setDispatching] = useState(false);

  const fetchUnits = useCallback(async () => {
    const { data } = await supabase.from('emergency_units').select('*');
    if (data) setUnits(data);
  }, []);

  const fetchRecentAlerts = useCallback(async () => {
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setCalls(data.map(a => ({
        id: a.id,
        type: a.alert_type === 'traffic' ? 'police' as const : a.alert_type === 'flood' ? 'fire' as const : 'ambulance' as const,
        zone_id: a.zone_id,
        zone_name: ZONE_MAP[a.zone_id]?.name || a.zone_id,
        status: 'dispatched' as const,
        severity: a.severity,
        description: a.message,
        timestamp: new Date(a.created_at),
      })));
    }
  }, []);

  useEffect(() => {
    fetchUnits();
    fetchRecentAlerts();

    // Real-time unit updates
    const channel = supabase
      .channel('emergency-units-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_units' }, () => fetchUnits())
      .subscribe();

    const interval = setInterval(() => { fetchUnits(); fetchRecentAlerts(); }, 15000);
    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, [fetchUnits, fetchRecentAlerts]);

  const handleDispatch = async () => {
    if (!emergencyDesc.trim()) {
      toast.error('Please describe the emergency');
      return;
    }

    setDispatching(true);
    try {
      const zoneName = ZONE_MAP[targetZone]?.name || targetZone;
      const { data, error } = await supabase.functions.invoke('emergency-alert-email', {
        body: {
          alert_type: 'emergency_dispatch',
          zone_id: targetZone,
          zone_name: zoneName,
          severity: 'critical',
          details: emergencyDesc,
          dispatch_type: dispatchType,
        },
      });

      if (error) throw error;

      toast.success(data.message || `${dispatchType} dispatched to ${zoneName}`);
      setEmergencyDesc('');
      fetchUnits();
      fetchRecentAlerts();
    } catch (err: any) {
      toast.error('Dispatch failed: ' + (err.message || 'Unknown error'));
    } finally {
      setDispatching(false);
    }
  };

  const ambulances = units.filter(u => u.unit_type === 'ambulance');
  const fireUnits = units.filter(u => u.unit_type === 'fire');
  const policeUnits = units.filter(u => u.unit_type === 'police');
  const availableCount = units.filter(u => u.status === 'available').length;
  const dispatchedCount = units.filter(u => u.status !== 'available').length;

  const unitTypeConfig = {
    ambulance: { icon: Ambulance, color: 'text-neon-red', bg: 'bg-neon-red/10', border: 'border-neon-red/30' },
    fire: { icon: Flame, color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/30' },
    police: { icon: Shield, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
  };

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-4 border-glow">
          <div className="flex items-center gap-2 mb-2">
            <Siren className="w-4 h-4 text-neon-red" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">TOTAL UNITS</span>
          </div>
          <div className="font-mono-tech text-2xl text-foreground">{units.length}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 border-glow">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-neon-green" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">AVAILABLE</span>
          </div>
          <div className="font-mono-tech text-2xl text-neon-green">{availableCount}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 border-glow">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-4 h-4 text-neon-orange" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">DISPATCHED</span>
          </div>
          <div className="font-mono-tech text-2xl text-neon-orange">{dispatchedCount}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 border-glow">
          <div className="flex items-center gap-2 mb-2">
            <BellRing className="w-4 h-4 text-neon-cyan" />
            <span className="text-[10px] font-mono-tech text-muted-foreground">ACTIVE CALLS</span>
          </div>
          <div className="font-mono-tech text-2xl text-neon-cyan">{calls.filter(c => c.status !== 'resolved').length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border border-border rounded-lg overflow-hidden border-glow">
        <div className="flex border-b border-border">
          {[
            { id: 'dispatch', label: 'Emergency Dispatch', icon: Send },
            { id: 'calls', label: 'Active Calls', icon: PhoneCall },
            { id: 'units', label: 'Unit Tracker', icon: Navigation },
            { id: 'history', label: 'Alert Log', icon: Activity },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-mono-tech transition-colors ${
                activeTab === tab.id ? 'text-primary bg-primary/10 border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* DISPATCH TAB */}
          {activeTab === 'dispatch' && (
            <motion.div key="dispatch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="text-xs font-mono-tech text-muted-foreground mb-2">
                  Dispatch emergency services to any zone. Alerts are logged and nearest available unit is auto-assigned.
                </div>

                {/* Unit type selection */}
                <div>
                  <label className="text-[10px] font-mono-tech text-muted-foreground mb-1.5 block">DISPATCH TYPE</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['ambulance', 'fire', 'police'] as const).map(type => {
                      const cfg = unitTypeConfig[type];
                      const Icon = cfg.icon;
                      const available = units.filter(u => u.unit_type === type && u.status === 'available').length;
                      return (
                        <button
                          key={type}
                          onClick={() => setDispatchType(type)}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            dispatchType === type ? `${cfg.border} ${cfg.bg} ring-1 ring-offset-1 ring-offset-background` : 'border-border hover:bg-secondary/50'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mx-auto mb-1 ${dispatchType === type ? cfg.color : 'text-muted-foreground'}`} />
                          <div className="text-xs font-mono-tech capitalize">{type}</div>
                          <div className={`text-[10px] font-mono-tech ${available > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                            {available} available
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target zone */}
                <div>
                  <label className="text-[10px] font-mono-tech text-muted-foreground mb-1.5 block">TARGET ZONE</label>
                  <select
                    value={targetZone}
                    onChange={e => setTargetZone(e.target.value)}
                    className="w-full bg-secondary text-foreground text-xs font-mono-tech rounded-md px-3 py-2 border border-border focus:border-primary outline-none"
                  >
                    {INDIAN_ZONES.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-mono-tech text-muted-foreground mb-1.5 block">EMERGENCY DESCRIPTION</label>
                  <textarea
                    value={emergencyDesc}
                    onChange={e => setEmergencyDesc(e.target.value)}
                    placeholder="Describe the emergency situation..."
                    className="w-full bg-secondary text-foreground text-xs font-mono-tech rounded-md px-3 py-2 border border-border focus:border-primary outline-none resize-none h-20"
                  />
                </div>

                {/* Dispatch button */}
                <button
                  onClick={handleDispatch}
                  disabled={dispatching || !emergencyDesc.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-neon-red/20 hover:bg-neon-red/30 border border-neon-red/40 text-neon-red font-mono-tech text-sm py-3 rounded-md transition-colors disabled:opacity-40"
                >
                  {dispatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Siren className="w-4 h-4" />}
                  {dispatching ? 'DISPATCHING...' : '🚨 DISPATCH EMERGENCY'}
                </button>
              </motion.div>
            )}

            {/* CALLS TAB */}
            {activeTab === 'calls' && (
              <motion.div key="calls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {calls.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-mono-tech">No active emergency calls</p>
                  </div>
                ) : (
                  calls.slice(0, 15).map((call, i) => {
                    const cfg = unitTypeConfig[call.type] || unitTypeConfig.ambulance;
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={call.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`border rounded-lg p-3 ${cfg.border} ${cfg.bg}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-md ${cfg.bg}`}>
                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono-tech text-foreground">{call.zone_name}</span>
                              <span className={`text-[10px] font-mono-tech px-1.5 py-0.5 rounded ${
                                call.severity === 'critical' ? 'bg-neon-red/20 text-neon-red' : 'bg-neon-orange/20 text-neon-orange'
                              }`}>{call.severity}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{call.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[10px] font-mono-tech text-muted-foreground">
                                {call.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}

            {/* UNITS TAB */}
            {activeTab === 'units' && (
              <motion.div key="units" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Unit type breakdown */}
                {(['ambulance', 'fire', 'police'] as const).map(type => {
                  const cfg = unitTypeConfig[type];
                  const Icon = cfg.icon;
                  const typeUnits = units.filter(u => u.unit_type === type);
                  return (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                        <span className="text-xs font-mono-tech text-foreground capitalize">{type} Units</span>
                        <span className="text-[10px] font-mono-tech text-muted-foreground ml-auto">
                          {typeUnits.filter(u => u.status === 'available').length}/{typeUnits.length} available
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {typeUnits.map(unit => (
                          <div key={unit.id} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-secondary/50">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                unit.status === 'available' ? 'bg-neon-green animate-pulse' :
                                unit.status === 'dispatched' ? 'bg-neon-orange' : 'bg-neon-red'
                              }`} />
                              <span className="text-xs font-mono-tech text-foreground">{unit.unit_id}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono-tech text-muted-foreground">
                                {unit.lat.toFixed(2)}°, {unit.lng.toFixed(2)}°
                              </span>
                              <span className={`text-[10px] font-mono-tech capitalize ${
                                unit.status === 'available' ? 'text-neon-green' : 
                                unit.status === 'dispatched' ? 'text-neon-orange' : 'text-neon-red'
                              }`}>{unit.status}</span>
                            </div>
                          </div>
                        ))}
                        {typeUnits.length === 0 && (
                          <p className="text-[10px] text-muted-foreground text-center py-2">No {type} units registered</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                <div className="text-xs font-mono-tech text-muted-foreground mb-2">
                  Recent emergency alerts and dispatch history
                </div>
                {calls.map((call, i) => (
                  <motion.div
                    key={call.id}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      call.severity === 'critical' ? 'bg-neon-red' : 'bg-neon-orange'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{call.description}</p>
                    </div>
                    <span className="text-[10px] font-mono-tech text-muted-foreground whitespace-nowrap">
                      {call.timestamp.toLocaleTimeString()}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          {/* end tabs */}
        </div>
      </div>
    </div>
  );
}
