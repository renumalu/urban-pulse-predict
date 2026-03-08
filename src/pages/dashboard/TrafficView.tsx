import { motion } from 'framer-motion';
import TrafficPanel from '@/components/TrafficPanel';
import TrafficPredictionPanel from '@/components/TrafficPredictionPanel';
import PredictionTimeline from '@/components/PredictionTimeline';
import City3DView from '@/components/City3DView';
import CityMapView from '@/components/CityMapView';
import type { TrafficData, FloodData, AccidentData, EmergencyUnit } from '@/lib/simulation';

interface TrafficViewProps {
  traffic: TrafficData[];
  flood: FloodData[];
  accidents: AccidentData[];
  emergencyUnits: EmergencyUnit[];
  trafficHistory: { time: string; value: number }[];
  viewMode: '3d' | 'map';
}

export default function TrafficView({
  traffic, flood, accidents, emergencyUnits, trafficHistory, viewMode
}: TrafficViewProps) {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-y-auto">
      {/* Left panel - Traffic data */}
      <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <TrafficPanel traffic={traffic} history={trafficHistory} />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <TrafficPredictionPanel />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <PredictionTimeline />
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
              emergencyRoute={[]}
            />
          ) : (
            <City3DView traffic={traffic} flood={flood} accidents={accidents} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
