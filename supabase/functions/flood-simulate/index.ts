import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ZONE_ELEVATIONS: Record<string, number> = {
  z0: 10, z1: 15, z2: 3, z3: 20, z4: 12, z5: 2, z6: 18, z7: 8, z8: 25, z9: 22, z10: 14, z11: 30,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Get latest weather data
    const { data: weatherData, error } = await supabase
      .from('weather_data')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(12)

    if (error) throw error

    const simulation = (weatherData || []).map(w => {
      const elevation = ZONE_ELEVATIONS[w.zone_id] || 10
      const riskLevel = Math.max(0, Math.min(1, (w.rainfall / 80) * (1 - elevation / 35)))
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
