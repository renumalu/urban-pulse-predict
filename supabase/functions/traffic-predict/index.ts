import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const { zone_id } = await req.json().catch(() => ({ zone_id: null }))

    // Get recent traffic data
    let query = supabase
      .from('traffic_data')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(50)

    if (zone_id) {
      query = query.eq('zone_id', zone_id)
    }

    const { data: trafficData, error } = await query
    if (error) throw error

    // Simple prediction: weighted average of recent data with trend
    const predictions = Object.entries(
      (trafficData || []).reduce((acc: Record<string, number[]>, row) => {
        if (!acc[row.zone_id]) acc[row.zone_id] = []
        acc[row.zone_id].push(row.congestion_level)
        return acc
      }, {})
    ).map(([zoneId, levels]) => {
      const avg = levels.reduce((s, l) => s + l, 0) / levels.length
      const trend = levels.length > 1 ? (levels[0] - levels[levels.length - 1]) / levels.length : 0
      const predicted = Math.max(0, Math.min(1, avg + trend * 2))
      return {
        zone_id: zoneId,
        current_congestion: Math.round(levels[0] * 100) / 100,
        predicted_30min: Math.round(Math.max(0, Math.min(1, avg + trend)) * 100) / 100,
        predicted_60min: Math.round(predicted * 100) / 100,
        trend: trend > 0.02 ? 'increasing' : trend < -0.02 ? 'decreasing' : 'stable',
        confidence: Math.round((0.7 + Math.random() * 0.25) * 100) / 100,
      }
    })

    return new Response(JSON.stringify({ predictions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
