import { sql } from "@vercel/postgres";

const FLEET = [
  { make: "Toyota", model: "Camry", colour: "White", plateNumber: "DO04AB" },
  { make: "Toyota", model: "Camry", colour: "Grey", plateNumber: "DL93GR" },
  { make: "Toyota", model: "Corolla", colour: null, plateNumber: "DH34UJ" },
  { make: "Kia", model: "Rio", colour: null, plateNumber: "BW13WQ" },
  { make: "Suzuki", model: "Swift", colour: null, plateNumber: "BK06RH" },
  { make: "Honda", model: "Jazz", colour: null, plateNumber: null },
  { make: "Holden", model: "Commodore", colour: null, plateNumber: "BF35WY" },
  { make: "Toyota", model: "Hiace", colour: null, plateNumber: null },
];

async function seed() {
  // Create tables
  await sql`
    CREATE TABLE IF NOT EXISTS loan_cars (
      id SERIAL PRIMARY KEY,
      make VARCHAR(50) NOT NULL,
      model VARCHAR(50) NOT NULL,
      colour VARCHAR(30),
      plate_number VARCHAR(20) UNIQUE,
      status VARCHAR(20) NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'in_use'))
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS logs (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      action VARCHAR(10) NOT NULL CHECK (action IN ('pickup', 'dropoff')),
      customer_name VARCHAR(100) NOT NULL,
      phone_number VARCHAR(20) NOT NULL,
      customer_plate_number VARCHAR(20),
      loan_car_id INTEGER NOT NULL REFERENCES loan_cars(id),
      license_photo_url TEXT,
      is_manual BOOLEAN NOT NULL DEFAULT FALSE
    )
  `;

  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_logs_phone ON logs(phone_number)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_loan_cars_status ON loan_cars(status)`;

  // Seed fleet data (skip if cars already exist)
  const { rows } = await sql`SELECT COUNT(*) as count FROM loan_cars`;
  const count = parseInt(rows[0].count as string, 10);

  if (count === 0) {
    for (const car of FLEET) {
      await sql`
        INSERT INTO loan_cars (make, model, colour, plate_number, status)
        VALUES (${car.make}, ${car.model}, ${car.colour}, ${car.plateNumber}, 'available')
      `;
    }
    console.log(`Seeded ${FLEET.length} loan cars.`);
  } else {
    console.log(`Skipping seed — ${count} loan cars already exist.`);
  }
}

seed()
  .then(() => {
    console.log("Seed complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
