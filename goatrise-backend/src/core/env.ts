import "dotenv/config";

export const POSTGRES_CONNECTION_URL = requireEnv("POSTGRES_CONNECTION_URL");
export const SUPABASE_URL = requireEnv("SUPABASE_URL");
export const SUPABASE_SECRET_KEY = requireEnv("SUPABASE_SECRET_KEY");
export const ADMIN_EMAIL_LIST = requireEnv("ADMIN_EMAIL_LIST");
export const MCP_KEY = requireEnv("MCP_KEY");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
