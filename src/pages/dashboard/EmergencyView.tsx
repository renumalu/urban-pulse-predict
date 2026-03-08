import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import EmergencyPanel from '@/components/EmergencyPanel';
import AlertsPanel from '@/components/AlertsPanel';
import City3DView from '@/components/City3DView';
import CityMapView from '@/components/CityMapView';
import type { TrafficData, FloodData, AccidentData, EmergencyUnit, Alert } from '@/lib/simulation';
import { Ambulance, Flame, Shield, AlertTriangle } from 'lucide-react';

interface EmergencyViewProps {
  traffic: TrafficData[];
  flood: FloodData[];
  accidents: AccidentData[];
  emergencyUnits: EmergencyUnit[];
  alerts: Alert[];
  viewMode: '3d' | 'map';
  onRouteCalculated: (route: { lat: number; lng: number }[]) => void;
  emergencyRoute: { lat: number; lng: number }[];
}

export default function EmergencyView({
  traffic, flood, accidents, emergencyUnits, alerts, viewMode, onRouteCalculated, emergencyRoute
}: EmergencyViewProps) {
  const ambulances = emergencyUnits.filter(u => u.type === 'ambulance');
  const fireUnits = emergencyUnits.filter(u => u.type === 'fire');
  const policeUnits = emergencyUnits.filter(u => u.type === 'police');

  const available = emergencyUnits.filter(u => u.status === 'available').length;
  const dispatched = emergencyUnits.filter(u => u.status === 'dispatched').length;
  const enRoute = emergencyUnits.filter(u => u.status === 'en-route').length;

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-y-auto">
      {/* Left panel - Emergency data */}
      <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">
        {/* Unit Summary */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-card border border-border rounded-lg p-4 space-y-4 border-glow">
            <div className="flex items-center gap-2">
              <Ambulance className="w-5 h-5 text-neon-red" />
              <h3 className="font-display text-sm tracking-wider text-neon-red">UNIT STATUS</h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-neon-green/10 rounded-md p-3 text-center">
                <div className="font-mono-tech text-xl text-neon-green">{available}</div>
                <div className="text-[10px] text-muted-foreground">Available</div>
              </div>
              <div className="bg-neon-orange/10 rounded-md p-3 text-center">
                <div className="font-mono-tech text-xl text-neon-orange">{dispatched}</div>
                <div className="text-[10px] text-muted-foreground">Dispatched</div>
              </div>
              <div className="bg-neon-cyan/10 rounded-md p-3 text-center">
                <div className="font-mono-tech text-xl text-neon-cyan">{enRoute}</div>
                <div className="text-[10px] text-muted-foreground">En Route</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Ambulance className="w-3 h-3 text-neon-red" />
                  <span className="text-muted-foreground">Ambulances</span>
                </div>
                <span className="font-mono-tech text-foreground">
                  {ambulances.filter(u => u.status === 'available').length}/{ambulances.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Flame className="w-3 h-3 text-neon-orange" />
                  <span className="text-muted-foreground">Fire Units</span>
                </div>
                <span className="font-mono-tech text-foreground">
                  {fireUnits.filter(u => u.status === 'available').length}/{fireUnits.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-primary" />
                  <span className="text-muted-foreground">Police</span>
                </div>
                <span className="font-mono-tech text-foreground">
                  {policeUnits.filter(u => u.status === 'available').length}/{policeUnits.length}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <EmergencyPanel units={emergencyUnits} onRouteCalculated={onRouteCalculated} />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <AlertsPanel alerts={alerts} />
        </motion.div>

        {/* Active Accidents */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
          <div className="bg-card border border-border rounded-lg p-4 border-glow">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-neon-orange" />
              <h4 className="text-xs text-muted-foreground font-display tracking-wider">ACTIVE INCIDENTS</h4>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {accidents.slice(0, 8).map(a => (
                <div key={a.id} className="flex items-center justify-between text-xs">
                  <span className="font-mono-tech text-foreground truncate w-28">{a.zone}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono-tech ${
                    a.severity === 'high' ? 'bg-neon-red/20 text-neon-red' :
                    a.severity === 'medium' ? 'bg-neon-orange/20 text-neon-orange' :
                    'bg-neon-green/20 text-neon-green'
                  }`}>
                    {a.severity}
                  </span>
                </div>
              ))}
              {accidents.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No active incidents</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Center - Map or 3D View */}
      <div className="lg:col-span-2 min-h-[500px] order-1 lg:order-2">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="h-full">
          {viewMode === 'map' ? (
            <CityMapView
              traffic={traffic}
              flood={flood}
              accidents={accidents}
              emergencyUnits={emergencyUnits}
              emergencyRoute={emergencyRoute}
            />
          ) : (
            <City3DView traffic={traffic} flood={flood} accidents={accidents} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
