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

    // 1. GET /api-traffic?action=list — Latest traffic for all zones
    if (req.method === 'GET' && action === 'list') {
      const { data, error } = await supabase
        .from('traffic_data')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return json({ data, count: data?.length })
    }

    // 2. GET /api-traffic?action=zone&zone_id=z13 — Traffic for specific zone
    if (req.method === 'GET' && action === 'zone' && zoneId) {
      const { data, error } = await supabase
        .from('traffic_data')
        .select('*')
        .eq('zone_id', zoneId)
        .order('recorded_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return json({ data, zone_id: zoneId })
    }

    // 3. GET /api-traffic?action=congested — Top congested zones
    if (req.method === 'GET' && action === 'congested') {
      const { data, error } = await supabase
        .from('traffic_data')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(36)
      if (error) throw error
      const sorted = (data || []).sort((a, b) => b.congestion_level - a.congestion_level).slice(0, 10)
      return json({ data: sorted, count: sorted.length })
    }

    // 4. GET /api-traffic?action=history&zone_id=z31 — Historical data for zone
    if (req.method === 'GET' && action === 'history' && zoneId) {
      const { data, error } = await supabase
        .from('traffic_data')
        .select('congestion_level, avg_speed, vehicle_count, recorded_at')
        .eq('zone_id', zoneId)
        .order('recorded_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return json({ data, zone_id: zoneId })
    }

    // 5. GET /api-traffic?action=stats — Aggregate statistics
    if (req.method === 'GET' && action === 'stats') {
      const { data, error } = await supabase
        .from('traffic_data')
        .select('congestion_level, avg_speed, vehicle_count')
        .order('recorded_at', { ascending: false })
        .limit(36)
      if (error) throw error
      const d = data || []
      const avg = (arr: number[]) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0
      return json({
        avg_congestion: Math.round(avg(d.map(r => r.congestion_level)) * 100) / 100,
        avg_speed: Math.round(avg(d.map(r => r.avg_speed))),
        total_vehicles: d.reduce((s, r) => s + r.vehicle_count, 0),
        zones_reporting: d.length,
      })
    }

    // 6. GET /api-traffic?action=predictions — Latest AI predictions
    if (req.method === 'GET' && action === 'predictions') {
      let query = supabase.from('traffic_predictions').select('*').order('created_at', { ascending: false })
      if (zoneId) query = query.eq('zone_id', zoneId)
      const { data, error } = await query.limit(zoneId ? 10 : 36)
      if (error) throw error
      return json({ data })
    }

    // 7. GET /api-traffic?action=speed_ranking — Zones ranked by avg speed
    if (req.method === 'GET' && action === 'speed_ranking') {
      const { data, error } = await supabase
        .from('traffic_data')
        .select('zone_id, avg_speed, congestion_level')
        .order('recorded_at', { ascending: false })
        .limit(36)
      if (error) throw error
      const sorted = (data || []).sort((a, b) => a.avg_speed - b.avg_speed)
      return json({ data: sorted })
    }

    return json({ error: 'Unknown action. Use: list, zone, congested, history, stats, predictions, speed_ranking' }, 400)
  } catch (error) {
    return json({ error: error.message }, 500)
  }
})

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
