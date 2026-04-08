import { createClient } from '@supabase/supabase-js'

// Credenciais carregadas exclusivamente de variáveis de ambiente
// Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || ''
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('[Supabase] AVISO: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão configurados. Algumas funcionalidades podem falhar.')
}

// Cria o cliente mesmo sem chaves (as chamadas falharão graciosamente ou via catch)
// para evitar travamento total da aplicação no boot
export const supabaseClient = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder')
