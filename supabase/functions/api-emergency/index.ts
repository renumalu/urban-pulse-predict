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
    const unitType = url.searchParams.get('unit_type')
    const status = url.searchParams.get('status')

    // 1. GET ?action=list — All emergency units
    if (req.method === 'GET' && action === 'list') {
      let query = supabase.from('emergency_units').select('*')
      if (unitType) query = query.eq('unit_type', unitType)
      if (status) query = query.eq('status', status)
      const { data, error } = await query
      if (error) throw error
      return json({ data, count: data?.length })
    }

    // 2. GET ?action=available — Available units only
    if (req.method === 'GET' && action === 'available') {
      let query = supabase.from('emergency_units').select('*').eq('status', 'available')
      if (unitType) query = query.eq('unit_type', unitType)
      const { data, error } = await query
      if (error) throw error
      return json({ data, count: data?.length })
    }

    // 3. GET ?action=summary — Unit counts by type and status
    if (req.method === 'GET' && action === 'summary') {
      const { data, error } = await supabase.from('emergency_units').select('unit_type, status')
      if (error) throw error
      const summary: Record<string, Record<string, number>> = {}
      for (const u of data || []) {
        if (!summary[u.unit_type]) summary[u.unit_type] = {}
        summary[u.unit_type][u.status] = (summary[u.unit_type][u.status] || 0) + 1
      }
      return json({ summary, total: data?.length })
    }

    // 4. GET ?action=nearest — Find nearest unit to coordinates
    if (req.method === 'GET' && action === 'nearest') {
      const lat = parseFloat(url.searchParams.get('lat') || '0')
      const lng = parseFloat(url.searchParams.get('lng') || '0')
      if (!lat || !lng) return json({ error: 'lat and lng required' }, 400)
      
      let query = supabase.from('emergency_units').select('*').eq('status', 'available')
      if (unitType) query = query.eq('unit_type', unitType)
      const { data, error } = await query
      if (error) throw error
      
      const withDist = (data || []).map(u => ({
        ...u,
        distance_km: Math.round(Math.sqrt((u.lat - lat) ** 2 + (u.lng - lng) ** 2) * 111 * 100) / 100,
      })).sort((a, b) => a.distance_km - b.distance_km)
      
      return json({ data: withDist.slice(0, 5) })
    }

    // 5. POST ?action=dispatch — Dispatch a unit
    if (req.method === 'POST' && action === 'dispatch') {
      const { unit_id, target_lat, target_lng } = await req.json()
      if (!unit_id) return json({ error: 'unit_id required' }, 400)
      
      const { data, error } = await supabase.from('emergency_units')
        .update({ status: 'dispatched', lat: target_lat || undefined, lng: target_lng || undefined, updated_at: new Date().toISOString() })
        .eq('unit_id', unit_id)
        .select()
      if (error) throw error
      return json({ data, dispatched: true })
    }

    // 6. POST ?action=recall — Recall a dispatched unit
    if (req.method === 'POST' && action === 'recall') {
      const { unit_id } = await req.json()
      if (!unit_id) return json({ error: 'unit_id required' }, 400)
      
      const { data, error } = await supabase.from('emergency_units')
        .update({ status: 'available', updated_at: new Date().toISOString() })
        .eq('unit_id', unit_id)
        .select()
      if (error) throw error
      return json({ data, recalled: true })
    }

    return json({ error: 'Unknown action. Use: list, available, summary, nearest, dispatch, recall' }, 400)
  } catch (error) {
    return json({ error: error.message }, 500)
  }
})

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
