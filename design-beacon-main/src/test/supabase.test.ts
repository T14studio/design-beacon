import { expect, test } from "vitest";
import { supabaseClient } from "../lib/supabase";

const url = String(import.meta.env.VITE_SUPABASE_URL || "");
const key = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "");
const isConfigured =
  Boolean(url) &&
  Boolean(key) &&
  url.startsWith("https://") &&
  !url.includes("seu-projeto.supabase.co") &&
  !key.includes("sua-anon-key-aqui");

test.runIf(isConfigured)("Supabase Insert Test", async () => {
  const { data, error } = await supabaseClient.from('leads').insert([
    {
      name: 'Teste Antigravity',
      phone: '11999999999',
      message: 'Teste de integração Supabase'
    }
  ]).select()

  if (error) {
    console.error('SUPABASE_ERROR_FULL:', JSON.stringify(error, null, 2))
    throw new Error(`Supabase Insert Failed: ${error.message} (Code: ${error.code})`)
  }

  console.log('SUPABASE_SUCCESS_DATA:', JSON.stringify(data, null, 2))
  expect(data).toBeDefined()
})
