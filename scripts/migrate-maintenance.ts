import "dotenv/config";
import { Pool } from "pg";

const connStr = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || "";
const separator = connStr.includes("?") ? "&" : "?";
const finalConnStr = connStr.includes("uselibpqcompat") ? connStr : connStr + separator + "uselibpqcompat=true";

const pool = new Pool({
  connectionString: finalConnStr,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("ALTER TABLE loan_cars DROP CONSTRAINT IF EXISTS loan_cars_status_check");
    await client.query(
      "ALTER TABLE loan_cars ADD CONSTRAINT loan_cars_status_check CHECK (status IN ('available', 'in_use', 'maintenance'))"
    );
    console.log("Migration complete: maintenance status added to loan_cars constraint.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => { console.error("Migration failed:", err); process.exit(1); });
