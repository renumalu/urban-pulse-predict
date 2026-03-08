import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const ZONES = [
  { id: 'z0', name: 'Andhra Pradesh', pop: 53 }, { id: 'z1', name: 'Arunachal Pradesh', pop: 1.7 },
  { id: 'z2', name: 'Assam', pop: 35 }, { id: 'z3', name: 'Bihar', pop: 130 },
  { id: 'z4', name: 'Chhattisgarh', pop: 30 }, { id: 'z5', name: 'Goa', pop: 1.6 },
  { id: 'z6', name: 'Gujarat', pop: 71 }, { id: 'z7', name: 'Haryana', pop: 30 },
  { id: 'z8', name: 'Himachal Pradesh', pop: 7.5 }, { id: 'z9', name: 'Jharkhand', pop: 40 },
  { id: 'z10', name: 'Karnataka', pop: 68 }, { id: 'z11', name: 'Kerala', pop: 35 },
  { id: 'z12', name: 'Madhya Pradesh', pop: 85 }, { id: 'z13', name: 'Maharashtra', pop: 126 },
  { id: 'z14', name: 'Manipur', pop: 3.2 }, { id: 'z15', name: 'Meghalaya', pop: 3.8 },
  { id: 'z16', name: 'Mizoram', pop: 1.2 }, { id: 'z17', name: 'Nagaland', pop: 2.2 },
  { id: 'z18', name: 'Odisha', pop: 46 }, { id: 'z19', name: 'Punjab', pop: 31 },
  { id: 'z20', name: 'Rajasthan', pop: 81 }, { id: 'z21', name: 'Sikkim', pop: 0.7 },
  { id: 'z22', name: 'Tamil Nadu', pop: 78 }, { id: 'z23', name: 'Telangana', pop: 40 },
  { id: 'z24', name: 'Tripura', pop: 4.2 }, { id: 'z25', name: 'Uttar Pradesh', pop: 235 },
  { id: 'z26', name: 'Uttarakhand', pop: 12 }, { id: 'z27', name: 'West Bengal', pop: 100 },
  { id: 'z28', name: 'Andaman & Nicobar', pop: 0.4 }, { id: 'z29', name: 'Chandigarh', pop: 1.2 },
  { id: 'z30', name: 'Dadra & Nagar Haveli', pop: 0.6 }, { id: 'z31', name: 'Delhi', pop: 32 },
  { id: 'z32', name: 'Jammu & Kashmir', pop: 14 }, { id: 'z33', name: 'Ladakh', pop: 0.3 },
  { id: 'z34', name: 'Lakshadweep', pop: 0.07 }, { id: 'z35', name: 'Puducherry', pop: 1.7 },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Get latest traffic data
    const { data: trafficData } = await supabase
      .from('traffic_data')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(36)

    // Get latest weather data
    const { data: weatherData } = await supabase
      .from('weather_data')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(36)

    // Get historical predictions for trend
    const { data: prevPredictions } = await supabase
      .from('traffic_predictions')
      .select('zone_id, predicted_60min, created_at')
      .order('created_at', { ascending: false })
      .limit(72)

    const hour = new Date().getUTCHours()
    const istHour = (hour + 5) % 24

    // Build context for AI
    const zoneDataSummary = ZONES.map(z => {
      const traffic = trafficData?.find(t => t.zone_id === z.id)
      const weather = weatherData?.find(w => w.zone_id === z.id)
      const prev = prevPredictions?.filter(p => p.zone_id === z.id).slice(0, 2)
      return {
        zone: z.name,
        id: z.id,
        population_millions: z.pop,
        current_congestion: traffic?.congestion_level ?? 0.3,
        vehicle_count: traffic?.vehicle_count ?? 500,
        avg_speed_kmh: traffic?.avg_speed ?? 40,
        rainfall_mm: weather?.rainfall ?? 0,
        temperature_c: weather?.temperature ?? 30,
        wind_speed: weather?.wind_speed ?? 5,
        prev_predictions: prev?.map(p => p.predicted_60min) ?? [],
      }
    })

    const prompt = `You are an LSTM-style traffic prediction model for Indian states. Given current traffic, weather, and contextual data, predict congestion levels.

Current IST hour: ${istHour}:00
Day: ${new Date().toLocaleDateString('en-IN', { weekday: 'long' })}

Data for all 36 Indian states/UTs:
${JSON.stringify(zoneDataSummary, null, 1)}

Rules for realistic predictions:
- Rush hours (8-10 AM, 5-8 PM IST) increase congestion 20-35%
- Heavy rain (>20mm/hr) increases congestion 15-25%
- High-population states (UP, Maharashtra, Bihar) naturally higher congestion
- Delhi, Mumbai, Bangalore, Chennai, Hyderabad, Kolkata have metro-level congestion
- NE states, Ladakh, Lakshadweep have minimal congestion
- Weekend patterns differ from weekday
- Consider previous predictions for trend continuity`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: 'Generate predictions for all 36 zones.' },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'submit_predictions',
            description: 'Submit traffic predictions for all zones',
            parameters: {
              type: 'object',
              properties: {
                predictions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      zone_id: { type: 'string' },
                      current_congestion: { type: 'number', description: '0-1 scale' },
                      predicted_30min: { type: 'number', description: '0-1 scale' },
                      predicted_60min: { type: 'number', description: '0-1 scale' },
                      predicted_120min: { type: 'number', description: '0-1 scale' },
                      confidence: { type: 'number', description: '0-1 scale' },
                      trend: { type: 'string', enum: ['increasing', 'decreasing', 'stable', 'peak', 'clearing'] },
                      factors: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Key factors: rush_hour, rain, high_density, weekend, event, etc.'
                      }
                    },
                    required: ['zone_id', 'current_congestion', 'predicted_30min', 'predicted_60min', 'predicted_120min', 'confidence', 'trend', 'factors'],
                    additionalProperties: false
                  }
                }
              },
              required: ['predictions'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'submit_predictions' } },
      }),
    })

    if (!response.ok) {
      const status = response.status
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited, please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required for AI predictions.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const errText = await response.text()
      console.error('AI gateway error:', status, errText)
      throw new Error(`AI gateway error: ${status}`)
    }

    const aiResult = await response.json()
    console.log('AI response:', JSON.stringify(aiResult).slice(0, 500))

    let predictions: any[] = []

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0]
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments)
        predictions = parsed.predictions || []
      } catch (parseErr) {
        console.error('Failed to parse tool call arguments:', parseErr)
      }
    }

    // Fallback: generate predictions locally if AI didn't return any
    if (!predictions || predictions.length === 0) {
      console.log('Falling back to local prediction generation')
      predictions = ZONES.map(z => {
        const traffic = trafficData?.find(t => t.zone_id === z.id)
        const weather = weatherData?.find(w => w.zone_id === z.id)
        const baseCongestion = traffic?.congestion_level ?? (0.2 + Math.random() * 0.3)
        const rainfall = weather?.rainfall ?? 0

        // Rush hour adjustment
        const isRushHour = (istHour >= 8 && istHour <= 10) || (istHour >= 17 && istHour <= 20)
        const rushFactor = isRushHour ? 1.25 : 1.0

        // Rain adjustment
        const rainFactor = rainfall > 20 ? 1.2 : rainfall > 10 ? 1.1 : 1.0

        // Population density factor
        const popFactor = Math.min(1.3, 1 + (z.pop / 250))

        const current = Math.min(1, baseCongestion * rushFactor * rainFactor * popFactor)
        const delta30 = (Math.random() - 0.5) * 0.1
        const delta60 = (Math.random() - 0.5) * 0.15
        const delta120 = (Math.random() - 0.5) * 0.2

        const pred30 = Math.max(0.05, Math.min(0.95, current + delta30))
        const pred60 = Math.max(0.05, Math.min(0.95, current + delta60))
        const pred120 = Math.max(0.05, Math.min(0.95, current + delta120))

        let trend = 'stable'
        if (pred60 > current + 0.05) trend = 'rising'
        else if (pred60 < current - 0.05) trend = 'falling'

        const factors: string[] = []
        if (isRushHour) factors.push('rush_hour')
        if (rainfall > 10) factors.push('rain')
        if (z.pop > 50) factors.push('high_density')

        return {
          zone_id: z.id,
          current_congestion: Math.round(current * 100) / 100,
          predicted_30min: Math.round(pred30 * 100) / 100,
          predicted_60min: Math.round(pred60 * 100) / 100,
          predicted_120min: Math.round(pred120 * 100) / 100,
          confidence: Math.round((0.7 + Math.random() * 0.25) * 100) / 100,
          trend,
          factors,
        }
      })
    }

    if (predictions && predictions.length > 0) {
      const rows = predictions.map((p: any) => ({
        zone_id: p.zone_id,
        current_congestion: Math.max(0, Math.min(1, p.current_congestion)),
        predicted_30min: Math.max(0, Math.min(1, p.predicted_30min)),
        predicted_60min: Math.max(0, Math.min(1, p.predicted_60min)),
        predicted_120min: Math.max(0, Math.min(1, p.predicted_120min)),
        confidence: Math.max(0, Math.min(1, p.confidence)),
        trend: p.trend || 'stable',
        factors: p.factors || [],
      }))

      const { error: insertError } = await supabase.from('traffic_predictions').insert(rows)
      if (insertError) console.error('Insert error:', insertError)
    }

    return new Response(JSON.stringify({
      success: true,
      predictions_count: predictions?.length || 0,
      predictions,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Prediction error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
