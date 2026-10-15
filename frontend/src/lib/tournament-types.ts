export interface CustomFieldDefinition {
  key: string;
  label: string;
  field_type: "TEXT" | "NUMBER" | "SELECT";
  required: boolean;
  options?: string[];
  help_text?: string;
}

export interface Tournament {
  id: string;
  organizer_id: string;
  title: string;
  slug: string;
  sport: "VOLLEYBALL" | "CRICKET" | "FOOTBALL" | "KABADDI" | "BASKETBALL" | "CUSTOM";
  description: string;
  venue: string;
  city: string;
  state: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  entry_fee: number;
  rules: string[];
  status: "DRAFT" | "PENDING_APPROVAL" | "PUBLISHED" | "REGISTRATION_CLOSED" | "COMPLETED";
  custom_fields: CustomFieldDefinition[];
  created_at: string;
  updated_at: string;
  total_registrations: number;
  approved_registrations: number;
}

export interface Registration {
  id: string;
  tournament_id: string;
  player_id: string;
  registration_number: string;
  serial_number?: number;
  serial_str?: string;
  village?: string;
  role?: string;
  player_name: string;
  player_phone: string;
  player_photo_url: string;
  custom_field_values: Record<string, any>;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejection_reason?: string | null;
  poster_url?: string | null;
  poster_status: "RENDERING" | "COMPLETED" | "FAILED";
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}
