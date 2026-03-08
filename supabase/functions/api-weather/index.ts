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
    const action = url.searchParams.get('action') || 'list'
    const zoneId = url.searchParams.get('zone_id')
    const limit = parseInt(url.searchParams.get('limit') || '36')

    // 1. GET ?action=list — Latest weather for all zones
    if (action === 'list') {
      const { data, error } = await supabase.from('weather_data').select('*').order('recorded_at', { ascending: false }).limit(limit)
      if (error) throw error
      return json({ data })
    }

    // 2. GET ?action=zone&zone_id=z11 — Weather for specific zone
    if (action === 'zone' && zoneId) {
      const { data, error } = await supabase.from('weather_data').select('*').eq('zone_id', zoneId).order('recorded_at', { ascending: false }).limit(limit)
      if (error) throw error
      return json({ data, zone_id: zoneId })
    }

    // 3. GET ?action=rainfall_ranking — Zones by rainfall
    if (action === 'rainfall_ranking') {
      const { data, error } = await supabase.from('weather_data').select('*').order('recorded_at', { ascending: false }).limit(36)
      if (error) throw error
      const sorted = (data || []).sort((a, b) => b.rainfall - a.rainfall)
      return json({ data: sorted })
    }

    // 4. GET ?action=history&zone_id=z31 — Historical weather
    if (action === 'history' && zoneId) {
      const { data, error } = await supabase.from('weather_data').select('rainfall, temperature, humidity, wind_speed, recorded_at').eq('zone_id', zoneId).order('recorded_at', { ascending: false }).limit(100)
      if (error) throw error
      return json({ data, zone_id: zoneId })
    }

    // 5. GET ?action=stats — Aggregate weather stats
    if (action === 'stats') {
      const { data, error } = await supabase.from('weather_data').select('rainfall, temperature, humidity').order('recorded_at', { ascending: false }).limit(36)
      if (error) throw error
      const d = data || []
      const avg = (arr: number[]) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0
      return json({
        avg_rainfall: Math.round(avg(d.map(r => r.rainfall)) * 10) / 10,
        avg_temperature: Math.round(avg(d.filter(r => r.temperature != null).map(r => r.temperature!)) * 10) / 10,
        avg_humidity: Math.round(avg(d.filter(r => r.humidity != null).map(r => r.humidity!))),
        high_rainfall_zones: d.filter(r => r.rainfall > 20).length,
      })
    }

    // 6. GET ?action=alerts — Zones with dangerous weather
    if (action === 'alerts') {
      const { data, error } = await supabase.from('weather_data').select('*').order('recorded_at', { ascending: false }).limit(36)
      if (error) throw error
      const dangerous = (data || []).filter(r => r.rainfall > 15 || (r.wind_speed && r.wind_speed > 25))
      return json({ data: dangerous, count: dangerous.length })
    }

    return json({ error: 'Unknown action. Use: list, zone, rainfall_ranking, history, stats, alerts' }, 400)
  } catch (error) {
    return json({ error: error.message }, 500)
  }
})

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
