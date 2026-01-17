export type CaseStatus =
  | "pending"
  | "assigned"
  | "under_investigation"
  | "verified"
  | "closed"
  | "archived";

export type CasePriority = "critical" | "high" | "medium" | "low";

export type WarrantStatus =
  | "not_requested"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "executed";

export interface Case {
  id: string;
  case_number: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  created_by: string; // UUID - references users(id)
  assigned_to: string | null; // UUID - references users(id)
  is_verified: boolean;
  verified_by?: string | null; // UUID - references users(id)
  verified_at?: string | null; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ

  // Populated fields (not in database, added by API)
  createdBy?: string; // User name (populated)
  assignedTo?: string; // User name (populated)
  verifiedBy?: string; // User name (populated)
  notes?: CaseNote[]; // Populated from case_notes table
}

export interface CaseNote {
  id: string;
  case_id: string; // UUID - references cases(id)
  user_id: string; // UUID - references users(id)
  content: string;
  created_at: string; // TIMESTAMPTZ

  // Populated fields
  userName?: string; // User name (populated)
}
