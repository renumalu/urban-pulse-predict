import { motion } from 'framer-motion';
import City3DView from '@/components/City3DView';
import CityMapView from '@/components/CityMapView';
import SolutionsPanel from '@/components/SolutionsPanel';
import AlertsPanel from '@/components/AlertsPanel';
import DataStreamStatus from '@/components/DataStreamStatus';
import SmartCityControlCenter from '@/components/SmartCityControlCenter';
import type { TrafficData, FloodData, AccidentData, EmergencyUnit, Alert } from '@/lib/simulation';

interface DashboardOverviewProps {
  traffic: TrafficData[];
  flood: FloodData[];
  accidents: AccidentData[];
  emergencyUnits: EmergencyUnit[];
  alerts: Alert[];
  emergencyRoute: { lat: number; lng: number }[];
  viewMode: '3d' | 'map';
}

export default function DashboardOverview({
  traffic, flood, accidents, emergencyUnits, alerts, emergencyRoute, viewMode
}: DashboardOverviewProps) {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 overflow-y-auto">
      {/* Left panel - Solutions & Status */}
      <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <SmartCityControlCenter />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <SolutionsPanel traffic={traffic} flood={flood} emergencyUnits={emergencyUnits} />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <AlertsPanel alerts={alerts} />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <DataStreamStatus />
        </motion.div>
      </div>

      {/* Center - Map or 3D View */}
      <div className="lg:col-span-3 min-h-[500px] order-1 lg:order-2">
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
