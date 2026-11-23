// Runs on every start-up:
//  1. applies database migrations (./drizzle). Already-applied ones are skipped and
//     every migration only ADDS tables/columns, so existing data is never touched.
//  2. creates the first logins from environment variables, only if those usernames
//     don't exist yet (passwords changed later in the app are never overwritten).
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { sslFor } from "./ssl.mjs";
import { hashPassword } from "./password.mjs";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url, max: 1, ssl: sslFor(url) });

async function ensureUser(username, password, role, name) {
  if (!username || !password) {
    console.warn(`No password set for ${role} login (${username || "no username"}), skipped`);
    return;
  }
  const u = username.trim().toLowerCase();
  const { rows } = await pool.query("select id from users where username = $1", [u]);
  if (rows.length) return;
  await pool.query(
    "insert into users (username, name, password_hash, role) values ($1, $2, $3, $4)",
    [u, name, hashPassword(password), role],
  );
  console.log(`Created ${role} login: ${u}`);
}

try {
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  console.log("Database ready");
  await ensureUser(process.env.SUPERADMIN_USERNAME || "pokitbio", process.env.SUPERADMIN_PASSWORD, "superadmin", "PokitBio");
  await ensureUser(process.env.OWNER_USERNAME || "owner", process.env.OWNER_PASSWORD, "admin", "Owner");
  await ensureUser(process.env.RIDER_USERNAME || "rider", process.env.RIDER_PASSWORD, "rider", "Rider");
  // First start: business name and 19L bottle price
  await pool.query(
    `insert into settings (id, business_name, price_std, price_disp, payment_info) values (1, $1, $2, 0, '') on conflict (id) do nothing`,
    [process.env.BUSINESS_NAME || "Safe & Fine Drinking Water", Number(process.env.BOTTLE_PRICE) || 100],
  );
} catch (e) {
  console.error("Start-up database step failed:", e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
