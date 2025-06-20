const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ldmppmnpgdxueebkkpid.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkbXBwbW5wZ2R4dWVlYmtrcGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2MzEwMjAsImV4cCI6MjA1NzIwNzAyMH0.4iAEQ9IrrxatqlR9S5YzWc5B-I34CahtqgzKtooz0rE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('nfc_tags')
      .select('*')
      .limit(1)

    if (error) throw error
    console.log('Connection successful:', data)
  } catch (error) {
    console.error('Connection failed:', error.message)
  }
}

testConnection() 