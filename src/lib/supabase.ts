import { createBrowserClient } from "@supabase/ssr";

// Browser client — used only for initiating OAuth from client components if needed
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
