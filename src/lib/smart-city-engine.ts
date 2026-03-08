// Smart City Real-Time Problem Solving Engine
import { supabase } from '@/integrations/supabase/client';
import { ZONE_MAP, ZONE_POSITIONS, INDIAN_ZONES } from './india-zones';

// ============ TYPES ============
export interface Alert {
  id: string;
  type: 'traffic' | 'flood' | 'accident' | 'anomaly' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  zone_id: string;
  message: string;
  timestamp: Date;
  dispatched?: boolean;
  acknowledged?: boolean;
}

export interface RouteOption {
  id: string;
  from: string;
  to: string;
  distance_km: number;
  estimated_time_min: number;
  congestion_level: number;
  is_recommended: boolean;
  reason: string;
  waypoints: { lat: number; lng: number }[];
}

export interface Anomaly {
  id: string;
  zone_id: string;
  type: 'traffic_spike' | 'unusual_congestion' | 'sudden_drop' | 'weather_anomaly' | 'accident_cluster';
  severity: number;
  description: string;
  detected_at: Date;
  baseline_value: number;
  current_value: number;
  deviation_percent: number;
}

export interface SignalOptimization {
  zone_id: string;
  zone_name: string;
  current_timing: number;
  recommended_timing: number;
  change_percent: number;
  reason: string;
  expected_improvement: number;
}

// ============ THRESHOLDS ============
export const THRESHOLDS = {
  CRITICAL_CONGESTION: 0.85,
  HIGH_CONGESTION: 0.70,
  FLOOD_ALERT: 40, // mm rainfall
  FLOOD_WARNING: 25, // mm rainfall
  ANOMALY_DEVIATION: 30, // percent deviation from baseline
  ACCIDENT_CLUSTER_RADIUS: 50, // km
  ACCIDENT_CLUSTER_COUNT: 3,
};

// ============ AUTO-ALERT DISPATCH ============
export async function checkAndDispatchAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  
  try {
    // Fetch current data
    const [trafficRes, weatherRes, accidentsRes] = await Promise.all([
      supabase.from('traffic_data').select('*').order('recorded_at', { ascending: false }).limit(36),
      supabase.from('weather_data').select('*').order('recorded_at', { ascending: false }).limit(36),
      supabase.from('accident_data').select('*').gte('reported_at', new Date(Date.now() - 3600000).toISOString()),
    ]);

    const trafficData = trafficRes.data || [];
    const weatherData = weatherRes.data || [];
    const recentAccidents = accidentsRes.data || [];

    // Check traffic thresholds
    for (const t of trafficData) {
      if (t.congestion_level >= THRESHOLDS.CRITICAL_CONGESTION) {
        alerts.push({
          id: `traffic-critical-${t.zone_id}-${Date.now()}`,
          type: 'traffic',
          severity: 'critical',
          zone_id: t.zone_id,
          message: `Critical congestion (${Math.round(t.congestion_level * 100)}%) in ${ZONE_MAP[t.zone_id]?.name || t.zone_id}. Emergency dispatch recommended.`,
          timestamp: new Date(),
          dispatched: false,
        });
      } else if (t.congestion_level >= THRESHOLDS.HIGH_CONGESTION) {
        alerts.push({
          id: `traffic-high-${t.zone_id}-${Date.now()}`,
          type: 'traffic',
          severity: 'high',
          zone_id: t.zone_id,
          message: `High congestion (${Math.round(t.congestion_level * 100)}%) in ${ZONE_MAP[t.zone_id]?.name || t.zone_id}.`,
          timestamp: new Date(),
        });
      }
    }

    // Check flood thresholds
    for (const w of weatherData) {
      if (w.rainfall >= THRESHOLDS.FLOOD_ALERT) {
        alerts.push({
          id: `flood-alert-${w.zone_id}-${Date.now()}`,
          type: 'flood',
          severity: 'critical',
          zone_id: w.zone_id,
          message: `Flood ALERT: ${w.rainfall}mm rainfall in ${ZONE_MAP[w.zone_id]?.name || w.zone_id}. Emergency services notified.`,
          timestamp: new Date(),
          dispatched: true,
        });
      } else if (w.rainfall >= THRESHOLDS.FLOOD_WARNING) {
        alerts.push({
          id: `flood-warning-${w.zone_id}-${Date.now()}`,
          type: 'flood',
          severity: 'high',
          zone_id: w.zone_id,
          message: `Flood WARNING: ${w.rainfall}mm rainfall in ${ZONE_MAP[w.zone_id]?.name || w.zone_id}.`,
          timestamp: new Date(),
        });
      }
    }

    // Check accident clusters
    const zoneAccidents: Record<string, number> = {};
    for (const a of recentAccidents) {
      zoneAccidents[a.zone_id] = (zoneAccidents[a.zone_id] || 0) + 1;
    }
    for (const [zoneId, count] of Object.entries(zoneAccidents)) {
      if (count >= THRESHOLDS.ACCIDENT_CLUSTER_COUNT) {
        alerts.push({
          id: `accident-cluster-${zoneId}-${Date.now()}`,
          type: 'accident',
          severity: 'high',
          zone_id: zoneId,
          message: `Accident cluster detected: ${count} accidents in ${ZONE_MAP[zoneId]?.name || zoneId} within the last hour.`,
          timestamp: new Date(),
          dispatched: true,
        });
      }
    }
  } catch (err) {
    console.error('Alert check failed:', err);
  }

  return alerts;
}

// ============ DYNAMIC ROUTE SUGGESTIONS ============
export async function getDynamicRoutes(fromZone: string, toZone: string): Promise<RouteOption[]> {
  const routes: RouteOption[] = [];
  
  try {
    const fromPos = ZONE_POSITIONS[fromZone];
    const toPos = ZONE_POSITIONS[toZone];
    if (!fromPos || !toPos) return routes;

    // Get current traffic data
    const { data: trafficData } = await supabase
      .from('traffic_data')
      .select('zone_id, congestion_level, avg_speed')
      .order('recorded_at', { ascending: false })
      .limit(36);

    const congestionMap: Record<string, number> = {};
    (trafficData || []).forEach(t => {
      if (!congestionMap[t.zone_id]) congestionMap[t.zone_id] = t.congestion_level;
    });

    // Calculate direct route distance
    const directDistance = calculateDistance(fromPos[0], fromPos[1], toPos[0], toPos[1]);
    const fromCongestion = congestionMap[fromZone] || 0.3;
    const toCongestion = congestionMap[toZone] || 0.3;
    const avgCongestion = (fromCongestion + toCongestion) / 2;

    // Direct route
    const directTime = Math.round(directDistance / (60 - avgCongestion * 40) * 60);
    routes.push({
      id: 'direct',
      from: fromZone,
      to: toZone,
      distance_km: Math.round(directDistance),
      estimated_time_min: directTime,
      congestion_level: avgCongestion,
      is_recommended: avgCongestion < 0.5,
      reason: avgCongestion < 0.5 ? 'Clear route' : 'Direct but congested',
      waypoints: [
        { lat: fromPos[0], lng: fromPos[1] },
        { lat: toPos[0], lng: toPos[1] },
      ],
    });

    // Find alternative routes through nearby zones with less congestion
    const nearbyZones = INDIAN_ZONES
      .filter(z => z.id !== fromZone && z.id !== toZone)
      .map(z => ({
        ...z,
        congestion: congestionMap[z.id] || 0.3,
        distanceFromPath: distanceFromLine(
          ZONE_POSITIONS[z.id][0], ZONE_POSITIONS[z.id][1],
          fromPos[0], fromPos[1], toPos[0], toPos[1]
        ),
      }))
      .filter(z => z.distanceFromPath < directDistance * 0.5 && z.congestion < avgCongestion * 0.7)
      .sort((a, b) => a.congestion - b.congestion)
      .slice(0, 3);

    for (let i = 0; i < nearbyZones.length; i++) {
      const via = nearbyZones[i];
      const viaPos = ZONE_POSITIONS[via.id];
      const totalDistance = 
        calculateDistance(fromPos[0], fromPos[1], viaPos[0], viaPos[1]) +
        calculateDistance(viaPos[0], viaPos[1], toPos[0], toPos[1]);
      
      const viaAvgCongestion = (fromCongestion + via.congestion + toCongestion) / 3;
      const viaTime = Math.round(totalDistance / (60 - viaAvgCongestion * 35) * 60);

      if (viaTime < directTime * 1.3) { // Only if not more than 30% longer
        routes.push({
          id: `via-${via.id}`,
          from: fromZone,
          to: toZone,
          distance_km: Math.round(totalDistance),
          estimated_time_min: viaTime,
          congestion_level: viaAvgCongestion,
          is_recommended: viaAvgCongestion < avgCongestion && viaTime <= directTime,
          reason: `Via ${via.name} - ${Math.round((1 - viaAvgCongestion / avgCongestion) * 100)}% less congestion`,
          waypoints: [
            { lat: fromPos[0], lng: fromPos[1] },
            { lat: viaPos[0], lng: viaPos[1] },
            { lat: toPos[0], lng: toPos[1] },
          ],
        });
      }
    }

    // Sort by recommendation
    routes.sort((a, b) => (b.is_recommended ? 1 : 0) - (a.is_recommended ? 1 : 0));

  } catch (err) {
    console.error('Route calculation failed:', err);
  }

  return routes;
}

// ============ ANOMALY DETECTION ============
export async function detectAnomalies(): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];

  try {
    // Get current and historical traffic data
    const [currentRes, historicalRes] = await Promise.all([
      supabase.from('traffic_data').select('*').order('recorded_at', { ascending: false }).limit(36),
      supabase.from('traffic_data').select('zone_id, congestion_level').order('recorded_at', { ascending: false }).limit(360),
    ]);

    const currentData = currentRes.data || [];
    const historicalData = historicalRes.data || [];

    // Calculate baseline (average of last 10 readings per zone)
    const baselines: Record<string, { values: number[]; avg: number }> = {};
    for (const h of historicalData) {
      if (!baselines[h.zone_id]) baselines[h.zone_id] = { values: [], avg: 0 };
      if (baselines[h.zone_id].values.length < 10) {
        baselines[h.zone_id].values.push(h.congestion_level);
      }
    }
    for (const [zoneId, data] of Object.entries(baselines)) {
      data.avg = data.values.length > 0 
        ? data.values.reduce((a, b) => a + b, 0) / data.values.length 
        : 0.3;
    }

    // Detect anomalies
    for (const current of currentData) {
      const baseline = baselines[current.zone_id]?.avg || 0.3;
      const deviation = ((current.congestion_level - baseline) / baseline) * 100;

      if (Math.abs(deviation) >= THRESHOLDS.ANOMALY_DEVIATION) {
        const isSpike = deviation > 0;
        anomalies.push({
          id: `anomaly-${current.zone_id}-${Date.now()}`,
          zone_id: current.zone_id,
          type: isSpike ? 'traffic_spike' : 'sudden_drop',
          severity: Math.min(1, Math.abs(deviation) / 100),
          description: isSpike
            ? `Unusual traffic spike in ${ZONE_MAP[current.zone_id]?.name || current.zone_id}: ${Math.round(deviation)}% above normal`
            : `Sudden traffic drop in ${ZONE_MAP[current.zone_id]?.name || current.zone_id}: ${Math.round(Math.abs(deviation))}% below normal`,
          detected_at: new Date(),
          baseline_value: Math.round(baseline * 100),
          current_value: Math.round(current.congestion_level * 100),
          deviation_percent: Math.round(deviation),
        });
      }
    }

    // Check weather anomalies
    const { data: weatherData } = await supabase
      .from('weather_data')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(36);

    for (const w of weatherData || []) {
      // Sudden heavy rain
      if (w.rainfall > 50) {
        anomalies.push({
          id: `weather-anomaly-${w.zone_id}-${Date.now()}`,
          zone_id: w.zone_id,
          type: 'weather_anomaly',
          severity: Math.min(1, w.rainfall / 80),
          description: `Extreme rainfall (${w.rainfall}mm) in ${ZONE_MAP[w.zone_id]?.name || w.zone_id}`,
          detected_at: new Date(),
          baseline_value: 10,
          current_value: w.rainfall,
          deviation_percent: Math.round((w.rainfall / 10 - 1) * 100),
        });
      }
    }

  } catch (err) {
    console.error('Anomaly detection failed:', err);
  }

  return anomalies;
}

// ============ TRAFFIC SIGNAL OPTIMIZATION ============
export async function optimizeSignalTimings(): Promise<SignalOptimization[]> {
  const optimizations: SignalOptimization[] = [];

  try {
    // Get current traffic and predictions
    const [trafficRes, predictionsRes] = await Promise.all([
      supabase.from('traffic_data').select('*').order('recorded_at', { ascending: false }).limit(36),
      supabase.from('traffic_predictions').select('*').order('created_at', { ascending: false }).limit(36),
    ]);

    const trafficData = trafficRes.data || [];
    const predictions = predictionsRes.data || [];

    const predictionMap: Record<string, any> = {};
    predictions.forEach(p => { if (!predictionMap[p.zone_id]) predictionMap[p.zone_id] = p; });

    for (const t of trafficData) {
      const zoneName = ZONE_MAP[t.zone_id]?.name || t.zone_id;
      const prediction = predictionMap[t.zone_id];
      
      // Base timing on congestion level (30-90 seconds)
      const baseTiming = 60; // seconds
      const currentCongestion = t.congestion_level;
      const futureCongestion = prediction?.predicted_60min || currentCongestion;

      // Calculate optimal timing
      let recommendedTiming: number;
      let reason: string;
      let expectedImprovement: number;

      if (futureCongestion > 0.7) {
        // High congestion predicted - longer green lights for main flow
        recommendedTiming = Math.min(90, baseTiming * (1 + futureCongestion * 0.5));
        reason = 'Extended timing for predicted high congestion';
        expectedImprovement = 15 + Math.round(futureCongestion * 20);
      } else if (futureCongestion < 0.3) {
        // Low congestion - shorter cycles for efficiency
        recommendedTiming = Math.max(30, baseTiming * (1 - (0.3 - futureCongestion)));
        reason = 'Reduced timing for efficient low-traffic flow';
        expectedImprovement = 10 + Math.round((0.3 - futureCongestion) * 30);
      } else {
        // Normal congestion
        recommendedTiming = baseTiming;
        reason = 'Standard timing - balanced flow';
        expectedImprovement = 5;
      }

      const changePercent = Math.round((recommendedTiming - baseTiming) / baseTiming * 100);

      if (Math.abs(changePercent) >= 5) { // Only show significant changes
        optimizations.push({
          zone_id: t.zone_id,
          zone_name: zoneName,
          current_timing: baseTiming,
          recommended_timing: Math.round(recommendedTiming),
          change_percent: changePercent,
          reason,
          expected_improvement: expectedImprovement,
        });
      }
    }

    // Sort by expected improvement
    optimizations.sort((a, b) => b.expected_improvement - a.expected_improvement);

  } catch (err) {
    console.error('Signal optimization failed:', err);
  }

  return optimizations;
}

// ============ HELPER FUNCTIONS ============
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function distanceFromLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) param = dot / len_sq;
  let xx: number, yy: number;
  if (param < 0) { xx = x1; yy = y1; }
  else if (param > 1) { xx = x2; yy = y2; }
  else { xx = x1 + param * C; yy = y1 + param * D; }
  return calculateDistance(px, py, xx, yy);
}

// ============ NOTIFICATION SYSTEM ============
export function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return Promise.resolve(false);
  if (Notification.permission === 'granted') return Promise.resolve(true);
  if (Notification.permission === 'denied') return Promise.resolve(false);
  return Notification.requestPermission().then(p => p === 'granted');
}

export function sendBrowserNotification(title: string, body: string, icon?: string) {
  if (Notification.permission !== 'granted') return;
  new Notification(title, {
    body,
    icon: icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'urbanpulse-alert',
    requireInteraction: true,
  });
}
