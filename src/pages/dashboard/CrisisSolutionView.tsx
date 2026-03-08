import SolutionsPanel from '@/components/SolutionsPanel';
import type { TrafficData, FloodData, EmergencyUnit } from '@/lib/simulation';

interface CrisisSolutionViewProps {
  traffic: TrafficData[];
  flood: FloodData[];
  emergencyUnits: EmergencyUnit[];
}

export default function CrisisSolutionView({ traffic, flood, emergencyUnits }: CrisisSolutionViewProps) {
  return (
    <div className="h-full p-4 overflow-y-auto">
      <SolutionsPanel traffic={traffic} flood={flood} emergencyUnits={emergencyUnits} />
    </div>
  );
}
