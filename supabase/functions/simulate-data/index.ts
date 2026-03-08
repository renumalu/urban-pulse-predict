import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

const ZONES = [
  { id: 'z0', name: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480, elevation: 200, population: 53, roadDensity: 0.65 },
  { id: 'z1', name: 'Arunachal Pradesh', lat: 27.0844, lng: 93.6053, elevation: 1500, population: 1.7, roadDensity: 0.2 },
  { id: 'z2', name: 'Assam', lat: 26.1445, lng: 91.7362, elevation: 55, population: 35, roadDensity: 0.45 },
  { id: 'z3', name: 'Bihar', lat: 25.6093, lng: 85.1376, elevation: 53, population: 130, roadDensity: 0.7 },
  { id: 'z4', name: 'Chhattisgarh', lat: 21.2514, lng: 81.6296, elevation: 300, population: 30, roadDensity: 0.4 },
  { id: 'z5', name: 'Goa', lat: 15.4909, lng: 73.8278, elevation: 37, population: 1.6, roadDensity: 0.8 },
  { id: 'z6', name: 'Gujarat', lat: 23.2156, lng: 72.6369, elevation: 81, population: 71, roadDensity: 0.7 },
  { id: 'z7', name: 'Haryana', lat: 30.7333, lng: 76.7794, elevation: 220, population: 30, roadDensity: 0.75 },
  { id: 'z8', name: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734, elevation: 2200, population: 7.5, roadDensity: 0.3 },
  { id: 'z9', name: 'Jharkhand', lat: 23.3441, lng: 85.3096, elevation: 650, population: 40, roadDensity: 0.45 },
  { id: 'z10', name: 'Karnataka', lat: 12.9716, lng: 77.5946, elevation: 920, population: 68, roadDensity: 0.7 },
  { id: 'z11', name: 'Kerala', lat: 8.5241, lng: 76.9366, elevation: 10, population: 35, roadDensity: 0.85 },
  { id: 'z12', name: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126, elevation: 500, population: 85, roadDensity: 0.5 },
  { id: 'z13', name: 'Maharashtra', lat: 19.0760, lng: 72.8777, elevation: 14, population: 126, roadDensity: 0.75 },
  { id: 'z14', name: 'Manipur', lat: 24.8170, lng: 93.9368, elevation: 790, population: 3.2, roadDensity: 0.25 },
  { id: 'z15', name: 'Meghalaya', lat: 25.5788, lng: 91.8933, elevation: 1500, population: 3.8, roadDensity: 0.3 },
  { id: 'z16', name: 'Mizoram', lat: 23.7271, lng: 92.7176, elevation: 1100, population: 1.2, roadDensity: 0.2 },
  { id: 'z17', name: 'Nagaland', lat: 25.6751, lng: 94.1086, elevation: 1500, population: 2.2, roadDensity: 0.2 },
  { id: 'z18', name: 'Odisha', lat: 20.2961, lng: 85.8245, elevation: 45, population: 46, roadDensity: 0.5 },
  { id: 'z19', name: 'Punjab', lat: 30.7333, lng: 76.7794, elevation: 230, population: 31, roadDensity: 0.8 },
  { id: 'z20', name: 'Rajasthan', lat: 26.9124, lng: 75.7873, elevation: 431, population: 81, roadDensity: 0.5 },
  { id: 'z21', name: 'Sikkim', lat: 27.3389, lng: 88.6065, elevation: 1650, population: 0.7, roadDensity: 0.2 },
  { id: 'z22', name: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, elevation: 6, population: 78, roadDensity: 0.8 },
  { id: 'z23', name: 'Telangana', lat: 17.3850, lng: 78.4867, elevation: 542, population: 40, roadDensity: 0.7 },
  { id: 'z24', name: 'Tripura', lat: 23.8315, lng: 91.2868, elevation: 13, population: 4.2, roadDensity: 0.35 },
  { id: 'z25', name: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, elevation: 123, population: 235, roadDensity: 0.7 },
  { id: 'z26', name: 'Uttarakhand', lat: 30.3165, lng: 78.0322, elevation: 640, population: 12, roadDensity: 0.35 },
  { id: 'z27', name: 'West Bengal', lat: 22.5726, lng: 88.3639, elevation: 11, population: 100, roadDensity: 0.7 },
  { id: 'z28', name: 'Andaman & Nicobar', lat: 11.6234, lng: 92.7265, elevation: 16, population: 0.4, roadDensity: 0.15 },
  { id: 'z29', name: 'Chandigarh', lat: 30.7333, lng: 76.7794, elevation: 321, population: 1.2, roadDensity: 0.9 },
  { id: 'z30', name: 'Dadra & Nagar Haveli and Daman & Diu', lat: 20.3974, lng: 72.8328, elevation: 12, population: 0.6, roadDensity: 0.5 },
  { id: 'z31', name: 'Delhi', lat: 28.6139, lng: 77.2090, elevation: 216, population: 32, roadDensity: 0.95 },
  { id: 'z32', name: 'Jammu & Kashmir', lat: 34.0837, lng: 74.7973, elevation: 1585, population: 14, roadDensity: 0.35 },
  { id: 'z33', name: 'Ladakh', lat: 34.1526, lng: 77.5771, elevation: 3500, population: 0.3, roadDensity: 0.1 },
  { id: 'z34', name: 'Lakshadweep', lat: 10.5593, lng: 72.6358, elevation: 2, population: 0.07, roadDensity: 0.1 },
  { id: 'z35', name: 'Puducherry', lat: 11.9416, lng: 79.8083, elevation: 6, population: 1.7, roadDensity: 0.8 },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const hour = new Date().getHours()
    // Indian rush hours: 8-10 AM, 5-8 PM IST
    const rushFactor = (hour >= 2 && hour <= 4) || (hour >= 11 && hour <= 14) ? 0.25 : 0 // UTC adjusted for IST

    // Generate traffic data for all 36 zones
    const trafficRows = ZONES.map(z => {
      const popFactor = Math.min(z.population / 200, 0.3)
      const congestion = clamp(rand(0.1, 0.6) + rushFactor + popFactor * z.roadDensity, 0, 1)
      return {
        zone_id: z.id,
        vehicle_count: Math.round(rand(200, 2000) * z.roadDensity + congestion * 1500 * (z.population / 50)),
        congestion_level: Math.round(congestion * 100) / 100,
        avg_speed: Math.round(70 - congestion * 55),
        prediction_60min: Math.round(clamp(congestion + rand(-0.15, 0.2), 0, 1) * 100) / 100,
      }
    })

    // Generate weather data
    const weatherRows = ZONES.map(z => ({
      zone_id: z.id,
      rainfall: Math.round(rand(0, 40) * 10) / 10,
      temperature: Math.round(rand(18, 42) * 10) / 10,
      humidity: Math.round(rand(40, 95)),
      wind_speed: Math.round(rand(0, 30) * 10) / 10,
    }))

    // Generate accidents
    const accidentCount = Math.floor(rand(5, 15))
    const accidentRows = Array.from({ length: accidentCount }, (_, i) => {
      const zone = ZONES[Math.floor(rand(0, ZONES.length))]
      return {
        zone_id: zone.id,
        lat: zone.lat + rand(-0.5, 0.5),
        lng: zone.lng + rand(-0.5, 0.5),
        severity: (['low', 'medium', 'high'] as const)[Math.floor(rand(0, 3))],
        description: `Incident #${Date.now()}-${i}`,
      }
    })

    // Generate alerts
    const alertRows: any[] = []
    trafficRows.forEach(t => {
      if (t.congestion_level > 0.7) {
        alertRows.push({
          alert_type: 'traffic',
          severity: t.congestion_level > 0.85 ? 'critical' : 'warning',
          message: `Heavy congestion in ${ZONES.find(z => z.id === t.zone_id)?.name} — ${Math.round(t.congestion_level * 100)}%`,
          zone_id: t.zone_id,
        })
      }
    })
    weatherRows.forEach(w => {
      const zone = ZONES.find(z => z.id === w.zone_id)!
      const maxElev = 3500
      const risk = (w.rainfall / 80) * (1 - zone.elevation / maxElev)
      if (risk > 0.5) {
        alertRows.push({
          alert_type: 'flood',
          severity: risk > 0.75 ? 'critical' : 'warning',
          message: `Flood risk in ${zone.name} — ${w.rainfall}mm/hr`,
          zone_id: w.zone_id,
        })
      }
    })

    // Update emergency units randomly
    const statuses = ['available', 'dispatched', 'en-route']
    const { data: units } = await supabase.from('emergency_units').select('unit_id')
    if (units) {
      for (const u of units) {
        const zone = ZONES[Math.floor(rand(0, ZONES.length))]
        await supabase.from('emergency_units').update({
          status: statuses[Math.floor(rand(0, 3))],
          lat: zone.lat + rand(-0.3, 0.3),
          lng: zone.lng + rand(-0.3, 0.3),
        }).eq('unit_id', u.unit_id)
      }
    }

    // Insert data
    await Promise.all([
      supabase.from('traffic_data').insert(trafficRows),
      supabase.from('weather_data').insert(weatherRows),
      supabase.from('accident_data').insert(accidentRows),
    ])

    // Deactivate old alerts, insert new
    await supabase.from('alerts').update({ is_active: false }).eq('is_active', true)
    if (alertRows.length > 0) {
      await supabase.from('alerts').insert(alertRows)
    }

    return new Response(JSON.stringify({
      success: true,
      traffic: trafficRows.length,
      weather: weatherRows.length,
      accidents: accidentRows.length,
      alerts: alertRows.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
