import pkg from "pg"; // Import the entire package
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema"; // Adjust the path to your schema file

const { Pool } = pkg; // Destructure the Pool class from the imported package

// Create a PostgreSQL connection pool
const pool = new Pool({
  host: "dpg-cvfakthopnds73b8al50-a.oregon-postgres.render.com", // Replace with your database host
  port: 5432, // Replace with your database port
  user: "jerome", // Replace with your database user
  password: "cceoN29xZchqU3TQVrrSFMoZo4LatpkV", // Replace with your database password
  database: "arduichallengedb", // Replace with your database name
  ssl: { rejectUnauthorized: false }, // Enable SSL for secure connections
});

// Initialize Drizzle with the schema
export const db = drizzle(pool, { schema });
// Automatically sync schema with the database (for development only)
(async () => {
    try {
        await db.sync(); // This will create tables based on your schema
        console.log('Database schema synchronized successfully.');
    } catch (err) {
        console.error('Error synchronizing database schema:', err);
    }
})();