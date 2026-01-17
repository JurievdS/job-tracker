import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString = `postgres://${process.env.DB_USER || "dev"}:${process.env.DB_PASSWORD || "dev"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5433"}/${process.env.DB_NAME || "job_tracker"}`;

const client = postgres(connectionString);
export const db = drizzle(client, { schema });