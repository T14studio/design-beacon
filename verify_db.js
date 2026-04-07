const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://kubfzjfjvovbdlqchhgh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YmZ6amZqdm92YmRscWNoaGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTkzMzgsImV4cCI6MjA4OTUzNTMzOH0.5hgkP6ges3FyMwvmgEZMDFzVNwksNP-l6moUkm8jmvc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRecord() {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('SUPABASE_ERROR:', error)
    } else {
      console.log('LATEST_RECORDS:', JSON.stringify(data, null, 2))
    }
  } catch (e) {
    console.error('CATCHED_ERROR:', e)
  }
}

checkRecord()
