import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ZONE_ELEVATIONS: Record<string, number> = {
  z0: 200, z1: 1500, z2: 55, z3: 53, z4: 300, z5: 37, z6: 81, z7: 220, z8: 2200, z9: 650,
  z10: 920, z11: 10, z12: 500, z13: 14, z14: 790, z15: 1500, z16: 1100, z17: 1500, z18: 45,
  z19: 230, z20: 431, z21: 1650, z22: 6, z23: 542, z24: 13, z25: 123, z26: 640, z27: 11,
  z28: 16, z29: 321, z30: 12, z31: 216, z32: 1585, z33: 3500, z34: 2, z35: 6,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: weatherData, error } = await supabase
      .from('weather_data')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(36)

    if (error) throw error

    const maxElev = 3500
    const simulation = (weatherData || []).map(w => {
      const elevation = ZONE_ELEVATIONS[w.zone_id] || 100
      const riskLevel = Math.max(0, Math.min(1, (w.rainfall / 80) * (1 - elevation / maxElev)))
      const waterLevel = riskLevel * 2.5
      return {
        zone_id: w.zone_id,
        rainfall: w.rainfall,
        elevation,
        risk_level: Math.round(riskLevel * 100) / 100,
        water_level: Math.round(waterLevel * 100) / 100,
        status: riskLevel > 0.7 ? 'critical' : riskLevel > 0.4 ? 'warning' : 'safe',
      }
    })

    return new Response(JSON.stringify({ simulation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
