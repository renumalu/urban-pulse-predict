import type { TrafficData, FloodData, AccidentData } from '@/lib/simulation';

function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportTrafficCSV(traffic: TrafficData[]) {
  const header = 'Zone ID,Zone Name,Vehicle Count,Congestion Level (%),Avg Speed (km/h),60min Prediction (%)';
  const rows = traffic.map(t =>
    `${t.zoneId},"${t.zoneName}",${t.vehicleCount},${Math.round(t.congestionLevel * 100)},${t.avgSpeed.toFixed(1)},${Math.round(t.prediction60min * 100)}`
  );
  downloadCSV('urbanpulse_traffic', [header, ...rows].join('\n'));
}

export function exportFloodCSV(flood: FloodData[]) {
  const header = 'Zone ID,Zone Name,Rainfall (mm/hr),Elevation (m),Risk Level (%),Water Level (m),Status';
  const rows = flood.map(f => {
    const status = f.riskLevel > 0.7 ? 'Critical' : f.riskLevel > 0.4 ? 'Warning' : 'Safe';
    return `${f.zoneId},"${f.zoneName}",${f.rainfall.toFixed(1)},${f.elevation},${Math.round(f.riskLevel * 100)},${f.waterLevel.toFixed(2)},${status}`;
  });
  downloadCSV('urbanpulse_flood', [header, ...rows].join('\n'));
}

export function exportAccidentsCSV(accidents: AccidentData[]) {
  const header = 'ID,Latitude,Longitude,Severity,Zone,Timestamp';
  const rows = accidents.map(a =>
    `${a.id},${a.lat},${a.lng},${a.severity},"${a.zone}",${new Date(a.timestamp).toISOString()}`
  );
  downloadCSV('urbanpulse_accidents', [header, ...rows].join('\n'));
}

export function exportFullReport(traffic: TrafficData[], flood: FloodData[], accidents: AccidentData[]) {
  const timestamp = new Date().toISOString();
  let csv = `UrbanPulse City Report — Generated: ${timestamp}\n\n`;

  csv += '=== TRAFFIC DATA ===\n';
  csv += 'Zone ID,Zone Name,Vehicle Count,Congestion (%),Avg Speed (km/h),60min Prediction (%)\n';
  traffic.forEach(t => {
    csv += `${t.zoneId},"${t.zoneName}",${t.vehicleCount},${Math.round(t.congestionLevel * 100)},${t.avgSpeed.toFixed(1)},${Math.round(t.prediction60min * 100)}\n`;
  });

  csv += '\n=== FLOOD RISK DATA ===\n';
  csv += 'Zone ID,Zone Name,Rainfall (mm/hr),Elevation (m),Risk Level (%),Water Level (m),Status\n';
  flood.forEach(f => {
    const status = f.riskLevel > 0.7 ? 'Critical' : f.riskLevel > 0.4 ? 'Warning' : 'Safe';
    csv += `${f.zoneId},"${f.zoneName}",${f.rainfall.toFixed(1)},${f.elevation},${Math.round(f.riskLevel * 100)},${f.waterLevel.toFixed(2)},${status}\n`;
  });

  csv += '\n=== ACCIDENT DATA ===\n';
  csv += 'ID,Latitude,Longitude,Severity,Zone,Timestamp\n';
  accidents.forEach(a => {
    csv += `${a.id},${a.lat},${a.lng},${a.severity},"${a.zone}",${new Date(a.timestamp).toISOString()}\n`;
  });

  downloadCSV('urbanpulse_full_report', csv);
}
