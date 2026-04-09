import { createHmac } from "crypto";
import { createClient } from "@/lib/supabaseServer";
import { CHANNEL_TALK_SECRET_KEY } from "@/env";

export async function GET() {
  if (!CHANNEL_TALK_SECRET_KEY) {
    return Response.json({ hash: null });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ hash: null });
  }

  const hash = createHmac("sha256", CHANNEL_TALK_SECRET_KEY)
    .update(user.id)
    .digest("hex");

  return Response.json({ hash });
}
