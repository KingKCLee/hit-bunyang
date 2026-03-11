// =============================================
// Supabase 설정
// 아래 값을 본인의 Supabase 프로젝트 값으로 교체하세요
// =============================================

const SUPABASE_URL = 'https://srlkttykoqbmrusbavzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNybGt0dHlreHBibXJ1c2JhdnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTg0NzUsImV4cCI6MjA4ODc5NDQ3NX0.9NhCaHGGltXURdgNqnZqZk4LvzS8w8EMsYLbBYvY1KM';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
