import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple DBSCAN-like clustering
function clusterPoints(points: { lat: number; lng: number; severity: string }[], eps = 0.005, minPts = 2) {
  const clusters: { centroid: { lat: number; lng: number }; count: number; severity: string; points: typeof points }[] = []
  const visited = new Set<number>()

  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue
    const neighbors: number[] = []
    for (let j = 0; j < points.length; j++) {
      const dist = Math.sqrt((points[i].lat - points[j].lat) ** 2 + (points[i].lng - points[j].lng) ** 2)
      if (dist < eps) neighbors.push(j)
    }
    if (neighbors.length >= minPts) {
      neighbors.forEach(n => visited.add(n))
      const clusterPts = neighbors.map(n => points[n])
      const centroid = {
        lat: clusterPts.reduce((s, p) => s + p.lat, 0) / clusterPts.length,
        lng: clusterPts.reduce((s, p) => s + p.lng, 0) / clusterPts.length,
      }
      const highCount = clusterPts.filter(p => p.severity === 'high').length
      clusters.push({
        centroid,
        count: clusterPts.length,
        severity: highCount > clusterPts.length / 2 ? 'high' : 'medium',
        points: clusterPts,
      })
    }
  }
  return clusters
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: accidents, error } = await supabase
      .from('accident_data')
      .select('lat, lng, severity')
      .order('reported_at', { ascending: false })
      .limit(200)

    if (error) throw error

    const hotspots = clusterPoints(accidents || [])

    return new Response(JSON.stringify({ hotspots, total_accidents: accidents?.length || 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
