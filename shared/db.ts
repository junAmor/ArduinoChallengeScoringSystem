import pkg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
// import * as schema from "./schema"; // Adjust the path to your schema file

import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file

const { Pool } = pkg;
// Create a PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Ensure this environment variable is set
  });
  
  // Initialize the Drizzle ORM instance
  export const db = drizzle(pool);

// Placeholder for database initialization or migration logic
(async () => {
    try {
        console.log('Database connection initialized successfully.');
        // Add migration or initialization logic here if needed
    } catch (err) {
        console.error('Error initializing database connection:', err);
    }
})();