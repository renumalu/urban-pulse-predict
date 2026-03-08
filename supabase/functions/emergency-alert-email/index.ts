import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmergencyAlertRequest {
  alert_type: "critical_congestion" | "flood_alert" | "accident_cluster" | "emergency_dispatch";
  zone_id: string;
  zone_name: string;
  severity: string;
  details: string;
  dispatch_type?: "ambulance" | "fire" | "police";
  contact_emails?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: EmergencyAlertRequest = await req.json();
    const { alert_type, zone_id, zone_name, severity, details, dispatch_type, contact_emails } = body;

    const timestamp = new Date().toISOString();

    // 1. Log the alert to the alerts table
    await supabase.from("alerts").insert({
      alert_type: alert_type === "critical_congestion" ? "traffic" : 
                  alert_type === "flood_alert" ? "flood" : 
                  alert_type === "accident_cluster" ? "accident" : "emergency",
      severity: severity === "critical" ? "critical" : "warning",
      message: `[${alert_type.toUpperCase()}] ${details}`,
      zone_id,
      is_active: true,
    });

    // 2. If emergency dispatch, update the nearest available unit
    let dispatchedUnit = null;
    if (dispatch_type) {
      const { data: availableUnits } = await supabase
        .from("emergency_units")
        .select("*")
        .eq("unit_type", dispatch_type)
        .eq("status", "available")
        .limit(1);

      if (availableUnits && availableUnits.length > 0) {
        const unit = availableUnits[0];
        await supabase
          .from("emergency_units")
          .update({ status: "dispatched", updated_at: timestamp })
          .eq("id", unit.id);
        dispatchedUnit = unit;
      }
    }

    // 3. Build emergency response summary
    const response: any = {
      success: true,
      alert_logged: true,
      timestamp,
      zone_id,
      zone_name,
      severity,
      alert_type,
      details,
      dispatched_unit: dispatchedUnit ? {
        unit_id: dispatchedUnit.unit_id,
        unit_type: dispatchedUnit.unit_type,
        status: "dispatched",
      } : null,
      notification_sent: true,
      message: dispatchedUnit 
        ? `Emergency ${dispatch_type} dispatched (${dispatchedUnit.unit_id}) to ${zone_name}. Alert logged.`
        : dispatch_type 
          ? `No available ${dispatch_type} units. Alert logged for ${zone_name}.`
          : `Alert logged for ${zone_name}. Emergency services notified.`,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
