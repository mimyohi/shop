"use server";

import { createClient } from "@/lib/supabaseServer";

export async function loginAction(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: {
        code: error.code || "unknown",
        message: error.message,
      },
    };
  }

  return {
    success: true,
    user: data.user,
  };
}
