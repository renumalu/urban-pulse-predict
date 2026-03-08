import { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { useSimulation } from '@/hooks/useSimulation';
import DashboardOverview from '@/pages/dashboard/DashboardOverview';
import TrafficView from '@/pages/dashboard/TrafficView';
import FloodView from '@/pages/dashboard/FloodView';
import EmergencyView from '@/pages/dashboard/EmergencyView';
import AnalyticsView from '@/pages/dashboard/AnalyticsView';
import AIPredictionsView from '@/pages/dashboard/AIPredictionsView';
import AIChatWidget from '@/components/AIChatWidget';
import { Box, Map, Database, Wifi } from 'lucide-react';

export default function Dashboard() {
  const { traffic, flood, accidents, emergencyUnits, alerts, trafficHistory, floodHistory, useBackend } = useSimulation(5000);
  const [viewMode, setViewMode] = useState<'3d' | 'map'>('map');
  const [emergencyRoute, setEmergencyRoute] = useState<{ lat: number; lng: number }[]>([]);

  const handleRouteCalculated = useCallback((route: { lat: number; lng: number }[]) => {
    setEmergencyRoute(route);
    setViewMode('map');
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background grid-bg scanline">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-12 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <span className="text-xs font-mono-tech text-muted-foreground">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
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
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route index element={
                <DashboardOverview
                  traffic={traffic}
                  flood={flood}
                  accidents={accidents}
                  emergencyUnits={emergencyUnits}
                  alerts={alerts}
                  emergencyRoute={emergencyRoute}
                  viewMode={viewMode}
                />
              } />
              <Route path="traffic" element={
                <TrafficView
                  traffic={traffic}
                  flood={flood}
                  accidents={accidents}
                  emergencyUnits={emergencyUnits}
                  trafficHistory={trafficHistory}
                  viewMode={viewMode}
                />
              } />
              <Route path="flood" element={
                <FloodView
                  traffic={traffic}
                  flood={flood}
                  accidents={accidents}
                  emergencyUnits={emergencyUnits}
                  floodHistory={floodHistory}
                  viewMode={viewMode}
                />
              } />
              <Route path="emergency" element={
                <EmergencyView
                  traffic={traffic}
                  flood={flood}
                  accidents={accidents}
                  emergencyUnits={emergencyUnits}
                  alerts={alerts}
                  viewMode={viewMode}
                  onRouteCalculated={handleRouteCalculated}
                  emergencyRoute={emergencyRoute}
                />
              } />
              <Route path="analytics" element={
                <AnalyticsView
                  traffic={traffic}
                  flood={flood}
                  accidents={accidents}
                />
              } />
              <Route path="predictions" element={<AIPredictionsView />} />
            </Routes>
          </main>
        </div>

        <AIChatWidget />
      </div>
    </SidebarProvider>
  );
}
