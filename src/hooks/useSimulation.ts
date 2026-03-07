import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { updateSimulation, generateTimeSeriesData, type TrafficData, type FloodData, type AccidentData, type EmergencyUnit, type Alert } from '@/lib/simulation';

export function useSimulation(interval = 3000) {
  const [traffic, setTraffic] = useState<TrafficData[]>([]);
  const [flood, setFlood] = useState<FloodData[]>([]);
  const [accidents, setAccidents] = useState<AccidentData[]>([]);
  const [emergencyUnits, setEmergencyUnits] = useState<EmergencyUnit[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trafficHistory] = useState(() => generateTimeSeriesData(24));
  const [floodHistory] = useState(() => generateTimeSeriesData(24));
  const [useBackend, setUseBackend] = useState(true);

  const fetchFromBackend = useCallback(async () => {
    try {
      // Trigger simulation
      await supabase.functions.invoke('simulate-data');

      // Fetch latest data
      const [trafficRes, weatherRes, accidentsRes, unitsRes, alertsRes] = await Promise.all([
        supabase.from('traffic_data').select('*').order('recorded_at', { ascending: false }).limit(12),
        supabase.from('weather_data').select('*').order('recorded_at', { ascending: false }).limit(12),
        supabase.from('accident_data').select('*').order('reported_at', { ascending: false }).limit(20),
        supabase.from('emergency_units').select('*'),
        supabase.from('alerts').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      ]);

      if (trafficRes.data) {
        setTraffic(trafficRes.data.map(t => ({
          zoneId: t.zone_id,
          zoneName: getZoneName(t.zone_id),
          vehicleCount: t.vehicle_count,
          congestionLevel: t.congestion_level,
          avgSpeed: t.avg_speed,
          prediction60min: t.prediction_60min,
        })));
      }

      if (weatherRes.data) {
        setFlood(weatherRes.data.map(w => {
          const elevation = getElevation(w.zone_id);
          const risk = Math.max(0, Math.min(1, (w.rainfall / 80) * (1 - elevation / 35)));
          return {
            zoneId: w.zone_id,
            zoneName: getZoneName(w.zone_id),
            rainfall: w.rainfall,
            elevation,
            riskLevel: risk,
            waterLevel: risk * 2.5,
          };
        }));
      }

      if (accidentsRes.data) {
        setAccidents(accidentsRes.data.map(a => ({
          id: a.id,
          lat: a.lat,
          lng: a.lng,
          severity: a.severity as 'low' | 'medium' | 'high',
          timestamp: new Date(a.reported_at).getTime(),
          zone: getZoneName(a.zone_id),
        })));
      }

      if (unitsRes.data) {
        setEmergencyUnits(unitsRes.data.map(u => ({
          id: u.unit_id,
          type: u.unit_type as 'ambulance' | 'fire' | 'police',
          status: u.status as 'available' | 'dispatched' | 'en-route',
          position: [u.lat, u.lng] as [number, number],
        })));
      }

      if (alertsRes.data) {
        setAlerts(alertsRes.data.map(a => ({
          id: a.id,
          type: a.alert_type as Alert['type'],
          severity: a.severity as Alert['severity'],
          message: a.message,
          timestamp: new Date(a.created_at).getTime(),
          zone: getZoneName(a.zone_id),
        })));
      }
    } catch (err) {
      console.error('Backend fetch failed, falling back to local simulation:', err);
      setUseBackend(false);
    }
  }, []);

  const tickLocal = useCallback(() => {
    const data = updateSimulation();
    setTraffic(data.traffic);
    setFlood(data.flood);
    setAccidents(data.accidents);
    setEmergencyUnits(data.emergencyUnits);
    setAlerts(data.alerts);
  }, []);

  useEffect(() => {
    if (useBackend) {
      fetchFromBackend();
      const id = setInterval(fetchFromBackend, interval);
      return () => clearInterval(id);
    } else {
      tickLocal();
      const id = setInterval(tickLocal, interval);
      return () => clearInterval(id);
    }
  }, [useBackend, fetchFromBackend, tickLocal, interval]);

  return { traffic, flood, accidents, emergencyUnits, alerts, trafficHistory, floodHistory, useBackend };
}

const ZONE_NAMES: Record<string, string> = {
  z0: 'Downtown Core', z1: 'Financial District', z2: 'Riverside', z3: 'Tech Park',
  z4: 'Old Town', z5: 'Harbor District', z6: 'University Quarter', z7: 'Industrial Zone',
  z8: 'Residential North', z9: 'Residential South', z10: 'Commercial Strip', z11: 'Green Belt',
};

const ZONE_ELEVATIONS: Record<string, number> = {
  z0: 10, z1: 15, z2: 3, z3: 20, z4: 12, z5: 2, z6: 18, z7: 8, z8: 25, z9: 22, z10: 14, z11: 30,
};

function getZoneName(zoneId: string) { return ZONE_NAMES[zoneId] || zoneId; }
function getElevation(zoneId: string) { return ZONE_ELEVATIONS[zoneId] || 10; }
