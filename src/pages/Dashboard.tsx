import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSimulation } from '@/hooks/useSimulation';
import City3DView from '@/components/City3DView';
import CityMapView from '@/components/CityMapView';
import TrafficPanel from '@/components/TrafficPanel';
import FloodPanel from '@/components/FloodPanel';
import EmergencyPanel from '@/components/EmergencyPanel';
import AlertsPanel from '@/components/AlertsPanel';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import { Activity, Radio, Map, Box, Database, Wifi, MessageSquarePlus, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { traffic, flood, accidents, emergencyUnits, alerts, trafficHistory, floodHistory, useBackend } = useSimulation(5000);
  const [viewMode, setViewMode] = useState<'3d' | 'map'>('map');
  const [emergencyRoute, setEmergencyRoute] = useState<{ lat: number; lng: number }[]>([]);
  const handleRouteCalculated = useCallback((route: { lat: number; lng: number }[]) => {
    setEmergencyRoute(route);
    setViewMode('map');
  }, []);

  return (
    <div className="min-h-screen bg-background grid-bg scanline">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center glow-blue">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-lg tracking-widest text-primary text-glow-blue">URBANPULSE</h1>
            <p className="text-xs text-muted-foreground font-mono-tech -mt-0.5">Predictive Digital Twin</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-secondary rounded-md p-1">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono-tech transition-colors ${viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Map className="w-3 h-3" /> Map
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono-tech transition-colors ${viewMode === '3d' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Box className="w-3 h-3" /> 3D
            </button>
          </div>
          {/* Backend indicator */}
          <div className="flex items-center gap-1">
            {useBackend ? (
              <Database className="w-3 h-3 text-neon-cyan" />
            ) : (
              <Wifi className="w-3 h-3 text-muted-foreground" />
            )}
            <span className="text-xs font-mono-tech text-muted-foreground">
              {useBackend ? 'CLOUD' : 'LOCAL'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 text-neon-green animate-pulse-neon" />
            <span className="text-xs font-mono-tech text-neon-green">LIVE</span>
          </div>
          <span className="text-xs font-mono-tech text-muted-foreground">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </header>

      {/* Main Layout */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-60px)]">
        {/* Left sidebar */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <TrafficPanel traffic={traffic} history={trafficHistory} />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <FloodPanel flood={flood} history={floodHistory} />
          </motion.div>
        </div>

        {/* Center - Map or 3D View */}
        <div className="lg:col-span-2 min-h-[400px]">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="h-full">
            {viewMode === 'map' ? (
              <CityMapView traffic={traffic} flood={flood} accidents={accidents} emergencyUnits={emergencyUnits} emergencyRoute={emergencyRoute} />
            ) : (
              <City3DView traffic={traffic} flood={flood} accidents={accidents} />
            )}
          </motion.div>
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <AlertsPanel alerts={alerts} />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <EmergencyPanel units={emergencyUnits} onRouteCalculated={handleRouteCalculated} />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <AnalyticsPanel traffic={traffic} flood={flood} accidents={accidents} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
