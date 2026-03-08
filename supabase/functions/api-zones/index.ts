import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const ZONE_META: Record<string, { name: string; population: number; area_sqkm: number; capital: string }> = {
  z0: { name: 'Andhra Pradesh', population: 53, area_sqkm: 162968, capital: 'Amaravati' },
  z1: { name: 'Arunachal Pradesh', population: 1.7, area_sqkm: 83743, capital: 'Itanagar' },
  z2: { name: 'Assam', population: 35, area_sqkm: 78438, capital: 'Dispur' },
  z3: { name: 'Bihar', population: 130, area_sqkm: 94163, capital: 'Patna' },
  z4: { name: 'Chhattisgarh', population: 30, area_sqkm: 135194, capital: 'Raipur' },
  z5: { name: 'Goa', population: 1.6, area_sqkm: 3702, capital: 'Panaji' },
  z6: { name: 'Gujarat', population: 71, area_sqkm: 196024, capital: 'Gandhinagar' },
  z7: { name: 'Haryana', population: 30, area_sqkm: 44212, capital: 'Chandigarh' },
  z8: { name: 'Himachal Pradesh', population: 7.5, area_sqkm: 55673, capital: 'Shimla' },
  z9: { name: 'Jharkhand', population: 40, area_sqkm: 79714, capital: 'Ranchi' },
  z10: { name: 'Karnataka', population: 68, area_sqkm: 191791, capital: 'Bengaluru' },
  z11: { name: 'Kerala', population: 35, area_sqkm: 38863, capital: 'Thiruvananthapuram' },
  z12: { name: 'Madhya Pradesh', population: 85, area_sqkm: 308252, capital: 'Bhopal' },
  z13: { name: 'Maharashtra', population: 126, area_sqkm: 307713, capital: 'Mumbai' },
  z14: { name: 'Manipur', population: 3.2, area_sqkm: 22327, capital: 'Imphal' },
  z15: { name: 'Meghalaya', population: 3.8, area_sqkm: 22429, capital: 'Shillong' },
  z16: { name: 'Mizoram', population: 1.2, area_sqkm: 21081, capital: 'Aizawl' },
  z17: { name: 'Nagaland', population: 2.2, area_sqkm: 16579, capital: 'Kohima' },
  z18: { name: 'Odisha', population: 46, area_sqkm: 155707, capital: 'Bhubaneswar' },
  z19: { name: 'Punjab', population: 31, area_sqkm: 50362, capital: 'Chandigarh' },
  z20: { name: 'Rajasthan', population: 81, area_sqkm: 342239, capital: 'Jaipur' },
  z21: { name: 'Sikkim', population: 0.7, area_sqkm: 7096, capital: 'Gangtok' },
  z22: { name: 'Tamil Nadu', population: 78, area_sqkm: 130058, capital: 'Chennai' },
  z23: { name: 'Telangana', population: 40, area_sqkm: 112077, capital: 'Hyderabad' },
  z24: { name: 'Tripura', population: 4.2, area_sqkm: 10486, capital: 'Agartala' },
  z25: { name: 'Uttar Pradesh', population: 235, area_sqkm: 240928, capital: 'Lucknow' },
  z26: { name: 'Uttarakhand', population: 12, area_sqkm: 53483, capital: 'Dehradun' },
  z27: { name: 'West Bengal', population: 100, area_sqkm: 88752, capital: 'Kolkata' },
  z28: { name: 'Andaman & Nicobar', population: 0.4, area_sqkm: 8249, capital: 'Port Blair' },
  z29: { name: 'Chandigarh', population: 1.2, area_sqkm: 114, capital: 'Chandigarh' },
  z30: { name: 'Dadra & Nagar Haveli and Daman & Diu', population: 0.6, area_sqkm: 603, capital: 'Daman' },
  z31: { name: 'Delhi', population: 32, area_sqkm: 1484, capital: 'New Delhi' },
  z32: { name: 'Jammu & Kashmir', population: 14, area_sqkm: 42241, capital: 'Srinagar' },
  z33: { name: 'Ladakh', population: 0.3, area_sqkm: 59146, capital: 'Leh' },
  z34: { name: 'Lakshadweep', population: 0.07, area_sqkm: 32, capital: 'Kavaratti' },
  z35: { name: 'Puducherry', population: 1.7, area_sqkm: 479, capital: 'Puducherry' },
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

    // 1. GET ?action=list — All zones with metadata
    if (action === 'list') {
      const { data, error } = await supabase.from('city_zones').select('*')
      if (error) throw error
      const enriched = (data || []).map(z => ({ ...z, meta: ZONE_META[z.zone_id] || null }))
      return json({ data: enriched, count: enriched.length })
    }

    // 2. GET ?action=detail&zone_id=z31 — Zone detail with latest data
    if (action === 'detail' && zoneId) {
      const [zoneRes, trafficRes, weatherRes, alertRes, accidentRes] = await Promise.all([
        supabase.from('city_zones').select('*').eq('zone_id', zoneId).maybeSingle(),
        supabase.from('traffic_data').select('*').eq('zone_id', zoneId).order('recorded_at', { ascending: false }).limit(1),
        supabase.from('weather_data').select('*').eq('zone_id', zoneId).order('recorded_at', { ascending: false }).limit(1),
        supabase.from('alerts').select('*').eq('zone_id', zoneId).eq('is_active', true),
        supabase.from('accident_data').select('*').eq('zone_id', zoneId).order('reported_at', { ascending: false }).limit(5),
      ])
      return json({
        zone: zoneRes.data,
        meta: ZONE_META[zoneId] || null,
        latest_traffic: trafficRes.data?.[0] || null,
        latest_weather: weatherRes.data?.[0] || null,
        active_alerts: alertRes.data || [],
        recent_accidents: accidentRes.data || [],
      })
    }

    // 3. GET ?action=meta — Zone metadata only (no DB query)
    if (action === 'meta') {
      if (zoneId) return json({ data: ZONE_META[zoneId] || null })
      return json({ data: ZONE_META })
    }

    return json({ error: 'Unknown action. Use: list, detail, meta' }, 400)
  } catch (error) {
    return json({ error: error.message }, 500)
  }
})

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
