import { createClient } from "@supabase/supabase-js"

let browserClient = null

export const getSupabaseBrowserClient = () => {
  if (browserClient) return browserClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase credentials are missing")
    throw new Error("Supabase credentials are missing")
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: "serenify-auth",
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    // Add global error handler
    global: {
      fetch: (...args) => {
        return fetch(...args).catch((err) => {
          console.error("Supabase fetch error:", err)
          throw err
        })
      },
    },
  })

  return browserClient
}

// Server-side Supabase client (for server components and API routes)
export const getSupabaseServerClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase server credentials are missing")
    throw new Error("Supabase server credentials are missing")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
