import { createClient } from '@supabase/supabase-js';

function getSupabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL;
}

export function hasSupabaseServiceConfig(): boolean {
  return Boolean(getSupabaseUrl() && process.env.SUPABASE_SERVICE_KEY);
}

export function createServiceClient() {
  const url = getSupabaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
