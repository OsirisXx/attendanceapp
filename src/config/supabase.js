import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fraidyefvgtvppnnpjpw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYWlkeWVmdmd0dnBwbm5wanB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyMDA3NjgsImV4cCI6MjA1NDc3Njc2OH0.N87PWJduNMmjQwL_RyqeKzYCXPSPNHAfu8vMGbVH2WA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
