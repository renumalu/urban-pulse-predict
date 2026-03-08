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
    const action = url.searchParams.get('action') || 'active'
    const zoneId = url.searchParams.get('zone_id')
    const alertType = url.searchParams.get('type')
    const severity = url.searchParams.get('severity')

    // 1. GET ?action=active — Active alerts
    if (req.method === 'GET' && action === 'active') {
      let query = supabase.from('alerts').select('*').eq('is_active', true).order('created_at', { ascending: false })
      if (zoneId) query = query.eq('zone_id', zoneId)
      if (alertType) query = query.eq('alert_type', alertType)
      if (severity) query = query.eq('severity', severity)
      const { data, error } = await query.limit(100)
      if (error) throw error
      return json({ data, count: data?.length })
    }

    // 2. GET ?action=all — All alerts including inactive
    if (req.method === 'GET' && action === 'all') {
      let query = supabase.from('alerts').select('*').order('created_at', { ascending: false })
      if (zoneId) query = query.eq('zone_id', zoneId)
      const { data, error } = await query.limit(200)
      if (error) throw error
      return json({ data })
    }

    // 3. GET ?action=critical — Critical alerts only
    if (req.method === 'GET' && action === 'critical') {
      const { data, error } = await supabase.from('alerts').select('*').eq('is_active', true).eq('severity', 'critical').order('created_at', { ascending: false })
      if (error) throw error
      return json({ data, count: data?.length })
    }

    // 4. GET ?action=summary — Alert counts by type/severity
    if (req.method === 'GET' && action === 'summary') {
      const { data, error } = await supabase.from('alerts').select('alert_type, severity, is_active').eq('is_active', true)
      if (error) throw error
      const summary: Record<string, number> = {}
      for (const a of data || []) {
        const key = `${a.alert_type}_${a.severity}`
        summary[key] = (summary[key] || 0) + 1
      }
      return json({ summary, total_active: data?.length })
    }

    // 5. GET ?action=history&zone_id=z31 — Alert history for zone
    if (req.method === 'GET' && action === 'history' && zoneId) {
      const { data, error } = await supabase.from('alerts').select('*').eq('zone_id', zoneId).order('created_at', { ascending: false }).limit(50)
      if (error) throw error
      return json({ data, zone_id: zoneId })
    }

    return json({ error: 'Unknown action. Use: active, all, critical, summary, history' }, 400)
  } catch (error) {
    return json({ error: error.message }, 500)
  }
})

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
