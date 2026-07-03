// Supabase client — used ONLY for optional sign-in and sync.
// The app reads scripture and commentary from the bundled offline database,
// so nothing here is ever required for the core experience.
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hfohwyqoemeyittatswu.supabase.co";
// Publishable key — safe to ship in the app binary.
const SUPABASE_KEY = "sb_publishable_Eq_LMCk52_jAEmfK0Td13g_u56_SrGU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
