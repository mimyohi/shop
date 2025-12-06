import { env } from "@/env";
import { createClient } from "@supabase/supabase-js";

/**
 * Service role 클라이언트 생성
 * 주의: 서버 사이드에서만 사용하세요. 클라이언트에 노출되면 안 됩니다.
 */
export async function createServiceClient() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
