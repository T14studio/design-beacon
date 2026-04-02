import { createClient } from '@supabase/supabase-js'

// Credenciais carregadas exclusivamente de variáveis de ambiente
// Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error('[Supabase] Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env')
}

export const supabaseClient = createClient(supabaseUrl, supabaseKey)
