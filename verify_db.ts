import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kubfzjfjvovbdlqchhgh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YmZ6amZqdm92YmRscWNoaGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTkzMzgsImV4cCI6MjA4OTUzNTMzOH0.5hgkP6ges3FyMwvmgEZMDFzVNwksNP-l6moUkm8jmvc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRecord() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('name', 'TESTE_FINAL_VALIDACAO_SUCCESS')
    .single()

  if (error) {
    console.error('Record not found or error:', error)
  } else {
    console.log('RECORD_FOUND:', data)
  }
}

checkRecord()
