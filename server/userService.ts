import { eq } from "drizzle-orm";
import { db } from "./db"; // Adjust the path to your database instance
import { users } from "../shared/schema"; // Adjust the path to your schema

export async function checkAdminExists() {
  const adminExists = await db.select().from(users).where(eq(users.role, "admin")).limit(1);

  if (!adminExists.length) {
    console.log("No admin user found.");
    return false;
  }

  console.log("Admin user exists.");
  return true;
}