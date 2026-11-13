import { createClient, SupabaseClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | null = null;

/**
 * Retorna el cliente Supabase con privilegios administrativos (Service Role)
 * para operaciones seguras en el servidor (grabar scores, leer configuraciones).
 * Si no está configurado, retorna null de forma segura.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project-ref")) {
    return null;
  }

  if (serverClient) return serverClient;

  try {
    serverClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return serverClient;
  } catch (err) {
    console.warn("Failed to initialize Supabase server client:", err);
    return null;
  }
}
