// Hand-written types matching supabase/migrations/*.sql.
// If you change the schema, update this file to match (or generate it with
// `supabase gen types typescript` once the project is linked).

export type UserRole = "admin" | "editor" | "viewer";
export type MobileVisibility = "public" | "private";

export type AuditAction =
  | "contact_create"
  | "contact_update"
  | "contact_deactivate"
  | "contact_reactivate"
  | "contact_import"
  | "profile_role_change"
  | "profile_activate"
  | "profile_deactivate"
  | "department_create"
  | "department_update"
  | "department_delete";

// NOTE: these are plain `type` aliases (object type literals), not
// `interface`s. TypeScript only infers an implicit index signature for the
// latter, which the supabase-js/postgrest-js generics require to treat each
// Row as `Record<string, unknown>` — an `interface` Row here would silently
// collapse the client's generics to `never`.
export type Department = {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  user_id: string;
  display_name: string;
  role: UserRole;
  department_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: string;
  prefix: string | null;
  first_name: string;
  last_name: string;
  nickname: string | null;
  rank: string | null;
  position: string | null;
  department_id: string | null;
  mobile_phone: string | null;
  mobile_visibility: MobileVisibility;
  office_phone: string | null;
  extension: string | null;
  email: string | null;
  work_location: string | null;
  notes: string | null;
  rank_order: number | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  search_text?: string;
  phone_digits?: string;
};

export type Favorite = {
  user_id: string;
  contact_id: string;
  created_at: string;
};

export type AuditLog = {
  id: string;
  actor_id: string | null;
  action: AuditAction;
  record_type: string;
  record_id: string | null;
  changed_fields: Record<string, { old: unknown; new: unknown }> | null;
  created_at: string;
};

type NoRelationships = { Relationships: [] };

export type Database = {
  public: {
    Tables: {
      departments: {
        Row: Department;
        Insert: Partial<Department> & { name: string };
        Update: Partial<Department>;
      } & NoRelationships;
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { user_id: string; display_name: string };
        Update: Partial<Profile>;
      } & NoRelationships;
      contacts: {
        Row: Contact;
        Insert: Partial<Contact> & { first_name: string; last_name: string };
        Update: Partial<Contact>;
      } & NoRelationships;
      favorites: {
        Row: Favorite;
        Insert: Partial<Favorite> & { user_id: string; contact_id: string };
        Update: Partial<Favorite>;
      } & NoRelationships;
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog>;
        Update: Partial<AuditLog>;
      } & NoRelationships;
    };
    Views: {
      contacts_view: {
        Row: Contact;
      } & NoRelationships;
    };
    Functions: {
      department_and_descendants: {
        Args: { dept_id: string };
        Returns: { id: string }[];
      };
      log_contact_import: {
        Args: { summary: Record<string, unknown> };
        Returns: void;
      };
      jsonb_diff: {
        Args: { old_row: Record<string, unknown>; new_row: Record<string, unknown> };
        Returns: Record<string, unknown>;
      };
    };
  };
}
