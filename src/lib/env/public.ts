import { z } from "zod";

const supabaseSchema = z.object({
  url: z.url(),
  key: z.string().min(1),
});

export function getSupabaseConfig() {
  const result = supabaseSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!result.success) {
    // Do not include supplied values in configuration errors.
    throw new Error("Supabase is not configured. Set its public URL and publishable key.");
  }
  return result.data;
}
