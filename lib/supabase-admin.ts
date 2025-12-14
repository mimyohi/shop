import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

// 서버 측 API용 admin 클라이언트 (RLS 우회)
// 이 파일은 서버에서만 import해야 합니다
export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);
