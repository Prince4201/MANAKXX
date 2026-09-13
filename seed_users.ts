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

if (!url || !key) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function seedUser(email: string, name: string, role: string, metadata: any) {
  console.log(`\nRegistering ${email}...`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: "Admin@123",
    options: {
      data: { name, role, ...metadata },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      console.log(`- User ${email} already exists.`);
    } else {
      console.error(`- Error registering ${email}:`, error.message);
    }
  } else {
    console.log(`- Success! User ${email} created.`);
  }
}

async function main() {
  console.log("Seeding Demo Accounts...");

  await seedUser("admin@manakx.demo", "System Admin", "Admin", {
    organization: "MANAKX",
  });

  await seedUser("reviewer@manakx.demo", "S. Nair", "Technical Reviewer", {
    department: "Technical Evaluation",
  });

  await seedUser("officer@manakx.demo", "A. Sharma", "Government Procurement Officer", {
    organization: "Ministry of Defence",
    department: "Procurement",
    employee_id: "MOD-1049",
  });

  await seedUser("vendor@manakx.demo", "Rahul Vendor", "Vendor/Supplier", {
    company_name: "ABC Electronics",
    industry: "IT Hardware",
    phone: "9876543210",
  });

  console.log("\nDone! Note: To make the Admin and Reviewer accounts ACTIVE, you must run the following SQL in your Supabase SQL Editor:");
  console.log(`
UPDATE public.profiles
SET status = 'ACTIVE'
WHERE email IN ('admin@manakx.demo', 'reviewer@manakx.demo', 'officer@manakx.demo');
  `);
}

main();
