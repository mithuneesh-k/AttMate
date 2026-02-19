import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://txyxjsceanxjvebkwbrw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4eXhqc2NlYW54anZlYmt3YnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTAxMjQsImV4cCI6MjA4NjcyNjEyNH0.GOsxV5RIw2p2_9hpXW7r-VMgOhlW-N95IR3Mvhq0AXc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
