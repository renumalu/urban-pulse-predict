// Data simulation engine for UrbanPulse — India Edition

import { INDIAN_ZONES, getZoneName } from './india-zones';

export interface TrafficData {
  zoneId: string;
  zoneName: string;
  vehicleCount: number;
  congestionLevel: number; // 0-1
  avgSpeed: number;
  prediction60min: number;
}

export interface FloodData {
  zoneId: string;
  zoneName: string;
  rainfall: number; // mm/hr
  elevation: number;
  riskLevel: number; // 0-1
  waterLevel: number;
}

export interface AccidentData {
  id: string;
  lat: number;
  lng: number;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  zone: string;
}

export interface EmergencyUnit {
  id: string;
  type: 'ambulance' | 'fire' | 'police';
  status: 'available' | 'dispatched' | 'en-route';
  position: [number, number];
}

export interface Alert {
  id: string;
  type: 'traffic' | 'flood' | 'accident' | 'emergency';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
  zone: string;
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

let prevTraffic: TrafficData[] | null = null;
let prevFlood: FloodData[] | null = null;

export function generateTrafficData(): TrafficData[] {
  const hour = new Date().getHours();
  const rushFactor = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20) ? 0.25 : 0;

  return INDIAN_ZONES.map((zone, i) => {
    const prev = prevTraffic?.[i];
    const base = prev ? prev.congestionLevel : rand(0.1, 0.5);
    // Higher population & road density = higher base congestion
    const popFactor = Math.min(zone.population / 200, 0.3);
    const congestion = clamp(base + rand(-0.1, 0.1) + rushFactor + popFactor * zone.roadDensity, 0, 1);
    return {
      zoneId: zone.id,
      zoneName: zone.name,
      vehicleCount: Math.round(rand(200, 2000) * zone.roadDensity + congestion * 1500 * (zone.population / 50)),
      congestionLevel: congestion,
      avgSpeed: Math.round(70 - congestion * 55),
      prediction60min: clamp(congestion + rand(-0.15, 0.2), 0, 1),
    };
  });
}

export function generateFloodData(): FloodData[] {
  return INDIAN_ZONES.map((zone, i) => {
    const prev = prevFlood?.[i];
    const baseRain = prev ? prev.rainfall : rand(0, 30);
    const rainfall = clamp(baseRain + rand(-5, 5), 0, 80);
    // Low elevation + high rainfall = high risk
    const maxElev = 3500;
    const risk = clamp((rainfall / 80) * (1 - zone.elevation / maxElev), 0, 1);
    return {
      zoneId: zone.id,
      zoneName: zone.name,
      rainfall,
      elevation: zone.elevation,
      riskLevel: risk,
      waterLevel: risk * 2.5,
    };
  });
}

export function generateAccidents(): AccidentData[] {
  const count = Math.floor(rand(5, 20));
  return Array.from({ length: count }, (_, i) => {
    const zone = INDIAN_ZONES[Math.floor(rand(0, INDIAN_ZONES.length))];
    return {
      id: `acc-${Date.now()}-${i}`,
      lat: zone.lat + rand(-0.5, 0.5),
      lng: zone.lng + rand(-0.5, 0.5),
      severity: (['low', 'medium', 'high'] as const)[Math.floor(rand(0, 3))],
      timestamp: Date.now() - rand(0, 3600000),
      zone: zone.name,
    };
  });
}

export function generateEmergencyUnits(): EmergencyUnit[] {
  const types: EmergencyUnit['type'][] = ['ambulance', 'fire', 'police'];
  return Array.from({ length: 12 }, (_, i) => {
    const zone = INDIAN_ZONES[Math.floor(rand(0, INDIAN_ZONES.length))];
    return {
      id: `eu-${i}`,
      type: types[i % 3],
      status: (['available', 'dispatched', 'en-route'] as const)[Math.floor(rand(0, 3))],
      position: [zone.lat + rand(-0.3, 0.3), zone.lng + rand(-0.3, 0.3)],
    };
  });
}

export function generateAlerts(traffic: TrafficData[], flood: FloodData[]): Alert[] {
  const alerts: Alert[] = [];
  traffic.forEach(t => {
    if (t.congestionLevel > 0.7) {
      alerts.push({
        id: `alt-${t.zoneId}-t`,
        type: 'traffic',
        severity: t.congestionLevel > 0.85 ? 'critical' : 'warning',
        message: `Heavy congestion in ${t.zoneName} — ${Math.round(t.congestionLevel * 100)}%`,
        timestamp: Date.now(),
        zone: t.zoneName,
      });
    }
  });
  flood.forEach(f => {
    if (f.riskLevel > 0.5) {
      alerts.push({
        id: `alt-${f.zoneId}-f`,
        type: 'flood',
        severity: f.riskLevel > 0.75 ? 'critical' : 'warning',
        message: `Flood risk in ${f.zoneName} — ${f.rainfall.toFixed(0)}mm/hr rainfall`,
        timestamp: Date.now(),
        zone: f.zoneName,
      });
    }
  });
  return alerts.sort((a, b) => (a.severity === 'critical' ? -1 : 1));
}

export function generateTimeSeriesData(points: number = 24) {
  let val = rand(20, 40);
  return Array.from({ length: points }, (_, i) => {
    val = clamp(val + rand(-8, 8), 5, 95);
    return { time: `${String(i).padStart(2, '0')}:00`, value: Math.round(val) };
  });
}

export function updateSimulation() {
  const traffic = generateTrafficData();
  const flood = generateFloodData();
  prevTraffic = traffic;
  prevFlood = flood;
  return {
    traffic,
    flood,
    accidents: generateAccidents(),
    emergencyUnits: generateEmergencyUnits(),
    alerts: generateAlerts(traffic, flood),
  };
}
