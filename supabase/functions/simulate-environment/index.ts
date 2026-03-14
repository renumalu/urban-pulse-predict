import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ZONES = Array.from({ length: 36 }, (_, i) => `z${i}`);

// Population tiers affect pollution/load levels
const HIGH_POP_ZONES = new Set([
  "z3","z6","z10","z13","z20","z22","z23","z25","z27","z31",
]);
const MED_POP_ZONES = new Set([
  "z0","z7","z9","z11","z12","z18","z19",
]);

const NOISE_SOURCES = ["traffic","construction","industrial","commercial","residential"];
const TRANSPORT_TYPES = ["bus","metro","train","tram"];
const ROUTE_NAMES: Record<string, string[]> = {
  z10: ["Namma Metro Purple","Namma Metro Green","BMTC Volvo"],
  z13: ["Mumbai Metro Line 1","Mumbai Local Western","Mumbai Local Central","BEST AC Bus"],
  z22: ["Chennai Metro Blue","Chennai Metro Green","MTC Deluxe","MRTS Chennai"],
  z25: ["Lucknow Metro","UPSRTC AC","Noida Metro Aqua"],
  z27: ["Kolkata Metro Blue","Kolkata Metro Green","Kolkata Heritage Tram"],
  z31: ["Delhi Metro Yellow","Delhi Metro Blue","Delhi Metro Red","DTC AC Bus","DTC Cluster Bus"],
  z23: ["Hyderabad Metro Red","Hyderabad Metro Blue"],
  z6:  ["BRTS Ahmedabad","Ahmedabad Metro Blue"],
  z0:  ["Vijayawada Express","Green Line"],
  z11: ["Kochi Metro","Kochi City Bus"],
  z20: ["Jaipur Metro","Jaipur City Transport"],
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function getAqiCategory(aqi: number): string {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "unhealthy_sensitive";
  if (aqi <= 200) return "unhealthy";
  if (aqi <= 300) return "very_unhealthy";
  return "hazardous";
}

function getNoiseCategory(db: number): string {
  if (db <= 50) return "Quiet";
  if (db <= 65) return "Moderate";
  if (db <= 75) return "Loud";
  if (db <= 85) return "Very Loud";
  return "Dangerous";
}

function generateAirQuality() {
  return ZONES.map((zone_id) => {
    const isHigh = HIGH_POP_ZONES.has(zone_id);
    const isMed = MED_POP_ZONES.has(zone_id);
    const base = isHigh ? 120 : isMed ? 80 : 35;
    const aqi = clamp(Math.round(base + rand(-25, 40)), 15, 350);
    const pm25 = +(aqi * rand(0.35, 0.5)).toFixed(1);
    const pm10 = +(aqi * rand(0.6, 0.85)).toFixed(1);
    const no2 = +(aqi * rand(0.2, 0.35)).toFixed(1);
    const so2 = +(aqi * rand(0.08, 0.14)).toFixed(1);
    const o3 = +(20 + aqi * rand(0.15, 0.25)).toFixed(1);
    const co = +(aqi * rand(0.008, 0.015)).toFixed(1);
    return {
      zone_id, aqi, pm25, pm10, no2, so2, o3, co,
      category: getAqiCategory(aqi),
    };
  });
}

function generateNoise() {
  return ZONES.map((zone_id) => {
    const isHigh = HIGH_POP_ZONES.has(zone_id);
    const isMed = MED_POP_ZONES.has(zone_id);
    const base = isHigh ? 72 : isMed ? 60 : 38;
    const decibel_level = clamp(Math.round(base + rand(-8, 15)), 25, 110);
    return {
      zone_id,
      decibel_level,
      category: getNoiseCategory(decibel_level),
      source: NOISE_SOURCES[Math.floor(Math.random() * NOISE_SOURCES.length)],
      near_sensitive_area: Math.random() > 0.65,
    };
  });
}

function generateTransport() {
  const rows: Record<string, unknown>[] = [];
  const zonesWithTransport = Object.keys(ROUTE_NAMES);
  for (const zone_id of zonesWithTransport) {
    const routes = ROUTE_NAMES[zone_id];
    for (let i = 0; i < routes.length; i++) {
      const type = routes[i].toLowerCase().includes("metro") ? "metro"
        : routes[i].toLowerCase().includes("local") || routes[i].toLowerCase().includes("mrts") ? "train"
        : routes[i].toLowerCase().includes("tram") ? "tram" : "bus";
      rows.push({
        zone_id,
        transport_type: type,
        vehicle_id: `${zone_id.toUpperCase()}-${type.toUpperCase()}-${String(i + 1).padStart(2, "0")}`,
        route_name: routes[i],
        status: Math.random() > 0.2 ? "on_time" : "delayed",
        occupancy_percent: clamp(Math.round(rand(30, 100)), 0, 105),
        eta_minutes: Math.round(rand(2, 35)),
      });
    }
  }
  return rows;
}

function generatePowerGrid() {
  return ZONES.map((zone_id) => {
    const isHigh = HIGH_POP_ZONES.has(zone_id);
    const isMed = MED_POP_ZONES.has(zone_id);
    const capacity_mw = isHigh
      ? Math.round(rand(10000, 25000))
      : isMed
      ? Math.round(rand(4000, 12000))
      : Math.round(rand(50, 5000));
    const load_percent = clamp(Math.round(rand(50, 95)), 30, 100);
    const load_mw = Math.round(capacity_mw * (load_percent / 100));
    const outage_active = Math.random() > 0.9;
    const outage_duration_min = outage_active ? Math.round(rand(5, 120)) : 0;
    const status = outage_active ? "outage" : load_percent > 90 ? "critical" : load_percent > 75 ? "warning" : "normal";
    const frequency_hz = +(49.8 + Math.random() * 0.4).toFixed(2);
    return {
      zone_id, load_mw, capacity_mw, load_percent,
      status, outage_active, outage_duration_min, frequency_hz,
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Delete old data and insert fresh for each table
    const results: Record<string, string> = {};

    // Air Quality
    await supabase.from("air_quality_data").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const { error: aqErr } = await supabase.from("air_quality_data").insert(generateAirQuality());
    results.air_quality = aqErr ? `error: ${aqErr.message}` : "36 rows";

    // Noise
    await supabase.from("noise_data").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const { error: noiseErr } = await supabase.from("noise_data").insert(generateNoise());
    results.noise = noiseErr ? `error: ${noiseErr.message}` : "36 rows";

    // Transport
    await supabase.from("transport_data").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const transportData = generateTransport();
    const { error: transErr } = await supabase.from("transport_data").insert(transportData);
    results.transport = transErr ? `error: ${transErr.message}` : `${transportData.length} rows`;

    // Power Grid
    await supabase.from("power_grid_data").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const { error: pgErr } = await supabase.from("power_grid_data").insert(generatePowerGrid());
    results.power_grid = pgErr ? `error: ${pgErr.message}` : "36 rows";

    return new Response(JSON.stringify({ success: true, results, refreshed_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
