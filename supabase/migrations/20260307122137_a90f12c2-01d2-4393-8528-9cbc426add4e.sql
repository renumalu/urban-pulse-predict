
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- City Zones
CREATE TABLE public.city_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL DEFAULT 0,
  lng DOUBLE PRECISION NOT NULL DEFAULT 0,
  elevation DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.city_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Zones are publicly readable" ON public.city_zones FOR SELECT USING (true);

-- Traffic Data
CREATE TABLE public.traffic_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id TEXT NOT NULL,
  vehicle_count INTEGER NOT NULL DEFAULT 0,
  congestion_level DOUBLE PRECISION NOT NULL DEFAULT 0,
  avg_speed DOUBLE PRECISION NOT NULL DEFAULT 0,
  prediction_60min DOUBLE PRECISION NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.traffic_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Traffic data is publicly readable" ON public.traffic_data FOR SELECT USING (true);
CREATE INDEX idx_traffic_zone ON public.traffic_data (zone_id);
CREATE INDEX idx_traffic_time ON public.traffic_data (recorded_at DESC);

-- Weather Data
CREATE TABLE public.weather_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id TEXT NOT NULL,
  rainfall DOUBLE PRECISION NOT NULL DEFAULT 0,
  temperature DOUBLE PRECISION,
  humidity DOUBLE PRECISION,
  wind_speed DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Weather data is publicly readable" ON public.weather_data FOR SELECT USING (true);
CREATE INDEX idx_weather_zone ON public.weather_data (zone_id);

-- Accident Data
CREATE TABLE public.accident_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  description TEXT,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.accident_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accident data is publicly readable" ON public.accident_data FOR SELECT USING (true);
CREATE INDEX idx_accident_zone ON public.accident_data (zone_id);

-- Emergency Units
CREATE TABLE public.emergency_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id TEXT NOT NULL UNIQUE,
  unit_type TEXT NOT NULL CHECK (unit_type IN ('ambulance', 'fire', 'police')),
  status TEXT NOT NULL CHECK (status IN ('available', 'dispatched', 'en-route')) DEFAULT 'available',
  lat DOUBLE PRECISION NOT NULL DEFAULT 0,
  lng DOUBLE PRECISION NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.emergency_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Emergency units are publicly readable" ON public.emergency_units FOR SELECT USING (true);

-- Alerts
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('traffic', 'flood', 'accident', 'emergency')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  zone_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Alerts are publicly readable" ON public.alerts FOR SELECT USING (true);
CREATE INDEX idx_alerts_active ON public.alerts (is_active, created_at DESC);

-- Triggers for updated_at
CREATE TRIGGER update_emergency_units_updated_at
  BEFORE UPDATE ON public.emergency_units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
