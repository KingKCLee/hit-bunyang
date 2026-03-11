// =============================================
// Supabase 설정
// 아래 값을 본인의 Supabase 프로젝트 값으로 교체하세요
// =============================================

const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0gB-14Z0t5ewxQ3J_epBbQ_ZCYMFoAc';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
