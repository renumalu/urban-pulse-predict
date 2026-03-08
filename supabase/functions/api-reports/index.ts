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
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'list'
    const zoneId = url.searchParams.get('zone_id')
    const category = url.searchParams.get('category')
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    // For auth-required actions, use user's token
    const authHeader = req.headers.get('Authorization')
    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    // 1. GET ?action=list — List reports (public)
    if (req.method === 'GET' && action === 'list') {
      let query = supabaseAdmin.from('citizen_reports').select('*').order('created_at', { ascending: false })
      if (zoneId) query = query.eq('zone_id', zoneId)
      if (category) query = query.eq('category', category)
      if (status) query = query.eq('status', status)
      const { data, error } = await query.limit(limit)
      if (error) throw error
      return json({ data, count: data?.length })
    }

    // 2. GET ?action=detail&id=uuid — Single report detail
    if (req.method === 'GET' && action === 'detail') {
      const id = url.searchParams.get('id')
      if (!id) return json({ error: 'id required' }, 400)
      const { data, error } = await supabaseAdmin.from('citizen_reports').select('*').eq('id', id).single()
      if (error) throw error
      const { data: votes } = await supabaseAdmin.from('report_votes').select('user_id').eq('report_id', id)
      return json({ data, vote_count: votes?.length || 0 })
    }

    // 3. GET ?action=trending — Most voted reports
    if (req.method === 'GET' && action === 'trending') {
      const { data, error } = await supabaseAdmin.from('citizen_reports').select('*').eq('status', 'open').order('vote_count', { ascending: false }).limit(20)
      if (error) throw error
      return json({ data })
    }

    // 4. GET ?action=stats — Report statistics
    if (req.method === 'GET' && action === 'stats') {
      const { data, error } = await supabaseAdmin.from('citizen_reports').select('status, category, priority, zone_id')
      if (error) throw error
      const byStatus: Record<string, number> = {}
      const byCategory: Record<string, number> = {}
      const byZone: Record<string, number> = {}
      for (const r of data || []) {
        byStatus[r.status] = (byStatus[r.status] || 0) + 1
        byCategory[r.category] = (byCategory[r.category] || 0) + 1
        byZone[r.zone_id] = (byZone[r.zone_id] || 0) + 1
      }
      return json({ by_status: byStatus, by_category: byCategory, by_zone: byZone, total: data?.length })
    }

    // 5. GET ?action=my_reports — User's own reports (auth required)
    if (req.method === 'GET' && action === 'my_reports') {
      if (!authHeader) return json({ error: 'Authentication required' }, 401)
      const supabaseUser = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
      const { data: claims, error: claimsErr } = await supabaseUser.auth.getClaims(authHeader.replace('Bearer ', ''))
      if (claimsErr) return json({ error: 'Unauthorized' }, 401)
      const userId = claims.claims.sub
      const { data, error } = await supabaseAdmin.from('citizen_reports').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      if (error) throw error
      return json({ data })
    }

    // 6. POST ?action=create — Create report (auth required)
    if (req.method === 'POST' && action === 'create') {
      if (!authHeader) return json({ error: 'Authentication required' }, 401)
      const supabaseUser = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
      const { data: claims, error: claimsErr } = await supabaseUser.auth.getClaims(authHeader.replace('Bearer ', ''))
      if (claimsErr) return json({ error: 'Unauthorized' }, 401)
      const userId = claims.claims.sub
      const body = await req.json()
      const { title, description, category: cat, priority: pri, zone_id, lat, lng } = body
      if (!title || !description || !zone_id) return json({ error: 'title, description, zone_id required' }, 400)
      
      const { data, error } = await supabaseAdmin.from('citizen_reports').insert({
        user_id: userId,
        title: String(title).slice(0, 200),
        description: String(description).slice(0, 2000),
        category: cat || 'general',
        priority: pri || 'medium',
        zone_id,
        lat: lat || null,
        lng: lng || null,
      }).select().single()
      if (error) throw error
      return json({ data, created: true })
    }

    // 7. POST ?action=vote — Vote on a report (auth required)
    if (req.method === 'POST' && action === 'vote') {
      if (!authHeader) return json({ error: 'Authentication required' }, 401)
      const supabaseUser = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
      const { data: claims, error: claimsErr } = await supabaseUser.auth.getClaims(authHeader.replace('Bearer ', ''))
      if (claimsErr) return json({ error: 'Unauthorized' }, 401)
      const userId = claims.claims.sub
      const { report_id } = await req.json()
      if (!report_id) return json({ error: 'report_id required' }, 400)
      
      // Toggle vote
      const { data: existing } = await supabaseAdmin.from('report_votes').select('id').eq('report_id', report_id).eq('user_id', userId).maybeSingle()
      if (existing) {
        await supabaseAdmin.from('report_votes').delete().eq('id', existing.id)
        return json({ voted: false })
      }
      await supabaseAdmin.from('report_votes').insert({ report_id, user_id: userId })
      return json({ voted: true })
    }

    return json({ error: 'Unknown action. Use: list, detail, trending, stats, my_reports, create, vote' }, 400)
  } catch (error) {
    return json({ error: error.message }, 500)
  }
})

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
