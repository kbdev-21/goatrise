import {createClient} from "@supabase/supabase-js";

export const auth = createClient(
  "https://dwjwewkzfivgyingwhrh.supabase.co",
  "sb_publishable_nSbOYbpV7n0CEvxYJ_0UMg_K22Nuf6b", {
    auth: {
      flowType: "pkce"
    }
  }
).auth;