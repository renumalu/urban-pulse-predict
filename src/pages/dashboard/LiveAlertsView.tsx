import AlertsPanel from '@/components/AlertsPanel';
import type { Alert } from '@/lib/simulation';

interface LiveAlertsViewProps {
  alerts: Alert[];
}

export default function LiveAlertsView({ alerts }: LiveAlertsViewProps) {
  return (
    <div className="h-full p-4 overflow-y-auto">
      <AlertsPanel alerts={alerts} />
    </div>
  );
}
