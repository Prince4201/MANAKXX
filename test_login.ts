import { createClient } from "@supabase/supabase-js";
import fs from "fs";

function loadEnv() {
  const envFile = fs.readFileSync(".env", "utf8");
  const env: Record<string, string> = {};
  envFile.split("\n").forEach((line) => {
    const [key, ...values] = line.split("=");
    if (key && values.length > 0) {
      env[key.trim()] = values.join("=").trim();
    }
  });
  return env;
}

const env = loadEnv();
const url = env["VITE_SUPABASE_URL"];
const key = env["VITE_SUPABASE_ANON_KEY"];

const supabase = createClient(url, key);

async function testLogin() {
  console.log("Signing in as admin@manakx.demo...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "admin@manakx.demo",
    password: "Admin@123",
  });

  if (authError) {
    console.error("Auth Error:", authError.message);
    return;
  }

  const userId = authData.session?.user.id;
  console.log("Logged in! User ID:", userId);

  console.log("Fetching profile from public.profiles...");
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("Profile Fetch Error:", profileError);
    
    console.log("Trying to list all profiles (might be blocked by RLS)...");
    const { data: allProfiles, error: allProfilesError } = await supabase.from("profiles").select("*");
    console.log("All profiles:", allProfiles, allProfilesError);
  } else {
    console.log("Profile successfully found:", profile);
  }
}

testLogin();
