import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ZONES = [
  { id: 'z0', name: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480 },
  { id: 'z1', name: 'Arunachal Pradesh', lat: 27.0844, lng: 93.6053 },
  { id: 'z2', name: 'Assam', lat: 26.1445, lng: 91.7362 },
  { id: 'z3', name: 'Bihar', lat: 25.6093, lng: 85.1376 },
  { id: 'z4', name: 'Chhattisgarh', lat: 21.2514, lng: 81.6296 },
  { id: 'z5', name: 'Goa', lat: 15.4909, lng: 73.8278 },
  { id: 'z6', name: 'Gujarat', lat: 23.2156, lng: 72.6369 },
  { id: 'z7', name: 'Haryana', lat: 30.7333, lng: 76.7794 },
  { id: 'z8', name: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
  { id: 'z9', name: 'Jharkhand', lat: 23.3441, lng: 85.3096 },
  { id: 'z10', name: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { id: 'z11', name: 'Kerala', lat: 8.5241, lng: 76.9366 },
  { id: 'z12', name: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { id: 'z13', name: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { id: 'z14', name: 'Manipur', lat: 24.8170, lng: 93.9368 },
  { id: 'z15', name: 'Meghalaya', lat: 25.5788, lng: 91.8933 },
  { id: 'z16', name: 'Mizoram', lat: 23.7271, lng: 92.7176 },
  { id: 'z17', name: 'Nagaland', lat: 25.6751, lng: 94.1086 },
  { id: 'z18', name: 'Odisha', lat: 20.2961, lng: 85.8245 },
  { id: 'z19', name: 'Punjab', lat: 30.7333, lng: 76.7794 },
  { id: 'z20', name: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { id: 'z21', name: 'Sikkim', lat: 27.3389, lng: 88.6065 },
  { id: 'z22', name: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { id: 'z23', name: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { id: 'z24', name: 'Tripura', lat: 23.8315, lng: 91.2868 },
  { id: 'z25', name: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { id: 'z26', name: 'Uttarakhand', lat: 30.3165, lng: 78.0322 },
  { id: 'z27', name: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { id: 'z28', name: 'Andaman & Nicobar', lat: 11.6234, lng: 92.7265 },
  { id: 'z29', name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { id: 'z30', name: 'Dadra & Nagar Haveli', lat: 20.3974, lng: 72.8328 },
  { id: 'z31', name: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { id: 'z32', name: 'Jammu & Kashmir', lat: 34.0837, lng: 74.7973 },
  { id: 'z33', name: 'Ladakh', lat: 34.1526, lng: 77.5771 },
  { id: 'z34', name: 'Lakshadweep', lat: 10.5593, lng: 72.6358 },
  { id: 'z35', name: 'Puducherry', lat: 11.9416, lng: 79.8083 },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('OPENWEATHERMAP_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OpenWeatherMap API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Fetch weather for all zones (batch in groups of 6 to stay within rate limits)
    const weatherResults = []
    for (let i = 0; i < ZONES.length; i += 6) {
      const batch = ZONES.slice(i, i + 6)
      const batchResults = await Promise.all(
        batch.map(async (zone) => {
          try {
            const res = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${zone.lat}&lon=${zone.lng}&appid=${apiKey}&units=metric`
            )
            if (!res.ok) {
              console.error(`Weather fetch failed for ${zone.name}: ${res.status}`)
              return null
            }
            const data = await res.json()
            return {
              zone_id: zone.id,
              rainfall: data.rain?.['1h'] || data.rain?.['3h'] || 0,
              temperature: data.main?.temp || 25,
              humidity: data.main?.humidity || 50,
              wind_speed: data.wind?.speed || 0,
            }
          } catch (err) {
            console.error(`Error fetching weather for ${zone.name}:`, err)
            return null
          }
        })
      )
      weatherResults.push(...batchResults.filter(Boolean))
    }

    if (weatherResults.length > 0) {
      const { error } = await supabase.from('weather_data').insert(weatherResults)
      if (error) {
        console.error('Error inserting weather data:', error)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      fetched: weatherResults.length,
      zones: ZONES.length,
      data: weatherResults,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
