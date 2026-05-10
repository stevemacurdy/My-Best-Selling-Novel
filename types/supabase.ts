// TODO: regenerate via 'npm run db:types' after TASK-011-015 migrations apply in Phase 3.
// Currently empty placeholder; no table/column type safety until then.
//
// This file exists so callers of createBrowserClient<Database>() /
// createServerClient<Database>() resolve at compile time before the schema lands.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
