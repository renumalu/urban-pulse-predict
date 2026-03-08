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
    const severity = url.searchParams.get('severity')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    // 1. GET ?action=list — Recent accidents
    if (action === 'list') {
      let query = supabase.from('accident_data').select('*').order('reported_at', { ascending: false })
      if (zoneId) query = query.eq('zone_id', zoneId)
      if (severity) query = query.eq('severity', severity)
      const { data, error } = await query.limit(limit)
      if (error) throw error
      return json({ data, count: data?.length })
    }

    // 2. GET ?action=zone&zone_id=z13 — Accidents for a zone
    if (action === 'zone' && zoneId) {
      const { data, error } = await supabase.from('accident_data').select('*').eq('zone_id', zoneId).order('reported_at', { ascending: false }).limit(limit)
      if (error) throw error
      return json({ data, zone_id: zoneId })
    }

    // 3. GET ?action=stats — Accident statistics
    if (action === 'stats') {
      const { data, error } = await supabase.from('accident_data').select('zone_id, severity').order('reported_at', { ascending: false }).limit(500)
      if (error) throw error
      const byZone: Record<string, number> = {}
      const bySeverity: Record<string, number> = {}
      for (const a of data || []) {
        byZone[a.zone_id] = (byZone[a.zone_id] || 0) + 1
        bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1
      }
      return json({ by_zone: byZone, by_severity: bySeverity, total: data?.length })
    }

    // 4. GET ?action=high_severity — High severity only
    if (action === 'high_severity') {
      const { data, error } = await supabase.from('accident_data').select('*').eq('severity', 'high').order('reported_at', { ascending: false }).limit(limit)
      if (error) throw error
      return json({ data, count: data?.length })
    }

    // 5. GET ?action=nearby — Accidents near coordinates
    if (action === 'nearby') {
      const lat = parseFloat(url.searchParams.get('lat') || '0')
      const lng = parseFloat(url.searchParams.get('lng') || '0')
      const radius = parseFloat(url.searchParams.get('radius') || '0.5')
      if (!lat || !lng) return json({ error: 'lat and lng required' }, 400)
      
      const { data, error } = await supabase.from('accident_data').select('*').order('reported_at', { ascending: false }).limit(200)
      if (error) throw error
      const nearby = (data || []).filter(a => Math.sqrt((a.lat - lat) ** 2 + (a.lng - lng) ** 2) <= radius)
      return json({ data: nearby, count: nearby.length })
    }

    return json({ error: 'Unknown action. Use: list, zone, stats, high_severity, nearby' }, 400)
  } catch (error) {
    return json({ error: error.message }, 500)
  }
})

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
