import { createClient } from '@supabase/supabase-js'

// Supabase project credentials
const SUPABASE_URL = 'https://nrepnjcmqysvsukfysyb.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZXBuamNtcXlzdnN1a2Z5c3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1Njg0NjEsImV4cCI6MjA2NjE0NDQ2MX0.QzIz8IZo_ZsV5Ve2P4SFMzygQShb1MMhT1mv7kD7ExI'

export default createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})