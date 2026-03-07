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
  { id: 'z0', name: 'Downtown Core', elevation: 10 },
  { id: 'z1', name: 'Financial District', elevation: 15 },
  { id: 'z2', name: 'Riverside', elevation: 3 },
  { id: 'z3', name: 'Tech Park', elevation: 20 },
  { id: 'z4', name: 'Old Town', elevation: 12 },
  { id: 'z5', name: 'Harbor District', elevation: 2 },
  { id: 'z6', name: 'University Quarter', elevation: 18 },
  { id: 'z7', name: 'Industrial Zone', elevation: 8 },
  { id: 'z8', name: 'Residential North', elevation: 25 },
  { id: 'z9', name: 'Residential South', elevation: 22 },
  { id: 'z10', name: 'Commercial Strip', elevation: 14 },
  { id: 'z11', name: 'Green Belt', elevation: 30 },
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
    const rushFactor = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19) ? 0.3 : 0

    // Generate traffic data
    const trafficRows = ZONES.map(z => {
      const congestion = clamp(rand(0.1, 0.6) + rushFactor, 0, 1)
      return {
        zone_id: z.id,
        vehicle_count: Math.round(rand(50, 500) + congestion * 300),
        congestion_level: Math.round(congestion * 100) / 100,
        avg_speed: Math.round(60 - congestion * 50),
        prediction_60min: Math.round(clamp(congestion + rand(-0.15, 0.2), 0, 1) * 100) / 100,
      }
    })

    // Generate weather data
    const weatherRows = ZONES.map(z => ({
      zone_id: z.id,
      rainfall: Math.round(rand(0, 40) * 10) / 10,
      temperature: Math.round(rand(15, 35) * 10) / 10,
      humidity: Math.round(rand(40, 95)),
      wind_speed: Math.round(rand(0, 30) * 10) / 10,
    }))

    // Generate accidents
    const accidentCount = Math.floor(rand(2, 8))
    const accidentRows = Array.from({ length: accidentCount }, (_, i) => ({
      zone_id: ZONES[Math.floor(rand(0, ZONES.length))].id,
      lat: rand(40.698, 40.735),
      lng: rand(-74.02, -73.99),
      severity: (['low', 'medium', 'high'] as const)[Math.floor(rand(0, 3))],
      description: `Incident #${Date.now()}-${i}`,
    }))

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
      const risk = (w.rainfall / 80) * (1 - zone.elevation / 35)
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
        await supabase.from('emergency_units').update({
          status: statuses[Math.floor(rand(0, 3))],
          lat: rand(40.698, 40.735),
          lng: rand(-74.02, -73.99),
        }).eq('unit_id', u.unit_id)
      }
    }

    // Insert data
    const [t, w, a] = await Promise.all([
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
