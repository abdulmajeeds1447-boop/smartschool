
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhppvwtrlewsamovevbp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocHB2d3RybGV3c2Ftb3ZldmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNzc5NDAsImV4cCI6MjA4Mjc1Mzk0MH0.Bb3bf8eCdhV07GoGA472h-lIcQH3upSrts_KnLe22b4';

// إنشاء العميل مع إعدادات إضافية للمرونة في الاتصال
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'x-application-name': 'school-mgmt-v4' }
  }
});
