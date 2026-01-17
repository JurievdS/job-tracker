/** @type {import('drizzle-kit').Config} */

const db_user = process.env.DB_USER || "dev";
const db_password = process.env.DB_PASSWORD || "dev";
const db_host = process.env.DB_HOST || "localhost";
const db_port = process.env.DB_PORT || "5433";
const db_name = process.env.DB_NAME || "job_tracker";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: `postgres://${db_user}:${db_password}@${db_host}:${db_port}/${db_name}`,
  },
};