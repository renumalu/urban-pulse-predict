import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Clock, TrendingUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ZONE_MAP, INDIAN_ZONES } from '@/lib/india-zones';

interface HistoricalDataPoint {
  hour: string;
  congestion: number;
  prediction: number;
  vehicles: number;
}

export default function HistoricalTrendsChart() {
  const [selectedZones, setSelectedZones] = useState<string[]>(['z13', 'z31', 'z22']); // Maharashtra, Delhi, Tamil Nadu
  const [chartData, setChartData] = useState<Record<string, HistoricalDataPoint[]>>({});
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchHistoricalData = useCallback(async () => {
    setLoading(true);
    try {
      // Get traffic data from the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const [trafficResult, predictionsResult] = await Promise.all([
        supabase
          .from('traffic_data')
          .select('zone_id, congestion_level, vehicle_count, recorded_at')
          .gte('recorded_at', twentyFourHoursAgo)
          .in('zone_id', selectedZones)
          .order('recorded_at', { ascending: true }),
        supabase
          .from('traffic_predictions')
          .select('zone_id, current_congestion, predicted_60min, created_at')
          .gte('created_at', twentyFourHoursAgo)
          .in('zone_id', selectedZones)
          .order('created_at', { ascending: true })
      ]);

      // Group data by zone and hour
      const grouped: Record<string, Record<string, { congestion: number[]; prediction: number[]; vehicles: number[] }>> = {};

      (trafficResult.data || []).forEach(d => {
        const hour = new Date(d.recorded_at).getHours();
        const hourKey = `${hour.toString().padStart(2, '0')}:00`;
        if (!grouped[d.zone_id]) grouped[d.zone_id] = {};
        if (!grouped[d.zone_id][hourKey]) grouped[d.zone_id][hourKey] = { congestion: [], prediction: [], vehicles: [] };
        grouped[d.zone_id][hourKey].congestion.push(d.congestion_level);
        grouped[d.zone_id][hourKey].vehicles.push(d.vehicle_count);
      });

      (predictionsResult.data || []).forEach(p => {
        const hour = new Date(p.created_at).getHours();
        const hourKey = `${hour.toString().padStart(2, '0')}:00`;
        if (!grouped[p.zone_id]) grouped[p.zone_id] = {};
        if (!grouped[p.zone_id][hourKey]) grouped[p.zone_id][hourKey] = { congestion: [], prediction: [], vehicles: [] };
        grouped[p.zone_id][hourKey].prediction.push(p.predicted_60min);
      });

      // Convert to chart format
      const result: Record<string, HistoricalDataPoint[]> = {};
      
      selectedZones.forEach(zoneId => {
        const zoneData = grouped[zoneId] || {};
        const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
        
        result[zoneId] = hours.map(hour => {
          const data = zoneData[hour] || { congestion: [], prediction: [], vehicles: [] };
          return {
            hour,
            congestion: data.congestion.length 
              ? Math.round(data.congestion.reduce((a, b) => a + b, 0) / data.congestion.length * 100) 
              : 0,
            prediction: data.prediction.length 
              ? Math.round(data.prediction.reduce((a, b) => a + b, 0) / data.prediction.length * 100) 
              : 0,
            vehicles: data.vehicles.length 
              ? Math.round(data.vehicles.reduce((a, b) => a + b, 0) / data.vehicles.length) 
              : 0,
          };
        });
      });

      setChartData(result);
    } catch (err) {
      console.error('Failed to fetch historical data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedZones]);

  useEffect(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  const toggleZone = (zoneId: string) => {
    setSelectedZones(prev => 
      prev.includes(zoneId) 
        ? prev.filter(z => z !== zoneId)
        : prev.length < 5 ? [...prev, zoneId] : prev
    );
  };

  const ZONE_COLORS: Record<string, string> = {
    z0: '#06b6d4', z1: '#8b5cf6', z2: '#f97316', z3: '#22c55e', z4: '#ef4444',
    z5: '#eab308', z6: '#ec4899', z7: '#14b8a6', z8: '#6366f1', z9: '#f43f5e',
    z10: '#84cc16', z11: '#0ea5e9', z12: '#d946ef', z13: '#10b981', z14: '#f59e0b',
    z15: '#3b82f6', z16: '#a855f7', z17: '#06b6d4', z18: '#f97316', z19: '#22c55e',
    z20: '#ef4444', z21: '#eab308', z22: '#ec4899', z23: '#14b8a6', z24: '#6366f1',
    z25: '#f43f5e', z26: '#84cc16', z27: '#0ea5e9', z28: '#d946ef', z29: '#10b981',
    z30: '#f59e0b', z31: '#3b82f6', z32: '#a855f7', z33: '#06b6d4', z34: '#f97316',
    z35: '#22c55e',
  };

  // Combine all zone data for multi-line chart
  const combinedData = Array.from({ length: 24 }, (_, i) => {
    const hour = `${i.toString().padStart(2, '0')}:00`;
    const point: any = { hour };
    selectedZones.forEach(zoneId => {
      const zonePoints = chartData[zoneId] || [];
      const found = zonePoints.find(p => p.hour === hour);
      point[zoneId] = found?.congestion || 0;
    });
    return point;
  });

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4 border-glow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-neon-cyan" />
          <h3 className="font-display text-sm tracking-wider text-neon-cyan">24-HOUR CONGESTION TRENDS</h3>
        </div>
        
        {/* Zone Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary text-xs font-mono-tech hover:bg-secondary/80 transition-colors"
          >
            <span>{selectedZones.length} states selected</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-full mt-1 w-56 max-h-64 overflow-y-auto bg-card border border-border rounded-lg shadow-lg z-50"
            >
              {INDIAN_ZONES.map(zone => (
                <label
                  key={zone.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-secondary cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selectedZones.includes(zone.id)}
                    onChange={() => toggleZone(zone.id)}
                    className="rounded border-border"
                    disabled={!selectedZones.includes(zone.id) && selectedZones.length >= 5}
                  />
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: ZONE_COLORS[zone.id] }}
                  />
                  <span className="font-mono-tech text-foreground">{zone.name}</span>
                </label>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Selected Zones Legend */}
      <div className="flex flex-wrap gap-2">
        {selectedZones.map(zoneId => (
          <span
            key={zoneId}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono-tech bg-secondary"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: ZONE_COLORS[zoneId] }}
            />
            {ZONE_MAP[zoneId]?.name || zoneId}
          </span>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 animate-pulse text-neon-cyan" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                interval={3}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                formatter={(value: number, name: string) => [
                  `${value}%`,
                  ZONE_MAP[name]?.name || name
                ]}
              />
              {selectedZones.map(zoneId => (
                <Line
                  key={zoneId}
                  type="monotone"
                  dataKey={zoneId}
                  stroke={ZONE_COLORS[zoneId]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground font-mono-tech text-center">
        Showing hourly average congestion levels • Select up to 5 states to compare
      </p>
    </div>
  );
}
