import { expect, test } from 'vitest'
import { supabaseClient } from '../lib/supabase'

test('Supabase Insert Test', async () => {
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
