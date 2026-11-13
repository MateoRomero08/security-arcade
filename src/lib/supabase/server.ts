import { createClient, SupabaseClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | null = null;

/**
 * Obtiene la URL de Supabase reconociendo tanto nombres estándar
 * como variables inyectadas por Vercel / Storage.
 */
export function getSupabaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL;

  if (!url || url.includes("your-project-ref")) {
    throw new Error(
      "[Supabase Server] Missing Supabase URL. Please define NEXT_PUBLIC_SUPABASE_URL, SUPABASE_URL, or NEXT_PUBLIC_STORAGE_SUPABASE_URL in your environment."
    );
  }

  return url;
}

/**
 * Obtiene la llave de Supabase para servidor (Service Role o Secret Key)
 * reconociendo nombres estándar y variantes de Vercel.
 */
export function getSupabaseServerKey(): string {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key || key.includes("your-anon-key") || key.includes("eyJhbGciOi...")) {
    throw new Error(
      "[Supabase Server] Missing Supabase Key. Please define SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SECRET_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment."
    );
  }

  return key;
}

/**
 * Retorna el cliente Supabase del servidor listo para operaciones con base de datos.
 * Lanza un error explícito si faltan las variables de entorno para evitar
 * el modo mock silencioso.
 */
export function getSupabaseServerClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const key = getSupabaseServerKey();

  if (serverClient) return serverClient;

  serverClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serverClient;
}
