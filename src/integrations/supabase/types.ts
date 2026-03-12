export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      accident_data: {
        Row: {
          description: string | null
          id: string
          lat: number
          lng: number
          reported_at: string
          severity: string
          zone_id: string
        }
        Insert: {
          description?: string | null
          id?: string
          lat: number
          lng: number
          reported_at?: string
          severity: string
          zone_id: string
        }
        Update: {
          description?: string | null
          id?: string
          lat?: number
          lng?: number
          reported_at?: string
          severity?: string
          zone_id?: string
        }
        Relationships: []
      }
      air_quality_data: {
        Row: {
          aqi: number
          category: string
          co: number
          id: string
          no2: number
          o3: number
          pm10: number
          pm25: number
          recorded_at: string
          so2: number
          zone_id: string
        }
        Insert: {
          aqi?: number
          category?: string
          co?: number
          id?: string
          no2?: number
          o3?: number
          pm10?: number
          pm25?: number
          recorded_at?: string
          so2?: number
          zone_id: string
        }
        Update: {
          aqi?: number
          category?: string
          co?: number
          id?: string
          no2?: number
          o3?: number
          pm10?: number
          pm25?: number
          recorded_at?: string
          so2?: number
          zone_id?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_active: boolean
          message: string
          severity: string
          zone_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          message: string
          severity: string
          zone_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string
          severity?: string
          zone_id?: string
        }
        Relationships: []
      }
      citizen_reports: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          lat: number | null
          lng: number | null
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
          vote_count: number
          zone_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
          vote_count?: number
          zone_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          vote_count?: number
          zone_id?: string
        }
        Relationships: []
      }
      city_zones: {
        Row: {
          created_at: string
          elevation: number
          id: string
          lat: number
          lng: number
          name: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          elevation?: number
          id?: string
          lat?: number
          lng?: number
          name: string
          zone_id: string
        }
        Update: {
          created_at?: string
          elevation?: number
          id?: string
          lat?: number
          lng?: number
          name?: string
          zone_id?: string
        }
        Relationships: []
      }
      emergency_units: {
        Row: {
          id: string
          lat: number
          lng: number
          status: string
          unit_id: string
          unit_type: string
          updated_at: string
        }
        Insert: {
          id?: string
          lat?: number
          lng?: number
          status?: string
          unit_id: string
          unit_type: string
          updated_at?: string
        }
        Update: {
          id?: string
          lat?: number
          lng?: number
          status?: string
          unit_id?: string
          unit_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      noise_data: {
        Row: {
          category: string
          decibel_level: number
          id: string
          near_sensitive_area: boolean
          recorded_at: string
          source: string
          zone_id: string
        }
        Insert: {
          category?: string
          decibel_level?: number
          id?: string
          near_sensitive_area?: boolean
          recorded_at?: string
          source?: string
          zone_id: string
        }
        Update: {
          category?: string
          decibel_level?: number
          id?: string
          near_sensitive_area?: boolean
          recorded_at?: string
          source?: string
          zone_id?: string
        }
        Relationships: []
      }
      power_grid_data: {
        Row: {
          capacity_mw: number
          frequency_hz: number
          id: string
          load_mw: number
          load_percent: number
          outage_active: boolean
          outage_duration_min: number
          recorded_at: string
          status: string
          zone_id: string
        }
        Insert: {
          capacity_mw?: number
          frequency_hz?: number
          id?: string
          load_mw?: number
          load_percent?: number
          outage_active?: boolean
          outage_duration_min?: number
          recorded_at?: string
          status?: string
          zone_id: string
        }
        Update: {
          capacity_mw?: number
          frequency_hz?: number
          id?: string
          load_mw?: number
          load_percent?: number
          outage_active?: boolean
          outage_duration_min?: number
          recorded_at?: string
          status?: string
          zone_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_votes: {
        Row: {
          created_at: string
          id: string
          report_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          report_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          report_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_votes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "citizen_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      traffic_data: {
        Row: {
          avg_speed: number
          congestion_level: number
          id: string
          prediction_60min: number
          recorded_at: string
          vehicle_count: number
          zone_id: string
        }
        Insert: {
          avg_speed?: number
          congestion_level?: number
          id?: string
          prediction_60min?: number
          recorded_at?: string
          vehicle_count?: number
          zone_id: string
        }
        Update: {
          avg_speed?: number
          congestion_level?: number
          id?: string
          prediction_60min?: number
          recorded_at?: string
          vehicle_count?: number
          zone_id?: string
        }
        Relationships: []
      }
      traffic_predictions: {
        Row: {
          confidence: number
          created_at: string
          current_congestion: number
          factors: string[] | null
          id: string
          predicted_120min: number
          predicted_30min: number
          predicted_60min: number
          trend: string
          zone_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          current_congestion?: number
          factors?: string[] | null
          id?: string
          predicted_120min?: number
          predicted_30min?: number
          predicted_60min?: number
          trend?: string
          zone_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          current_congestion?: number
          factors?: string[] | null
          id?: string
          predicted_120min?: number
          predicted_30min?: number
          predicted_60min?: number
          trend?: string
          zone_id?: string
        }
        Relationships: []
      }
      transport_data: {
        Row: {
          eta_minutes: number
          id: string
          occupancy_percent: number
          recorded_at: string
          route_name: string
          status: string
          transport_type: string
          vehicle_id: string
          zone_id: string
        }
        Insert: {
          eta_minutes?: number
          id?: string
          occupancy_percent?: number
          recorded_at?: string
          route_name?: string
          status?: string
          transport_type?: string
          vehicle_id?: string
          zone_id: string
        }
        Update: {
          eta_minutes?: number
          id?: string
          occupancy_percent?: number
          recorded_at?: string
          route_name?: string
          status?: string
          transport_type?: string
          vehicle_id?: string
          zone_id?: string
        }
        Relationships: []
      }
      weather_data: {
        Row: {
          humidity: number | null
          id: string
          rainfall: number
          recorded_at: string
          temperature: number | null
          wind_speed: number | null
          zone_id: string
        }
        Insert: {
          humidity?: number | null
          id?: string
          rainfall?: number
          recorded_at?: string
          temperature?: number | null
          wind_speed?: number | null
          zone_id: string
        }
        Update: {
          humidity?: number | null
          id?: string
          rainfall?: number
          recorded_at?: string
          temperature?: number | null
          wind_speed?: number | null
          zone_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
