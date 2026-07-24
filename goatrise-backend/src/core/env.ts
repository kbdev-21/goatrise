import "dotenv/config";

export const DASHBOARD_URL = requireEnv("DASHBOARD_URL");
export const WEBSITE_URL = requireEnv("WEBSITE_URL");
export const POSTGRES_CONNECTION_URL = requireEnv("POSTGRES_CONNECTION_URL");
export const SUPABASE_URL = requireEnv("SUPABASE_URL");
export const SUPABASE_SECRET_KEY = requireEnv("SUPABASE_SECRET_KEY");
export const ADMIN_EMAIL_LIST = requireEnv("ADMIN_EMAIL_LIST");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
