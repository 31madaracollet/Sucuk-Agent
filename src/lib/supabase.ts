import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnon);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnon as string)
  : null;

export const supabaseAdmin = isSupabaseConfigured && serviceRole
  ? createClient(supabaseUrl as string, serviceRole as string)
  : null;
