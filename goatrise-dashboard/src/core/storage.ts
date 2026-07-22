import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// flowType "pkce": trả ?code=... (supabase-js tự đổi lấy session + dọn URL)
// thay vì implicit flow trả token trong hash (#access_token=...)
export const storage = createClient(supabaseUrl, supabaseKey, {
  auth: {
    flowType: "pkce",
  },
}).storage;
