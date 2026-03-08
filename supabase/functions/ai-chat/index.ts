import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { messages } = await req.json()
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Fetch latest data to give AI real context
    const [trafficRes, weatherRes, accidentsRes, alertsRes, unitsRes] = await Promise.all([
      supabase.from('traffic_data').select('zone_id, congestion_level, avg_speed, vehicle_count, prediction_60min').order('recorded_at', { ascending: false }).limit(36),
      supabase.from('weather_data').select('zone_id, rainfall, temperature, humidity, wind_speed').order('recorded_at', { ascending: false }).limit(36),
      supabase.from('accident_data').select('zone_id, severity, lat, lng, description').order('reported_at', { ascending: false }).limit(20),
      supabase.from('alerts').select('zone_id, alert_type, severity, message').eq('is_active', true).order('created_at', { ascending: false }).limit(15),
      supabase.from('emergency_units').select('unit_id, unit_type, status').limit(20),
    ])

    // Zone name mapping
    const ZONE_NAMES: Record<string, string> = {
      z0: 'Andhra Pradesh', z1: 'Arunachal Pradesh', z2: 'Assam', z3: 'Bihar',
      z4: 'Chhattisgarh', z5: 'Goa', z6: 'Gujarat', z7: 'Haryana',
      z8: 'Himachal Pradesh', z9: 'Jharkhand', z10: 'Karnataka', z11: 'Kerala',
      z12: 'Madhya Pradesh', z13: 'Maharashtra', z14: 'Manipur', z15: 'Meghalaya',
      z16: 'Mizoram', z17: 'Nagaland', z18: 'Odisha', z19: 'Punjab',
      z20: 'Rajasthan', z21: 'Sikkim', z22: 'Tamil Nadu', z23: 'Telangana',
      z24: 'Tripura', z25: 'Uttar Pradesh', z26: 'Uttarakhand', z27: 'West Bengal',
      z28: 'Andaman & Nicobar', z29: 'Chandigarh', z30: 'Dadra & Nagar Haveli',
      z31: 'Delhi', z32: 'Jammu & Kashmir', z33: 'Ladakh', z34: 'Lakshadweep', z35: 'Puducherry',
    }

    const enrichWithNames = (data: any[]) => data?.map(d => ({ ...d, zone_name: ZONE_NAMES[d.zone_id] || d.zone_id })) || []

    const trafficData = enrichWithNames(trafficRes.data || [])
    const weatherData = enrichWithNames(weatherRes.data || [])
    const accidentData = enrichWithNames(accidentsRes.data || [])
    const alertData = enrichWithNames(alertsRes.data || [])

    const systemPrompt = `You are **UrbanPulse AI**, the intelligent assistant for India's Predictive Urban Digital Twin platform. You have access to LIVE real-time data from all 36 Indian states & union territories.

## Your Capabilities
- Answer questions about traffic congestion, speeds, and predictions for any zone
- Report weather conditions including rainfall, temperature, humidity, and wind
- Identify flood risk zones based on rainfall + elevation
- Summarize active alerts and emergencies
- Provide accident reports and severity analysis
- Track emergency unit (ambulance, fire, police) availability

## Current Live Data Snapshot

### Traffic Data (Latest):
${JSON.stringify(trafficData.map(t => ({
  zone: t.zone_name,
  congestion: (t.congestion_level * 100).toFixed(0) + '%',
  avg_speed: t.avg_speed + ' km/h',
  vehicles: t.vehicle_count,
  prediction_60min: (t.prediction_60min * 100).toFixed(0) + '%',
})), null, 1)}

### Weather Data (Latest):
${JSON.stringify(weatherData.map(w => ({
  zone: w.zone_name,
  rainfall: w.rainfall + ' mm/hr',
  temp: w.temperature + '°C',
  humidity: w.humidity + '%',
  wind: w.wind_speed + ' km/h',
})), null, 1)}

### Recent Accidents:
${JSON.stringify(accidentData.map(a => ({
  zone: a.zone_name,
  severity: a.severity,
  description: a.description,
})), null, 1)}

### Active Alerts:
${JSON.stringify(alertData.map(a => ({
  zone: a.zone_name,
  type: a.alert_type,
  severity: a.severity,
  message: a.message,
})), null, 1)}

### Emergency Units:
${JSON.stringify((unitsRes.data || []).map(u => ({
  id: u.unit_id,
  type: u.unit_type,
  status: u.status,
})), null, 1)}

## Response Guidelines
- Use **markdown formatting** with headers, bold, tables, and bullet points
- When asked about a specific zone/state, provide detailed data from the snapshot
- For flood risk: zones with rainfall > 15mm/hr AND low elevation are high risk
- For traffic: congestion > 0.7 is "heavy", > 0.5 is "moderate", < 0.3 is "light"
- Always mention data is LIVE and real-time
- Be concise but thorough. Use tables for comparisons.
- If asked about something not in the data, say so honestly.
- Sign off responses with a relevant emoji`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    })

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI usage credits exhausted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const errorText = await response.text()
      console.error('AI gateway error:', response.status, errorText)
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    })
  } catch (e) {
    console.error('chat error:', e)
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
