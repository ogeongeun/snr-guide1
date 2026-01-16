import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log("SUPABASE ENV CHECK", {
  url: supabaseUrl,
  anonKeyExists: !!supabaseAnonKey,
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ Supabase 환경변수 누락 (.env.local 확인 필요)"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
