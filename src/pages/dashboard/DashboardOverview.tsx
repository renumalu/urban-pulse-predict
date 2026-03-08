import { motion } from 'framer-motion';
import City3DView from '@/components/City3DView';
import CityMapView from '@/components/CityMapView';
import type { TrafficData, FloodData, AccidentData, EmergencyUnit } from '@/lib/simulation';

interface DashboardOverviewProps {
  traffic: TrafficData[];
  flood: FloodData[];
  accidents: AccidentData[];
  emergencyUnits: EmergencyUnit[];
  alerts: any[];
  emergencyRoute: { lat: number; lng: number }[];
  viewMode: '3d' | 'map';
}

export default function DashboardOverview({
  traffic, flood, accidents, emergencyUnits, emergencyRoute, viewMode
}: DashboardOverviewProps) {
  return (
    <div className="h-full p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="h-full">
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
  );
}
