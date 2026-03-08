
CREATE TABLE public.traffic_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id TEXT NOT NULL,
  current_congestion DOUBLE PRECISION NOT NULL DEFAULT 0,
  predicted_30min DOUBLE PRECISION NOT NULL DEFAULT 0,
  predicted_60min DOUBLE PRECISION NOT NULL DEFAULT 0,
  predicted_120min DOUBLE PRECISION NOT NULL DEFAULT 0,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 0.8,
  trend TEXT NOT NULL DEFAULT 'stable',
  factors TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.traffic_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Predictions are publicly readable" ON public.traffic_predictions FOR SELECT USING (true);

-- Index for fast lookups
CREATE INDEX idx_traffic_predictions_zone_time ON public.traffic_predictions (zone_id, created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.traffic_predictions;
