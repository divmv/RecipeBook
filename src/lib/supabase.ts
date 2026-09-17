import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://stdskfvibattimligofo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZHNrZnZpYmF0dGltbGlnb2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1OTAyMjEsImV4cCI6MjEwNTE2NjIyMX0.CsVyLt_2GiZkZ65hAJS9eHc-H3d5R92kkKcNDbVNcfQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);