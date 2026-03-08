import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'overview'

    // 1. GET ?action=overview — Full dashboard summary
    if (action === 'overview') {
      const [traffic, weather, alerts, accidents, units, reports] = await Promise.all([
        supabase.from('traffic_data').select('congestion_level, avg_speed, vehicle_count').order('recorded_at', { ascending: false }).limit(36),
        supabase.from('weather_data').select('rainfall, temperature').order('recorded_at', { ascending: false }).limit(36),
        supabase.from('alerts').select('alert_type, severity').eq('is_active', true),
        supabase.from('accident_data').select('severity').order('reported_at', { ascending: false }).limit(50),
        supabase.from('emergency_units').select('status'),
        supabase.from('citizen_reports').select('status').order('created_at', { ascending: false }).limit(100),
      ])

      const td = traffic.data || []
      const wd = weather.data || []
      const avg = (arr: number[]) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0

      return json({
        traffic: {
          avg_congestion: Math.round(avg(td.map(r => r.congestion_level)) * 100) / 100,
          avg_speed: Math.round(avg(td.map(r => r.avg_speed))),
          total_vehicles: td.reduce((s, r) => s + r.vehicle_count, 0),
          zones_reporting: td.length,
        },
        weather: {
          avg_rainfall: Math.round(avg(wd.map(r => r.rainfall)) * 10) / 10,
          avg_temperature: Math.round(avg(wd.filter(r => r.temperature != null).map(r => r.temperature!)) * 10) / 10,
        },
        alerts: {
          total_active: alerts.data?.length || 0,
          critical: alerts.data?.filter(a => a.severity === 'critical').length || 0,
          by_type: countBy(alerts.data || [], 'alert_type'),
        },
        accidents: {
          recent_count: accidents.data?.length || 0,
          by_severity: countBy(accidents.data || [], 'severity'),
        },
        emergency: {
          total: units.data?.length || 0,
          available: units.data?.filter(u => u.status === 'available').length || 0,
          dispatched: units.data?.filter(u => u.status === 'dispatched').length || 0,
        },
        reports: {
          recent_count: reports.data?.length || 0,
          open: reports.data?.filter(r => r.status === 'open').length || 0,
          resolved: reports.data?.filter(r => r.status === 'resolved').length || 0,
        },
        generated_at: new Date().toISOString(),
      })
    }

    // 2. GET ?action=health — System health check
    if (action === 'health') {
      const checks = await Promise.all([
        supabase.from('traffic_data').select('recorded_at').order('recorded_at', { ascending: false }).limit(1),
        supabase.from('weather_data').select('recorded_at').order('recorded_at', { ascending: false }).limit(1),
        supabase.from('alerts').select('created_at').order('created_at', { ascending: false }).limit(1),
      ])
      return json({
        status: 'healthy',
        services: {
          traffic: { last_update: checks[0].data?.[0]?.recorded_at || null },
          weather: { last_update: checks[1].data?.[0]?.recorded_at || null },
          alerts: { last_update: checks[2].data?.[0]?.created_at || null },
        },
        timestamp: new Date().toISOString(),
      })
    }

    // 3. GET ?action=realtime_snapshot — Current state of all systems
    if (action === 'realtime_snapshot') {
      const [traffic, weather, alerts, units] = await Promise.all([
        supabase.from('traffic_data').select('*').order('recorded_at', { ascending: false }).limit(36),
        supabase.from('weather_data').select('*').order('recorded_at', { ascending: false }).limit(36),
        supabase.from('alerts').select('*').eq('is_active', true),
        supabase.from('emergency_units').select('*'),
      ])
      return json({
        traffic: traffic.data,
        weather: weather.data,
        alerts: alerts.data,
        emergency_units: units.data,
        snapshot_at: new Date().toISOString(),
      })
    }

    return json({ error: 'Unknown action. Use: overview, health, realtime_snapshot' }, 400)
  } catch (error) {
    return json({ error: error.message }, 500)
  }
})

function countBy(arr: any[], key: string) {
  const result: Record<string, number> = {}
  for (const item of arr) {
    result[item[key]] = (result[item[key]] || 0) + 1
  }
  return result
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
