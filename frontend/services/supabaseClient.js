import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_PROJECT_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

// export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabase = {}; // Dummy object for demo mode
