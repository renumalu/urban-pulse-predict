import { MapContainer, TileLayer, CircleMarker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TrafficData, FloodData, AccidentData, EmergencyUnit } from '@/lib/simulation';
import { ZONE_POSITIONS } from '@/lib/india-zones';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function congestionColor(level: number): string {
  if (level > 0.7) return '#ff3333';
  if (level > 0.4) return '#ff9933';
  return '#33cc66';
}

function riskColor(level: number): string {
  if (level > 0.7) return '#0066ff';
  if (level > 0.4) return '#3399ff';
  return '#99ccff';
}

function severityColor(severity: string): string {
  if (severity === 'high') return '#ff0000';
  if (severity === 'medium') return '#ff9900';
  return '#ffcc00';
}

interface CityMapViewProps {
  traffic: TrafficData[];
  flood: FloodData[];
  accidents: AccidentData[];
  emergencyUnits: EmergencyUnit[];
  emergencyRoute?: { lat: number; lng: number }[];
}

export default function CityMapView({ traffic, flood, accidents, emergencyUnits, emergencyRoute }: CityMapViewProps) {
  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-border glow-blue">
      <MapContainer
        center={[22.5, 82.0]}
        zoom={5}
        className="h-full w-full"
        style={{ background: '#0a1520' }}
        zoomControl={true}
        scrollWheelZoom={true}
        dragging={true}
        doubleClickZoom={true}
        touchZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Traffic congestion zones */}
        {traffic.map(t => {
          const pos = ZONE_POSITIONS[t.zoneId];
          if (!pos) return null;
          return (
            <CircleMarker
              key={`traffic-${t.zoneId}`}
              center={pos}
              radius={10 + t.congestionLevel * 15}
              pathOptions={{
                color: congestionColor(t.congestionLevel),
                fillColor: congestionColor(t.congestionLevel),
                fillOpacity: 0.3,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <strong>{t.zoneName}</strong>
                  <div>Congestion: {Math.round(t.congestionLevel * 100)}%</div>
                  <div>Vehicles: {t.vehicleCount.toLocaleString()}</div>
                  <div>Avg Speed: {t.avgSpeed} km/h</div>
                  <div>60min Prediction: {Math.round(t.prediction60min * 100)}%</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Flood risk zones */}
        {flood.filter(f => f.riskLevel > 0.2).map(f => {
          const pos = ZONE_POSITIONS[f.zoneId];
          if (!pos) return null;
          return (
            <CircleMarker
              key={`flood-${f.zoneId}`}
              center={pos}
              radius={8 + f.riskLevel * 18}
              pathOptions={{
                color: riskColor(f.riskLevel),
                fillColor: riskColor(f.riskLevel),
                fillOpacity: 0.2,
                weight: 1,
                dashArray: '4 4',
              }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <strong>{f.zoneName} — Flood Risk</strong>
                  <div>Rainfall: {f.rainfall.toFixed(1)} mm/hr</div>
                  <div>Risk: {Math.round(f.riskLevel * 100)}%</div>
                  <div>Water Level: {f.waterLevel.toFixed(1)}m</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Accident markers */}
        {accidents.slice(0, 20).map(a => (
          <CircleMarker
            key={a.id}
            center={[a.lat, a.lng]}
            radius={5}
            pathOptions={{
              color: severityColor(a.severity),
              fillColor: severityColor(a.severity),
              fillOpacity: 0.8,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-xs">
                <strong>Accident — {a.severity}</strong>
                <div>{a.zone}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Emergency units */}
        {emergencyUnits.map(u => (
          <CircleMarker
            key={u.id}
            center={[u.position[0], u.position[1]]}
            radius={4}
            pathOptions={{
              color: u.type === 'ambulance' ? '#ff4444' : u.type === 'fire' ? '#ff8800' : '#4488ff',
              fillColor: u.type === 'ambulance' ? '#ff4444' : u.type === 'fire' ? '#ff8800' : '#4488ff',
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>
              <div className="text-xs">
                <strong>{u.type} — {u.id}</strong>
                <div>Status: {u.status}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Emergency route */}
        {emergencyRoute && emergencyRoute.length > 1 && (
          <Polyline
            positions={emergencyRoute.map(p => [p.lat, p.lng] as [number, number])}
            pathOptions={{
              color: '#00ff88',
              weight: 4,
              opacity: 0.8,
              dashArray: '10 6',
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
