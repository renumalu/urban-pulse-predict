
-- Add explicit write deny policies for system-managed tables
-- INSERT only uses WITH CHECK, UPDATE uses both, DELETE only uses USING

CREATE POLICY "No client writes to emergency_units" ON public.emergency_units FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "No client updates to emergency_units" ON public.emergency_units FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes from emergency_units" ON public.emergency_units FOR DELETE TO authenticated, anon USING (false);

CREATE POLICY "No client writes to accident_data" ON public.accident_data FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "No client updates to accident_data" ON public.accident_data FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes from accident_data" ON public.accident_data FOR DELETE TO authenticated, anon USING (false);

CREATE POLICY "No client writes to alerts" ON public.alerts FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "No client updates to alerts" ON public.alerts FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes from alerts" ON public.alerts FOR DELETE TO authenticated, anon USING (false);

CREATE POLICY "No client writes to traffic_data" ON public.traffic_data FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "No client updates to traffic_data" ON public.traffic_data FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes from traffic_data" ON public.traffic_data FOR DELETE TO authenticated, anon USING (false);

CREATE POLICY "No client writes to traffic_predictions" ON public.traffic_predictions FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "No client updates to traffic_predictions" ON public.traffic_predictions FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes from traffic_predictions" ON public.traffic_predictions FOR DELETE TO authenticated, anon USING (false);

CREATE POLICY "No client writes to weather_data" ON public.weather_data FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "No client updates to weather_data" ON public.weather_data FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes from weather_data" ON public.weather_data FOR DELETE TO authenticated, anon USING (false);

CREATE POLICY "No client writes to city_zones" ON public.city_zones FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "No client updates to city_zones" ON public.city_zones FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes from city_zones" ON public.city_zones FOR DELETE TO authenticated, anon USING (false);
