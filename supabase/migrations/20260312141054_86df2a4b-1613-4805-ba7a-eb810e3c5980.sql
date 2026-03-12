
-- Air Quality Data
CREATE TABLE public.air_quality_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id text NOT NULL,
  aqi integer NOT NULL DEFAULT 0,
  pm25 double precision NOT NULL DEFAULT 0,
  pm10 double precision NOT NULL DEFAULT 0,
  o3 double precision NOT NULL DEFAULT 0,
  no2 double precision NOT NULL DEFAULT 0,
  so2 double precision NOT NULL DEFAULT 0,
  co double precision NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'good',
  recorded_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.air_quality_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Air quality data publicly readable" ON public.air_quality_data FOR SELECT TO public USING (true);
CREATE POLICY "No client writes air_quality_data" ON public.air_quality_data FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client updates air_quality_data" ON public.air_quality_data FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes air_quality_data" ON public.air_quality_data FOR DELETE TO anon, authenticated USING (false);

-- Noise Pollution Data
CREATE TABLE public.noise_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id text NOT NULL,
  decibel_level double precision NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'acceptable',
  source text NOT NULL DEFAULT 'traffic',
  near_sensitive_area boolean NOT NULL DEFAULT false,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.noise_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Noise data publicly readable" ON public.noise_data FOR SELECT TO public USING (true);
CREATE POLICY "No client writes noise_data" ON public.noise_data FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client updates noise_data" ON public.noise_data FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes noise_data" ON public.noise_data FOR DELETE TO anon, authenticated USING (false);

-- Public Transport Data
CREATE TABLE public.transport_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id text NOT NULL,
  transport_type text NOT NULL DEFAULT 'bus',
  route_name text NOT NULL DEFAULT '',
  occupancy_percent double precision NOT NULL DEFAULT 0,
  eta_minutes integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'on_time',
  vehicle_id text NOT NULL DEFAULT '',
  recorded_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.transport_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Transport data publicly readable" ON public.transport_data FOR SELECT TO public USING (true);
CREATE POLICY "No client writes transport_data" ON public.transport_data FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client updates transport_data" ON public.transport_data FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes transport_data" ON public.transport_data FOR DELETE TO anon, authenticated USING (false);

-- Power Grid Data
CREATE TABLE public.power_grid_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id text NOT NULL,
  load_mw double precision NOT NULL DEFAULT 0,
  capacity_mw double precision NOT NULL DEFAULT 0,
  load_percent double precision NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'normal',
  outage_active boolean NOT NULL DEFAULT false,
  outage_duration_min integer NOT NULL DEFAULT 0,
  frequency_hz double precision NOT NULL DEFAULT 50.0,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.power_grid_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Power grid data publicly readable" ON public.power_grid_data FOR SELECT TO public USING (true);
CREATE POLICY "No client writes power_grid_data" ON public.power_grid_data FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client updates power_grid_data" ON public.power_grid_data FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes power_grid_data" ON public.power_grid_data FOR DELETE TO anon, authenticated USING (false);
