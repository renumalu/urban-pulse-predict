import { useState, useEffect, useCallback } from 'react';
import { updateSimulation, generateTimeSeriesData, type TrafficData, type FloodData, type AccidentData, type EmergencyUnit, type Alert } from '@/lib/simulation';

export function useSimulation(interval = 3000) {
  const [traffic, setTraffic] = useState<TrafficData[]>([]);
  const [flood, setFlood] = useState<FloodData[]>([]);
  const [accidents, setAccidents] = useState<AccidentData[]>([]);
  const [emergencyUnits, setEmergencyUnits] = useState<EmergencyUnit[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trafficHistory] = useState(() => generateTimeSeriesData(24));
  const [floodHistory] = useState(() => generateTimeSeriesData(24));

  const tick = useCallback(() => {
    const data = updateSimulation();
    setTraffic(data.traffic);
    setFlood(data.flood);
    setAccidents(data.accidents);
    setEmergencyUnits(data.emergencyUnits);
    setAlerts(data.alerts);
  }, []);

  useEffect(() => {
    tick();
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [tick, interval]);

  return { traffic, flood, accidents, emergencyUnits, alerts, trafficHistory, floodHistory };
}
