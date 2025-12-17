import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@shared/schema";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env file
dotenv.config();

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine database to use based on environment
let client;

// Check if DATABASE_URL is a PostgreSQL URL
const isPostgresUrl = process.env.DATABASE_URL?.startsWith('postgresql://') || process.env.DATABASE_URL?.startsWith('postgres://');

if (process.env.DATABASE_URL && isPostgresUrl) {
  // If PostgreSQL URL is provided, warn the user
  console.warn("PostgreSQL is configured but this version uses SQLite for local development. Please set up PostgreSQL to match the configured DATABASE_URL or remove it for local SQLite usage.");
  client = createClient({
    url: 'file:./local-dev-db.sqlite',
  });
} else if (process.env.DATABASE_URL && process.env.DATABASE_URL.endsWith('.sqlite')) {
  // If DATABASE_URL exists and ends with .sqlite, treat it as SQLite path
  client = createClient({
    url: `file:${process.env.DATABASE_URL}`,
  });
} else {
  // Default to SQLite for local development
  console.log("Using local SQLite database for development");
  client = createClient({
    url: 'file:./local-dev-db.sqlite',
  });
}

export const db = drizzle(client, { schema });
