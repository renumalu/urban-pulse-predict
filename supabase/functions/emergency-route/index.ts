import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// A* pathfinding on a simplified grid
interface Node { x: number; y: number; g: number; h: number; f: number; parent: Node | null }

function heuristic(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function aStar(
  startLat: number, startLng: number,
  endLat: number, endLng: number,
  congestionMap: Record<string, number>
) {
  const gridSize = 20
  const latRange = [40.695, 40.740]
  const lngRange = [-74.025, -73.985]
  
  const toGrid = (lat: number, lng: number) => ({
    x: Math.round(((lng - lngRange[0]) / (lngRange[1] - lngRange[0])) * gridSize),
    y: Math.round(((lat - latRange[0]) / (latRange[1] - latRange[0])) * gridSize),
  })
  
  const toCoord = (x: number, y: number) => ({
    lat: latRange[0] + (y / gridSize) * (latRange[1] - latRange[0]),
    lng: lngRange[0] + (x / gridSize) * (lngRange[1] - lngRange[0]),
  })

  const start = toGrid(startLat, startLng)
  const end = toGrid(endLat, endLng)

  const open: Node[] = [{ ...start, g: 0, h: heuristic(start, end), f: heuristic(start, end), parent: null }]
  const closed = new Set<string>()

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f)
    const current = open.shift()!
    const key = `${current.x},${current.y}`

    if (current.x === end.x && current.y === end.y) {
      const path: { lat: number; lng: number }[] = []
      let node: Node | null = current
      while (node) {
        const coord = toCoord(node.x, node.y)
        path.unshift(coord)
        node = node.parent
      }
      return path
    }

    closed.add(key)

    for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const nx = current.x + dx
      const ny = current.y + dy
      const nKey = `${nx},${ny}`
      
      if (nx < 0 || nx > gridSize || ny < 0 || ny > gridSize || closed.has(nKey)) continue

      // Cost increases with congestion
      const congestion = congestionMap[`${nx},${ny}`] || 0
      const moveCost = Math.abs(dx) + Math.abs(dy) === 2 ? 1.41 : 1
      const g = current.g + moveCost * (1 + congestion * 3)
      const h = heuristic({ x: nx, y: ny }, end)

      const existing = open.find(n => n.x === nx && n.y === ny)
      if (!existing || g < existing.g) {
        if (existing) open.splice(open.indexOf(existing), 1)
        open.push({ x: nx, y: ny, g, h, f: g + h, parent: current })
      }
    }
  }

  // Fallback: direct line
  return [
    { lat: startLat, lng: startLng },
    { lat: endLat, lng: endLng },
  ]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const { start_lat, start_lng, end_lat, end_lng } = await req.json()

    if (!start_lat || !start_lng || !end_lat || !end_lng) {
      return new Response(JSON.stringify({ error: 'Missing coordinates' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get congestion data for cost map
    const { data: traffic } = await supabase
      .from('traffic_data')
      .select('zone_id, congestion_level')
      .order('recorded_at', { ascending: false })
      .limit(12)

    const congestionMap: Record<string, number> = {}
    // Simplified: spread congestion across grid
    if (traffic) {
      traffic.forEach(t => {
        const idx = parseInt(t.zone_id.replace('z', ''))
        const cx = (idx % 4) * 5
        const cy = Math.floor(idx / 4) * 7
        for (let dx = -2; dx <= 2; dx++) {
          for (let dy = -2; dy <= 2; dy++) {
            congestionMap[`${cx+dx},${cy+dy}`] = t.congestion_level
          }
        }
      })
    }

    const route = aStar(start_lat, start_lng, end_lat, end_lng, congestionMap)
    const distance = route.reduce((sum, p, i) => {
      if (i === 0) return 0
      const prev = route[i - 1]
      return sum + Math.sqrt((p.lat - prev.lat) ** 2 + (p.lng - prev.lng) ** 2) * 111
    }, 0)

    return new Response(JSON.stringify({
      route,
      distance_km: Math.round(distance * 100) / 100,
      estimated_time_min: Math.round(distance / 0.8 * 10) / 10,
      waypoints: route.length,
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
