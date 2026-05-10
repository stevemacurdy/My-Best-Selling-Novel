// PLACEHOLDER — regenerate via `npm run db:types` after migrations TASK-011..015 land.
// Until then, the Database type is empty so client factories type-check but no
// table/column compile-time safety is enforced. This file exists so callers of
// createBrowserClient<Database>() / createServerClient<Database>() resolve.

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
